"""Original butterfly wing painting and quiet synthesized nature cues."""
from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np
import math,wave
out=Path(__file__).resolve().parents[1]/'public/experience/assets'
n=128;y,x=np.mgrid[:n,:n]/(n-1)
a=np.zeros((n,n,3));a[:,:,0]=246-45*x;a[:,:,1]=235-42*x;a[:,:,2]=213+16*y
edge=(np.maximum(np.abs(x-.5),np.abs(y-.5))>.45)
a[edge]*=.58
veins=np.maximum(0,np.cos((y*.9+x*.3)*math.tau*5))**40
veins+=np.maximum(0,np.cos((y*.3-x*.8)*math.tau*4))**40
a-=veins[:,:,None]*24
im=Image.fromarray(np.uint8(np.clip(a,0,255)));d=ImageDraw.Draw(im)
for i in range(14):
 xx=int(16+i*7);yy=int(18+math.sin(i*.7)*8);d.ellipse((xx,yy,xx+3,yy+3),fill=(255,247,220))
im.save(out/'butterfly-wing.png')
rate=22050
rng=np.random.default_rng(3157)
def write(name,samples):
 samples=np.int16(np.clip(samples,-.8,.8)*32767)
 with wave.open(str(out/(name+'.wav')),'wb') as f:f.setparams((1,2,rate,0,'NONE',''));f.writeframes(samples.tobytes())
def cue(name,notes,length):
 t=np.arange(int(length*rate))/rate;s=np.zeros_like(t)
 for start,freq,duration in notes:
  a=t-start;mask=(a>=0)&(a<duration);v=a[mask]
  env=np.minimum(1,v/.025)*np.minimum(1,(duration-v)/.06)*np.exp(-v*5)
  s[mask]+=np.sin(math.tau*(freq*v+freq*.16*v*v))*env*.12
 write(name,s)
cue('garden-chirp',[(0,1750,.15),(.19,2200,.14),(.38,1650,.19)],.85)
cue('garden-combo',[(i*.09,f,.5) for i,f in enumerate([659,784,988,1319])],.9)
cue('pet-chirp',[(0,740,.15),(.15,960,.2)],.5)
# Quiet, smoothly looped breeze, without abrupt transitions or loud hiss.
t=np.arange(rate*12)/rate;s=rng.normal(0,1,len(t))
for _ in range(6):s=(np.roll(s,1)+s+np.roll(s,-1))/3
s*=.022*(.7+.3*np.sin(t*math.tau/12));write('garden-breeze',s)
print('Created original 3D butterfly wing texture, breeze loop and three gentle cues.')
