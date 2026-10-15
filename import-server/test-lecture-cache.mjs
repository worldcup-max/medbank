/* Offline test of the shared class library (lecture-cache.mjs): fingerprints, scope, extras sharing,
 * and the store → lookup → merge round trip against a tiny in-memory stand-in for Supabase.
 *   node import-server/test-lecture-cache.mjs */
import assert from "node:assert/strict";
import { test } from "node:test";
import { youtubeId, inputKey, contentKey, cacheScope, shareableExtras, makeLectureCache } from "./lecture-cache.mjs";

/* just enough of the supabase-js query builder for lecture-cache.mjs */
function fakeAdmin() {
  const rows = []; let n = 0;
  const q = (filters = [], op = null, payload = null) => {
    const api = {
      select() { return api; }, order() { return api; }, limit() { return api; },
      eq(f, v) { filters.push([f, v]); return api; },
      upsert(row) { op = "upsert"; payload = row; return api; },
      update(patch) { op = "update"; payload = patch; return api; },
      match() { return rows.filter((r) => filters.every(([f, v]) => r[f] === v)); },
      run() {
        if (op === "upsert") {
          let r = rows.find((x) => x.input_key === payload.input_key && x.scope === payload.scope);
          if (r) Object.assign(r, payload); else { r = Object.assign({ id: "row" + ++n, created_at: n }, payload); rows.push(r); }
          return { data: { id: r.id }, error: null };
        }
        if (op === "update") { api.match().forEach((r) => Object.assign(r, payload)); return { data: null, error: null }; }
        const m = api.match().sort((a, b) => b.created_at - a.created_at);
        return { data: m[0] ? JSON.parse(JSON.stringify(m[0])) : null, error: null };
      },
      maybeSingle() { return Promise.resolve(api.run()); }, single() { return Promise.resolve(api.run()); },
      then(res, rej) { return Promise.resolve(api.run()).then(res, rej); },
    };
    return api;
  };
  return {
    rows,
    from() { return q(); },
    async rpc(name, { p_id, p_patch }) {
      const r = rows.find((x) => x.id === p_id); if (!r) return { error: null };
      if (name === "lecture_cache_merge_extras") r.extras = Object.assign({}, r.extras, p_patch);
      if (name === "lecture_cache_hit") r.hits++;
      return { error: null };
    },
  };
}
const quiet = { warn() {} };
const PDF = Buffer.from("%PDF-1.4 cardiac cycle lecture").toString("base64");

test("youtubeId reads every common link shape", () => {
  for (const u of ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://youtu.be/dQw4w9WgXcQ?t=42", "https://m.youtube.com/watch?feature=share&v=dQw4w9WgXcQ",
                   "https://youtube.com/shorts/dQw4w9WgXcQ", "https://www.youtube.com/embed/dQw4w9WgXcQ", "https://www.youtube.com/live/dQw4w9WgXcQ?si=x"])
    assert.equal(youtubeId(u), "dQw4w9WgXcQ", u);
  assert.equal(youtubeId("https://example.com/video"), null);
});

