# MedBank VisualScene — schema **v2** (provider-agnostic)

Supersedes `model3d-production-spec.md` (kept for the authoring rationale) and `model3d-scene-spec.md` (v1).
Every scene is v2. Both existing scenes are migrated; there is no v1 left to author against.

## The one idea

**The 207 scenes are not an anatomy database. They are the semantic layer that says what anatomy to request
and how to teach it.** A scene names a structure and the teaching operations it needs; a provider adapter
decides which model that is and where it comes from. Get this boundary right and the corpus outlives every
provider decision MedBank will ever make.

## Why v2 exists

v1 scenes hardcoded a delivery URL into every part:

```json
{ "ref": "FMA37686", "url": "https://cdn.jsdelivr.net/gh/.../FMA37686.stl" }
```

That single field is provider lock-in. It also let a scene ship a model id that does not exist — the v1 heart
scene referenced 13 ids that are **not** in `available-meshes.json`, and labelled `FMA7196`, which the
catalog calls the **spleen**, as "left lung". v2 separates three things v1 fused:

| concern | v1 | v2 |
|---|---|---|
| **what** the structure is | implied by `label` | `name` — canonical, checked against the catalog |
| **which** model represents it | `ref` (an FMA id) | `refs: { bodyparts3d: "FMA37686", biodigital: null }` |
| **where** the file lives | `url`, hardcoded per part | resolved at render time by the adapter |

## The abstraction boundary (enforced, not advisory)

A scene must never contain a URL, a file extension, a CDN host, a rendering library, or a provider's name
outside `provider{}` and `refs{}`. The validator's **purity** stage rejects all of these. Human prose in
`gaps` and `blocked_reason` is exempt — those are notes to a reader, not instructions to a machine.

The scene knows: *"the median nerve, highlighted, then traced from axilla to cubital fossa."*
The adapter knows: *"that is FMA<id>, fetched from here, drawn like this."*

**Attribution follows the same rule.** The CC-BY-SA credit is not in the scene file — the adapter that
delivered the model emits it. A scene rendered by a different provider would otherwise print a credit that
is simply false.

## Scene shape

```jsonc
{
  "schema": 2,
  "id": "gross__arm__biceps-triceps",
  "mode": "3d_anatomy",              // which engine can render this at all (below)
  "course": "Gross Anatomy",
  "topic": "Arm (Brachium)",
  "structure": "Biceps brachii & Triceps brachii",
  "learning_goal": "Know the heads of each muscle, what each crosses, and which movement it drives.",

  "status": "ready",                 // ready | candidate | planned | blocked  — only `ready` reaches a student
  "provenance": { "author": "task", "authored_at": "<YYYY-MM-DD>",
                  "approved_by": "frank", "approved_at": "<YYYY-MM-DD>" },

  "provider": { "primary": "bodyparts3d", "fallbacks": [] },

  "match": {                          // how a note finds this scene
    "topics": ["arm", "brachium", "upper limb"],
    "terms":  ["biceps", "biceps brachii", "triceps", "long head"]
  },

  "camera": { "framing": "anterior", "autoRotate": 0.006, "initialYaw": 0.4 },

  "structures": [                     // every model in the scene — context and parts alike
    {
      "key": "bic_long",              // stable id used by ops and by term→part links
      "name": "long head of right biceps brachii",   // MUST equal the catalog name, character for character
      "label": "Biceps — long head",  // what the student reads
      "role": "part",                 // "part" (in the student's list) | "context" (scaffolding)
      "group": "Biceps brachii",
      "layer": "muscle",              // for PEEL_LAYER: skin | fascia | muscle | vessel | organ | bone
      "color": "#c23a3a",
      "refs": { "bodyparts3d": "FMA37686" },
      "terms": ["biceps long head", "long head of biceps", "supraglenoid tubercle"],
      "narration": "From the supraglenoid tubercle of the scapula, in the bicipital groove."
    },
    {
      "key": "inferior_angle",
      "label": "Inferior angle",
      "role": "part",
      "render": "anchor",             // no model of its own → an authored marker
      "anchor": { "on": "scapula", "xyz": [0.0, -1.9, 0.2], "radius": 0.09 },
      "status": "needs-review",       // mandatory until a human clears it in-app
      "narration": "The lowest point — palpable; overlies rib 7."
    }
  ],

  "views": [                          // the guided beats; each is a titled list of ops
    {
      "mode": "location", "beat": 1, "title": "See it in the body",
      "ops": [
        { "op": "SHOW_STRUCTURE", "target": "*" },
        { "op": "ROTATE_TO_VIEW", "view": "anterior" }
      ],
      "narration": "The biceps sits on the front of the arm, the triceps on the back."
    }
  ]
}
```

