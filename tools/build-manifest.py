#!/usr/bin/env python3
"""Build art-manifest.json from the picture folder.

Usage: python3 tools/build-manifest.py <art root> <out.json> [--base-url URL]
  <art root>  folder laid out as <course>/<topic>/<set>/<picture>.webp
  --base-url  URL prefix the app loads pictures from (default: er-sim-art/)

Shape (matches what window.MB_ART.resolve(topic, set) returns per set):
{ "version": 1, "baseUrl": "...", "topics": { "<topic>": { "course": "<course>",
    "sets": { "<set>": { "dir": "<baseUrl><topic>/<set>/", "sex": "m|f",
      "age": "child|infant|adult…", "facility": "phc|gh|private|th…",
      "files": { "base": "base.webp", ... } } } } } }
Only files that exist are listed. Set names follow <sex>-<age>-<facility>-<nn>.
"""
import json, os, sys
args = [a for a in sys.argv[1:] if not a.startswith('--')]
base = 'er-sim-art/'
if '--base-url' in sys.argv:
    base = sys.argv[sys.argv.index('--base-url') + 1]
    args = [a for a in args if a != base]
root, out = args[0], args[1]
if not base.endswith('/'): base += '/'
man = {'version': 1, 'baseUrl': base, 'topics': {}}
for course in sorted(os.listdir(root)):
    cdir = os.path.join(root, course)
    if not os.path.isdir(cdir): continue
    for topic in sorted(os.listdir(cdir)):
        tdir = os.path.join(cdir, topic)
        if not os.path.isdir(tdir): continue
        sets = {}
        for s in sorted(os.listdir(tdir)):
            sdir = os.path.join(tdir, s)
            if not os.path.isdir(sdir): continue
            files = {f[:-5]: f for f in sorted(os.listdir(sdir)) if f.endswith('.webp')}
            if 'base' not in files: continue
            parts = s.split('-')
            sets[s] = {'dir': f'{base}{topic}/{s}/', 'sex': parts[0] if parts else '',
                       'age': parts[1] if len(parts) > 1 else '',
                       'facility': parts[2] if len(parts) > 2 else '', 'files': files}
        if sets:
            man['topics'][topic] = {'course': course, 'sets': sets}
json.dump(man, open(out, 'w'), indent=1)
print(out, sum(len(t['sets']) for t in man['topics'].values()), 'sets')