test("inputKey: same source → same key; anything different → different key", () => {
  assert.equal(inputKey({ pdf_base64: PDF }), inputKey({ pdf_base64: PDF, topicName: "other title", lecturer: "Dr B" }));
  assert.notEqual(inputKey({ pdf_base64: PDF }), inputKey({ pdf_base64: PDF + "AA" }));
  assert.equal(inputKey({ youtube_url: "https://youtu.be/dQw4w9WgXcQ" }), inputKey({ youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10" }));
  assert.equal(inputKey({ text: "Heart  sounds\n S1 and S2 " }), inputKey({ text: "Heart sounds S1 and S2" }));
  const a = { data: "AAAA" }, b = { data: "BBBB" };
  assert.equal(inputKey({ images: [a, b] }), inputKey({ images: [b, a] }), "photo order doesn't matter");
  assert.notEqual(inputKey({ pdf_base64: PDF }), inputKey({ pdf_base64: PDF, images: [a] }), "PDF + photos is a different source");
  assert.equal(inputKey({ images: [] }), null);
  assert.equal(inputKey({}), null);
});

test("contentKey matches the same extracted text from different files", () => {
  const p1 = [{ type: "text", text: "RAW LECTURE (PDF):\n\nThe  cardiac cycle has systole and diastole." }];
  const p2 = [{ type: "text", text: "RAW LECTURE (PDF):\n\nThe cardiac cycle has systole and diastole.\n" }];
  assert.equal(contentKey(p1, []), contentKey(p2, []));
  assert.notEqual(contentKey(p1, []), contentKey([{ type: "text", text: "RAW LECTURE (PDF):\n\nSomething else" }], []));
  assert.equal(contentKey([], []), null);
});

test("cacheScope separates levels and prompt versions", () => {
  assert.equal(cacheScope(2, "T"), cacheScope("2", "T"));
  assert.equal(cacheScope(null, "T"), cacheScope(0, "T"));
  assert.notEqual(cacheScope(2, "T"), cacheScope(3, "T"));
  assert.notEqual(cacheScope(2, "T"), cacheScope(2, "T edited"));
});

test("shareableExtras keeps Q-bank, written and podcast scripts, drops the builder's audio", () => {
  const out = shareableExtras({ qbank: [{ qid: "q1" }], written: [], podcast: { scripts: { deep: [{ s: "A", t: "hi" }], quick: [] }, audio: { x: ["u"] }, seg: { y: [] } }, other: 1 });
  assert.deepEqual(out, { qbank: [{ qid: "q1" }], podcast: { scripts: { deep: [{ s: "A", t: "hi" }] }, script: [{ s: "A", t: "hi" }] } });
  assert.deepEqual(shareableExtras({ podcast: { script: [{ t: "legacy" }] } }).podcast.scripts, { deep: [{ t: "legacy" }] });
  assert.deepEqual(shareableExtras(null), {});
});

test("store → find by upload or by content → merge extras → count hits", async () => {
  const admin = fakeAdmin(), lc = makeLectureCache(admin, quiet);
  const scope = cacheScope(1, "T"), ik = inputKey({ pdf_base64: PDF }), ck = contentKey([{ text: "x" }], []);
  const obj = { note_md: "N", simplified_md: "S", primer: { cards: [{ q: "p" }] }, recall: { cards: [{ q: "r", opts: [1, 2, 3, 4], ans: 0, a: "a" }] } };
  assert.equal(await lc.byInput(ik, scope), null);
  const id = await lc.put({ input_key: ik, content_key: ck, scope, level: 1, source_kind: "pdf", model: "flash", obj, transcript: null, built_by: "u1" });
  assert.ok(id);
  assert.equal((await lc.byInput(ik, scope)).note_md, "N");
  assert.equal((await lc.byContent(ck, scope)).id, id);
  assert.equal(await lc.byInput(ik, cacheScope(2, "T")), null, "other level misses");

  await lc.addExtras(id, { qbank: [{ qid: "q1" }] });
  await lc.addExtras(id, { podcast: { scripts: { deep: [{ t: "d" }] } } });
  await lc.addExtras(id, { podcast: { scripts: { quick: [{ t: "q" }] } } });
  const row = await lc.byId(id);
  assert.deepEqual(row.extras.qbank, [{ qid: "q1" }]);
  assert.deepEqual(Object.keys(row.extras.podcast.scripts).sort(), ["deep", "quick"], "a second podcast mode doesn't wipe the first");

  await lc.hit(id); await lc.hit(id);
  assert.equal(admin.rows[0].hits, 2);

  // a "build my own copy" rebuild replaces the shared row for that upload and resets its extras
  const id2 = await lc.put({ input_key: ik, content_key: ck, scope, level: 1, source_kind: "pdf", model: "pro", obj: { ...obj, note_md: "N2" } });
  assert.equal(id2, id);
  assert.equal((await lc.byInput(ik, scope)).note_md, "N2");
  assert.deepEqual((await lc.byId(id)).extras, {});
});

test("a classmate importing the same upload mid-build waits for it instead of paying twice", async () => {
  const lc = makeLectureCache(fakeAdmin(), quiet), scope = "1:x";
  assert.equal(await lc.waitInflight("k", scope), false, "nothing running → don't wait");
  const done = lc.begin("k", scope);
  let waited = false;
  const w = lc.waitInflight("k", scope).then((r) => { waited = r; });
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(waited, false, "still waiting while the build runs");
  done(); await w;
  assert.equal(waited, true);
  assert.equal(await lc.waitInflight("k", scope), false, "released after the build");
  done();   // a second release (the route's finally) is harmless
});

test("missing table → every call is a quiet no-op, imports carry on as before", async () => {
  const err = { message: 'relation "public.lecture_cache" does not exist' };
  const broken = { from() { const a = { select: () => a, eq: () => a, order: () => a, limit: () => a, upsert: () => a, update: () => a,
    maybeSingle: async () => ({ data: null, error: err }), single: async () => ({ data: null, error: err }) }; return a; },
    async rpc() { return { error: err }; } };
  const lc = makeLectureCache(broken, { warn() { throw new Error("should stay quiet"); } });
  assert.equal(await lc.byInput("k", "s"), null);
  assert.equal(await lc.put({ input_key: "k", scope: "s", obj: { note_md: "N" } }), null);
  await lc.addExtras("id", { qbank: [{ qid: "q" }] });
});
