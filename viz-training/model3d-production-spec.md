# Production `model3d` scene — correct glows by construction

The lesson from the test harness: **do not guess landmark spots on one fused mesh.** Instead, build each scene
from **per-part labelled meshes**, so a highlighted part is correct because it *is* its own mesh. When a part
genuinely has no separate mesh (a landmark on a bone), author its anchor **once on our side** (never the student).

Primary source: **BodyParts3D** (CC-BY-SA) — every anatomical concept has its own `FMA<id>.stl`, in a single
**consistent coordinate frame**, served per-file by jsdelivr:
`https://cdn.jsdelivr.net/gh/Kevin-Mattheus-Moerman/BodyParts3D@main/stl/FMA<id>.stl`
FMA id ↔ English-name mapping lives in that repo's `assets/*.txt`.

## Scene shape (stored in the Visualize DB, served pre-calibrated)
```jsonc
{
  "id": "gross-anatomy__scapula",
  "title": "Scapula",
  "subject": "Gross Anatomy",
  "attribution": "BodyParts3D, © DBCLS, CC-BY-SA 2.1 JP",
  "camera": { "framing": "posterior", "autoRotate": 0.006 },
  "meshes": [                                   // loaded together, form the whole structure
    { "ref": "FMA13394", "role": "base", "color": "#e9e1cc",
      "url": "https://cdn.jsdelivr.net/gh/Kevin-Mattheus-Moerman/BodyParts3D@main/stl/FMA13394.stl" }
  ],
  "parts": [                                    // the list the student sees; each lights up correctly
    { "id": "glenoid", "label": "Glenoid cavity",
      "mode": "mesh", "ref": "FMA23275",        // its OWN mesh → glow is exact, no guessing
      "url": "https://cdn.jsdelivr.net/gh/Kevin-Mattheus-Moerman/BodyParts3D@main/stl/FMA23275.stl",
      "narration": "The shallow socket for the head of the humerus." },

    { "id": "inferior_angle", "label": "Inferior angle",
      "mode": "anchor",                         // landmark with no separate mesh → we author it ONCE
      "anchor": [x, y, z], "radius": 0.09,      // in the base mesh's own (known) coordinate frame
      "calibrated_by": "author", "status": "needs-review",
      "narration": "The lowest point — palpable; overlies rib 7." }
  ]
}
```

Rules:
- **Prefer `mode:"mesh"`** — resolve each part to its own FMA mesh. Correct glow, zero calibration.
- **Use `mode:"anchor"` only when no sub-mesh exists.** Author the anchor in the base mesh's known frame
  (BodyParts3D's consistent orientation makes this deterministic, not a guess), and mark `status:"needs-review"`
  so a human eyeballs it once in-app before it goes live.
- Every mesh URL is **validated reachable** and carries its **CC-BY-SA attribution**.
- The engine loads the scene as-is; the student opens the note, highlights a term, and the matching part is
  **already glowing in the right place** — no list to pick from, no clicking to calibrate.

## View modes (a structure is rendered "all at once" as a small guided set)
Every structure scene tells one story in up to three beats — **"see it in the body → see it among its neighbours →
see how it works"** — plus any of the special views the structure needs:

| view | when to use | how it's built |
|---|---|---|
| `location` | always (beat 1) | highlight the structure inside its whole region / body context |
| `associated_organs` | most (beat 2) | show it among neighbouring organs/structures (each its own labelled mesh) |
| `mechanism` | anything that *does* something (beat 3) | animate the function — heart pumping, peristalsis, breathing, CSF flow, bile flow |
| `cross_section` | hollow / layered structures | a cut plane revealing chambers, spaces, layers (heart chambers, kidney cortex/medulla, gut wall) |
| `contraction_filter` | skeletal muscles | a relaxed↔contracted toggle (e.g. flexing the biceps) — two mesh states or a morph |
| `vasculature` | most regions/organs | the arteries & veins in/around it, in correct position (own meshes, red/blue) |
| `glands` | organs with associated glands | show associated glands + a note on their secretion |

Scene JSON gains a `views` array; each entry names a `mode` from above plus its meshes/animation params. `mechanism`
and `contraction_filter` entries carry a lightweight `animation` block (e.g. `{"type":"pump","bpm":60}`,
`{"type":"muscle_state","from":"relaxed","to":"contracted"}`) the engine plays. Author only the views a structure
truly needs — never pad.

## Mesh hosting — self-host, don't hotlink (learned the hard way)
Public CDNs (jsdelivr/raw GitHub) do **not** reliably serve BodyParts3D's per-part files — wrong/missing IDs, Git-LFS
pointers, and CORS all bite (verified: a per-chamber heart test fell back to the whole-organ mesh). So production
does NOT hotlink. Instead, an **ingest step** downloads each resolved `FMA<id>.stl` **once** from BodyParts3D into
our own Visualize asset store (e.g. Supabase Storage `viz-meshes/FMA<id>.stl`), and scene files point at OUR URLs.
Benefits: parts always load, correct CORS, one place to keep CC-BY-SA attribution, and we control quality/versioning.

Pipeline split:
- **Hourly author task (log-only):** resolves the FMA ids for a structure + its parts, writes the scene JSON, and
  records the list of meshes to ingest (`ingest_queue`). It never downloads binaries.
- **Ingest step (server-side, when we run it):** pulls each queued `FMA<id>.stl` into `viz-meshes/`, rewrites the
  scene's `url`s to our store, marks the scene `ready`. Whole-organ meshes that already load (Wikimedia CC-BY) can be
  used as the `base` immediately; per-part meshes come from our store.

## Muscles (the biceps/triceps problem, solved)
Each muscle **and each head** is its own BodyParts3D mesh (e.g., biceps long head, short head). A muscle scene
loads the heads as separate `mode:"mesh"` parts → highlighting any head is exact and automatic. This is why the
in-app engine renders muscles correctly where the offline test (guessing one combined file) could not.
