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
      "role": "part",                 // "primary" | "part" (both in the student's list) | "context" (scaffolding)
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

### The three roles, and the rule the engine actually applies

| role | in the student's tappable list | survives a cross-section | meaning |
|---|---|---|---|
| `primary` | yes | yes | the headline subject — the medulla in the medulla scene, the ACA and MCA in anterior circulation |
| `part` | yes | yes | a taught structure alongside the subject |
| `context` | no — it gets a pin, not a button | no, it is clipped away | scaffolding, there so the subject has somewhere to be |

**The engine asks one question, in one place: is this taught?** `isTaught()` in `viz3d.js` answers
`role !== 'context'`, so an unrecognised role counts as taught. That direction is deliberate: a
structure an author bothered to name and colour is more safely shown and tappable than silently
clipped out of the picture.

This section exists because the spec used to declare only `part` and `context` while the corpus was
already using `primary`, and four separate places in the engine tested the role inline — three as
`role === 'part'` and a fourth, easy to miss, as `role !== 'part'` where it was partitioning
structures into taught and scaffolding, which would have double-counted every `primary` once the first
three were fixed. Such a structure was treated as scaffolding: dropped from the part list, given a
context pin, and clipped away in cross-sections.

**How big it actually was, which is smaller than first written here.** 28 scenes carry `primary`, 111
structures between them — but that number counts scenes `viz3d.js` never touches. Only `3d_anatomy`
scenes reach this engine (the svg adapter does not filter by role), and only `ready` ones reach a
student:

| | scenes | |
|---|---|---|
| `3d_anatomy` / `ready` | 6 | **20 structures actually broken** |
| `3d_anatomy` / `candidate` | 3 | fixed before they ship |
| `diagram` / `planned` | 15 | svg engine — never affected |
| `microscopic` / `planned` | 4 | svg engine — never affected |

One live scene carried no `role: "part"` at all and so showed an empty part list with nothing to tap:
`neuroanatomy__limbic-system__amygdala`, 0 part against 5 primary. An earlier draft of this section
also named two histology scenes; both are `microscopic` and `planned`, drawn by the svg engine, and
were never affected. Corpus-wide counts are the wrong unit for an engine bug — the unit is scenes the
engine renders, in a status a student can reach.

**The lesson is not "document your roles".** It is that a vocabulary check belongs in one function
rather than at each call site, because the failure of an inline `=== 'part'` is invisible — it does
not throw, it does not warn, it just quietly moves a structure into the other category.

### `views[].mode` — a different vocabulary from the scene's `mode`, and the one coverage reads

Two fields are called `mode` and they mean unrelated things. **The scene's `mode`** (below, "Mode is a
property of the concept") says which engine can render the scene: `3d_anatomy`, `microscopic`,
`diagram`, `sequence`, `comparison`, `imaging`. **A view's `mode`** says what that beat teaches, and
must be one of the view types `CURRICULUM.json` uses:

`location` · `cross_section` · `mechanism` · `vasculature` · `associated_organs` · `glands` ·
`contraction_filter` · `comparison`

**This is the field `tools/coverage.mjs` matches on, as an exact string.** Every structure in the
curriculum declares the view types it needs, and a structure is covered when its scene carries a view
of each. So a view whose mode is outside this list counts for nothing: the scene teaches the thing,
the coverage report says it does not, and the gap is queued as work that is already done.

That happened. `cardiac-looping` labels all nine of its views `process`, while its curriculum entry
declares `mechanism` — a scene that teaches looping in nine careful beats reported **0 of 1** view
slots covered. `comparison` also turns up, in eight scenes, and is the collision between the two
vocabularies: it is a legitimate scene mode, so it looked legitimate on a view. It is allowed here,
because in every one of those eight it sits alongside all the declared types rather than instead of
one — an extra beat, costing nothing.

`tools/validate-scenes.mjs` now rejects a view mode outside this list, for the same reason it rejects
an unknown role: the failure is silent, and a silent failure in the coverage report is worse than a
loud one, because it sends someone to build a scene that already exists.

## The op vocabulary

