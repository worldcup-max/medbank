/* =====================================================================
 * MedBank — per-account content loader (Phase 5)
 * When a student is logged in, this fetches THEIR imported topics + cards
 * for the active level-profile and slots them into the app's own content
 * model (DB.subjects / allTopics) in the exact shape the engine expects, so
 * imported lectures appear and study just like the built-in content.
 *
 * Card ids line up because the server stored card_key = topicId|deck|hash(q),
 * which equals the app's cid(topicId, deck, card) — so SRS state matches.
 *
 * Runs when sync becomes ready (hooked from sync.js). Additive & idempotent.
 * ===================================================================== */
(function () {
  function haveAppCtx(){ try { return typeof DB !== "undefined" && typeof allTopics !== "undefined"; } catch(e){ return false; } }

  /* Rebuild per-subject counts + the lecturers list from loaded topics, so
     subject cards show "X topics / Y built / Z cards" and the Lecturers view works. */
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

  async function loadProfileContent(){
    try{
      var sb = window.__mbSB; if(!sb) return;
      var ses = await sb.auth.getSession(); if(!ses.data.session) return;
      if(!haveAppCtx()) return;                     // must run inside the app

      var acc = await sb.from("accounts").select("active_level_profile_id,is_admin").maybeSingle();
      try{ window.IS_ADMIN = !!(acc.data && acc.data.is_admin); }catch(e){}
      var pid = acc.data && acc.data.active_level_profile_id;
      if(!pid) return;

      var courses = (await sb.from("courses").select("id,name,code").eq("level_profile_id", pid).order("position")).data || [];
      if(!courses.length) return;
      var courseIds = courses.map(function(c){ return c.id; });

      var topics = (await sb.from("topics").select("id,course_id,title,lecturer,note_md,simplified_md,status")
                      .in("course_id", courseIds)).data || [];
      var topicIds = topics.map(function(t){ return t.id; });

      // timestamped lecture transcripts (recordings / YouTube) — guarded: if the column
      // isn't there yet, we simply skip it and the app runs exactly as before.
      var trById = {};
      if(topicIds.length){
        var trRes = await sb.from("topics").select("id,transcript").in("id", topicIds);
        if(trRes && !trRes.error){ (trRes.data||[]).forEach(function(x){ if(x.transcript) trById[x.id]=x.transcript; }); }
      }
      // optional built extras (fill_blank / written) — guarded, independent of the transcript column
      var exById = {};
      if(topicIds.length){
        var exRes = await sb.from("topics").select("id,extras").in("id", topicIds);
        if(exRes && !exRes.error){ (exRes.data||[]).forEach(function(x){ if(x.extras) exById[x.id]=x.extras; }); }
      }

      var cards = topicIds.length
        ? ((await sb.from("cards").select("topic_id,deck,idx,q,payload").in("topic_id", topicIds).order("idx")).data || [])
        : [];
      var byTopic = {};
      cards.forEach(function(c){
        (byTopic[c.topic_id] = byTopic[c.topic_id] || { primer:[], recall:[] });
        var card = Object.assign({ q:c.q }, c.payload || {});   // primer:{lecturer,explain,tie} | recall:{a,opts,ans}
        (byTopic[c.topic_id][c.deck] || byTopic[c.topic_id].recall).push(card);
      });

      var added = 0;
      courses.forEach(function(co){
        var sid = "course_" + co.id;
        var subj = DB.subjects.find(function(s){ return s.id === sid; });
        if(!subj){ subj = { id:sid, name:co.name, modules:[{ name:"Imported", topics:[] }] }; DB.subjects.push(subj); }
        var mod = subj.modules[0] || (subj.modules[0] = { name:"Imported", topics:[] });
        topics.filter(function(t){ return t.course_id === co.id; }).forEach(function(t){
          if(allTopics.some(function(x){ return x.id === t.id; })) return;   // already loaded
          var g = byTopic[t.id] || { primer:[], recall:[] };
          var topic = {
            id: t.id, name: t.title, lecturer: t.lecturer || "", ready: (t.status === "ready"),
            note: t.note_md || "", simplified: t.simplified_md || "",
            transcript: trById[t.id] || null,
            extras: exById[t.id] || null,
            primer: g.primer, recall: g.recall
          };
          mod.topics.push(topic);
          allTopics.push(Object.assign({ subject:subj, module:mod.name }, topic));
          added++;
        });
      });

      recomputeStats();
      try{ if(typeof render === "function") render(); }catch(e){}
      return added;
    }catch(e){ /* never break the app */ }
  }

  window.MB_loadProfileContent = loadProfileContent;
  // when the Import tab finishes, pull the new topic in immediately
  window.onImported = function(){ loadProfileContent(); };
})();
