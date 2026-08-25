/* =====================================================================================
 * MedBank · viz3d.js — the VisualScene player (mode: 3d_anatomy)
 *
 * MedBank owns the intelligence; a provider owns the models. This file is the seam:
 *   MB3D.render(scene, host)  →  picks an adapter by scene.provider.primary  →  adapter draws it.
 *
 * Nothing here touches the SVG Visualize engine or the frozen Smart-Drill engine. The whole file is
 * inert unless MB3D.on() is true (FEATURES.MODEL3D, or localStorage.mb3d === '1' for testing).
 *
 * Public API
 *   MB3D.on()                        → is the feature enabled at all
 *   MB3D.loadIndex()                 → Promise<index>            (scenes/index.json, fetched once)
 *   MB3D.scenesForTopic(name, subj)  → Promise<[indexEntry]>     (which scenes suit this note)
 *   MB3D.partForTerm(term)           → Promise<{scene, key}|null>(highlighted term → the exact part)
 *   MB3D.mount(hostElOrId, sceneId, {part, view}) → Promise<player>
 *   MB3D.dispose()                   → tear down the live player (GPU memory, rAF, listeners)
 *   MB3D.register(name, adapter)     → add a provider adapter
 *
 * Provider adapters implement: capabilities, resolve(structure) → url, load(structure) → Promise<obj3d>.
 * Everything above resolve() is provider-neutral, so swapping BodyParts3D for another provider is a
 * map lookup in the scene's refs — not a corpus rewrite.
 * ===================================================================================== */
