# viz-training/tools — self-host the meshes

**Why:** public CDNs don't reliably serve per-part anatomy meshes (verified: they 404/CORS-fail in the browser).
So we host them ourselves. This runs on YOUR machine/server (full network) — not in the sandbox.

## Run
```
node viz-training/tools/ingest-meshes.mjs            # ingest every FMA mesh referenced by scenes/*.json
node viz-training/tools/ingest-meshes.mjs --only FMA7096,FMA7098   # just these
```
It downloads each `FMA<id>.stl` into `viz-training/viz-meshes/`, validates it's a real STL, and prints a
**REPORT** of which files exist vs are MISSING (the ground truth we can't get from the sandbox).

## Then
1. Upload `viz-training/viz-meshes/` to a public store — e.g. Supabase Storage bucket `viz-meshes`.
2. Point scene `url`s at `https://<project>.supabase.co/storage/v1/object/public/viz-meshes/FMA<id>.stl`.
3. The app's model3d player loads parts from our store — reliable, correct CORS, CC-BY-SA credit kept in the scene.

Attribution to keep wherever these render: *"BodyParts3D, © DBCLS, licensed CC-BY-SA 2.1 JP."*
