/* =====================================================================
 * MedBank — LEARNING EVENTS (build 01)
 * The durable learning record. One row per learning interaction, on every
 * surface, written straight to Supabase under the student's own auth.
 *
 * DESIGN RULES (these are load-bearing — read before changing anything):
 *
 *  1. OBSERVER, NEVER DECIDER. Nothing here may influence what a student
 *     sees or when a card is next due. Every entry point is wrapped so a
 *     failure in here can never throw into the caller.
 *
 *  2. IMMUTABLE LEDGER. We only ever INSERT. An event is what happened at
 *     that moment; if we later learn a card's target, that goes in a
 *     separate mapping layer, not by rewriting the row.
 *
 *  3. THE CLIENT DOES NOT SAY WHO IT IS. account_id is never sent — the
 *     column defaults to auth.uid() and RLS re-checks it. We only send
 *     level_profile_id, which the policy verifies against the caller.
 *
 *  4. QUEUE FIRST, SEND SECOND. Direct-to-Supabase without a queue merely
 *     changes WHERE events get lost. Every event is persisted to
 *     localStorage before any network call and removed only on confirmed
 *     success (or a confirmed duplicate, which means it is already stored).
 *
 *  5. DARK BY DEFAULT. Inert unless FEATURES.LEARNING_EVENTS is true.
 *     With the flag off nothing is queued and no request is made.
 *
 * Exposes: window.MB_EVENTS = { emit, flush, stats, _queue }
 * ===================================================================== */
