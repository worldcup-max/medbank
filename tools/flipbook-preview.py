import sys, os, random, subprocess
from PIL import Image
S=sys.argv[1]; out=sys.argv[2]; tmp='fb'
for f in os.listdir(tmp): os.remove(os.path.join(tmp,f))
L=lambda n: Image.open(os.path.join(S,n)).convert('RGB')
base,crit,treat=L('base.webp'),L('critical.webp'),L('treated.webp')
fr=[L(f'distress-f{i}.webp') for i in (1,2,3,4)]
FPS=24; n=[0]
def put(im):
    im.save(f'{tmp}/{n[0]:05d}.jpg',quality=90); n[0]+=1
def hold(im,s):
    for _ in range(int(s*FPS)): put(im)
def fade(a,b,s):
    k=int(s*FPS)
    for i in range(k): put(Image.blend(a,b,(i+1)/k))
def shake(im,amp=4):
    dx,dy=random.randint(-amp,amp),random.randint(-amp,amp)
    W,H=im.size; c=im.crop((8+dx,8+dy,W-8+dx,H-8+dy)).resize((W,H)); return c
random.seed(1)
hold(base,1.5); fade(base,fr[0],0.4)
order=[0,1,2,3,1,0,2,3]*3
for i in order:
    im=fr[i]
    for _ in range(3): put(shake(im))   # 8 poses/sec with jitter
fade(fr[0],crit,0.6); hold(crit,1.5); fade(crit,treat,0.8); hold(treat,1.5)
subprocess.run(['ffmpeg','-y','-loglevel','error','-framerate',str(FPS),'-i',f'{tmp}/%05d.jpg','-c:v','libx264','-pix_fmt','yuv420p','-crf','26','-movflags','+faststart',out],check=True)
print(out, n[0], 'frames')
