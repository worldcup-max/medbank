/* =====================================================================
 * Shared class library — build a lecture once, reuse it for every classmate.
 * (FEATURE_BACKLOG #7; the biggest cost saving in the launch & cost review.)
 *
 * When a student imports a lecture, the source is fingerprinted. If a classmate
 * already built the same source (same PDF bytes, same YouTube video, same slide
 * photos, same pasted text) at the same level with the same build prompt, the
 * stored build is copied into a NEW topic owned by this student: no model call,
 * no transcription, instant. Content is shared; progress stays personal (cards
 * get this student's own topic id, so their card keys are their own).
 *
 * Two keys per build:
 *   input_key   — hash of the raw upload. Checked BEFORE extraction, so a cache
 *                 hit skips PDF parsing, YouTube caption fetch and Whisper.
 *   content_key — hash of the extracted text (+ image hashes). Checked AFTER
 *                 extraction; catches the same lecture re-saved as a new PDF file.
 * Both are scoped by `scope` = level + a hash of the core build prompt, so an
 * edited prompt (or a different level) never serves an old build.
 *
 * Extras built later on any copy (Q-bank, written tests, podcast scripts, topic
 * preview) are written back to the shared row, so the next classmate gets them
 * free as well. Podcast audio is NOT copied (its files live under the first
 * topic's path); it re-stitches from the voice-clip cache, which is keyed by
 * line text, so shared scripts hit already-paid clips.
 *
 * Table + functions: import-server/sql/lecture_cache.sql. Every DB call here is
 * best-effort: if the table doesn't exist yet, imports behave exactly as before.
 * ===================================================================== */
import { createHash } from "node:crypto";

/* Bump when the code-side additions to the import prompt (server.mjs /import) change
   in a way that should stop old shared builds from being served. */
export const CACHE_VERSION = "1";

const sha = (s) => createHash("sha256").update(s).digest("hex");
const normText = (s) => String(s || "").replace(/\s+/g, " ").trim();

/* 11-char YouTube video id from any common link shape, or null. */
export function youtubeId(url) {
  const u = String(url || "").trim();
  const m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/|v\/))([A-Za-z0-9_-]{11})/i);
  return m ? m[1] : null;
}

/* Fingerprint of the raw upload (same body /import receives). null = nothing to key on. */
export function inputKey(body) {
  const b = body || {};
  const parts = [];
  if (b.pdf_base64) parts.push("pdf:" + sha(String(b.pdf_base64)));
  if (b.audio_base64) parts.push("audio:" + sha(String(b.audio_base64)));
  if (b.youtube_url) { const id = youtubeId(b.youtube_url); parts.push("yt:" + (id || sha(normText(b.youtube_url)))); }
  if (b.text && normText(b.text)) parts.push("text:" + sha(normText(b.text)));
  // photo order varies between phones/pickers; the lecture doesn't
  const imgs = (Array.isArray(b.images) ? b.images : []).filter((i) => i && i.data).map((i) => "img:" + sha(String(i.data))).sort();
  parts.push(...imgs);
  return parts.length ? sha("in|" + parts.join("\n")) : null;
}

/* Fingerprint of what extraction produced (extractContent's parts/images). */
export function contentKey(parts, images) {
  const txt = (parts || []).map((p) => normText(p && p.text)).filter(Boolean);
  const imgs = (images || []).map((im) => im && im.source && im.source.data).filter(Boolean).map((d) => sha(String(d))).sort();
  if (!txt.length && !imgs.length) return null;
  return sha("ct|" + txt.join("\n") + "|" + imgs.join(","));
}

/* level + prompt version: a build is only reused under the same prompt it was made with. */
export function cacheScope(level, template) {
  return (Number(level) || 0) + ":" + sha(CACHE_VERSION + "|" + String(template || "")).slice(0, 16);
}

/* Extras safe to hand to another student's topic. Podcast audio/seams point at the
   builder's own storage path, so only the scripts travel. */
export function shareableExtras(extras) {
  const out = {};
  const e = extras || {};
  if (Array.isArray(e.qbank) && e.qbank.length) out.qbank = e.qbank;
  if (Array.isArray(e.written) && e.written.length) out.written = e.written;
  const pod = e.podcast || {};
  const scripts = Object.assign({}, pod.scripts || {});
  if (!Object.keys(scripts).length && Array.isArray(pod.script) && pod.script.length) scripts.deep = pod.script;
  Object.keys(scripts).forEach((k) => { if (!Array.isArray(scripts[k]) || !scripts[k].length) delete scripts[k]; });
  if (Object.keys(scripts).length) out.podcast = { scripts, script: scripts.deep || scripts[Object.keys(scripts)[0]] };
  return out;
}

