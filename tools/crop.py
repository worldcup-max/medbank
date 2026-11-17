import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); W, H = im.size
nw, nh = (int(sys.argv[3]), int(sys.argv[4])) if len(sys.argv) > 4 else (1376, 768)
s = min(W/nw, H/nh); dw, dh = nw*s, nh*s; l = (W-dw)/2; t = (H-dh)/2
im = im.crop((round(l)+1, round(t), round(l+dw)-1, round(t+dh)))
im = im.resize((1206, 674), Image.LANCZOS) if im.size != (1206, 674) else im
im.save(sys.argv[2], 'WEBP', quality=82, method=6); print(sys.argv[2], im.size)
