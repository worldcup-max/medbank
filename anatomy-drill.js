/* =====================================================================================
 * MedBank · anatomy-drill.js — Anatomy Drill (type-the-name, on a real 3D model)
 *
 * One structure glows on a see-through "x-ray" model; the student types its name.
 * Each set has 4 structures and runs three rounds:
 *   1 · type it              — the name is shown faintly, the student types over it (+ word origin)
 *   2 · first letter         — only the first letter and a clue
 *   3 · from memory          — nothing shown, the camera turns to another view
 * An on-screen keyboard lights each key green (right) or red (wrong) and doubles as the input on phones.
 *
 * Meshes are BodyParts3D scans (same files viz3d.js uses), loaded from MEDBANK_CONFIG.MESH_BASE with the
 * public mirror as a fallback. Self-contained: it does not touch viz3d.js state or the Smart-Drill engine.
 *
 * API: MBDrill.mount(host, {set}) → Promise · MBDrill.dispose() · MBDrill.SETS
 * ===================================================================================== */
(function () {
  'use strict';
  if (window.MBDrill) return;

  var THREE_URLS = [
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
    'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/STLLoader.js'
  ];
  var MIRROR = 'https://cdn.jsdelivr.net/gh/Kevin-Mattheus-Moerman/BodyParts3D@main/assets/BodyParts3D_data/stl/';

  /* ---------------- the drill sets ----------------
     fma: one or more meshes that make up the structure. ctx: scenery drawn as glass.
     view: camera direction for rounds 1–2, view3: the "another view" for round 3 (model space, Y up, +Z = anterior,
     -X = the body's right). accept: other spellings that count as correct. */
  var SKULL_R = ['FMA52734', 'FMA52788', 'FMA52738', 'FMA52735', 'FMA52736', 'FMA52892', 'FMA53649', 'FMA52748',
    'FMA52789', 'FMA52739', 'FMA52893', 'FMA53650', 'FMA52740', 'FMA9710', 'FMA53647', 'FMA53648',
    'FMA12519', 'FMA12520', 'FMA12521', 'FMA12522', 'FMA12523', 'FMA12524', 'FMA12525'];
  var HAND_R = ['FMA23464', 'FMA23467', 'FMA24435', 'FMA24437', 'FMA24439', 'FMA24441', 'FMA24443', 'FMA23725',
    'FMA24446', 'FMA24448', 'FMA24464', 'FMA24466', 'FMA24468', 'FMA24470', 'FMA24472',
    'FMA24450', 'FMA24451', 'FMA24452', 'FMA24453', 'FMA24454'];
  var RIBS_R = ['FMA7857', 'FMA7882', 'FMA7909', 'FMA7957', 'FMA8066', 'FMA8175', 'FMA8229', 'FMA8283', 'FMA8364', 'FMA8445', 'FMA8531', 'FMA8533'];
  var RIBS_L = ['FMA7987', 'FMA8012', 'FMA8039', 'FMA8148', 'FMA8093', 'FMA8202', 'FMA8256', 'FMA8310', 'FMA8391', 'FMA8472', 'FMA8532', 'FMA8534'];
  var THORAX = ['FMA7486', 'FMA7487', 'FMA7488', 'BP28', 'BP24'].concat(RIBS_R, RIBS_L,
    ['FMA9165', 'FMA9187', 'FMA9209', 'FMA9248', 'FMA9922', 'FMA9945', 'FMA9968', 'FMA9991', 'FMA10014', 'FMA10037', 'FMA10059', 'FMA10081']);

  var SETS = [
    { id: 'mastication', title: 'Muscles of mastication', region: 'Head & neck', ctx: SKULL_R,
      view: [-1, 0.12, 0.25], view3: [-0.55, -0.35, 0.8], zoom: 0.95, items: [
      { name: 'masseter', fma: ['FMA49001', 'FMA49004'], origin: 'masseter · Greek "chewer"',
        clue: 'bulges at the angle of your jaw when you clench your teeth' },
      { name: 'temporalis', fma: ['FMA49007'], origin: 'temporal · of the temple',
        clue: 'the fan on your temple — it moves under your fingers when you chew' },
      { name: 'medial pterygoid', fma: ['FMA49012'], origin: 'pterygoid · Greek "wing-shaped"',
        clue: "the masseter's mirror, on the inside of the jaw" },
      { name: 'lateral pterygoid', fma: ['FMA49024', 'FMA49022'], origin: 'pterygoid · Greek "wing-shaped"',
        clue: 'the only chewing muscle that opens the jaw — runs back to the jaw joint' }
    ] },
    { id: 'carpals-proximal', title: 'Carpal bones · proximal row', region: 'Upper limb', ctx: HAND_R,
      view: [0, 0.1, 1], view3: [0.25, 0.2, -1], zoom: 0.42, bias: 0.85, items: [
      { name: 'scaphoid', fma: ['FMA24435'], origin: 'scaphoid · Greek "boat-shaped"',
        clue: 'the boat on the thumb side — the carpal most often broken in a fall' },
      { name: 'lunate', fma: ['FMA24437'], origin: 'lunate · Latin "moon-shaped"',
        clue: 'the half-moon in the middle — the carpal most often dislocated' },
      { name: 'triquetrum', fma: ['FMA24439'], accept: ['triquetral'], origin: 'triquetrum · Latin "three-cornered"',
        clue: 'three-cornered, on the little-finger side of the proximal row' },
      { name: 'pisiform', fma: ['FMA24441'], origin: 'pisiform · Latin "pea-shaped"',
        clue: 'the pea sitting on top of the triquetrum, inside flexor carpi ulnaris' }
    ] },
    { id: 'carpals-distal', title: 'Carpal bones · distal row', region: 'Upper limb', ctx: HAND_R,
      view: [0, 0.1, 1], view3: [-0.3, 0.2, -1], zoom: 0.42, bias: 0.85, items: [
      { name: 'trapezium', fma: ['FMA24443'], origin: 'trapezium · Greek "little table"',
        clue: 'sits under the thumb — "the trapezium carries the thumb"' },
      { name: 'trapezoid', fma: ['FMA23725'], origin: 'trapezoid · "table-like"',
        clue: 'the small wedge under the index finger' },
      { name: 'capitate', fma: ['FMA24446'], origin: 'capitate · Latin "having a head"',
        clue: 'the biggest carpal, right in the centre under the middle finger' },
      { name: 'hamate', fma: ['FMA24448'], origin: 'hamate · Latin "hooked"',
        clue: 'carries a hook you can feel in your palm, on the little-finger side' }
    ] },
    { id: 'sternum', title: 'Sternum & ribs', region: 'Thorax', ctx: THORAX,
      view: [0.15, 0.1, 1], view3: [0.9, 0.15, 0.6], items: [
      { name: 'manubrium', fma: ['FMA7486'], origin: 'manubrium · Latin "handle"',
        clue: 'the handle at the top of the sternum — the clavicles and first ribs meet it' },
      { name: 'body of sternum', fma: ['FMA7487'], origin: 'sternum · Greek "chest"',
        clue: 'the long blade below the sternal angle' },
      { name: 'xiphoid process', fma: ['FMA7488'], origin: 'xiphoid · Greek "sword-shaped"',
        clue: 'the small sword tip at the bottom of the sternum' },
      { name: 'floating ribs', fma: ['FMA8531', 'FMA8533', 'FMA8532', 'FMA8534'], accept: ['floating rib'],
        origin: 'ribs 11 and 12', clue: 'the last two pairs — no attachment to the sternum at all' }
    ] }
  ];

  /* ---------------- helpers ---------------- */
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function cfg() { try { return window.MEDBANK_CONFIG || {}; } catch (e) { return {}; } }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }

  var _three = null;
  function loadThree() {
    if (_three) return _three;
    _three = new Promise(function (res, rej) {
      if (window.THREE && window.THREE.STLLoader) return res(window.THREE);
      var i = 0;
      (function next() {
        if (window.THREE && window.THREE.STLLoader) return res(window.THREE);
        if (i >= THREE_URLS.length) return rej(new Error('3D library failed to load.'));
        var u = THREE_URLS[i++];
        if (/three\.min\.js$/.test(u) && window.THREE) return next();
        var el = document.createElement('script'); el.src = u; el.onload = next;
        el.onerror = function () { rej(new Error('Could not reach the 3D library (offline?).')); };
        document.head.appendChild(el);
      })();
    }).catch(function (e) { _three = null; throw e; });
    return _three;
  }

  /* Weld coincident corners and average normals (within a crease angle) — STL scans otherwise shade as facets. */
  var CREASE = Math.cos(60 * Math.PI / 180);
  function smoothNormals(T, geo) {
    var pos = geo.attributes.position, p = pos.array, n = pos.count, nf = n / 3, i, j, k;
    if (n % 3) { geo.computeVertexNormals(); return geo; }
    var fn = new Float32Array(nf * 3), un = new Float32Array(nf * 3);
    for (i = 0; i < nf; i++) {
      var a = i * 9, ux = p[a + 3] - p[a], uy = p[a + 4] - p[a + 1], uz = p[a + 5] - p[a + 2],
        vx = p[a + 6] - p[a], vy = p[a + 7] - p[a + 1], vz = p[a + 8] - p[a + 2];
      var x = uy * vz - uz * vy, y = uz * vx - ux * vz, z = ux * vy - uy * vx, l = Math.sqrt(x * x + y * y + z * z) || 1;
      fn[i * 3] = x; fn[i * 3 + 1] = y; fn[i * 3 + 2] = z; un[i * 3] = x / l; un[i * 3 + 1] = y / l; un[i * 3 + 2] = z / l;
    }
    var mn = Infinity, mx = -Infinity;
    for (i = 0; i < p.length; i++) { if (p[i] < mn) mn = p[i]; if (p[i] > mx) mx = p[i]; }
    var q = ((mx - mn) || 1) * 1e-4, map = {}, keys = new Array(n);
    for (i = 0; i < n; i++) {
      var key = Math.round(p[i * 3] / q) + '_' + Math.round(p[i * 3 + 1] / q) + '_' + Math.round(p[i * 3 + 2] / q);
      keys[i] = key; (map[key] || (map[key] = [])).push((i / 3) | 0);
    }
    var out = new Float32Array(n * 3);
    for (i = 0; i < n; i++) {
      var f = (i / 3) | 0, fs = map[keys[i]], sx = 0, sy = 0, sz = 0;
      for (j = 0; j < fs.length; j++) {
        k = fs[j];
        if (un[k * 3] * un[f * 3] + un[k * 3 + 1] * un[f * 3 + 1] + un[k * 3 + 2] * un[f * 3 + 2] < CREASE) continue;
        sx += fn[k * 3]; sy += fn[k * 3 + 1]; sz += fn[k * 3 + 2];
      }
      var m = Math.sqrt(sx * sx + sy * sy + sz * sz) || 1;
      out[i * 3] = sx / m; out[i * 3 + 1] = sy / m; out[i * 3 + 2] = sz / m;
    }
    geo.setAttribute('normal', new T.BufferAttribute(out, 3));
    return geo;
  }

  var GEO = {};   // fma id → Promise<BufferGeometry|null>, shared across sets
  function loadMesh(T, id) {
    if (GEO[id]) return GEO[id];
    var bases = [];
    var b = cfg().MESH_BASE; if (b) bases.push(b);
    if (bases.indexOf(MIRROR) < 0) bases.push(MIRROR);
    var loader = new T.STLLoader();
    GEO[id] = new Promise(function (res) {
      (function attempt(i) {
        if (i >= bases.length) return res(null);
        loader.load(bases[i] + id + '.stl', function (g) { res(smoothNormals(T, g)); }, undefined, function () { attempt(i + 1); });
      })(0);
    });
    return GEO[id];
  }

  /* ---------------- materials ---------------- */
  function glass(T) {
    return new T.ShaderMaterial({
      transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      uniforms: { c: { value: new T.Color(0xd9dcf0) }, k: { value: 0.5 }, a: { value: 0.05 } },
      vertexShader: 'varying vec3 n;varying vec3 v;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
      fragmentShader: 'uniform vec3 c;uniform float k;uniform float a;varying vec3 n;varying vec3 v;void main(){float f=pow(1.-abs(dot(normalize(n),normalize(v))),2.2);gl_FragColor=vec4(c*(a+f*k),1.);}'
    });
  }
  function solid(T) {
    return new T.MeshStandardMaterial({ color: 0xd9002e, emissive: 0x5a0012, emissiveIntensity: 0.6, roughness: 0.55, metalness: 0 });
  }

  /* ---------------- styles ---------------- */
  var CSS = '.mbd{position:relative;background:#0b0b10;color:#e8e6f0;border-radius:18px;overflow:hidden;min-height:620px;font-family:inherit;user-select:none}'
    + '.mbd canvas{display:block;width:100%;height:100%}.mbd .stage{position:absolute;inset:0}'
    + '.mbd .hud{position:absolute;left:0;right:0;bottom:0;padding:0 14px 16px;text-align:center;background:linear-gradient(transparent,#0b0b10 38%)}'
    + '.mbd .rnd{font-size:12px;color:#8a879a;letter-spacing:.3px;margin-bottom:6px}'
    + '.mbd .word{font-family:Georgia,"Times New Roman",serif;font-size:clamp(28px,6vw,46px);line-height:1.15;min-height:1.2em;letter-spacing:.3px}'
    + '.mbd .word .ok{color:#ff4d6d}.mbd .word .gh{color:#4e4b5c}.mbd .word .cur{border-left:2px solid #ff4d6d;margin-left:1px;animation:mbdb 1s steps(1) infinite}'
    + '@keyframes mbdb{50%{border-color:transparent}}.mbd .word.bad{animation:mbds .25s}@keyframes mbds{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}'
    + '.mbd .clue{font-size:13px;color:#9a97ab;margin:6px auto 12px;max-width:560px;min-height:1.3em}'
    + '.mbd .kb{max-width:560px;margin:0 auto;display:flex;flex-direction:column;gap:5px}.mbd .kr{display:flex;gap:5px;justify-content:center}'
    + '.mbd .k{flex:1;max-width:44px;height:38px;border-radius:7px;background:#2a2935;color:#b9b6c8;font-size:13px;display:grid;place-items:center;cursor:pointer;transition:background .15s}'
    + '.mbd .k.w{max-width:90px;flex:1.6}.mbd .k.sp{max-width:240px;flex:5}.mbd .k.g{background:#d9f27a;color:#1b1b10}.mbd .k.r{background:#ff4d6d;color:#fff}'
    + '.mbd .top{position:absolute;left:14px;right:14px;top:12px;display:flex;gap:8px;align-items:center;font-size:12.5px;color:#9a97ab;z-index:2}'
    + '.mbd .top b{color:#e8e6f0;font-weight:600}.mbd .top .sp{flex:1}.mbd .btn{background:#22212c;border:1px solid #34323f;color:#d6d3e4;border-radius:9px;padding:6px 10px;cursor:pointer;font:inherit;font-size:12.5px}'
    + '.mbd .msg{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:24px;z-index:3}'
    + '.mbd .card{background:#16151f;border:1px solid #2c2a38;border-radius:16px;padding:22px 22px 18px;max-width:420px}'
    + '.mbd .card h3{margin:0 0 6px;font-size:22px}.mbd .card p{margin:4px 0;color:#a9a6ba;font-size:14px}.mbd .card .row{display:flex;gap:8px;justify-content:center;margin-top:14px;flex-wrap:wrap}'
    + '.mbd .btn.pri{background:#7c5cff;border-color:#7c5cff;color:#fff;font-weight:600;padding:9px 14px}'
    + '.mbd .load{color:#8a879a;font-size:13px}';

  /* ---------------- the player ---------------- */
  var live = null;

  function mount(host, opts) {
    dispose();
    opts = opts || {};
    if (typeof host === 'string') host = document.getElementById(host);
    if (!host) return Promise.reject(new Error('no host'));
    if (!document.getElementById('mbd-css')) { var st = document.createElement('style'); st.id = 'mbd-css'; st.textContent = CSS; document.head.appendChild(st); }
    var set = SETS.filter(function (s) { return s.id === opts.set; })[0] || SETS[0];
    host.innerHTML = '<div class="mbd" style="height:' + (opts.height || 640) + 'px"><div class="stage"></div>'
      + '<div class="top"><b>' + esc(set.title) + '</b><span>· ' + esc(set.region) + '</span><span class="sp"></span>'
      + '<button class="btn" data-a="snd">🔊</button><button class="btn" data-a="restart">↻</button></div>'
      + '<div class="msg"><div class="load">Loading the model…</div></div>'
      + '<div class="hud" style="display:none"><div class="rnd"></div><div class="word"></div><div class="clue"></div><div class="kb"></div></div></div>';
    var root = host.firstChild, stage = root.querySelector('.stage'), msg = root.querySelector('.msg'), hud = root.querySelector('.hud');
    var me = { root: root, dead: false };
    live = me;

    return loadThree().then(function (T) {
      if (me.dead) return;
      var ids = set.ctx.slice();
      set.items.forEach(function (it) { it.fma.forEach(function (f) { if (ids.indexOf(f) < 0) ids.push(f); }); });
      return Promise.all(ids.map(function (id) { return loadMesh(T, id).then(function (g) { return [id, g]; }); }))
        .then(function (pairs) { if (!me.dead) build(T, me, set, pairs, stage, msg, hud, opts); });
    }).catch(function (e) {
      if (!me.dead) msg.innerHTML = '<div class="card"><h3>Couldn\'t load the 3D model</h3><p>' + esc(e.message) + '</p><div class="row"><button class="btn pri" data-a="restart">Try again</button></div></div>';
      bindTop(me, set, opts, host);
    });
  }

  function bindTop(me, set, opts, host) {
    me.root.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('[data-a]'); if (!a) return;
      var act = a.getAttribute('data-a');
      if (act === 'restart') { mount(host, opts); }
      if (act === 'snd') { var on = !(store('mbdrill:snd') === false); store('mbdrill:snd', !on); a.textContent = on ? '🔇' : '🔊'; }
      if (act === 'next') { var i = SETS.indexOf(set); opts.set = SETS[(i + 1) % SETS.length].id; if (opts.onSet) opts.onSet(opts.set); mount(host, opts); }
    });
  }

  function build(T, me, set, pairs, stage, msg, hud, opts) {
    var host = me.root.parentNode;
    bindTop(me, set, opts, host);
    var sndBtn = me.root.querySelector('[data-a="snd"]'); if (store('mbdrill:snd') === false) sndBtn.textContent = '🔇';

    var W = stage.clientWidth || 600, H = stage.clientHeight || 600;
    var renderer = new T.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: !!opts.capture });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H); renderer.setClearColor(0x0b0b10);
    if (T.sRGBEncoding) renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    stage.appendChild(renderer.domElement);
    var scene = new T.Scene(), cam = new T.PerspectiveCamera(30, W / H, 1, 20000);
    scene.add(new T.HemisphereLight(0xffffff, 0x303040, 0.9));
    var d1 = new T.DirectionalLight(0xffffff, 1.1); cam.add(d1); d1.position.set(1, 1.2, 1); d1.target.position.set(0, 0, -1); cam.add(d1.target);
    scene.add(cam);

    var model = new T.Group(); model.rotation.x = -Math.PI / 2; scene.add(model);   // BodyParts3D is Z-up
    var meshes = {}, missing = [];
    var G = glass(T);
    pairs.forEach(function (p) {
      if (!p[1]) { missing.push(p[0]); return; }
      var m = new T.Mesh(p[1], G); m.userData.id = p[0]; m.renderOrder = 1; model.add(m); meshes[p[0]] = m;
    });
    var playable = set.items.filter(function (it) { return it.fma.some(function (f) { return meshes[f]; }); });
    if (!playable.length) { msg.innerHTML = '<div class="card"><h3>Couldn\'t load the 3D model</h3><p>Check your connection and try again.</p><div class="row"><button class="btn pri" data-a="restart">Try again</button></div></div>'; renderer.dispose(); return; }

    model.updateMatrixWorld(true);
    var box = new T.Box3().setFromObject(model), center = box.getCenter(new T.Vector3()), size = box.getSize(new T.Vector3());
    model.position.sub(center); model.updateMatrixWorld(true);
    var R = Math.max(size.x, size.y, size.z);
    var SOLID = solid(T);

    function targetCenter(it) {
      var b = new T.Box3(); it.fma.forEach(function (f) { if (meshes[f]) b.expandByObject(meshes[f]); });
      return b.isEmpty() ? new T.Vector3() : b.getCenter(new T.Vector3());
    }
    var camGoal = { pos: new T.Vector3(0, 0, R * 2), look: new T.Vector3() }, camLook = new T.Vector3();
    function aim(it, round) {
      var v = new T.Vector3().fromArray(round === 3 ? set.view3 : set.view).normalize();
      var tc = targetCenter(it), look = tc.clone().multiplyScalar(set.bias || 0.35);
      camGoal.look.copy(look);
      camGoal.pos.copy(look).add(v.multiplyScalar(R * (set.zoom || 1) * (W < H ? 2.35 : 2.0)));
    }
    function paint(it) {
      Object.keys(meshes).forEach(function (id) {
        var on = it && it.fma.indexOf(id) >= 0;
        meshes[id].material = on ? SOLID : G; meshes[id].renderOrder = on ? 2 : 1;
      });
    }

    // ---------- game state ----------
    var rounds = [
      { n: 1, label: 'type it' },
      { n: 2, label: 'first letter' },
      { n: 3, label: 'from memory, another view' }
    ];
    var queue = [];
    rounds.forEach(function (r) { shuffle(playable).forEach(function (it) { queue.push({ it: it, r: r }); }); });
    var qi = 0, typed = '', wrong = 0, stats = { keys: 0, miss: 0, t0: Date.now(), per: {} };
    var wordEl = hud.querySelector('.word'), clueEl = hud.querySelector('.clue'), rndEl = hud.querySelector('.rnd'), kbEl = hud.querySelector('.kb');

    // on-screen keyboard
    var ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
    kbEl.innerHTML = ROWS.map(function (r, i) {
      return '<div class="kr">' + (i === 2 ? '<div class="k w" data-k="Backspace">del</div>' : '')
        + r.split('').map(function (c) { return '<div class="k" data-k="' + c + '">' + c + '</div>'; }).join('')
        + (i === 2 ? '<div class="k w" data-k="hint">hint</div>' : '') + '</div>';
    }).join('') + '<div class="kr"><div class="k sp" data-k=" ">space</div></div>';
    function flash(k, cls) {
      var el = kbEl.querySelector('[data-k="' + (k === ' ' ? ' ' : k) + '"]'); if (!el) return;
      el.classList.remove('g', 'r'); void el.offsetWidth; el.classList.add(cls);
      setTimeout(function () { el.classList.remove(cls); }, 260);
    }
    kbEl.addEventListener('pointerdown', function (e) { var k = e.target.closest('[data-k]'); if (k) { e.preventDefault(); press(k.getAttribute('data-k')); } });

    var actx = null;
    function beep(ok) {
      if (store('mbdrill:snd') === false) return;
      try {
        actx = actx || new (window.AudioContext || window.webkitAudioContext)();
        var o = actx.createOscillator(), g = actx.createGain();
        o.frequency.value = ok ? 1250 : 180; o.type = ok ? 'sine' : 'square';
        g.gain.setValueAtTime(ok ? 0.035 : 0.05, actx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + (ok ? 0.05 : 0.12));
        o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + 0.13);
      } catch (e) {}
    }

    function answers(it) { return [it.name].concat(it.accept || []); }
    function target(it) {   // the spelling we are steering towards: the main name, or an accepted one the student has committed to
      var all = answers(it);
      for (var i = 0; i < all.length; i++) if (all[i].indexOf(typed) === 0) return all[i];
      return it.name;
    }
    function show() {
      var cur = queue[qi], it = cur.it, r = cur.r.n, tgt = target(it);
      rndEl.textContent = 'Round ' + r + ' · ' + cur.r.label + ' · ' + ((qi % playable.length) + 1) + ' / ' + playable.length;
      var html = '<span class="ok">' + esc(typed) + '</span><span class="cur"></span>';
      var rest = tgt.slice(typed.length);
      if (r === 1) html += '<span class="gh">' + esc(rest) + '</span>';
      else if (r === 2) html += '<span class="gh">' + esc(rest.replace(/[a-z]/g, '•')) + '</span>';
      if (r === 2 && !typed) html = '<span class="gh">' + esc(tgt[0]) + '</span><span class="cur"></span><span class="gh">' + esc(tgt.slice(1).replace(/[a-z]/g, '•')) + '</span>';
      wordEl.innerHTML = html;
      clueEl.textContent = r === 1 ? it.origin : r === 2 ? it.clue : 'name the red structure';
    }
    function start(i) {
      qi = i; typed = ''; wrong = 0;
      var cur = queue[qi]; paint(cur.it); aim(cur.it, cur.r.n); show();
    }
    function press(k) {
      if (qi >= queue.length) return;
      var cur = queue[qi], it = cur.it, tgt = target(it);
      if (k === 'Backspace') { typed = typed.slice(0, -1); show(); return; }
      if (k === 'hint') { typed = tgt.slice(0, typed.length + 1); wrong += 2; stats.miss++; afterType(it); return; }
      k = String(k).toLowerCase();
      if (!/^[a-z ]$/.test(k)) return;
      stats.keys++;
      var ok = answers(it).some(function (a) { return a.indexOf(typed + k) === 0; });
      if (ok) { typed += k; flash(k, 'g'); beep(true); afterType(it); }
      else {
        wrong++; stats.miss++; flash(k, 'r'); beep(false);
        wordEl.classList.remove('bad'); void wordEl.offsetWidth; wordEl.classList.add('bad');
        if (cur.r.n === 3 && wrong >= 3 && typed.length < tgt.length) { typed = tgt.slice(0, typed.length + 1); afterType(it); }   // stuck from memory: give the next letter
      }
      stats.per[it.name] = (stats.per[it.name] || 0) + (ok ? 0 : 1);
    }
    function afterType(it) {
      show();
      if (answers(it).indexOf(typed) >= 0) {
        wordEl.innerHTML = '<span class="ok">' + esc(typed) + '</span>';
        var q = qi + 1;
        setTimeout(function () { if (me.dead) return; if (q >= queue.length) finish(); else start(q); }, 650);
        qi = queue.length + 1;   // lock input until the next item starts
      }
    }
    function finish() {
      paint(null);
      var secs = Math.round((Date.now() - stats.t0) / 1000), acc = stats.keys ? Math.round(100 * (stats.keys - stats.miss) / stats.keys) : 100;
      var best = store('mbdrill:best') || {}, prev = best[set.id];
      if (!prev || acc > prev.acc || (acc === prev.acc && secs < prev.secs)) { best[set.id] = { acc: acc, secs: secs, at: Date.now() }; store('mbdrill:best', best); }
      var tough = Object.keys(stats.per).filter(function (n) { return stats.per[n] > 1; });
      hud.style.display = 'none'; stage.style.bottom = '0px'; resize();
      msg.style.display = '';
      msg.innerHTML = '<div class="card"><h3>' + esc(set.title) + ' · done</h3><p>' + acc + '% of keys right · ' + secs + 's</p>'
        + (tough.length ? '<p>Worth another look: ' + tough.map(esc).join(', ') + '</p>' : '<p>Clean run — every name from memory.</p>')
        + '<div class="row"><button class="btn" data-a="restart">Again</button><button class="btn pri" data-a="next">Next set →</button></div></div>';
      if (opts.onDone) try { opts.onDone({ set: set.id, acc: acc, secs: secs }); } catch (e) {}
    }

    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target; if (t && /input|textarea|select/i.test(t.tagName)) return;
      if (e.key === 'Backspace' || /^[a-zA-Z ]$/.test(e.key)) { e.preventDefault(); press(e.key); }
    }
    document.addEventListener('keydown', onKey);

    // ---------- loop ----------
    var raf = 0, t0 = performance.now();
    function frame(now) {
      if (me.dead) return;
      var t = (now - t0) / 1000;
      cam.position.lerp(camGoal.pos, 0.06); camLook.lerp(camGoal.look, 0.08);
      var sway = new T.Vector3(Math.sin(t * 0.35) * R * 0.04, Math.sin(t * 0.27) * R * 0.015, 0);
      cam.position.add(sway); cam.lookAt(camLook); cam.position.sub(sway);
      renderer.render(scene, cam);
      raf = requestAnimationFrame(frame);
    }
    function resize() {
      var w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
      W = w; H = h; renderer.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix();
      if (qi < queue.length) aim(queue[qi].it, queue[qi].r.n);
    }
    window.addEventListener('resize', resize);

    msg.style.display = 'none'; msg.innerHTML = ''; hud.style.display = '';
    stage.style.bottom = Math.max(0, hud.offsetHeight - 70) + 'px'; resize();
    start(0);
    cam.position.copy(camGoal.pos).multiplyScalar(1.4); camLook.copy(camGoal.look);
    raf = requestAnimationFrame(frame);

    me.cleanup = function () {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey); window.removeEventListener('resize', resize);
      try { renderer.dispose(); G.dispose(); SOLID.dispose(); } catch (e) {}
      try { if (actx) actx.close(); } catch (e) {}
    };
    me.api = { press: press, state: function () { return { qi: qi, typed: typed, total: queue.length, missing: missing }; } };
    if (missing.length && window.console) console.warn('[MBDrill] meshes missing:', missing.join(','));
  }

  function dispose() {
    if (!live) return;
    live.dead = true;
    try { if (live.cleanup) live.cleanup(); } catch (e) {}
    live = null;
  }

  window.MBDrill = { mount: mount, dispose: dispose, SETS: SETS, _live: function () { return live && live.api; } };
})();