v1's `meshes[]` + `parts[]` collapse into one `structures[]` separated by `role`, removing the ambiguity
where the same model appeared in both arrays with different labels.

## The op vocabulary

Ten ops — a teaching language, not a rendering API. Scenes are authored against **all ten**; each adapter
declares which it supports and degrades the rest. A scene is never rejected for using an op its current
renderer lacks, because the day a better renderer arrives the teaching is already authored.

| op | arguments | meaning | bodyparts3d today |
|---|---|---|---|
| `SHOW_STRUCTURE` | `target` (key, group, or `*`) | make visible at full opacity | native |
| `HIDE_STRUCTURE` | `target` | remove from view | native |
| `HIGHLIGHT_STRUCTURE` | `target`, `intensity?` | emissive glow + pinned label | native |
| `ISOLATE_REGION` | `target` | show only this; ghost everything else | native |
| `ROTATE_TO_VIEW` | `view` (anterior/posterior/lateral/medial/superior/inferior) | animate the camera | native |
| `CROSS_SECTION` | `axis`, `offset`, `animate?` | cut plane, with a student-draggable slider | native |
| `COMPARE_STRUCTURES` | `targets[]`, `layout?` | two structures lit, others ghosted | native |
| `SHOW_RELATIONSHIP` | `from`, `to`, `kind` | light both, draw a connector | native |
| `TRACE_STRUCTURE` | `target`, `path[]`, `duration?` | follow a structure along its course | **degrades** → timed sequential highlight along `path` |

**`covers[]` — what curriculum structures this scene actually teaches.** An array of CURRICULUM.json
structure names, spelled exactly as the curriculum spells them. `tools/sync-state.mjs` reads it to work out
what is left to author, so it is what stops the same structure being authored twice. Declare only what the
scene can genuinely teach: the arm scene covers both "Biceps brachii" and "Triceps brachii", but the heart
scene does **not** cover "Heart chambers" — it has no chamber meshes and says so in `gaps[]`. Claiming a
structure the scene cannot teach is worse than leaving it unauthored, because the gap stops being visible
and nobody returns to it. A name matching no curriculum entry is reported as a typo, not silently accepted.

Every `target`, `targets[]`, `path[]`, `from` and `to` must name a structure `key` or a `group` in the same
scene, or be `*`. The validator rejects anything else — that check is what stops a mistyped waypoint from
shipping as a step the camera silently skips.

**Tracing something that has no mesh.** Blood through the chambers, air down the airway, CSF round the
ventricles: the *path* is anatomy but the *subject* is not a model. Write it as `concept:<slug>` —
`"target": "concept:blood"` — and the renderer walks the path without lighting a subject. Say what the
concept is in the narration; the slug is a contract, not a label. Never invent a bare word like `blood` as
a target: it reads exactly like a typo, and a validator lenient enough to accept it is lenient enough to
accept the typo too.
| `PEEL_LAYER` | `layer`, `direction?` | remove an anatomical layer | **degrades** → hides structures tagged with that `layer` |

The player shows a "≈ simplified" note whenever it degrades an op, and `index.json` records it per scene, so
corpus review can see what is waiting on a better renderer instead of silently under-delivering.

## Mode is a property of the concept, not the subject

