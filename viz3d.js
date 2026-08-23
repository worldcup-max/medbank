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
      if (window.THREE && window.THREE.STLLoader && window.THREE.OrbitControls) return resolve(window.THREE);
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
        'CROSS_SECTION', 'COMPARE_STRUCTURES', 'SHOW_RELATIONSHIP'],
      degraded: ['TRACE_STRUCTURE', 'PEEL_LAYER']
    },
    resolve: function (s) {
      var id = s && s.refs && s.refs.bodyparts3d;
      return id ? this.stlBase + id + '.stl' : null;
    },
    load: function (T, s) {
      var url = this.resolve(s);
      if (!url) return Promise.resolve(null);
      return new Promise(function (res) {
        new T.STLLoader().load(url, function (geo) {
          geo.computeVertexNormals();
          var col = new T.Color(s.color || '#c9c3d8');
          var mat = new T.MeshStandardMaterial({ color: col, roughness: 0.62, metalness: 0.02, transparent: true, opacity: 1, side: T.DoubleSide });
          var mesh = new T.Mesh(geo, mat);
          mesh.userData = s;
          res(mesh);
        }, null, function () { res(null); });
      });
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
      '.mb3d-pins{position:absolute;inset:0;pointer-events:none}',
      '.mb3d-pin{position:absolute;transform:translate(-50%,-50%);font-size:11.5px;font-weight:700;color:#fff;white-space:nowrap;opacity:0;transition:opacity .2s}',
      '.mb3d-pin.on{opacity:1}.mb3d-pin i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px;vertical-align:middle;box-shadow:0 0 9px currentColor}',
      '.mb3d-pin b{background:rgba(12,10,24,.85);padding:2px 7px;border-radius:6px;border:1px solid currentColor;font-weight:700}',
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
      '@media(max-width:860px){.mb3d-main{flex-direction:column;height:auto}.mb3d-stage{height:320px}.mb3d-side{width:auto;border-left:0;border-top:1px solid var(--m3line);max-height:250px}.mb3d-ov{padding:0}.mb3d-shell{max-height:100vh;border-radius:0;height:100%}}'
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

  function scenesForTopic(topicName, subjectName) {
    return loadIndex().then(function (idx) {
      var hay = norm(topicName) + ' ' + norm(subjectName || '');
      if (!hay.trim()) return [];
      return (idx.scenes || []).filter(function (s) {
        // students see validated scenes only — candidate/planned/blocked are for the dev route
        if (s.mode !== '3d_anatomy' || s.status !== 'ready') return false;
        return (s.match.topics || []).some(function (t) { return t.length > 3 && hay.indexOf(t) >= 0; });
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
          '<div class="mb3d-stage" data-r="stage"><canvas data-r="canvas"></canvas><div class="mb3d-pins" data-r="pins"></div>' +
            '<div class="mb3d-status" data-r="status">Loading meshes…</div><div class="mb3d-hint">drag to rotate · scroll to zoom</div></div>' +
          '<div class="mb3d-side">' +
            '<div class="mb3d-sh"><span data-r="sidehd">Parts</span><a data-r="showall">show all</a></div>' +
            '<div class="mb3d-list" data-r="list"></div>' +
            '<div class="mb3d-acts"><button class="mb3d-btn pri" data-r="tour">▶ Tour the parts</button><button class="mb3d-btn" data-r="ghost">Ghost others</button></div>' +
          '</div>' +
        '</div>' +
        '<div class="mb3d-slider" data-r="cliprow" style="display:none">Cut plane<input type="range" data-r="clip" min="-1" max="1" step="0.01" value="0"></div>' +
        '<div class="mb3d-narr" data-r="narr"></div>' +
        '<div class="mb3d-foot"><span>' + esc(adapter.attribution || '') + '</span><span data-r="note"></span></div>' +
      '</div>';

    var $ = function (r) { return host.querySelector('[data-r="' + r + '"]'); };
    var stage = $('stage'), canvas = $('canvas'), pinWrap = $('pins');
    function st(t, c) { var e = $('status'); e.textContent = t; e.className = 'mb3d-status' + (c ? ' ' + c : ''); }

    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.localClippingEnabled = true;
    if (T.sRGBEncoding) renderer.outputEncoding = T.sRGBEncoding;

    var sceneObj = new T.Scene(); sceneObj.background = new T.Color(0x141225);
    var camera = new T.PerspectiveCamera(45, 1, 0.01, 4000); camera.position.set(0, 0.4, 7);
    var controls = new T.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.09;
    controls.autoRotate = true; controls.autoRotateSpeed = 0.9;
    controls.minDistance = 1.2; controls.maxDistance = 200;

    sceneObj.add(new T.HemisphereLight(0xf2ecff, 0x20203a, 1.0));
    var k1 = new T.DirectionalLight(0xffffff, 1.15); k1.position.set(5, 8, 6); sceneObj.add(k1);
    var k2 = new T.DirectionalLight(0xbfd0ff, 0.5); k2.position.set(-6, 2, 4); sceneObj.add(k2);
    var k3 = new T.DirectionalLight(0x9d8bff, 0.6); k3.position.set(-3, 3, -6); sceneObj.add(k3);

    var holder = new T.Group(); sceneObj.add(holder);
    var overlay = new T.Group(); sceneObj.add(overlay);          // relationship lines
    var meshes = {}, pins = {}, loadedKeys = [], missing = [];
    var clipPlane = new T.Plane(new T.Vector3(0, 0, -1), 0), clipping = false;
    var selected = [], ghost = false, running = true, raf = 0, tourTimer = null;
    var degraded = {};

    /* ---------- load every structure; a failure is reported, never fatal ---------- */
    var jobs = structures.map(function (s) {
      if (s.render === 'anchor') {
        var g = new T.Mesh(new T.SphereGeometry((s.anchor && s.anchor.radius) || 0.09, 20, 16),
          new T.MeshStandardMaterial({ color: new T.Color(s.color || '#ffb020'), emissive: new T.Color(s.color || '#ffb020'), emissiveIntensity: 0.35, transparent: true }));
        var a = (s.anchor && s.anchor.xyz) || [0, 0, 0];
        g.position.set(a[0], a[1], a[2]); g.userData = s;
        holder.add(g); meshes[s.key] = g; loadedKeys.push(s.key);
        return Promise.resolve(true);
      }
      return adapter.load(T, s).then(function (m) {
        if (!m) { missing.push(s.label || s.key); return false; }
        holder.add(m); meshes[s.key] = m; loadedKeys.push(s.key);
        return true;
      });
    });

    var player = {
      scene: scene, host: host, meshes: meshes,
      dispose: function () { teardown(); }
    };
    LIVE = player;

    /* mount() resolves only once every mesh has settled, so callers can trust that the parts list,
       the view chips and any requested part focus are on screen when the promise resolves. */
    var ready = Promise.all(jobs).then(function () {
      if (!loadedKeys.length) { st('No meshes could be loaded — check your connection.', 'warn'); return player; }
      fit();
      holder.rotation.y = (scene.camera && scene.camera.initialYaw) || 0;
      controls.autoRotateSpeed = ((scene.camera && scene.camera.autoRotate) || 0.006) * 150;
      buildList(); buildChips();
      applyView(0);
      if (opts.part && meshes[opts.part]) focusPart(opts.part);
      var msg = 'Loaded ' + loadedKeys.length + ' of ' + structures.length + ' parts';
      st(missing.length ? msg + ' — ' + missing.length + ' unavailable' : msg + ' — tap any part to isolate it.', missing.length ? 'warn' : 'ok');
      note();
      return player;
    });

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
      var list = $('list'); list.innerHTML = ''; pinWrap.innerHTML = ''; pins = {};
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
          '<span><b style="font-weight:600">' + esc(p.label) + '</b><small>' + esc(ok ? (p.narration || '') : 'not available in this mesh set') + '</small></span>';
        if (ok) b.addEventListener('click', function () { toggle(p.key); });
        list.appendChild(b);
        if (ok) addPin(p);
      });
      // context structures get a pin too — no button, but when a view highlights one it must be named
      structures.forEach(function (s) { if (s.role !== 'part' && meshes[s.key]) addPin(s); });
    }
    function addPin(s) {
      if (pins[s.key]) return;
      var pin = document.createElement('div'); pin.className = 'mb3d-pin';
      var col = esc(s.color || '#7c5cff');
      pin.innerHTML = '<i style="background:' + col + ';color:' + col + '"></i><b>' + esc(s.label || s.key) + '</b>';
      pinWrap.appendChild(pin); pins[s.key] = pin;
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

    function applyView(i) {
      var v = views[i]; if (!v) return;
      stopTour();
      Array.prototype.forEach.call(host.querySelectorAll('.mb3d-chip'), function (c, k) { c.classList.toggle('on', k === i); });
      selected = [];
      Array.prototype.forEach.call(host.querySelectorAll('.mb3d-part'), function (b) { b.classList.remove('on'); });
      runOps(v.ops);
      $('narr').innerHTML = '<b>' + esc(v.title || v.mode) + '</b> — ' + esc(v.narration || '');
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

    /* TRACE degrades to a timed sequential highlight along the authored path — the teaching survives
       even though this renderer cannot draw a true swept path. */
    var traceTimer = null;
    function trace(o) {
      var path = (o.path || []).filter(function (k) { return meshes[k]; });
      if (!path.length) return;
      var i = 0, step = Math.max(700, ((o.duration || 6) * 1000) / path.length);
      clearInterval(traceTimer);
      traceTimer = setInterval(function () {
        if (!running || i >= path.length) { clearInterval(traceTimer); traceTimer = null; return; }
        state.hi = {}; state.hi[path[i]] = 0.6; state.ghosted = true; state.only = [path[i]];
        paint(); i++;
      }, step);
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

    function center(m) {
      if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
      var c = m.geometry.boundingSphere.center.clone();
      m.localToWorld(c); return c;
    }

    function toggle(key) {
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
        var show = selected.indexOf(k) >= 0 || (state.hi && state.hi[k] != null);
        pins[k].classList.toggle('on', !!show && !!(meshes[k] && meshes[k].visible));
      });
    }

    $('showall').addEventListener('click', function () {
      selected = []; ghost = false;
      Array.prototype.forEach.call(host.querySelectorAll('.mb3d-part'), function (b) { b.classList.remove('on'); });
      $('ghost').classList.remove('pri');
      paint();
    });
    $('ghost').addEventListener('click', function () { ghost = !ghost; this.classList.toggle('pri', ghost); paint(); });
    $('tour').addEventListener('click', function () { tourTimer ? stopTour() : startTour(); });

    function startTour() {
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
      tourTimer = null; $('tour').textContent = '▶ Tour the parts';
    }

    /* ---------- loop ---------- */
    var v3 = new T.Vector3();
    function updatePins() {
      var w = stage.clientWidth, h = stage.clientHeight;
      Object.keys(pins).forEach(function (k) {
        var m = meshes[k]; if (!m || !m.visible) return;
        v3.copy(center(m)).project(camera);
        pins[k].style.left = ((v3.x * 0.5 + 0.5) * w) + 'px';
        pins[k].style.top = ((-v3.y * 0.5 + 0.5) * h) + 'px';
      });
    }
    function resize() {
      var w = stage.clientWidth || 640, h = stage.clientHeight || 400;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize); resize();
    function loop() {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;                     // don't burn battery in a background tab
      controls.update(); updatePins(); renderer.render(sceneObj, camera);
    }
    loop();

    function teardown() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      if (tourTimer) clearInterval(tourTimer);
      if (traceTimer) clearInterval(traceTimer);
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
      return open(hit.scene, { part: hit.key, title: term, subtitle: 'matched: ' + hit.label });
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
    MIN_SCORE: 4,          // below this a mention is not worth a chip — see rankMentions
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