const COLS = "id,input_key,content_key,scope,level,source_kind,model,note_md,simplified_md,primer,recall,transcript,extras,preview";

export function makeLectureCache(admin, log = console) {
  const inflight = new Map();   // scope|input_key → Promise: a classmate importing the same file mid-build waits instead of paying twice

  async function find(field, key, scope) {
    if (!key) return null;
    try {
      const r = await admin.from("lecture_cache").select(COLS).eq(field, key).eq("scope", scope)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (r.error) { if (!/lecture_cache/i.test(r.error.message || "")) log.warn("[lecture-cache] lookup failed: " + (r.error.message || r.error)); return null; }
      return r.data || null;
    } catch (e) { log.warn("[lecture-cache] lookup threw: " + ((e && e.message) || e)); return null; }
  }

  return {
    find,
    async byInput(key, scope) { return find("input_key", key, scope); },
    async byContent(key, scope) { return find("content_key", key, scope); },
    async byId(id) {
      if (!id) return null;
      try { const r = await admin.from("lecture_cache").select(COLS).eq("id", id).maybeSingle(); return (r && !r.error && r.data) || null; }
      catch (_) { return null; }
    },

    /* Wait for a build of the same upload that's already running on this server. */
    async waitInflight(key, scope) {
      const p = key && inflight.get(scope + "|" + key);
      if (!p) return false;
      try { await p; } catch (_) {}
      return true;
    },
    /* Register a build; returns done() to call when it finishes (success or not). */
    begin(key, scope) {
      if (!key) return () => {};
      const k = scope + "|" + key;
      let done; const p = new Promise((r) => { done = r; });
      inflight.set(k, p);
      return () => { if (inflight.get(k) === p) inflight.delete(k); done(); };
    },

    /* Store a fresh build. Returns the row id or null. Replaces an older row for the same
       upload (a "build my own copy" rebuild means the student wanted a better one). */
    async put({ input_key, content_key, scope, level, source_kind, model, obj, transcript, extras, built_by }) {
      if (!input_key || !obj) return null;
      try {
        const row = {
          input_key, content_key: content_key || null, scope, level: Number(level) || null, source_kind, model,
          note_md: obj.note_md, simplified_md: obj.simplified_md || null,
          primer: (obj.primer && obj.primer.cards) || [], recall: (obj.recall && obj.recall.cards) || [],
          transcript: transcript && transcript.length ? transcript : null,
          extras: shareableExtras(extras), preview: null, built_by: built_by || null, hits: 0,
        };
        const r = await admin.from("lecture_cache").upsert(row, { onConflict: "input_key,scope" }).select("id").single();
        if (r.error) { if (!/lecture_cache/i.test(r.error.message || "")) log.warn("[lecture-cache] store failed: " + (r.error.message || r.error)); return null; }
        return r.data.id;
      } catch (e) { log.warn("[lecture-cache] store threw: " + ((e && e.message) || e)); return null; }
    },

    /* Merge newly built extras into a shared row (top-level keys; podcast scripts merged by mode). */
    async addExtras(id, extras) {
      if (!id) return;
      try {
        const add = shareableExtras(extras);
        if (add.podcast) {
          const cur = await this.byId(id);
          const have = (cur && cur.extras && cur.extras.podcast && cur.extras.podcast.scripts) || {};
          add.podcast = { scripts: Object.assign({}, have, add.podcast.scripts), script: add.podcast.script };
        }
        if (!Object.keys(add).length) return;
        const r = await admin.rpc("lecture_cache_merge_extras", { p_id: id, p_patch: add });
        if (r && r.error && !/lecture_cache/i.test(r.error.message || "")) log.warn("[lecture-cache] extras merge failed: " + (r.error.message || r.error));
      } catch (e) { log.warn("[lecture-cache] extras merge threw: " + ((e && e.message) || e)); }
    },

    async setPreview(id, preview) {
      if (!id || !preview || preview.status !== "ready") return;
      try { await admin.from("lecture_cache").update({ preview }).eq("id", id); } catch (_) {}
    },

    async hit(id) {
      if (!id) return;
      try { await admin.rpc("lecture_cache_hit", { p_id: id }); } catch (_) {}
    },
  };
}
