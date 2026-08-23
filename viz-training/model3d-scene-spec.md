# Proposed `model3d` scene spec (revolving anatomy)

The engine today supports 2D layouts (diagram, tree, flow, graph, table, …). This corpus trains toward one new
scene mode — **`model3d`** — a revolving mesh with sequenced, narrated landmark callouts. Shape (fits inside the
existing `narration_steps` contract so the player is a thin extension, exactly like Topic Preview):

```jsonc
{
  "heading": "Scapula",
  "mode": "model3d",
  "beat": "segment",                       // overview | segment | contrast | takeaway
  "model": {
    "source": "BodyParts3D",               // BodyParts3D | Leiden-Open3DModel | Z-Anatomy | procedural
    "license": "CC-BY-SA",
    "ref": "FMA13394",                      // source structure id where known (FMA / part name)
    "structures": ["scapula"],             // meshes to load (can be several for relationships)
    "autoRotate": 0.006,                    // radians/frame; user can drag to override
    "framing": "posterior"                  // initial camera pose
  },
  "anchors": [                             // 3D landmark points → labels (projected to screen each frame)
    { "id": "body",     "pos": [0.1,-0.4,0.2], "label": "Body (blade)" },
    { "id": "spine",    "pos": [-0.2,1.05,-0.2], "label": "Spine" },
    { "id": "acromion", "pos": [1.15,1.25,-0.25], "label": "Acromion" },
    { "id": "glenoid",  "pos": [1.45,0.6,0.0], "label": "Glenoid cavity" },
    { "id": "coracoid", "pos": [1.1,1.5,0.5], "label": "Coracoid process" }
  ],
  "narration_steps": [                     // same field the current renderer already drives
    { "point": "body",     "reveal": ["body"],                       "short": "Overview",   "narration_text": "The scapula — a flat triangular bone on the back of the ribcage." },
    { "point": "spine",    "reveal": ["body","spine","acromion"],    "short": "The blade",  "narration_text": "The raised ridge is the spine, ending laterally in the acromion." },
    { "point": "glenoid",  "reveal": ["glenoid"],                    "short": "The socket", "narration_text": "The shallow glenoid cavity is the socket the arm bone sits in." },
    { "point": "coracoid", "reveal": ["coracoid"],                   "short": "Landmarks",  "narration_text": "The hook in front is the coracoid process — a muscle and ligament anchor." }
  ]
}
```

Notes for authors of draft blueprints:
- Every `narration_steps[i].point` MUST equal an `anchors[i].id` (so camera-follow centres the live landmark —
  same contract the 2D renderer uses via `data-el`).
- Keep narration **simpler than the note**, orienting not exhaustive. 2–5 short sentences per step.
- Prefer real source `ref`s (FMA ids / BodyParts3D names) so meshes are traceable + correctly licensed.
- If no mesh is realistically sourceable, set `"source":"procedural"` and describe the primitive build
  (the preview rig proves procedural bones/muscles render fine as a fallback).
