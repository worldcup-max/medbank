# Plate kit: how library plates are built (Opus standard)

Run in a cloud workspace, not on the Windows PC. Set up a work folder like this:
  work/tools/   = copy of explainer/studio/{kit.js,shell.mjs,qa.mjs,prompts.mjs,llm.mjs,fixtures/} + these files (assemble.mjs, final.mjs, voice.py)
  work/<topic>/ = plan.json, model.js, scene.js, lesson.json  (written by the builder)
Build + check:   cd work && node tools/assemble.mjs <topic>       (prints MODEL/SCENE CODE/PAGE ISSUES, saves shot.png + stage-*.png)
  (assemble.mjs imports playwright from /opt/npm-tools/node_modules/playwright/index.js; change that path if needed)
Voice:           pip install kokoro-onnx soundfile; download
                 https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.int8.onnx -> kokoro.onnx
                 https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin -> voices.bin
                 KOKORO=<dir with both> python3 tools/voice.py <topic> bf_emma   -> <topic>/lesson.voiced.json
Final page:      node tools/final.mjs <topic> <out>.html
BRIEF-nephron-example.md is the exact brief that produced the winning Opus nephron plate; copy it per topic and swap the note/topic specifics.