Eleven ops — a teaching language, not a rendering API. Scenes are authored against **all eleven**; each
adapter declares which it supports and degrades the rest. A scene is never rejected for using an op its
current renderer lacks, because the day a better renderer arrives the teaching is already authored.

*(This section said "ten" and listed nine: `PEEL_LAYER` was in the validator and in the player but never
in this table. Both missing rows are below. Corrected 2026-09-10 by the build run that added `SET_STAGE`.)*

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
| `PEEL_LAYER` | `layer` | hide every structure in that layer | **degrades** → plain hide, with no peeling animation |
| `SET_STAGE` | `t` (0–1) | move the whole picture to that point in the process | **unsupported** — a scanned mesh has no stages |

### `SET_STAGE` — a process scene that can actually walk its stages

Thirty-two scenes in this corpus are processes. Until 2026-09-10 the player could not walk one: `t` lived
on the structure's ref, so a scene showing three stages of the heart tube had to declare the ventricle
three times — `ventricle_a@0`, `ventricle_b@0.65`, `ventricle_c@1` — and hide two of them per view. The
live cardiac-looping scene still carries 44 structures for about fifteen distinct organs because of it.

With `SET_STAGE`, one ventricle is declared and every view says where it stands.

```json
{ "key": "ventricle", "label": "Primitive ventricle", "refs": { "procedural": "cardiac-looping#ventricle" } }
```
```json
{ "title": "Movement one — the bulbus swings right",
  "ops": [ { "op": "SET_STAGE", "t": 0.65 }, { "op": "SHOW_STRUCTURE", "target": "*" } ] }
```

Three rules, and they are all one rule seen from three sides — **a written `t` is a promise, and nothing
overrides it**:

- **A ref that writes `@t` is PINNED and never follows a view.** `"cardiac-looping#ventricle@1"` stands at
  1 in every view of the scene. This is what lets one view compare the finished D-loop with the finished
  mirror loop while its neighbours walk the stages; if `SET_STAGE` dragged those to 0.65 the comparison
  the view exists to make would quietly stop being true.
- **A ref with no `@t` FOLLOWS the view.** `"cardiac-looping#ventricle"` is rebuilt wherever the view says.
- **A view with no `SET_STAGE` is at `t = 1`** — the fully developed form, exactly what a bare ref has
  always meant. It is deliberately NOT sticky: a view that rendered differently depending on which chip
  the student pressed before it would not be a view. It also means every scene written before this op
  existed renders exactly as it did, because with no `SET_STAGE` anywhere nothing moves.

`t` must be a number in 0–1; the validator rejects anything else, and warns when a scene uses `SET_STAGE`
while every one of its procedural refs is pinned — the op is then decoration, and almost always the scene
is still authored the old way and was never collapsed.

Only the `procedural` provider has stages. A BodyParts3D scene carrying `SET_STAGE` gets a capability
warning and the op does nothing: a scanned scapula is not a function of anything.

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

### `CROSS_SECTION.axis` — the anatomical plane convention

`axis` is the **normal of the cut plane**, not a direction the plane runs along. The meshes are LPS
(+X left, +Y posterior, +Z superior) — this is not inferred from sibling scenes, it is stated in the
`calibrated_by` string of every anchor `derive-landmark.mjs` has ever emitted. So:

| plane the narration names | `axis` | because the plane's normal is |
|---|---|---|
| sagittal / median | `x` | left–right |
| coronal / frontal | `y` | anterior–posterior |
| axial / transverse / horizontal | `z` | superior–inferior |

This holds for a limb as much as for a trunk: a "transverse section through the popliteal fossa" is
still cut normal to the superior–inferior axis of the mesh, which is `z`, because the femur and tibia
lie along `z`. The one place the table does not apply is a **pre-folding embryo**, where the disc is
flat and its cranio-caudal axis is not the mesh's `z`; those scenes must state their axis in the beat.

**Write the plane word in the narration and the `axis` that matches it, or write neither.** Four scenes
were found narrating one plane and cutting another — kidney, liver, pancreas and popliteal fossa, all
signed and all reported clean by every run — because nothing compared the two. `validate-scenes.mjs`
now warns on the mismatch, but the warning only fires when the narration names a plane, so a beat that
cuts silently is still unchecked.

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
