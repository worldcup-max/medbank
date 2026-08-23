/* =====================================================================
 * MedBank — per-account content loader (Phase 5)
 * When a student is logged in, this fetches THEIR imported topics + cards
 * for the active level-profile and slots them into the app's own content
 * model (DB.subjects / allTopics) in the exact shape the engine expects, so
 * imported lectures appear and study just like the built-in content.
 *
 * FAST RELOAD: the built content is cached to localStorage. On boot we
 * hydrate from that cache synchronously (no network) so the page you were on
 * paints instantly, then refresh from Supabase in the background.
 *
 * Card ids line up because the server stored card_key = topicId|deck|hash(q),
 * which equals the app's cid(topicId, deck, card) — so SRS state matches.
 * ===================================================================== */
(function () {
  var CACHE_PID_KEY = "medbank_content_pid";
  function cacheKey(pid){ return "medbank_content_" + pid; }
  function haveAppCtx(){ try { return typeof DB !== "undefined" && typeof allTopics !== "undefined"; } catch(e){ return false; } }

  /* Rebuild per-subject counts + the lecturers list from loaded topics. */
  function recomputeStats(){
    try{
      DB.lecturers = DB.lecturers || [];
      DB.lecturers.length = 0;
      var lmap = {}, totP = 0, totR = 0;
      (DB.subjects || []).forEach(function(s){
        var tps = []; (s.modules || []).forEach(function(m){ (m.topics || []).forEach(function(t){ tps.push(t); }); });
        var built = 0, cardc = 0, realLec = {};
        tps.forEach(function(t){
          var np = (t.primer || []).length, nr = (t.recall || []).length;
          if(t.ready) built++;
          cardc += np + nr; totP += np; totR += nr;
          var ln = (t.lecturer || "").trim() || "To be confirmed";
          if(ln !== "To be confirmed") realLec[ln] = 1;
          var lid = "lec_" + s.id + "_" + ln.toLowerCase().replace(/[^a-z0-9]+/g,"-");
          if(!lmap[lid]){ lmap[lid] = { id:lid, name:ln, subjectId:s.id, subject:s.name, topics:[], readyCount:0 }; DB.lecturers.push(lmap[lid]); }
          lmap[lid].topics.push(t);
          if(t.ready) lmap[lid].readyCount++;
        });
        s.topicCount = tps.length; s.readyCount = built; s.cardCount = cardc;
        s.lecturerCount = Object.keys(realLec).length; if(!s.short) s.short = s.name;
      });
      DB.stats = DB.stats || {};
      DB.stats.primerCards = totP; DB.stats.recallCards = totR;
      DB.stats.lecturers = DB.lecturers.filter(function(l){ return l.name !== "To be confirmed"; }).length;
      DB.stats.topics = (DB.subjects || []).reduce(function(a,s){ return a + (s.topicCount || 0); }, 0);
    }catch(e){}
  }

  /* Slot fetched (or cached) content into DB/allTopics. UPSERTS: updates a
     topic in place if it's already loaded, so a background refresh reflects
     edits without ever dropping what's on screen. */
  function applyContent(courses, topics, byTopic, trById, exById){
    if(!haveAppCtx()) return 0;
    byTopic = byTopic || {}; trById = trById || {}; exById = exById || {};
    var changed = 0;
    (courses || []).forEach(function(co){
      var sid = "course_" + co.id;
      var subj = DB.subjects.find(function(s){ return s.id === sid; });
      if(!subj){ subj = { id:sid, name:co.name, modules:[{ name:"Imported", topics:[] }] }; DB.subjects.push(subj); }
      else { subj.name = co.name; subj.short = co.name; }   // CNT-08: reflect a renamed course
      var mod = subj.modules[0] || (subj.modules[0] = { name:"Imported", topics:[] });
      (topics || []).filter(function(t){ return t.course_id === co.id; }).forEach(function(t){
        var g = byTopic[t.id] || { primer:[], recall:[] };
        var fields = {
          id: t.id, name: t.title, lecturer: t.lecturer || "", ready: (t.status === "ready"),
          note: t.note_md || "", simplified: t.simplified_md || "",
          transcript: (trById[t.id] || null),
          extras: (exById[t.id] || null),
          primer: g.primer, recall: g.recall
        };
        var em = mod.topics.find(function(x){ return x.id === t.id; });
        var ea = allTopics.find(function(x){ return x.id === t.id; });
        // don't wipe a transcript we already loaded with a cache/refresh that lacks it
        if(fields.transcript == null){ if(em && em.transcript) fields.transcript = em.transcript; else if(ea && ea.transcript) fields.transcript = ea.transcript; }
        // same for extras (q-bank / written test): buildExtraNow caches them on the topic locally,
        // and a refresh whose payload lacks them must not wipe them back to "not built yet"
        if(fields.extras == null){ if(em && em.extras) fields.extras = em.extras; else if(ea && ea.extras) fields.extras = ea.extras; }
        // CNT-03: never let a payload that lacks cards (partial fetch) wipe decks we already loaded.
        if((!fields.primer || !fields.primer.length)){ if(em && em.primer && em.primer.length) fields.primer = em.primer; else if(ea && ea.primer && ea.primer.length) fields.primer = ea.primer; }
        if((!fields.recall || !fields.recall.length)){ if(em && em.recall && em.recall.length) fields.recall = em.recall; else if(ea && ea.recall && ea.recall.length) fields.recall = ea.recall; }
        if(em) Object.assign(em, fields); else mod.topics.push(fields);
        if(ea) Object.assign(ea, fields); else allTopics.push(Object.assign({ subject:subj, module:mod.name }, fields));
        changed++;
      });
    });
    recomputeStats();
    return changed;
  }

  function saveCache(pid, raw){
    try{ localStorage.setItem(CACHE_PID_KEY, pid); }catch(e){}
    try{ localStorage.setItem(cacheKey(pid), JSON.stringify(raw)); return; }catch(e){}
    // over quota — retry without the heaviest field (transcripts); note view doesn't need them
    try{ localStorage.setItem(cacheKey(pid), JSON.stringify(Object.assign({}, raw, { trById:{} }))); }catch(e2){}
  }

  /* Synchronous, no-network: paint the page you were on straight from cache. */
  function hydrateFromCache(){
    try{
      if(!haveAppCtx()) return false;
      var pid = localStorage.getItem(CACHE_PID_KEY); if(!pid) return false;
      var raw = localStorage.getItem(cacheKey(pid)); if(!raw) return false;
      var d = JSON.parse(raw);
      if(!d || !Array.isArray(d.courses) || !d.courses.length) return false;   // CNT-04: an empty [] must NOT pass as "hydrated"
      applyContent(d.courses, d.topics, d.byTopic, d.trById, d.exById);
      return true;
    }catch(e){ return false; }
  }
  window.MB_hydrateContentCache = hydrateFromCache;

  /* Fetch everything for a profile in as few round-trips as possible.
     One topics query carries note/simplified + (guarded) transcript/extras. */
  // CNT-05: PostgREST caps a select at ~1000 rows. Page explicitly so a heavy account never silently truncates.
  async function fetchAll(query){
    var out = [], from = 0, PAGE = 1000;
    for(;;){
      var r = await query(from, from + PAGE - 1);
      if(r.error) throw r.error;                                  // CNT-03/04: a failed read must NOT masquerade as empty
      var rows = r.data || []; out = out.concat(rows);
      if(rows.length < PAGE) break;                               // short page = last page
      from += PAGE;
      if(from > 200000) break;                                    // hard safety stop
    }
    return out;
  }
  function isMissingColumn(err){ return !!err && (err.code === "42703" || /column .* does not exist/i.test(err.message || "")); }

  async function fetchRaw(sb, pid){
    var cr = await sb.from("courses").select("id,name,code").eq("level_profile_id", pid).order("position");
    if(cr.error) throw cr.error;                                  // CNT-04: don't turn a failed courses read into an empty library
    var courses = cr.data || [];
    if(!courses.length) return { courses:[], topics:[], byTopic:{}, trById:{}, exById:{} };
    var courseIds = courses.map(function(c){ return c.id; });
    var topics, trById = {}, exById = {};
    var full = await sb.from("topics").select("id,course_id,title,lecturer,note_md,simplified_md,status,transcript,extras").in("course_id", courseIds);
    if(full && !full.error){
      topics = full.data || [];
      topics.forEach(function(t){ if(t.transcript) trById[t.id] = t.transcript; if(t.extras) exById[t.id] = t.extras; });
    } else if(full && isMissingColumn(full.error)){
      // CNT-10: only fall back for a genuinely-older schema (missing column) — not for a network/RLS error
      var base = await sb.from("topics").select("id,course_id,title,lecturer,note_md,simplified_md,status").in("course_id", courseIds);
      if(base.error) throw base.error;
      topics = base.data || [];
    } else {
      throw (full && full.error) || new Error("topics read failed");
    }
    var topicIds = topics.map(function(t){ return t.id; });
    var cards = topicIds.length
      ? await fetchAll(function(a,b){ return sb.from("cards").select("topic_id,deck,idx,q,payload").in("topic_id", topicIds).order("idx").range(a,b); })
      : [];
    var byTopic = {};
    cards.forEach(function(c){
      (byTopic[c.topic_id] = byTopic[c.topic_id] || { primer:[], recall:[] });
      var card = Object.assign({ q:c.q }, c.payload || {});
      (byTopic[c.topic_id][c.deck] || byTopic[c.topic_id].recall).push(card);
    });
    return { courses:courses, topics:topics, byTopic:byTopic, trById:trById, exById:exById };
  }

  async function loadProfileContent(){
    var markReady = function(){ window.__MB_CONTENT_READY = true; };   // CNT-09: only mark ready on a clean outcome
    try{
      var sb = window.__mbSB; if(!sb){ markReady(); return; }
      var ses = await sb.auth.getSession(); if(!ses.data.session){ markReady(); return; }   // genuinely signed out
      if(!haveAppCtx()){ markReady(); return; }

      var uid = ses.data.session.user.id;
      var acc = await sb.from("accounts").select("active_level_profile_id,is_admin").eq("id", uid).maybeSingle();   // CNT-06: filter by uid + check error
      if(acc.error){ console.warn("[content] accounts read failed:", acc.error.message || acc.error); return; }     // leave the gate to the 9s watchdog, don't force "no profile"
      try{ window.IS_ADMIN = !!(acc.data && acc.data.is_admin); }catch(e){}
      var pid = acc.data && acc.data.active_level_profile_id;
      if(!pid){ markReady(); return; }   // genuinely no profile yet

      var raw = await fetchRaw(sb, pid);   // throws on a failed read (CNT-03/04) → caught below, cache untouched
      var added = applyContent(raw.courses, raw.topics, raw.byTopic, raw.trById, raw.exById);
      // CNT-03/04: never overwrite a good cache with an empty payload
      var cardCount = 0; for(var k in raw.byTopic){ cardCount += (raw.byTopic[k].primer || []).length + (raw.byTopic[k].recall || []).length; }
      var prev = null; try{ prev = localStorage.getItem(cacheKey(pid)); }catch(e){}
      var prevHadCards = !!prev && prev.indexOf('"q":') !== -1;
      if(raw.courses.length && !(cardCount === 0 && prevHadCards)) saveCache(pid, raw);
      markReady();
      try{ if(typeof render === "function") render(); }catch(e){}
      return added;
    }catch(e){ /* real error: DON'T mark ready — the 9s watchdog recovers, so a valid deep link waits instead of 404-ing (CNT-09) */ }
  }

  window.MB_loadProfileContent = loadProfileContent;
  window.onImported = function(){ loadProfileContent(); };

  /* INSTANT PAINT: rebuild imported content from the local cache the moment
     this script loads (before any network call), then re-render. */
  try{ if(hydrateFromCache()){ if(typeof render === "function") render(); } }catch(e){}
})();
