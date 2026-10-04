
**ADDENDUM, same run, 06:20Z.** `report.json` as first committed (06:12) predated the last scene write
(06:13:56 — the one-string `[purity]` fix to `provenance`, byte-identical in structures, views, camera,
provider, visibility_waivers, gaps and status, verified field by field after the round trip). Round 5
proposed that a review compare `report.json`'s mtime against the model's and the scene's, so rather than
ask a reviewer to accept that argument, `render-lateral-folding.mjs` was re-run against the scene now in
the repo and `report.json` regenerated at 06:20:42 — **exit 0**, the whole battery passing with nothing
overridden. Final ordering: model 03:27:01 · scene 06:13:56 · report 06:20:42 · `built_at` 06:20:56.