(function () {
  'use strict';
  if (window.MB3D) return;

  /* ---------- where our files live (works at /, at /medbank/, and from the test harness) ---------- */
  var SELF = (function () {
    try {
      var s = document.currentScript && document.currentScript.src;
      if (s) return s.replace(/[^/]*$/, '');
    } catch (e) {}
    return '';
  })();
  var BASE = SELF;                                  // repo root as seen by the browser
  var SCENES = BASE + 'viz-training/scenes/';

  var THREE_URLS = [
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
    /* Trackball, not Orbit. OrbitControls pins an "up" axis, so the model stops dead at the poles and a
       student cannot look at it from underneath or roll it — which reads as the viewer being stuck. */
    'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/TrackballControls.js',
    'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js',
    'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/STLLoader.js'
  ];

  function flagOn() {
    try {
      var C = window.MEDBANK_CONFIG || {};
      if (C.FEATURES && C.FEATURES.MODEL3D) return true;
    } catch (e) {}
    try { return localStorage.getItem('mb3d') === '1'; } catch (e) { return false; }
  }

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }

  /* ---------- fetch that survives the service worker's app-shell fallback ----------
     sw.js is cache-first for same-origin with app.html as the final fallback, so a missing scene
     comes back as HTML with status 200. Parsing it as JSON would throw a confusing SyntaxError. */
  function getJSON(url) {
    return fetch(url, { credentials: 'same-origin' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + url);
      return r.text();
    }).then(function (t) {
      var head = t.slice(0, 200).trim().toLowerCase();
      if (head.indexOf('<!doctype') === 0 || head.indexOf('<html') === 0) throw new Error('not-found: ' + url + ' (the app shell was served instead — the file is missing or not deployed)');
      return JSON.parse(t);
    });
  }

  /* ---------- lazy three.js: never loaded until a player actually opens ---------- */
  var _three = null;
  function loadThree() {
    if (_three) return _three;
    _three = new Promise(function (resolve, reject) {
      if (window.THREE && window.THREE.STLLoader && (window.THREE.TrackballControls || window.THREE.OrbitControls)) return resolve(window.THREE);
      var i = 0, timer = setTimeout(function () { reject(new Error('3D library timed out — check your connection.')); }, 20000);
      (function next() {
        if (i >= THREE_URLS.length) {
          clearTimeout(timer);
          if (window.THREE && window.THREE.STLLoader) return resolve(window.THREE);
          return reject(new Error('3D library failed to load.'));
        }
        var el = document.createElement('script');
        el.src = THREE_URLS[i++];
        el.onload = next;
        el.onerror = function () { clearTimeout(timer); reject(new Error('Could not reach the 3D library (offline?).')); };
        document.head.appendChild(el);
      })();
    }).catch(function (e) { _three = null; throw e; });
    return _three;
  }

  /* ======================= provider adapters ======================= */
  var ADAPTERS = {};
  function register(name, adapter) { ADAPTERS[name] = adapter; }

  register('bodyparts3d', {
    label: 'BodyParts3D',
    /* The adapter delivers the model, so the adapter owns the credit. Scene files never carry an
       attribution string — if a scene were rendered by another provider, the credit would be a lie. */
    attribution: 'BodyParts3D, © DBCLS, licensed CC-BY-SA 2.1 JP',
    /* the ONE place a delivery URL is constructed. Self-hosting later changes this line and nothing else. */
    stlBase: 'https://cdn.jsdelivr.net/gh/Kevin-Mattheus-Moerman/BodyParts3D@main/assets/BodyParts3D_data/stl/',
    capabilities: {
      native: ['SHOW_STRUCTURE', 'HIDE_STRUCTURE', 'HIGHLIGHT_STRUCTURE', 'ISOLATE_REGION', 'ROTATE_TO_VIEW',
        'CROSS_SECTION', 'COMPARE_STRUCTURES', 'SHOW_RELATIONSHIP', 'TRACE_STRUCTURE'],
      degraded: ['PEEL_LAYER']
    },
    resolve: function (s) {
      var id = s && s.refs && s.refs.bodyparts3d;
      if (!id) return null;
      /* Self-hosting is a config line, not a code change: set MESH_BASE in config.js once the ingest has
         put meshes in our own store, and every scene follows without being touched. */
      var base = '';
      try { base = (window.MEDBANK_CONFIG && window.MEDBANK_CONFIG.MESH_BASE) || ''; } catch (e) {}
      return (base || this.stlBase) + id + '.stl';
    },
    /* Resolves to a mesh, or to a REASON it has none. The two are not the same thing and the difference
       matters to a student: "there is no model of this structure" is a fact about the corpus, while "the
       download failed" is a fact about the last ten seconds. Reporting the second as the first tells the
       student a lie and sends whoever reads the bug report hunting for a better mesh set that they do not
       need. So: no ref → {reason:'none'}; anything else → {reason:'failed'} after retries are exhausted.

       Retries exist because a public CDN is not a guarantee. Measured 2026-08-25 against the mirror, two of
       the arm scene's nine meshes took over 40 seconds and one never arrived at all on the first attempt —
       with a single try and no timeout, that is a permanently greyed-out muscle for no good reason. */
    load: function (T, s) {
      var url = this.resolve(s);
      if (!url) return Promise.resolve({ mesh: null, reason: 'none' });
      var ATTEMPTS = 3, TIMEOUT = 12000;
      function attempt(n) {
        return new Promise(function (res) {
          var settled = false;
          var timer = setTimeout(function () { if (!settled) { settled = true; res(null); } }, TIMEOUT);
          try {
            new T.STLLoader().load(url + (n ? (url.indexOf('?') < 0 ? '?' : '&') + 'retry=' + n : ''), function (geo) {
              if (settled) return; settled = true; clearTimeout(timer);
              try {
                geo.computeVertexNormals();
                var col = new T.Color(s.color || '#c9c3d8');
                var mat = new T.MeshStandardMaterial({ color: col, roughness: 0.62, metalness: 0.02, transparent: true, opacity: 1, side: T.DoubleSide });
                var mesh = new T.Mesh(geo, mat);
                mesh.userData = s;
                res(mesh);
              } catch (e) { res(null); }
            }, null, function () { if (!settled) { settled = true; clearTimeout(timer); res(null); } });
          } catch (e) { if (!settled) { settled = true; clearTimeout(timer); res(null); } }
        }).then(function (m) {
          if (m || n + 1 >= ATTEMPTS) return m;
          /* back off before trying again — hammering a CDN that just refused makes it likelier to refuse */
          return new Promise(function (r) { setTimeout(r, 400 * Math.pow(2, n)); }).then(function () { return attempt(n + 1); });
        });
      }
      return attempt(0).then(function (m) { return { mesh: m, reason: m ? null : 'failed' }; });
    }
  });

  /* the SVG-engine modes are listed so the dispatcher can say something useful rather than fail */
  register('svg', {
    label: 'MedBank diagram engine',
    capabilities: { native: [], degraded: [] },
    resolve: function () { return null; },
    load: function () { return Promise.resolve(null); },
    unsupported: 'This scene is authored for the diagram engine, not the 3D player.'
  });

  /* ======================= styles (injected once, all mb3d- prefixed) ======================= */
  function injectCSS() {
    if (document.getElementById('mb3dcss')) return;
    var css = document.createElement('style');
    css.id = 'mb3dcss';
    css.textContent = [
      '.mb3d{--m3bg:#141225;--m3pan:#1b1930;--m3pan2:#221f39;--m3ink:#f3f0ff;--m3dim:#a9a4c8;--m3acc:#7c5cff;--m3ok:#28c093;--m3warn:#ffb020;--m3line:#2c2948;',
      'display:flex;flex-direction:column;border:1px solid var(--m3line);border-radius:12px;overflow:hidden;background:var(--m3bg);color:var(--m3ink);font-size:14px}',
      '.mb3d *{box-sizing:border-box}',
      '.mb3d-chips{display:flex;gap:7px;overflow-x:auto;padding:10px 12px;border-bottom:1px solid var(--m3line);-webkit-overflow-scrolling:touch}',
      '.mb3d-chip{flex:none;font:inherit;font-size:12.5px;font-weight:600;padding:6px 12px;border-radius:20px;border:1px solid #35315a;background:#221f3a;color:#e9e6ff;cursor:pointer;white-space:nowrap}',
      '.mb3d-chip.on{background:var(--m3acc);border-color:var(--m3acc);color:#fff}',
      '.mb3d-main{display:flex;min-height:0;height:440px}',
      '.mb3d-stage{position:relative;flex:1;min-width:0}',
      '.mb3d canvas{display:block;width:100%;height:100%}',
      '.mb3d-pins{position:absolute;inset:0;pointer-events:none;overflow:hidden}',
      '.mb3d-leads{position:absolute;inset:0;width:100%;height:100%}',
      '.mb3d-pin{position:absolute;transform:translateY(-50%);font-size:11.5px;font-weight:700;color:#fff;white-space:nowrap;opacity:0;transition:opacity .15s}',
      '.mb3d-pin.on{opacity:1}',
      '.mb3d-pin b{background:rgba(12,10,24,.9);padding:2px 8px;border-radius:6px;border:1px solid currentColor;font-weight:700}',
      '.mb3d-pin.occl{opacity:.45}',
      /* the dot sits ON the structure; the label is pushed clear and joined by a leader line, so a label
         never has to pretend to be where the anatomy is */
      '.mb3d-anchor{position:absolute;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;border:1.5px solid #fff;opacity:0;transition:opacity .15s;box-shadow:0 0 8px currentColor}',
      '.mb3d-anchor.on{opacity:1}',
      '.mb3d-status{position:absolute;left:12px;top:11px;font-size:12.5px;background:rgba(20,18,37,.78);border:1px solid #35315a;padding:6px 11px;border-radius:9px;color:var(--m3dim);max-width:74%}',
      '.mb3d-status.ok{color:var(--m3ok)}.mb3d-status.warn{color:var(--m3warn)}',
      '.mb3d-hint{position:absolute;right:12px;bottom:10px;font-size:11px;color:#8681ab}',
      '.mb3d-side{width:270px;flex:none;border-left:1px solid var(--m3line);background:var(--m3pan);display:flex;flex-direction:column;min-height:0}',
      '.mb3d-sh{padding:10px 13px;font-size:11.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--m3dim);border-bottom:1px solid var(--m3line);display:flex;justify-content:space-between;align-items:center}',
      '.mb3d-sh a{font-size:11px;color:#b3a6ff;text-transform:none;letter-spacing:0;cursor:pointer;text-decoration:underline}',
      '.mb3d-list{overflow:auto;flex:1;padding:6px;min-height:0}',
      '.mb3d-grp{font-size:10.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#8f8ab5;padding:9px 10px 3px}',
      '.mb3d-part{display:flex;gap:9px;align-items:flex-start;width:100%;text-align:left;font:inherit;font-size:13px;padding:7px 10px;border-radius:8px;border:1px solid transparent;background:transparent;color:#e7e3ff;cursor:pointer}',
      '.mb3d-part:hover{background:var(--m3pan2)}.mb3d-part.on{background:#2a2650;border-color:#4a4488}',
      '.mb3d-part[disabled]{opacity:.4;cursor:not-allowed}',
      '.mb3d-dot{width:14px;height:14px;border-radius:50%;flex:0 0 auto;margin-top:2px;border:2px solid #ffffff2a}',
      '.mb3d-part small{display:block;color:#8f8ab5;font-size:11px;margin-top:1px;line-height:1.35}',
      '.mb3d-acts{padding:9px;border-top:1px solid var(--m3line);display:flex;gap:7px;flex-wrap:wrap}',
      '.mb3d-btn{font:inherit;font-size:12.5px;font-weight:600;padding:7px 12px;border-radius:8px;border:1px solid #35315a;background:#221f3a;color:#e9e6ff;cursor:pointer}',
      '.mb3d-btn.pri{background:var(--m3acc);border-color:var(--m3acc);color:#fff}',
      '.mb3d-narr{padding:11px 14px;border-top:1px solid var(--m3line);font-size:13.5px;line-height:1.5;color:#e7e3ff;background:var(--m3pan)}',
      '.mb3d-narr b{color:#c9bcff}',
      '.mb3d-foot{padding:7px 14px;border-top:1px solid var(--m3line);font-size:11px;color:var(--m3dim);display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}',
      '.mb3d-gap{color:var(--m3warn)}',
      '.mb3d-err{padding:26px 20px;text-align:center;color:var(--m3dim);font-size:13.5px}',
      '.mb3d-slider{display:flex;align-items:center;gap:8px;padding:8px 14px;border-top:1px solid var(--m3line);font-size:11.5px;color:var(--m3dim)}',
      '.mb3d-slider input{flex:1}',
      /* the "See it in 3D" overlay — opened from a note, never embedded beside every paragraph */
      '.mb3d-ov{position:fixed;inset:0;z-index:9000;background:rgba(8,7,16,.72);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:18px}',
      '.mb3d-shell{width:min(1100px,100%);max-height:calc(100vh - 36px);display:flex;flex-direction:column;background:#141225;border:1px solid #2c2948;border-radius:14px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.5)}',
      '.mb3d-ovhd{display:flex;align-items:center;gap:10px;padding:11px 14px;border-bottom:1px solid #2c2948;color:#f3f0ff;font-size:14px;font-weight:600}',
      '.mb3d-ovhd small{font-weight:400;color:#a9a4c8;font-size:12.5px}',
      '.mb3d-ovhd button{margin-left:auto;font:inherit;font-size:16px;line-height:1;padding:6px 10px;border-radius:8px;border:1px solid #35315a;background:#221f3a;color:#e9e6ff;cursor:pointer}',
      '.mb3d-ovbody{overflow:auto;padding:12px}',
      '@media(max-width:860px){.mb3d-main{flex-direction:column;height:auto}.mb3d-stage{height:46vh;min-height:280px}.mb3d-side{width:auto;border-left:0;border-top:1px solid var(--m3line);max-height:32vh}.mb3d-status{font-size:11.5px;padding:5px 9px;max-width:86%}.mb3d-acts{padding:7px;gap:6px}.mb3d-btn{font-size:12px;padding:6px 10px}.mb3d-narr{padding:9px 12px;font-size:13px}.mb3d-ov{padding:0}.mb3d-shell{max-height:100vh;border-radius:0;height:100%}.mb3d-ovbody{padding:0}.mb3d-ov .mb3d{border:0;border-radius:0}.mb3d-ovhd small{display:none}.mb3d-ovhd span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}'
    ].join('');
    document.head.appendChild(css);
  }

  /* ======================= the index ======================= */
  var _index = null, _indexData = null;
  function loadIndex() {
    if (_index) return _index;
    _index = getJSON(SCENES + 'index.json')
      .then(function (d) { _indexData = d; return d; })
      .catch(function (e) { _index = null; throw e; });
    return _index;
  }

  /* Whole-word containment over a norm()'d string.
     norm() has already reduced everything to lowercase alphanumerics separated by single spaces, so
     padding both sides with a space makes ' arm ' a true word test with no regex and no escaping.
     This replaces a raw indexOf, which forced a t.length>3 guard to keep 'arm' out of 'warm' — and that
     guard then silently excluded 'arm' itself, the single most common way a note names the topic.
     Word boundaries let short real anatomy through (arm, hip, rib, jaw, eye, ear) while still refusing
     'ear' inside 'heart', which raw substring matching would have happily accepted. */
  function hasWord(hay, t) { return t.length > 2 && hay.indexOf(' ' + t + ' ') >= 0; }

  /* Which scenes suit this topic?
     Title+subject is the primary signal. bodyText is a fallback for the pasted-lecture case, where the
     title is "Week 3" or a lecturer's name and says nothing about the anatomy. The body is held to a
     stricter test — a multi-word topic — so that one stray "arm" in a paragraph cannot grow a 3D tab on
     an unrelated note. Single words in body prose are the inline chips' job, not the tab's. */
  function scenesForTopic(topicName, subjectName, bodyText) {
    return loadIndex().then(function (idx) {
      var title = ' ' + norm(topicName) + ' ' + norm(subjectName || '') + ' ';
      var body = bodyText ? ' ' + norm(String(bodyText).slice(0, 40000)) + ' ' : '';
      if (!title.trim() && !body.trim()) return [];
      return (idx.scenes || []).filter(function (s) {
        // students see validated scenes only — candidate/planned/blocked are for the dev route
        if (s.mode !== '3d_anatomy' || s.status !== 'ready') return false;
        var topics = (s.match.topics || []).map(norm);
        if (topics.some(function (t) { return hasWord(title, t); })) return true;
        if (!body) return false;
        return topics.some(function (t) { return t.indexOf(' ') > 0 && hasWord(body, t); });
      });
    }).catch(function () { return []; });
  }

  function partForTerm(term) {
    var k = norm(term);
    if (k.length < 3) return Promise.resolve(null);
    return loadIndex().then(function (idx) {
      var best = null;
      (idx.scenes || []).forEach(function (s) {
        if (s.mode !== '3d_anatomy' || s.status !== 'ready') return;
        Object.keys(s.terms || {}).forEach(function (t) {
          if (k === t || (k.length > 5 && k.indexOf(t) >= 0) || (t.length > 5 && t.indexOf(k) >= 0)) {
            var score = (k === t ? 100 : Math.min(t.length, k.length));
            if (!best || score > best.score) best = { score: score, scene: s.id, key: s.terms[t], label: t };
          }
        });
      });
      return best;
    }).catch(function () { return null; });
  }

  /* Synchronous lookup against the already-loaded index. Returns null (and warms the index) if it has not
     arrived yet — used by the selection popup, where an async answer would make the button flicker in late. */
  function partForTermSync(term) {
    if (!_indexData) { loadIndex(); return null; }
    var k = norm(term), best = null;
    if (k.length < 3) return null;
    (_indexData.scenes || []).forEach(function (s) {
      if (s.mode !== '3d_anatomy' || s.status !== 'ready') return;
      Object.keys(s.terms || {}).forEach(function (t) {
        if (k === t || (k.length > 5 && k.indexOf(t) >= 0) || (t.length > 5 && t.indexOf(k) >= 0)) {
          var score = (k === t ? 100 : Math.min(t.length, k.length));
          if (!best || score > best.score) best = { score: score, scene: s.id, key: s.terms[t], label: t };
        }
      });
    });
    return best;
  }

  /* Every term the corpus can put a student in front of, longest first.
     Only terms that resolve to a PART are offered: a part is something the student can tap and isolate.
     Context scaffolding (the humerus behind a muscle) is real anatomy but not a destination — offering
     "see it in 3D" on it opens a viewer where nothing is selected. */
  function terms() {
    if (!_indexData) { loadIndex(); return []; }
    var out = [];
    (_indexData.scenes || []).forEach(function (s) {
      if (s.mode !== '3d_anatomy' || s.status !== 'ready') return;
      var partKeys = {};
      (s.parts || []).forEach(function (p) { partKeys[p.key] = 1; });
      Object.keys(s.terms || {}).forEach(function (t) {
        if (t.length > 4 && partKeys[s.terms[t]]) out.push({ term: t, scene: s.id, key: s.terms[t] });
      });
    });
    out.sort(function (a, b) { return b.term.length - a.term.length; });
    return out;
  }

  /* ======================= is this mention worth showing in 3D? =======================
     "The humerus is a long bone of the upper limb" needs no model — the sentence already says it.
     "The long head of biceps arises from the supraglenoid tubercle and passes through the intertubercular
     groove" is exactly what a flat page cannot carry: an origin, a course, a relationship in space.
     Triggering on every anatomical noun would bury a note in chips and teach nothing extra. */

  /* verbs and prepositions that mean a spatial relationship or a course is being described */
  var RELATIONAL = /\b(aris\w+|origin\w*|insert\w*|attach\w*|pass\w*|run\w*|travel\w*|accompan\w*|cross\w*|pierc\w*|emerg\w*|branch\w*|suppl\w*|drain\w*|divid\w*|cours\w*|enter\w*|exit\w*|wind\w*|wrap\w*|descend\w*|ascend\w*|terminat\w*|continu\w*|lie\w*|border\w*|bound\w*|separat\w*|surround\w*|contain\w*|receiv\w*|connect\w*)\b|\b(deep|superficial|medial|lateral|anterior|posterior|proximal|distal|superior|inferior)\s+to\b|\bbetween\b|\bwithin\b|\bbeneath\b|\bbehind\b|\bin front of\b/i;
  /* a bare definition — "X is a long bone", "Y are the muscles of..." — carries no spatial payload */
  var DEFINITIONAL = /\b(is|are|was|were)\s+(a|an|the)\b/i;

  function sentencesOf(text) {
    var out = [], re = /[^.!?;\n]+[.!?;\n]?/g, m;
    while ((m = re.exec(text))) { if (m[0].trim()) out.push({ text: m[0], at: m.index }); }
    return out.length ? out : [{ text: text, at: 0 }];
  }

  function termRe(term) {
    try {
      return new RegExp('\\b' + term.split(' ').map(function (w) { return w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('[\\s\\-]+') + '\\b', 'i');
    } catch (e) { return null; }
  }

  /* Score every structure this text mentions. Higher = more worth seeing.
       +4  the sentence describes a relationship or a course   (priority 2 — the real reason 3D helps)
       +2  the term is central: it opens the sentence           (priority 1 — what the sentence is about)
       +1  the term is specific ("long head of biceps" beats "biceps")
       -3  the sentence is a bare definition with no spatial content (priority 4 — merely mentioned)
     Returns hits sorted best-first, each with the offset where the chip belongs. */
  function rankMentions(text) {
    var list = terms();
    if (!list.length || !text) return [];
    var hits = [], best = {};
    sentencesOf(text).forEach(function (s) {
      var relational = RELATIONAL.test(s.text);
      var definitional = !relational && DEFINITIONAL.test(s.text);
      list.forEach(function (t) {
        var re = termRe(t.term); if (!re) return;
        var m = re.exec(s.text); if (!m) return;
        var score = 1;
        var why = 'mentioned';
        if (relational) { score += 4; why = 'a relationship worth seeing'; }
        if (m.index <= Math.max(24, s.text.length * 0.35)) { score += 2; if (!relational) why = 'what this sentence is about'; }
        if (t.term.indexOf(' ') >= 0) score += 1;
        if (definitional) { score -= 3; why = 'definition only'; }
        var id = t.scene + '|' + t.key;
        if (!best[id] || score > best[id].score) {
          best[id] = { term: t.term, scene: t.scene, key: t.key, score: score, why: why,
                       index: s.at + m.index, match: m[0] };
        }
      });
    });
    Object.keys(best).forEach(function (k) { hits.push(best[k]); });
    hits.sort(function (a, b) { return b.score - a.score || a.index - b.index; });
    return hits;
  }

  /* ======================= what the corpus could not show =======================
     A miss is worth more than a hit for deciding what to author next. When a student reads a sentence that
     deserved a picture about a structure the curriculum names but no scene covers yet, that is demand —
     and demand should set the authoring order, not the alphabet. Only relational sentences count: a passing
     mention of the femur is not a request for a femur scene. */
  function missesIn(text) {
    if (!_indexData || !text) return [];
    var wanted = _indexData.wanted || [];
    if (!wanted.length) return [];
    var out = [], seen = {};
    sentencesOf(text).forEach(function (sen) {
      if (!RELATIONAL.test(sen.text)) return;                 // demand means "this needed a picture"
      wanted.forEach(function (w) {
        if (seen[w.term] || w.term.length < 5) return;
        var re = termRe(w.term); if (!re) return;
        var m = re.exec(sen.text); if (!m) return;
        seen[w.term] = 1;
        out.push({ name: w.name, course: w.course, topic: w.topic, modes: w.modes, match: m[0] });
      });
    });
    return out;
  }

  /* ======================= how many opportunities a note can carry =======================
     "Three" was a safety rail, not a rule. A 200-word note with one good relationship deserves one chip;
     a 3,000-word anatomy chapter with eighteen deserves far more than three; a pharmacology chapter that
     mentions the liver in passing deserves none. The number is a POLICY — tunable without touching the
     scanner — not a constant baked into the product. */
  var POLICY = {
    minScore: 4,          // below this a mention is not worth surfacing at all
    wordsPerChip: 220,    // reading budget: roughly one opportunity per this many words
    minGapChars: 700,     // density: how far apart two chips must sit in the reading flow
    ceiling: 3,           // TEMPORARY testing ceiling. Set to null to let the budget decide.
    floor: 0,             // a note with nothing worth showing gets nothing
    /* Personalisation is confidence-graded on purpose. Two ignored chips say nothing about a student;
       eighty observations say a great deal. Below adaptMinObs the global policy applies unchanged; between
       adaptMinObs and adaptFullObs the student's own behaviour fades in; only past adaptFullObs does it
       carry its full (still bounded) weight. */
    adapt: true,
    adaptMinObs: 20,      // no personalisation at all below this many chips shown
    adaptFullObs: 80,     // full (still bounded) personal weight at this many
    adaptBaseline: 0.25,  // an open rate around this is "normal" — no tilt either way
    adaptStrength: 0.35   // the most personalisation can ever move the budget: ±35%
  };
  function setPolicy(p) { if (p) Object.keys(p).forEach(function (k) { POLICY[k] = p[k]; }); return POLICY; }

  /* The player reports what happened; the app decides where that goes. Keeping the sink abstract is what
     lets viz3d.js stay a renderer rather than something that knows about MedBank's telemetry. */
  var SINK = null;
  function sink(fn) { SINK = (typeof fn === 'function') ? fn : null; }
  function emit(name, data) { try { if (SINK) SINK(name, data || {}); } catch (e) {} }

  /* engagement: cheap, local, per-device. Used only to nudge the budget, never to hide 3D entirely. */
  function engagement() {
    try { return JSON.parse(localStorage.getItem('mb3d_engage') || '{"shown":0,"opened":0}'); }
    catch (e) { return { shown: 0, opened: 0 }; }
  }
  function recordEngagement(kind, n) {
    try {
      var e = engagement();
      e[kind] = (e[kind] || 0) + (n || 1);
      localStorage.setItem('mb3d_engage', JSON.stringify(e));
    } catch (err) {}
  }

  /* Plan a whole note at once.
       passages: [{ text, ref }]  — ref is whatever the caller needs back (a DOM text node, say)
     Returns the opportunities to surface, in reading order, each with the offset inside its passage. */
  function planNote(passages) {
    var list = terms();
    if (!list.length || !passages || !passages.length) return [];

    /* 1 — score every mention, keeping its position in the document as a whole */
    var cands = [], docAt = 0, words = 0;
    passages.forEach(function (p) {
      var text = p.text || '';
      words += (text.match(/\S+/g) || []).length;
      sentencesOf(text).forEach(function (s) {
        var relational = RELATIONAL.test(s.text);
        var definitional = !relational && DEFINITIONAL.test(s.text);
        list.forEach(function (t) {
          var re = termRe(t.term); if (!re) return;
          var m = re.exec(s.text); if (!m) return;
          var score = 1, why = 'mentioned';
          if (relational) { score += 4; why = 'a relationship worth seeing'; }
          if (m.index <= Math.max(24, s.text.length * 0.35)) { score += 2; if (!relational) why = 'what this sentence is about'; }
          if (t.term.indexOf(' ') >= 0) score += 1;
          if (definitional) { score -= 3; why = 'definition only'; }
          cands.push({ ref: p.ref, index: s.at + m.index, docIndex: docAt + s.at + m.index,
                       sentence: docAt + s.at,
                       match: m[0], term: t.term, scene: t.scene, key: t.key, score: score, why: why });
        });
      });
      docAt += text.length;
    });

    cands = cands.filter(function (c) { return c.score >= POLICY.minScore; });
    if (!cands.length) return [];
    cands.sort(function (a, b) { return a.docIndex - b.docIndex; });

    /* 2 — cluster: several structures from ONE scene described in ONE sentence are ONE opportunity.
       "The median nerve arises from the cords, travels with the brachial artery, and passes through the
       cubital fossa" is a single thing to see, not four chips. Clustering is deliberately limited to a
       single sentence: two neighbouring sentences can describe two genuinely different ideas, and merging
       them would put a "+2 related" label on a chip that misrepresents what it opens. Sentences sitting
       too close together are handled by the density rule below instead. */
    var clusters = [], byKey = {};
    cands.forEach(function (c) {
      var id = c.scene + '@' + c.sentence;
      var cl = byKey[id];
      if (cl) {
        if (cl.keys.indexOf(c.key) < 0) cl.keys.push(c.key);
        if (c.score > cl.anchor.score) cl.anchor = c;        // the strongest mention carries the chip
        return;
      }
      cl = { scene: c.scene, keys: [c.key], anchor: c };
      byKey[id] = cl; clusters.push(cl);
    });

    /* 3 — the budget: what this note can carry without becoming a gallery */
    var budget = Math.max(POLICY.floor, Math.round(words / POLICY.wordsPerChip) || 1);
    if (POLICY.adapt) {
      var e = engagement();
      if (e.shown >= POLICY.adaptMinObs) {
        var rate = e.opened / e.shown;
        var base = POLICY.adaptBaseline || 0.25;
        // how far this student sits from normal, clamped to ±1
        var tilt = Math.max(-1, Math.min(1, (rate - base) / base));
        // how much we are entitled to believe it yet, 0 → 1 across the observation window
        var weight = Math.max(0, Math.min(1, (e.shown - POLICY.adaptMinObs) / Math.max(1, POLICY.adaptFullObs - POLICY.adaptMinObs)));
        budget = Math.max(1, Math.round(budget * (1 + (POLICY.adaptStrength || 0.35) * tilt * weight)));
      }
    }
    if (POLICY.ceiling != null) budget = Math.min(budget, POLICY.ceiling);

    /* 4 — density: strongest first, but never two chips inside the same reading window */
    var ranked = clusters.slice().sort(function (a, b) {
      return b.anchor.score - a.anchor.score || b.keys.length - a.keys.length || a.anchor.docIndex - b.anchor.docIndex;
    });
    var taken = [], usedScenes = {};
    for (var i = 0; i < ranked.length && taken.length < budget; i++) {
      var cl = ranked[i], ok = true;
      for (var j = 0; j < taken.length; j++) {
        if (Math.abs(cl.anchor.docIndex - taken[j].anchor.docIndex) < POLICY.minGapChars) { ok = false; break; }
      }
      if (!ok) continue;
      if (usedScenes[cl.scene + '|' + cl.anchor.key]) continue;    // never the same structure twice
      usedScenes[cl.scene + '|' + cl.anchor.key] = 1;
      taken.push(cl);
    }

    taken.sort(function (a, b) { return a.anchor.docIndex - b.anchor.docIndex; });
    return taken.map(function (cl) {
      var a = cl.anchor;
      return { ref: a.ref, index: a.index, match: a.match, scene: a.scene, key: a.key,
               score: a.score, why: a.why, related: cl.keys.length - 1 };
    });
  }

  /* ======================= the player ======================= */
  var LIVE = null;

  function mount(host, sceneId, opts) {
    opts = opts || {};
    host = (typeof host === 'string') ? document.getElementById(host) : host;
    if (!host) return Promise.reject(new Error('no host element'));
    injectCSS();
    dispose();
    host.innerHTML = '<div class="mb3d"><div class="mb3d-err">Loading the 3D scene…</div></div>';
    return getJSON(SCENES + sceneId + '.json').then(function (scene) { return render(host, scene, opts); })
      .catch(function (e) { fail(host, e); throw e; });
  }

  /* Render a scene OBJECT rather than an id. Two callers need this: a page that inlines its scenes (the
     file:// mesh check), and — later — an AI-drafted candidate that has not been written to disk yet. */
  function mountScene(host, scene, opts) {
    opts = opts || {};
    host = (typeof host === 'string') ? document.getElementById(host) : host;
    if (!host) return Promise.reject(new Error('no host element'));
    injectCSS();
    dispose();
    host.innerHTML = '<div class="mb3d"><div class="mb3d-err">Loading the 3D scene…</div></div>';
    return Promise.resolve().then(function () { return render(host, scene, opts); })
      .catch(function (e) { fail(host, e); throw e; });
  }

  function fail(host, e) {
    host.innerHTML = '<div class="mb3d"><div class="mb3d-err"><b style="color:#f3f0ff">3D isn\'t available right now.</b><br><br>' + esc(e && e.message || e) + '</div></div>';
  }

  function render(host, scene, opts) {
    return Promise.resolve(scene)
      .then(function (scene) {
        var providerName = (scene.provider && scene.provider.primary) || 'bodyparts3d';
        var adapter = ADAPTERS[providerName];
        if (!adapter) throw new Error('No renderer for provider "' + providerName + '".');
        if (adapter.unsupported) throw new Error(adapter.unsupported);
        if (scene.mode && scene.mode !== '3d_anatomy') throw new Error('This scene is authored for the "' + scene.mode + '" engine.');
        return loadThree().then(function (T) { return build(T, host, scene, adapter, opts); });
      });
  }

  function build(T, host, scene, adapter, opts) {
    var structures = (scene.structures || []).filter(function (s) { return s.key; });
    var parts = structures.filter(function (s) { return s.role === 'part'; });
    var views = scene.views || [];

    host.innerHTML =
      '<div class="mb3d">' +
        '<div class="mb3d-chips" data-r="chips"></div>' +
        '<div class="mb3d-main">' +
          '<div class="mb3d-stage" data-r="stage"><canvas data-r="canvas"></canvas>' +
            '<div class="mb3d-pins" data-r="pins"><svg class="mb3d-leads" data-r="leads"></svg></div>' +
            '<div class="mb3d-status" data-r="status">Loading meshes…</div><div class="mb3d-hint">drag to rotate · scroll to zoom</div></div>' +
          '<div class="mb3d-side">' +
            '<div class="mb3d-sh"><span data-r="sidehd">Parts</span><a data-r="showall">show all</a></div>' +
            '<div class="mb3d-list" data-r="list"></div>' +
            '<div class="mb3d-acts"><button class="mb3d-btn pri" data-r="play">▶ Play</button>' +
              '<button class="mb3d-btn" data-r="retry" style="display:none">↻ Retry</button>' +
              '<button class="mb3d-btn" data-r="tour">Tour parts</button>' +
              '<button class="mb3d-btn" data-r="ghost">Ghost others</button>' +
              '<button class="mb3d-btn" data-r="solo">Only this</button></div>' +
          '</div>' +
        '</div>' +
        '<div class="mb3d-slider" data-r="cliprow" style="display:none">Cut plane<input type="range" data-r="clip" min="-1" max="1" step="0.01" value="0"></div>' +
        '<div class="mb3d-narr" data-r="narr"></div>' +
        '<div class="mb3d-foot"><span>' + esc(adapter.attribution || '') + '</span><span data-r="note"></span></div>' +
      '</div>';

    var $ = function (r) { return host.querySelector('[data-r="' + r + '"]'); };
    var stage = $('stage'), canvas = $('canvas'), pinWrap = $('pins'), leads = $('leads');
    var stFade = null;
    function st(t, c, fade) {
      var e = $('status'); e.textContent = t; e.className = 'mb3d-status' + (c ? ' ' + c : '');
      e.style.opacity = '1';
      if (stFade) clearTimeout(stFade);
      // once the scene is up, the pill has said its piece — fade it so it stops covering a small stage
      if (fade) stFade = setTimeout(function () { if (e) { e.style.transition = 'opacity .6s'; e.style.opacity = '0'; } }, 4500);
    }

    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.localClippingEnabled = true;
    if (T.sRGBEncoding) renderer.outputEncoding = T.sRGBEncoding;

    var sceneObj = new T.Scene(); sceneObj.background = new T.Color(0x141225);
    var camera = new T.PerspectiveCamera(45, 1, 0.01, 4000); camera.position.set(0, 0.4, 7);
    /* Trackball: no fixed up-axis, so the model turns freely on every axis instead of jamming at the
       poles. OrbitControls stays as a fallback if the trackball script did not load. */
    var trackball = !!T.TrackballControls;
    var controls = trackball ? new T.TrackballControls(camera, renderer.domElement)
                             : new T.OrbitControls(camera, renderer.domElement);
    if (trackball) {
      controls.rotateSpeed = 3.2; controls.zoomSpeed = 1.2; controls.panSpeed = 0.8;
      controls.staticMoving = false; controls.dynamicDampingFactor = 0.15;
      controls.minDistance = 1.2; controls.maxDistance = 200;
    } else {
      controls.enableDamping = true; controls.dampingFactor = 0.09;
      controls.minDistance = 1.2; controls.maxDistance = 200;
    }

    sceneObj.add(new T.HemisphereLight(0xf2ecff, 0x20203a, 1.0));
    var k1 = new T.DirectionalLight(0xffffff, 1.15); k1.position.set(5, 8, 6); sceneObj.add(k1);
    var k2 = new T.DirectionalLight(0xbfd0ff, 0.5); k2.position.set(-6, 2, 4); sceneObj.add(k2);
    var k3 = new T.DirectionalLight(0x9d8bff, 0.6); k3.position.set(-3, 3, -6); sceneObj.add(k3);

    var holder = new T.Group(); sceneObj.add(holder);
    var overlay = new T.Group(); sceneObj.add(overlay);          // relationship lines
    /* missing = the corpus has no model for this structure (a real, permanent gap)
       failed  = there IS a model and we could not fetch it (transient, and retryable) */
    var meshes = {}, pins = {}, loadedKeys = [], missing = [], failed = [], failedKeys = [];
    var clipPlane = new T.Plane(new T.Vector3(0, 0, -1), 0), clipping = false;
    /* Auto-rotation is an invitation, not a behaviour. It shows the thing is three-dimensional for three
       seconds, then the model belongs to the student — and the first touch ends it for good, so nothing
       ever drifts out from under a finger. */
    var SPIN_MS = 3000, spinTill = 0, spinning = false, lastT = 0;
    function startSpin() { spinning = true; spinTill = (window.performance || Date).now() + SPIN_MS; }
    function stopSpin() { spinning = false; }
    ['pointerdown', 'wheel', 'touchstart', 'keydown'].forEach(function (ev) {
      renderer.domElement.addEventListener(ev, stopSpin, { passive: true });
    });
    var selected = [], ghost = false, solo = false, running = true, raf = 0, tourTimer = null, playTimer = null;
    var currentView = 0;                               // so a retry can restore the view the student was on
    /* interaction depth — the difference between "opened it" and "used it" */
    var useCount = { partTaps: 0, views: 0, traces: 0, solo: 0, ghost: 0, played: 0, tours: 0 };
    var openedAt = (window.performance || Date).now();
    var degraded = {};

    /* ---------- load every structure; a failure is reported, never fatal ---------- */
    var anchorStructs = structures.filter(function (s) { return s.render === 'anchor'; });
    var meshStructs = structures.filter(function (s) { return s.render !== 'anchor'; });
    function loadOne(s) {
      return Promise.resolve(adapter.load(T, s)).then(function (r) {
        /* adapters may still return a bare mesh or null; normalise so an old adapter keeps working */
        if (!r || r.isObject3D) r = { mesh: r || null, reason: r ? null : 'none' };
        if (!r.mesh) {
          (r.reason === 'failed' ? failed : missing).push(s.label || s.key);
          if (r.reason === 'failed') failedKeys.push(s.key);
          return false;
        }
        holder.add(r.mesh); meshes[s.key] = r.mesh; loadedKeys.push(s.key);
        return true;
      });
    }
    var jobs = meshStructs.map(loadOne);

    /* A landmark is a place ON a bone, not a model of its own: the supraglenoid tubercle has no mesh, it
       is a spot on the scapula. Anchors are authored in the parent's own bounding box as fractions
       (uvw, each 0–1), so they survive any scaling the viewer applies and travel with the parent when it
       moves. They are children of the parent mesh, which is what keeps them exactly where they were put. */
    /* Idempotent on purpose: this runs again whenever a late or retried bone arrives, and a landmark that
       got added twice would sit in the scene as a doubled, double-bright pin that never goes away. */
    function placeAnchors() {
      anchorStructs.forEach(function (s) {
        var old = meshes[s.key];
        if (old) { if (old.parent) old.parent.remove(old); delete meshes[s.key];
          var li = loadedKeys.indexOf(s.key); if (li >= 0) loadedKeys.splice(li, 1); }
      });
      anchorStructs.forEach(function (s) {
        var a = s.anchor || {}, parent = meshes[a.on];
        var col = new T.Color(s.color || '#ffcf5c');
        var r = a.radius || 0.05;
        var g = new T.Mesh(new T.SphereGeometry(1, 20, 16),
          new T.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.65, transparent: true, depthTest: false }));
        g.renderOrder = 5; g.userData = s;
        if (parent) {
          if (!parent.geometry.boundingBox) parent.geometry.computeBoundingBox();
          var bb = parent.geometry.boundingBox, size = bb.getSize(new T.Vector3());
          var uvw = a.uvw || [0.5, 0.5, 0.5];
          g.position.set(bb.min.x + size.x * uvw[0], bb.min.y + size.y * uvw[1], bb.min.z + size.z * uvw[2]);
          g.scale.setScalar(r * Math.max(size.x, size.y, size.z));
          parent.add(g);                                   // rides the parent's transform for free
        } else if (a.xyz) {
          g.position.set(a.xyz[0], a.xyz[1], a.xyz[2]);
          g.scale.setScalar(r * 4);
          holder.add(g);
        } else { return; }
        meshes[s.key] = g; loadedKeys.push(s.key);
      });
    }

    var player = {
      scene: scene, host: host, meshes: meshes,
      camera: camera, controls: controls,          // exposed for tests and for tuning from the console
      dispose: function () { teardown(); }
    };
    LIVE = player;

    /* mount() resolves only once every mesh has settled, so callers can trust that the parts list,
       the view chips and any requested part focus are on screen when the promise resolves. */
    /* Do not hold the whole viewer hostage to the slowest file. Three attempts against a 12-second
       timeout means one dead mesh could keep a student staring at an empty stage for over half a minute
       while eight others sat loaded and ready. So the scene opens on whichever arrives first: everything,
       or a deadline. Stragglers are still running, and each one that lands afterwards folds itself in. */
    var OPEN_AFTER = 8000;
    var settled = false, lateTimer = null;
    jobs.forEach(function (j) { j.then(function () { if (settled) scheduleLate(); }); });

    function scheduleLate() {                              // debounced: several may land together
      if (lateTimer) return;
      lateTimer = setTimeout(function () {
        lateTimer = null;
        if (!LIVE || LIVE !== player) return;              // the student navigated away; do nothing
        fit(); placeAnchors(); buildList(); buildChips(); applyView(currentView || 0);
        showLoadStatus();
      }, 250);
    }

    var ready = Promise.race([
      Promise.all(jobs),
      new Promise(function (r) { setTimeout(r, OPEN_AFTER); })
    ]).then(function () {
      settled = true;
      if (!loadedKeys.length && !meshStructs.length) { st('This scene has no 3D models.', 'warn'); return player; }
      if (!loadedKeys.length) { st('Still fetching — nothing has arrived yet.', 'warn'); return player; }
      fit();
      placeAnchors();                                // after fit(), so landmarks land on the settled bones
      holder.rotation.y = (scene.camera && scene.camera.initialYaw) || 0;
      startSpin();                                   // a 3-second first glance, then it is the student's
      buildList(); buildChips();
      applyView(0);
      if (opts.part && meshes[opts.part]) focusPart(opts.part);
      emit('open', { scene: scene.id, via: opts.via || 'tab', part: opts.part || null,
                     structures: structures.length, loaded: loadedKeys.length,
                     missing: missing.length, failed: failed.length,
                     load_ms: Math.round((window.performance || Date).now() - openedAt) });
      showLoadStatus();
      note();
      return player;
    });

    /* Say which of the two things happened, because they call for different responses: a gap is the
       corpus's problem and there is nothing the student can do, while a failed download is worth one tap. */
    function showLoadStatus() {
      /* Three states, and conflating any two of them misinforms the student:
           pending — still on the wire. Saying anything final about it now would be guessing.
           failed  — tried and gave up. One tap can fix it.
           missing — the corpus has no model. Nothing to tap.                                        */
      var pending = meshStructs.length - meshStructs.filter(function (s) {
        return meshes[s.key] || failedKeys.indexOf(s.key) >= 0 || missing.indexOf(s.label || s.key) >= 0;
      }).length;
      var msg = 'Loaded ' + loadedKeys.length + ' of ' + structures.length + ' parts';
      showRetry(failed.length > 0 && !retrying);
      if (pending > 0) st(msg + ' — still fetching ' + pending + '…', 'warn', false);
      else if (failed.length) st(msg + ' — ' + failed.length + " didn't download. Tap ↻ Retry.", 'warn', false);
      else if (missing.length) st(msg + ' — ' + missing.length + ' have no 3D model yet.', 'warn', true);
      else st(msg + ' — tap any part to isolate it.', 'ok', true);
    }

    function showRetry(on) {
      var e = $('retry'); if (!e) return;
      e.style.display = on ? '' : 'none';
    }

    /* Retry only the ones that failed. Nothing that already loaded is touched, so a retry can never
       cost a student a working mesh. */
    var retrying = false;
    function retryFailed() {
      if (retrying || !failedKeys.length) return;
      retrying = true;
      var again = meshStructs.filter(function (s) { return failedKeys.indexOf(s.key) >= 0; });
      failed.length = 0; failedKeys.length = 0;
      st('Retrying ' + again.length + '…', 'warn', false);
      emit('retry', { scene: scene.id, parts: again.length });
      Promise.all(again.map(loadOne)).then(function () {
        retrying = false;
        fit(); placeAnchors(); buildList(); buildChips(); applyView(currentView || 0);
        showLoadStatus();
      });
    }

    function note() {
      var bits = [];
      /* A scene that has not passed the gate can still be opened on the dev route — it must never look
         like finished teaching. scenesForTopic() only ever hands students `ready` scenes. */
      if (scene.status && scene.status !== 'ready') bits.push('<span class="mb3d-gap">' + esc(scene.status.toUpperCase()) + ' — not shown to students</span>');
      if ((scene.gaps || []).length) bits.push('<span class="mb3d-gap" title="' + esc(scene.gaps.join(' · ')) + '">⚠ ' + scene.gaps.length + ' known gap' + (scene.gaps.length === 1 ? '' : 's') + '</span>');
      var d = Object.keys(degraded);
      if (d.length) bits.push('<span class="mb3d-gap" title="This renderer approximates: ' + esc(d.join(', ')) + '">≈ simplified: ' + esc(d.join(', ').toLowerCase().replace(/_/g, ' ')) + '</span>');
      $('note').innerHTML = bits.join(' · ');
    }

    function fit() {
      var box = new T.Box3().setFromObject(holder), c = new T.Vector3(), s = new T.Vector3();
      box.getCenter(c); box.getSize(s);
      holder.children.forEach(function (m) { m.position.sub(c); });
      var mx = Math.max(s.x, s.y, s.z) || 1;
      holder.scale.setScalar(4.2 / mx);
    }

    /* ---------- parts list ---------- */
    function buildList() {
      var list = $('list'); list.innerHTML = '';
      Array.prototype.slice.call(pinWrap.children).forEach(function (c) { if (c !== leads) pinWrap.removeChild(c); });
      leads.innerHTML = ''; pins = {};
      $('sidehd').textContent = (scene.structure || 'Parts') + ' · ' + parts.length;
      var lastGrp = null;
      parts.forEach(function (p) {
        var ok = !!meshes[p.key];
        if (p.group && p.group !== lastGrp) {
          var g = document.createElement('div'); g.className = 'mb3d-grp'; g.textContent = p.group; list.appendChild(g); lastGrp = p.group;
        }
        var b = document.createElement('button');
        b.className = 'mb3d-part'; b.setAttribute('data-key', p.key);
        if (!ok) b.setAttribute('disabled', '');
        b.innerHTML = '<span class="mb3d-dot" style="background:' + (ok ? esc(p.color || '#7c5cff') : '#3a365e') + '"></span>' +
          '<span><b style="font-weight:600">' + esc(p.label) + '</b><small>' + esc(
            ok ? (p.narration || '')
               : (failedKeys.indexOf(p.key) >= 0 ? 'download failed — tap ↻ Retry above' : 'no 3D model of this structure yet')
          ) + '</small></span>';
        if (ok) b.addEventListener('click', function () { toggle(p.key); });
        list.appendChild(b);
        if (ok) addPin(p);
      });
      // context structures get a pin too — no button, but when a view highlights one it must be named
      structures.forEach(function (s) { if (s.role !== 'part' && meshes[s.key]) addPin(s); });
    }
    function addPin(s) {
      if (pins[s.key]) return;
      var col = esc(s.color || '#7c5cff');
      var label = document.createElement('div');
      label.className = 'mb3d-pin'; label.style.color = col;
      label.innerHTML = '<b>' + esc(s.label || s.key) + '</b>';
      var dot = document.createElement('div');
      dot.className = 'mb3d-anchor'; dot.style.background = col; dot.style.color = col;
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('stroke', col); line.setAttribute('stroke-width', '1.2');
      line.setAttribute('opacity', '0');
      leads.appendChild(line); pinWrap.appendChild(dot); pinWrap.appendChild(label);
      pins[s.key] = { label: label, dot: dot, line: line };
    }

    function buildChips() {
      var chips = $('chips'); chips.innerHTML = '';
      views.forEach(function (v, i) {
        var b = document.createElement('button');
        b.className = 'mb3d-chip' + (i === 0 ? ' on' : '');
        b.textContent = v.title || v.mode;
        b.addEventListener('click', function () { applyView(i); });
        chips.appendChild(b);
      });
    }

    /* ---------- ops ---------- */
    function keysFor(target) {
      if (!target || target === '*') return structures.map(function (s) { return s.key; });
      if (meshes[target] || structures.some(function (s) { return s.key === target; })) return [target];
      return structures.filter(function (s) { return s.group === target; }).map(function (s) { return s.key; });
    }

    var state = {};
    function resetState() {
      state = { visible: {}, hi: {}, ghosted: false, only: null, clip: null, pairs: [] };
      structures.forEach(function (s) { state.visible[s.key] = true; });
    }

    function runOps(ops) {
      resetState();
      overlay.clear ? overlay.clear() : (function () { while (overlay.children.length) overlay.remove(overlay.children[0]); })();
      (ops || []).forEach(function (o) {
        switch (o.op) {
          case 'SHOW_STRUCTURE': keysFor(o.target).forEach(function (k) { state.visible[k] = true; }); break;
          case 'HIDE_STRUCTURE': keysFor(o.target).forEach(function (k) { state.visible[k] = false; }); break;
          case 'HIGHLIGHT_STRUCTURE': keysFor(o.target).forEach(function (k) { state.hi[k] = o.intensity || 0.45; }); break;
          case 'ISOLATE_REGION': state.only = keysFor(o.target); state.ghosted = true; break;
          case 'ROTATE_TO_VIEW': rotateTo(o.view); break;
          case 'CROSS_SECTION': state.clip = { axis: o.axis || 'z', offset: o.offset || 0 }; break;
          case 'COMPARE_STRUCTURES':
            state.only = (o.targets || []).reduce(function (a, t) { return a.concat(keysFor(t)); }, []);
            state.ghosted = true;
            state.only.forEach(function (k) { state.hi[k] = 0.5; });
            break;
          case 'SHOW_RELATIONSHIP': state.pairs.push(o); state.hi[o.from] = 0.5; state.hi[o.to] = 0.5; break;
          case 'TRACE_STRUCTURE': degraded.TRACE_STRUCTURE = 1; trace(o); break;
          case 'PEEL_LAYER':
            degraded.PEEL_LAYER = 1;
            structures.forEach(function (s) { if (s.layer === o.layer) state.visible[s.key] = false; });
            break;
        }
      });
      paint(); drawPairs();
    }

    function applyView(i, fromPlay) {
      var v = views[i]; if (!v) return;
      currentView = i;
      useCount.views++;
      stopTour();
      if (!fromPlay) stopPlay();
      Array.prototype.forEach.call(host.querySelectorAll('.mb3d-chip'), function (c, k) { c.classList.toggle('on', k === i); });
      selected = [];
      Array.prototype.forEach.call(host.querySelectorAll('.mb3d-part'), function (b) { b.classList.remove('on'); });
      /* the view's own line goes up FIRST, so an op that narrates per step (TRACE) overwrites it rather
         than being overwritten by it */
      $('narr').innerHTML = '<b>' + esc(v.title || v.mode) + '</b> — ' + esc(v.narration || '');
      runOps(v.ops);
      var row = $('cliprow');
      row.style.display = state.clip ? 'flex' : 'none';
      if (state.clip) { $('clip').value = state.clip.offset; setClip(state.clip.axis, state.clip.offset); }
      else { clipping = false; }
      note();
    }

    $('clip').addEventListener('input', function () { if (state.clip) setClip(state.clip.axis, parseFloat(this.value)); });

    function setClip(axis, offset) {
      var n = axis === 'x' ? new T.Vector3(-1, 0, 0) : axis === 'y' ? new T.Vector3(0, -1, 0) : new T.Vector3(0, 0, -1);
      clipPlane.normal.copy(n); clipPlane.constant = offset * 3;
      clipping = true; paint();
    }

    function rotateTo(view) {
      var d = camera.position.length() || 7, p = { anterior: [0, 0, d], posterior: [0, 0, -d], lateral: [d, 0, 0], medial: [-d, 0, 0], superior: [0, d, 0.001], inferior: [0, -d, 0.001] }[view];
      if (!p) return;
      controls.autoRotate = false;
      var from = camera.position.clone(), to = new T.Vector3(p[0], p[1], p[2]), t0 = performance.now();
      (function step() {
        var t = Math.min(1, (performance.now() - t0) / 700), e = t * t * (3 - 2 * t);
        camera.position.lerpVectors(from, to, e); camera.lookAt(0, 0, 0);
        if (t < 1 && running) requestAnimationFrame(step); else controls.autoRotate = true;
      })();
    }

    /* TRACE: walk the authored path one waypoint at a time — the structure stays on screen, the camera
       travels to each landmark in turn, and the narration bar says what you are looking at. "Arises from
       the supraglenoid tubercle and passes through the intertubercular groove" is three stops on a
       journey, not three bones lighting up. */
    var traceTimer = null;
    function flyTo(pos, dist, ms) {
      var from = camera.position.clone();
      var tgtFrom = (controls.target || new T.Vector3()).clone();
      var dir = camera.position.clone().sub(tgtFrom).normalize();
      var to = pos.clone().add(dir.multiplyScalar(dist || camera.position.distanceTo(tgtFrom)));
      var t0 = (window.performance || Date).now(); ms = ms || 700;
      (function step() {
        var t = Math.min(1, ((window.performance || Date).now() - t0) / ms), e = t * t * (3 - 2 * t);
        camera.position.lerpVectors(from, to, e);
        if (controls.target) controls.target.lerpVectors(tgtFrom, pos, e);
        if (t < 1 && running) requestAnimationFrame(step);
      })();
    }
    function frameDist(m) {
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      var s = m.geometry.boundingBox.getSize(new T.Vector3());
      var world = Math.max(s.x, s.y, s.z) * holder.scale.x * (m.scale ? m.scale.x : 1);
      return Math.max(1.6, Math.min(9, world * 3.2 + 1.2));
    }
    function trace(o) {
      useCount.traces++;
      var subject = o.target && meshes[o.target] ? o.target : null;
      var path = (o.path || []).filter(function (k) { return meshes[k]; });
      if (!path.length) return;
      var i = 0, step = Math.max(1600, ((o.duration || 6) * 1000) / path.length);
      clearInterval(traceTimer);
      stopSpin();
      function go() {
        if (!running || i >= path.length) { clearInterval(traceTimer); traceTimer = null; return; }
        var k = path[i], m = meshes[k];
        state.hi = {}; state.hi[k] = 0.85;
        if (subject) state.hi[subject] = 0.45;                 // the structure being traced stays lit
        state.only = subject ? [k, subject] : [k];
        state.ghosted = true;
        paint();
        flyTo(center(m), frameDist(m), 900);
        var s = structures.filter(function (x) { return x.key === k; })[0];
        if (s) $('narr').innerHTML = '<b>' + esc(s.label) + '</b>' + (s.narration ? ' — ' + esc(s.narration) : '') +
          '<span style="color:#8f8ab5;font-size:12px"> · step ' + (i + 1) + ' of ' + path.length + '</span>';
        i++;
      }
      go();
      traceTimer = setInterval(go, step);
    }

    function drawPairs() {
      (state.pairs || []).forEach(function (o) {
        var a = meshes[o.from], b = meshes[o.to]; if (!a || !b) return;
        var pa = center(a), pb = center(b);
        var geo = new T.BufferGeometry().setFromPoints([pa, pb]);
        var line = new T.Line(geo, new T.LineBasicMaterial({ color: 0xb3a6ff, transparent: true, opacity: 0.8 }));
        overlay.add(line);
      });
    }

    /* The bounding-BOX centre, not the bounding-sphere centre. For a long thin muscle the sphere centre
       can sit well off the mesh; the box centre stays on it, which is what makes the dot land on the
       structure rather than near it. */
    function center(m) {
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      var c = m.geometry.boundingBox.getCenter(new T.Vector3());
      m.localToWorld(c); return c;
    }

    function toggle(key) {
      useCount.partTaps++;
      var i = selected.indexOf(key);
      if (i >= 0) selected.splice(i, 1); else selected.push(key);
      var b = host.querySelector('.mb3d-part[data-key="' + key + '"]');
      if (b) b.classList.toggle('on', selected.indexOf(key) >= 0);
      paint();
    }

    function focusPart(key) {
      selected = [key]; ghost = true;
      var b = host.querySelector('.mb3d-part[data-key="' + key + '"]');
      if (b) { b.classList.add('on'); try { b.scrollIntoView({ block: 'nearest' }); } catch (e) {} }
      var s = structures.filter(function (x) { return x.key === key; })[0];
      if (s) $('narr').innerHTML = '<b>' + esc(s.label) + '</b> — ' + esc(s.narration || '');
      paint();
    }

    function paint() {
      var anySel = selected.length > 0;
      structures.forEach(function (s) {
        var m = meshes[s.key]; if (!m) return;
        var visible = state.visible ? state.visible[s.key] !== false : true;
        if (state.only && state.only.indexOf(s.key) < 0 && !state.ghosted) visible = false;
        // "Only this": ghosting to 10% still leaves a haze. Sometimes a student wants the structure alone.
        if (solo && anySel && selected.indexOf(s.key) < 0) visible = false;
        m.visible = visible;
        var isSel = selected.indexOf(s.key) >= 0;
        var isHi = isSel || (state.hi && state.hi[s.key] != null);
        var offstage = (anySel && !isSel) || (state.only && state.only.indexOf(s.key) < 0);
        m.material.opacity = isHi ? 1 : (offstage ? (ghost || state.ghosted ? 0.10 : 0.55) : 1);
        m.material.emissive.set(isHi ? new T.Color(s.color || '#7c5cff') : 0x000000);
        m.material.emissiveIntensity = isSel ? 0.5 : (state.hi && state.hi[s.key]) || 0;
        m.material.clippingPlanes = (clipping && s.role !== 'part') ? [clipPlane] : null;
        m.material.needsUpdate = true;
      });
      Object.keys(pins).forEach(function (k) {
        var show = !!(selected.indexOf(k) >= 0 || (state.hi && state.hi[k] != null)) && !!(meshes[k] && meshes[k].visible);
        pins[k].label.classList.toggle('on', show);
        pins[k].dot.classList.toggle('on', show);
        pins[k].line.setAttribute('opacity', show ? '0.75' : '0');
      });
    }

    $('showall').addEventListener('click', function () {
      selected = []; ghost = false; solo = false;
      Array.prototype.forEach.call(host.querySelectorAll('.mb3d-part'), function (b) { b.classList.remove('on'); });
      $('ghost').classList.remove('pri'); $('solo').classList.remove('pri');
      paint();
    });
    $('ghost').addEventListener('click', function () {
      ghost = !ghost; if (ghost) { useCount.ghost++; solo = false; $('solo').classList.remove('pri'); }
      this.classList.toggle('pri', ghost); paint();
    });
    $('solo').addEventListener('click', function () {
      solo = !solo; if (solo) { useCount.solo++; ghost = false; $('ghost').classList.remove('pri'); }
      this.classList.toggle('pri', solo); paint();
    });
    $('tour').addEventListener('click', function () { tourTimer ? stopTour() : startTour(); });
    $('play').addEventListener('click', function () { playTimer ? stopPlay() : startPlay(); });
    $('retry').addEventListener('click', retryFailed);

    /* ---------- play the scene as a short narrated sequence ----------
       This is the "visualize video" shape: the beats the author wrote, in order, each with its camera,
       its highlights and its line of narration — but still a live model the student can grab at any time. */
    function startPlay() {
      if (!views.length) return;
      useCount.played++;
      stopTour(); stopSpin();
      var i = 0;
      $('play').textContent = '■ Stop'; $('play').classList.add('pri');
      function beat() {
        if (!running || i >= views.length) { stopPlay(); return; }
        applyView(i, true);
        i++;
      }
      beat();
      playTimer = setInterval(beat, 7000);
    }
    function stopPlay() {
      if (playTimer) clearInterval(playTimer);
      playTimer = null;
      var b = $('play'); if (b) { b.textContent = '▶ Play'; b.classList.add('pri'); }
    }

    function startTour() {
      useCount.tours++;
      var i = 0, keys = parts.filter(function (p) { return meshes[p.key]; }).map(function (p) { return p.key; });
      if (!keys.length) return;
      ghost = true; $('ghost').classList.add('pri'); $('tour').textContent = '■ Stop';
      function step() {
        if (i >= keys.length) { stopTour(); return; }
        selected = [keys[i]];
        Array.prototype.forEach.call(host.querySelectorAll('.mb3d-part'), function (b) { b.classList.toggle('on', b.getAttribute('data-key') === keys[i]); });
        focusPart(keys[i]); i++;
      }
      step(); tourTimer = setInterval(step, 2600);
    }
    function stopTour() {
      if (tourTimer) clearInterval(tourTimer);
      tourTimer = null; $('tour').textContent = 'Tour parts';
    }

    /* ---------- calibrate mode: put a landmark exactly where it belongs ----------
       Turn on with localStorage.mb3dcal = '1'. Click anywhere on a bone and the viewer prints the anchor
       JSON for that exact spot, in the parent's own coordinates, ready to paste into the scene file.
       Authored once by us, never by a student — and the validator keeps it "needs-review" until a human
       has looked at it. */
    function calOn() { try { return localStorage.getItem('mb3dcal') === '1'; } catch (e) { return false; } }
    if (calOn()) {
      canvas.style.cursor = 'crosshair';
      canvas.addEventListener('click', function (e) {
        var r = canvas.getBoundingClientRect();
        var ndc = new T.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        var hit = ray.intersectObjects(holder.children, false).filter(function (h) { return h.object.visible; })[0];
        if (!hit) return;
        var m = hit.object, s = m.userData || {};
        if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
        var bb = m.geometry.boundingBox, size = bb.getSize(new T.Vector3());
        var local = m.worldToLocal(hit.point.clone());
        var uvw = [(local.x - bb.min.x) / size.x, (local.y - bb.min.y) / size.y, (local.z - bb.min.z) / size.z]
          .map(function (n) { return Math.round(n * 1000) / 1000; });
        var snippet = '{ "key": "NEW_LANDMARK", "label": "Name it", "role": "part", "render": "anchor",\n' +
          '  "anchor": { "on": "' + (s.key || '?') + '", "uvw": [' + uvw.join(', ') + '], "radius": 0.05 },\n' +
          '  "status": "needs-review", "terms": [], "narration": "" }';
        try { console.log('[mb3d calibrate] on ' + (s.key || '?') + ':\n' + snippet); } catch (x) {}
        $('narr').innerHTML = '<b>Calibrate</b> — on <b>' + esc(s.label || s.key) + '</b>, uvw = [' + uvw.join(', ') +
          ']<br><textarea readonly style="width:100%;height:74px;margin-top:6px;background:#141225;color:#c9bcff;border:1px solid #35315a;border-radius:8px;padding:7px;font:12px ui-monospace,Menlo,Consolas,monospace">' +
          esc(snippet) + '</textarea>';
      });
    }

    /* ---------- labels ---------- */
    var v3 = new T.Vector3(), ray = new T.Raycaster(), occlAt = 0;
    var LABEL_H = 26;                                  // the vertical room one label needs
    function updatePins() {
      var w = stage.clientWidth, h = stage.clientHeight, live = [];

      Object.keys(pins).forEach(function (k) {
        var p = pins[k], m = meshes[k];
        if (!p.label.classList.contains('on') || !m || !m.visible) { park(p); return; }
        v3.copy(center(m)).project(camera);
        if (v3.z > 1) { park(p); return; }              // behind the camera — no label at all
        live.push({ k: k, p: p, m: m, x: (v3.x * 0.5 + 0.5) * w, y: (-v3.y * 0.5 + 0.5) * h });
      });

      /* Declutter: labels are laid out top-to-bottom and pushed apart until none overlap, then nudged
         inside the frame. The dot stays put — only the label moves, and the leader line keeps the two
         connected, so a crowd of structures never becomes a pile of unreadable text. */
      live.sort(function (a, b) { return a.y - b.y; });
      var floorY = -1e9;
      live.forEach(function (it) {
        var ly = Math.max(it.y, floorY + LABEL_H);
        ly = Math.min(ly, h - 10);
        floorY = ly;
        var side = it.x > w * 0.55 ? -1 : 1;            // put the label on the roomier side of the dot
        var lx = it.x + side * 16;
        var lw = it.p.label.offsetWidth || 90;
        if (side > 0) lx = Math.min(lx, w - lw - 6); else lx = Math.max(6, lx - lw);
        it.p.label.style.left = lx + 'px';
        it.p.label.style.top = ly + 'px';
        it.p.dot.style.left = it.x + 'px';
        it.p.dot.style.top = it.y + 'px';
        it.p.dot.style.display = it.p.label.style.display = '';
        var lineX = side > 0 ? lx : lx + lw;
        it.p.line.setAttribute('x1', it.x); it.p.line.setAttribute('y1', it.y);
        it.p.line.setAttribute('x2', lineX); it.p.line.setAttribute('y2', ly);
      });

      /* Is the structure actually visible from here, or buried behind another mesh? Checked a few times a
         second, not every frame — a dimmed label is honest about a structure you cannot currently see. */
      var now = (window.performance || Date).now();
      if (live.length && now - occlAt > 180) {
        occlAt = now;
        var solids = holder.children.filter(function (o) { return o.visible && o.material && o.material.opacity > 0.5; });
        live.forEach(function (it) {
          var target = center(it.m);
          ray.set(camera.position, target.clone().sub(camera.position).normalize());
          var hit = ray.intersectObjects(solids, false)[0];
          it.p.label.classList.toggle('occl', !!(hit && hit.object !== it.m));
        });
      }
    }
    function park(p) { p.dot.style.display = 'none'; p.label.style.display = 'none'; p.line.setAttribute('opacity', '0'); }

    function resize() {
      var w = stage.clientWidth || 640, h = stage.clientHeight || 400;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      leads.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      if (controls.handleResize) controls.handleResize();   // trackball needs to be told
    }
    window.addEventListener('resize', resize); resize();
    function loop() {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;                     // don't burn battery in a background tab
      var now = (window.performance || Date).now(), dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0;
      lastT = now;
      if (spinning) { if (now > spinTill) spinning = false; else holder.rotation.y += dt * 0.55; }
      controls.update(); updatePins(); renderer.render(sceneObj, camera);
    }
    loop();

    function teardown() {
      if (running) emit('close', { scene: scene.id, via: opts.via || 'tab',
                                   ms: Math.round((window.performance || Date).now() - openedAt),
                                   part_taps: useCount.partTaps, views: useCount.views, traces: useCount.traces,
                                   solo: useCount.solo, ghost: useCount.ghost, played: useCount.played, tours: useCount.tours });
      running = false;
      if (raf) cancelAnimationFrame(raf);
      if (tourTimer) clearInterval(tourTimer);
      if (traceTimer) clearInterval(traceTimer);
      if (playTimer) clearInterval(playTimer);
      window.removeEventListener('resize', resize);
      try {
        Object.keys(meshes).forEach(function (k) {
          var m = meshes[k];
          if (m.geometry) m.geometry.dispose();
          if (m.material) m.material.dispose();
        });
        renderer.dispose();
      } catch (e) {}
      if (LIVE === player) LIVE = null;
    }

    return ready;
  }

  function dispose() { if (LIVE) { try { LIVE.dispose(); } catch (e) {} LIVE = null; } }

  /* ======================= "See it in 3D" — the note-side entry point =======================
     A student highlights a term and taps one button; the viewer opens already looking at that
     structure. The reading page stays clean — no model parked beside every paragraph. */
  var _ov = null;
  function close() {
    if (!_ov) return;
    dispose();
    document.removeEventListener('keydown', onKey, true);
    if (_ov.parentNode) _ov.parentNode.removeChild(_ov);
    _ov = null;
  }
  function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }

  function open(sceneId, opts) {
    opts = opts || {};
    if (!flagOn()) return Promise.resolve(null);
    injectCSS();
    close();
    _ov = document.createElement('div');
    _ov.className = 'mb3d-ov';
    _ov.innerHTML = '<div class="mb3d-shell"><div class="mb3d-ovhd">🧬 <span>' + esc(opts.title || 'See it in 3D') + '</span>' +
      (opts.subtitle ? '<small>' + esc(opts.subtitle) + '</small>' : '') +
      '<button aria-label="Close" data-r="x">✕</button></div>' +
      '<div class="mb3d-ovbody"><div data-r="host"></div></div></div>';
    _ov.addEventListener('click', function (e) { if (e.target === _ov) close(); });
    _ov.querySelector('[data-r="x"]').addEventListener('click', close);
    document.body.appendChild(_ov);
    document.addEventListener('keydown', onKey, true);
    var host = _ov.querySelector('[data-r="host"]');
    return (typeof sceneId === 'string' ? mount(host, sceneId, opts) : mountScene(host, sceneId, opts))
      .catch(function () { return null; });
  }

  /* term → the one scene+part that term means → the viewer, focused on it */
  function openTerm(term) {
    return partForTerm(term).then(function (hit) {
      if (!hit) return null;
      return open(hit.scene, { part: hit.key, title: term, subtitle: 'matched: ' + hit.label, via: 'highlight' });
    });
  }

  window.MB3D = {
    on: flagOn,
    base: function (b) { if (b != null) { BASE = b; SCENES = BASE + 'viz-training/scenes/'; _index = null; } return BASE; },
    loadIndex: loadIndex,
    scenesForTopic: scenesForTopic,
    partForTerm: partForTerm,
    partForTermSync: partForTermSync,
    terms: terms,
    rankMentions: rankMentions,
    missesIn: missesIn,
    planNote: planNote,
    policy: setPolicy,                 // MB3D.policy({ceiling:null, wordsPerChip:250}) — tune without code changes
    getPolicy: function () { return POLICY; },
    engagement: engagement,
    recordEngagement: recordEngagement,
    sink: sink,
    MIN_SCORE: 4,          // legacy alias for POLICY.minScore
    mount: mount,
    mountScene: mountScene,
    open: open,
    openTerm: openTerm,
    close: close,
    dispose: dispose,
    register: register,
    adapters: ADAPTERS
  };
})();
