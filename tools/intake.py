#!/usr/bin/env python3
"""Bring hand-made Flow pictures into the library.

  python3 tools/intake.py <folder with downloads> <art>/<course>/<topic>/<set>

Each file in the folder must be named after its picture key, any image extension, any case:
  base, distress, critical, treated, arrival, night, discharge,
  exam-eyes, exam-hands, exam-mouth, exam-skin, exam-abdomen, distress-f2..f4
(spaces or underscores are fine: "Exam Eyes.png" -> exam-eyes). Each one is cropped to 16:9 and saved
as <key>.webp at 1206x674. distress-f1 is made from distress automatically. Unknown names are listed
and skipped, so nothing lands under a wrong name. Prints what is still missing for a complete set.
"""
import os, re, sys
from PIL import Image

KEYS = ['base', 'distress', 'critical', 'treated', 'arrival', 'night', 'discharge',
        'exam-eyes', 'exam-hands', 'exam-mouth', 'exam-skin', 'exam-abdomen',
        'distress-f2', 'distress-f3', 'distress-f4']
REQUIRED = KEYS[:12]

def norm(stem):
    return re.sub(r'[\s_]+', '-', stem.strip().lower())

def save(src, dst):
    im = Image.open(src).convert('RGB'); W, H = im.size
    a = 1376 / 768
    if W / H > a: nw, nh = H * a, H
    else: nw, nh = W, W / a
    l, t = (W - nw) / 2, (H - nh) / 2
    im = im.crop((round(l), round(t), round(l + nw), round(t + nh))).resize((1206, 674), Image.LANCZOS)
    im.save(dst, 'WEBP', quality=82, method=6)

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
for f in sorted(os.listdir(src)):
    p = os.path.join(src, f)
    stem, ext = os.path.splitext(f)
    if not os.path.isfile(p) or ext.lower() not in ('.png', '.jpg', '.jpeg', '.webp'): continue
    k = norm(stem)
    if k not in KEYS: print('  skipped (name not a picture key):', f); continue
    save(p, os.path.join(out, k + '.webp')); print('  saved', k + '.webp')
    if k == 'distress': save(p, os.path.join(out, 'distress-f1.webp'))
have = {os.path.splitext(f)[0] for f in os.listdir(out)}
miss = [k for k in REQUIRED if k not in have]
print('complete set' if not miss else 'still missing: ' + ', '.join(miss))