(function () {
  'use strict';

  var QKEY   = 'mb_le_queue';      // pending events (array of row objects)
  var SKEY   = 'mb_le_stats';      // lifetime counters, for the verification report
  var QMAX   = 2000;               // hard cap so a permanently offline device can't fill storage
  var BATCH  = 25;                 // rows per insert
  var DEBOUNCE_MS = 1500;          // coalesce a burst of answers into one round trip
  var RETRY_MS    = [4000, 15000, 60000, 300000];   // backoff after consecutive failures

  var _timer = null, _flushing = false, _fails = 0, _retryTimer = null;

  function on(){ try{ var C=window.MEDBANK_CONFIG||{}; return !!(C.FEATURES && C.FEATURES.LEARNING_EVENTS); }catch(e){ return false; } }
  function sb(){ try{ return window.__mbSB || null; }catch(e){ return null; } }

  /* ---- tiny persistence helpers (never throw; storage can be full or blocked) ---- */
  function readQ(){ try{ var r=localStorage.getItem(QKEY); var a=r?JSON.parse(r):[]; return Array.isArray(a)?a:[]; }catch(e){ return []; } }
  function writeQ(a){ try{ localStorage.setItem(QKEY, JSON.stringify(a)); return true; }catch(e){ return false; } }
  function readS(){ try{ var r=localStorage.getItem(SKEY); var o=r?JSON.parse(r):null; return (o&&typeof o==='object')?o:{queued:0,sent:0,dup:0,retried:0,dropped:0,failed:0}; }
                    catch(e){ return {queued:0,sent:0,dup:0,retried:0,dropped:0,failed:0}; } }
  function bump(k,n){ try{ var s=readS(); s[k]=(s[k]||0)+(n||1); localStorage.setItem(SKEY, JSON.stringify(s)); }catch(e){} }

  function uuid(){
    try{ if(crypto && crypto.randomUUID) return crypto.randomUUID(); }catch(e){}
    try{ var b=new Uint8Array(16); crypto.getRandomValues(b);
      b[6]=(b[6]&0x0f)|0x40; b[8]=(b[8]&0x3f)|0x80;
      var h=[].map.call(b,function(x){return ('0'+x.toString(16)).slice(-2);}).join('');
      return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
    }catch(e){}
    return 'ffffffff-ffff-4fff-8fff-' + String(Date.now()).padStart(12,'0').slice(-12);
  }

  function profileId(){
    try{ var st = (window.MB_SYNC && MB_SYNC.status) ? (MB_SYNC.status()||{}) : {};
         return st.profileId || null; }catch(e){ return null; }
  }

  /* ---- the one entry point --------------------------------------------- */
  /* emit({event_type, surface, target_id, object_id, correct, confidence, response_ms, metadata})
     Returns true if the event was durably queued, false if it was ignored.  */
  function emit(ev){
    try{
      if(!on() || !ev || !ev.event_type || !ev.surface) return false;

      var row = {
        level_profile_id: profileId(),           // account_id is NEVER sent — RLS establishes it
        event_type:  String(ev.event_type),
        surface:     String(ev.surface),
        target_id:   ev.target_id != null ? String(ev.target_id) : null,
        object_id:   ev.object_id  != null ? String(ev.object_id)  : null,
        correct:     (typeof ev.correct === 'boolean') ? ev.correct : null,
        confidence:  (ev.confidence == null || isNaN(ev.confidence)) ? null : Math.max(0, Math.min(3, Math.round(ev.confidence))),
        response_ms: (ev.response_ms == null || isNaN(ev.response_ms)) ? null : Math.max(0, Math.round(ev.response_ms)),
        occurred_at: new Date(ev.occurred_at || Date.now()).toISOString(),
        client_event_id: uuid(),
        metadata:    (ev.metadata && typeof ev.metadata === 'object') ? ev.metadata : {}
      };

      var q = readQ();
      if(q.length >= QMAX){ q.splice(0, q.length - QMAX + 1); bump('dropped'); }
      q.push(row);
      if(!writeQ(q)) return false;
      bump('queued');

      clearTimeout(_timer);
      _timer = setTimeout(function(){ flush(); }, DEBOUNCE_MS);
      return true;
    }catch(e){ return false; }
  }

  /* ---- sending ---------------------------------------------------------- */
  function isDuplicate(err){
    try{ return !!err && (err.code === '23505' || /duplicate key|learning_events_dedupe/i.test(err.message||'')); }
    catch(e){ return false; }
  }

  /* Send one batch. Resolves {done:[rows persisted or already present], keep:[rows to retry]} */
  async function sendBatch(rows){
    var client = sb();
    if(!client || !client.from) return { done: [], keep: rows };

    var res;
    try{ res = await client.from('learning_events').insert(rows); }
    catch(e){ return { done: [], keep: rows }; }

    if(!res || !res.error) return { done: rows, keep: [] };

    // One bad/duplicate row fails the whole batch — fall back to per-row so a
    // single poisoned event can never block the queue behind it.
    if(rows.length > 1){
      var done = [], keep = [];
      for(var i=0;i<rows.length;i++){
        var one = await sendBatch([rows[i]]);
        done = done.concat(one.done); keep = keep.concat(one.keep);
      }
      return { done: done, keep: keep };
    }

    // Single row that errored.
    if(isDuplicate(res.error)){ bump('dup'); return { done: rows, keep: [] }; }   // already durable — drop it
    return { done: [], keep: rows };                                              // transient — retry later
  }

  async function flush(){
    if(_flushing) return;
    if(!on()) return;
    var q = readQ(); if(!q.length) return;
    var client = sb();
    if(!client) { schedule(); return; }
    try{
      var ses = await client.auth.getSession();
      if(!ses || !ses.data || !ses.data.session){ schedule(); return; }   // signed out: hold, do not drop
    }catch(e){ schedule(); return; }
    if(typeof navigator!=='undefined' && navigator.onLine === false){ schedule(); return; }

    _flushing = true;
    try{
      var sentAny = false, stuck = false;
      while(true){
        var cur = readQ(); if(!cur.length) break;
        var batch = cur.slice(0, BATCH);
        var r = await sendBatch(batch);

        if(r.done.length){
          // re-read: an emit may have appended while we were in flight
          var live = readQ();
          var goneIds = {}; r.done.forEach(function(x){ goneIds[x.client_event_id]=1; });
          writeQ(live.filter(function(x){ return !goneIds[x.client_event_id]; }));
          bump('sent', r.done.length);
          sentAny = true;
        }
        if(r.keep.length){ stuck = true; break; }        // transient failure — stop, back off
        if(readQ().length === 0) break;
      }
      if(stuck){ _fails++; bump('failed'); schedule(); }
      else if(sentAny){ _fails = 0; }
    }catch(e){ _fails++; schedule(); }
    finally{ _flushing = false; }
  }

  function schedule(){
    clearTimeout(_retryTimer);
    var wait = RETRY_MS[Math.min(_fails, RETRY_MS.length-1)];
    _retryTimer = setTimeout(function(){ bump('retried'); flush(); }, wait);
  }

  /* ---- lifecycle -------------------------------------------------------- */
  function init(){
    if(!on()) return;
    setTimeout(flush, 2500);                                    // catch anything left from last session
    try{ window.addEventListener('online', function(){ _fails=0; flush(); }); }catch(e){}
    try{ document.addEventListener('visibilitychange', function(){ if(document.visibilityState==='hidden') flush(); }); }catch(e){}
    try{ window.addEventListener('pagehide', function(){ flush(); }); }catch(e){}
    setInterval(function(){ if(readQ().length) flush(); }, 60000);
  }

  window.MB_EVENTS = {
    emit: emit,
    flush: flush,
    stats: function(){ var s=readS(); s.pending = readQ().length; s.enabled = on(); return s; },
    _queue: readQ,
    _reset: function(){ try{ localStorage.removeItem(QKEY); localStorage.removeItem(SKEY); }catch(e){} }
  };

  if(typeof document !== 'undefined'){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }
})();
