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

  async function loadProfileContent(){
    try{
      var sb = window.__mbSB; if(!sb) return;
      var ses = await sb.auth.getSession(); if(!ses.data.session) return;
      if(!haveAppCtx()) return;                     // must run inside the app

      var acc = await sb.from("accounts").select("active_level_profile_id").maybeSingle();
      var pid = acc.data && acc.data.active_level_profile_id;
      if(!pid) return;

      var courses = (await sb.from("courses").select("id,name,code").eq("level_profile_id", pid).order("position")).data || [];
      if(!courses.length) return;
      var courseIds = courses.map(function(c){ return c.id; });

      var topics = (await sb.from("topics").select("id,course_id,title,lecturer,note_md,simplified_md")
                      .in("course_id", courseIds).eq("status","ready")).data || [];
      var topicIds = topics.map(function(t){ return t.id; });

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
            id: t.id, name: t.title, lecturer: t.lecturer || "", ready: true,
            note: t.note_md || "", simplified: t.simplified_md || "",
            primer: g.primer, recall: g.recall
          };
          mod.topics.push(topic);
          allTopics.push(Object.assign({ subject:subj, module:mod.name }, topic));
          added++;
        });
      });

      if(added){ try{ if(typeof render === "function") render(); }catch(e){} }
      return added;
    }catch(e){ /* never break the app */ }
  }

  window.MB_loadProfileContent = loadProfileContent;
  // when the Import tab finishes, pull the new topic in immediately
  window.onImported = function(){ loadProfileContent(); };
})();
