# Self-host the 3D meshes — step by step (Windows)

Goal: download the real per-part anatomy meshes into our own store so the app loads them reliably.

---

## Step 0 — make sure Node is installed (one-time)
1. Press **Start**, type **PowerShell**, open **Windows PowerShell**.
2. Type this and press Enter:
   ```
   node -v
   ```
   - If you see something like `v18.x` or `v20.x` → good, skip to Step 1.
   - If you see an error / "not recognized" → install Node: go to **https://nodejs.org**, download the **LTS** installer, run it (click Next/Next/Finish), then **close and reopen PowerShell** and run `node -v` again.
   - Note: you need **v18 or newer** (the script uses built-in downloading).

---

## Step 1 — run the ingest script
1. In PowerShell, go to the project folder (copy-paste this exactly):
   ```
   cd "C:\Users\domin\OneDrive\Documents\GitHub\medbank"
   ```
2. Run the ingest:
   ```
   node viz-training\tools\ingest-meshes.mjs
   ```
3. Watch the output. For each part it prints `OK (… KB)` or `MISSING`. At the end you get a **REPORT**, e.g.:
   ```
   == REPORT ==
     hosted: 5/8
     MISSING (3) — pick another FMA id or source for these:
       - FMA4720  Superior vena cava  [used by gross__heart-pericardium__heart.json]
   ```
4. The downloaded files land in `C:\Users\domin\OneDrive\Documents\GitHub\medbank\viz-training\viz-meshes\`.
5. **Copy that whole REPORT and paste it back to me.** Whatever is MISSING, I'll swap to the correct id/source so every part resolves.

*(If nothing downloads at all, your network may block the source — tell me and I'll point the script at a mirror.)*

---

## Step 2 — put the meshes in Supabase Storage (so the app can serve them)
1. Open **https://supabase.com/dashboard** → your MedBank project.
2. Left sidebar → **Storage**.
3. Click **New bucket**. Name it exactly:
   ```
   viz-meshes
   ```
   Turn **Public bucket** ON. Click **Save**.
4. Click the **viz-meshes** bucket → **Upload files**.
5. Select **all the files** inside `viz-training\viz-meshes\` (Ctrl+A in that folder) and upload.
6. Click any file → **Copy URL**. It looks like:
   ```
   https://tytbrhuzikqkscxdnkmr.supabase.co/storage/v1/object/public/viz-meshes/FMA7096.stl
   ```
   The part before `FMA7096.stl` is the **base URL** — send me that.

---

## Step 3 — I wire it up (you don't do anything here)
Once you paste me (a) the REPORT and (b) the base URL, I will:
- Fix any MISSING part ids in the scene.
- Point the scene `url`s at your `viz-meshes` store.
- Wire the app's `model3d` player (behind the flag) to read `scenes/*.json`.

Then opening the Heart topic shows the real chambers as buttons, each lighting up the true structure. Done.

---

### TL;DR (the two commands)
```
cd "C:\Users\domin\OneDrive\Documents\GitHub\medbank"
node viz-training\tools\ingest-meshes.mjs
```
…then upload `viz-training\viz-meshes\` to a public Supabase bucket `viz-meshes`, and send me the REPORT + base URL.
