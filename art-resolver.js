/* MedBank · art-resolver.js — the picture library's picker (window.MB_ART).
 *
 * Reads art-manifest.json from MEDBANK_CONFIG.ART_BASE (the public Supabase bucket) and answers
 *   MB_ART.resolve(topic, set) -> { dir:'<full url>/<topic>/<set>/', files:{ key:'file.webp' } } | null
 * listing only files that were actually uploaded. Until the manifest has loaded (or if ART_BASE is
 * empty, or the fetch fails) window.MB_ART is not defined, so callers fall back to the copy in
 * er-sim-art/<topic>/<set>/ exactly as before. Nothing here needs a key: the bucket is public.
 *
 * Extra helpers: MB_ART.sets(topic) lists set ids; MB_ART.pick(topic, {sex, age, facility}) returns a
 * random matching set id (or any set when nothing matches).
 */
(function (root) {
  var cfg = root.MEDBANK_CONFIG || {};
  var base = String(cfg.ART_BASE || '').replace(/\/+$/, '');
  if (!base) return;
  base += '/';

  function install(m) {
    if (!m || !m.topics) return;
    var T = m.topics;
    root.MB_ART = {
      manifest: m,
      resolve: function (topic, set) {
        var t = T[topic], s = t && t.sets && t.sets[set];
        if (!s || !s.files || !s.files.base) return null;
        var dir = /^https?:/.test(s.dir) ? s.dir : base + topic + '/' + set + '/';
        var files = {}; for (var k in s.files) files[k] = s.files[k];
        return { dir: dir, files: files };
      },
      sets: function (topic) { var t = T[topic]; return t && t.sets ? Object.keys(t.sets) : []; },
      pick: function (topic, want) {
        var ids = this.sets(topic); if (!ids.length) return null;
        want = want || {};
        var ok = ids.filter(function (id) {
          var s = T[topic].sets[id];
          return ['sex', 'age', 'facility'].every(function (f) { return !want[f] || s[f] === want[f]; });
        });
        var pool = ok.length ? ok : ids;
        return pool[Math.floor(Math.random() * pool.length)];
      }
    };
    try { root.dispatchEvent(new CustomEvent('mb-art-ready')); } catch (_) {}
  }

  try {
    fetch(base + 'art-manifest.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(install)
      .catch(function () { /* stay on the bundled copy */ });
  } catch (_) {}
})(window);