`mode` decides which engine can render a scene at all. It is assigned by **what is being taught**, never by
what a provider happens to hold today.

| mode | for | engine |
|---|---|---|
| `3d_anatomy` | spatial relationships, nerves, vessels, organs, muscles, pathways | `viz3d.js` + an adapter |
| `microscopic` | histology, pathology, cellular structure | the existing SVG Visualize engine |
| `diagram` | physiology, pathways, algorithms | the existing SVG Visualize engine |
| `sequence` | ordered developmental or process stages | the SVG engine, played as beats |
| `comparison` | X vs Y, differentials | either engine, via `COMPARE_STRUCTURES` |
| `imaging` | X-ray, CT, MRI, ultrasound | **none yet** — author as `status:"planned"` |

In `CURRICULUM.json` a course carries `defaultModes` and **every structure carries `preferred_modes`, an
ordered fallback list**. The author takes the first mode an engine can render today and keeps the rest on
the record. A structure routed to `diagram` becomes a 3D scene the day a model for it exists, with no
curriculum edit — which is the point: *today's provider coverage must never harden into a permanent
curriculum rule.* This is why "Cardiac cycle" leads with `diagram` even inside Gross Anatomy, and why 19
embryology and 16 histology structures retain `3d_anatomy` as a later option.

## The gate

Validation is a hard gate, not a development utility. `tools/validate-scenes.mjs` runs eight stages:

```
author (task | ai | human)
   ↓
1 schema       is this a v2 VisualScene at all
2 canonical    does every name match the catalog's own name, character for character
3 provider-id  is there a resolvable ref for this scene's provider
4 existence    does that id actually exist in the catalog
5 ops          does every op exist and every target resolve
6 capability   which ops will the adapter degrade   (recorded, not fatal)
7 purity       does the scene leak delivery mechanics
8 lifecycle    may this scene claim the status it claims
   ↓
status: ready | candidate | planned | blocked
```

`tools/fixtures/regression-spleen.json` is a deliberately broken scene that must produce 11 errors across
five stages. If it ever passes, the gate is broken.

## Corpus as cache — where new scenes come from

The corpus is a **validated cache of anatomy knowledge**, not an improviser. An LLM inventing model ids at
read time is both expensive and dangerous in a medical product.

```
student opens note
   ↓
extract anatomy concepts
   ↓
scene index lookup ──── hit ───→ validated scene ──→ render
   ↓ miss
AI drafts a candidate VisualScene
   ↓
the gate (all 8 stages)
   ↓
human approval  ← required: status "ready" is refused to an AI-authored scene without provenance.approved_by
   ↓
added to the corpus — every future student gets the validated version
```

So the AI progressively **expands a validated visual knowledge base** rather than re-improvising anatomy for
each reader. `candidate` scenes render on the dev route with a status badge and are invisible to students.

## Provider adapters

```js
MB3D.register('bodyparts3d', {
  attribution: 'BodyParts3D, © DBCLS, licensed CC-BY-SA 2.1 JP',
  capabilities: { native: [...], degraded: ['TRACE_STRUCTURE','PEEL_LAYER'] },
  resolve(structure) { return BASE + structure.refs.bodyparts3d + '.stl'; },  // the ONLY place a URL is built
  load, apply, dispose
});
```

When models are self-hosted to Supabase Storage, only `resolve()` changes and no scene file is touched. A
second adapter implements the same functions; scenes gain a `refs.<provider>` key and become renderable
there — the corpus does not move.

**BioDigital is an optional provider, not an architectural dependency.** They do publish a Human Widget with
programmatic control, but developer toolkits are excluded from their free tier (School/Business, price on
request), and Complete Anatomy publishes no third-party SDK. The question was never "can BioDigital do
this" — it can — but "can it do this at MedBank's economics" at ₦2,000/month. So BodyParts3D is the
zero-marginal-cost baseline and BioDigital is a premium upgrade to be priced, not designed around. The
adapter seam exists so that stays a commercial decision rather than an engineering migration.
