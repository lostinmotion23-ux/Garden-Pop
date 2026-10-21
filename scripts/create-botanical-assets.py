"""Original botanical PBR maps and legible, hand-drawn power emblems."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter
import numpy as np
import math
out=Path(__file__).resolve().parents[1]/'public/experience/assets'
rng=np.random.default_rng(3157);n=256;y,x=np.mgrid[:n,:n]/n
noise=rng.normal(0,1,(n,n))
def surface(name,rgb,h,rough):
    Image.fromarray(np.uint8(np.clip(rgb,0,255))).save(out/f'{name}.png')
    dx=(np.roll(h,-1,1)-np.roll(h,1,1))*2;dy=(np.roll(h,-1,0)-np.roll(h,1,0))*2
    a=np.stack([-dx,-dy,np.ones_like(h)],-1);a/=np.linalg.norm(a,axis=-1,keepdims=True)
    Image.fromarray(np.uint8((a*.5+.5)*255)).save(out/f'{name}-normal.png')
    Image.fromarray(np.uint8(np.clip(rough+h*25,0,255))).convert('RGB').save(out/f'{name}-rough.png')
h=np.sin(x*math.tau*17+np.sin(y*math.tau*2))*.18+noise*.025
rgb=np.array([122,92,75])[None,None,:]+h[:,:,None]*42
for i in range(45):
    cx,cy=rng.random(2);w=rng.uniform(.015,.075)
    mark=(np.abs(x-cx)<w)&(np.abs(y-cy)<.0035)
    rgb[mark]+=rng.uniform(18,36);h[mark]-=.22
surface('bark',rgb,h,175)
rgb=np.zeros((n,n,3));t=np.clip(y,0,1)
rgb[:,:,0]=249-15*(1-t)**3;rgb[:,:,1]=225-61*(1-t)**2;rgb[:,:,2]=230-37*(1-t)**2
h=np.sin(x*math.tau*23+(1-y)*4)*.022+noise*.004
surface('petal',rgb+h[:,:,None]*5,h,155)
vein=np.exp(-((x-.5)/.025)**2)*.15
vein+=np.maximum(0,np.cos((y+np.abs(x-.5)*.7)*math.tau*9))**18*.1
h=vein+np.sin(x*math.pi)*.1+noise*.005
rgb=np.array([103,138,69])[None,None,:]+vein[:,:,None]*90+noise[:,:,None]*1.5
surface('botanical-leaf',rgb,h,155)
# Tileable stochastic soil, moss and short grass; no directional sine grid.
base=rng.normal(0,1,(n,n));mottle=base.copy()
for radius in [2,5,11,23]:
    layer=base.copy()
    for _ in range(radius):layer=(layer+np.roll(layer,1,0)+np.roll(layer,-1,0)+np.roll(layer,1,1)+np.roll(layer,-1,1))/5
    mottle+=layer*radius*.42
mottle=np.clip(mottle,-2,2)
rgb=np.array([91,111,63])[None,None,:]+mottle[:,:,None]*np.array([10,13,7])
h=mottle*.04
for _ in range(5200):
    xx,yy=rng.integers(n,size=2);length=int(rng.integers(2,9));angle=rng.uniform(-1,1)
    tint=rng.choice([-1,1])*rng.uniform(6,23)
    for k in range(length):
        px=(xx+int(k*angle))%n;py=(yy-k)%n
        rgb[py,px]+=np.array([.7,1,.45])*tint;h[py,px]+=.035
surface('botanical-ground',rgb,h,194)
# Paint at 3x resolution. The atlas is never used as a scenery replacement.
S=3;tile=256;atlas=Image.new('RGBA',(1024*S,512*S))
def point(p):return tuple(round(v*S) for v in p)
def poly(d,pts,fill):d.polygon([point(p) for p in pts],fill=fill)
def line(d,pts,fill,width):d.line([point(p) for p in pts],fill=fill,width=round(width*S),joint='curve')
def ellipse(d,box,fill,outline=None,width=1):d.ellipse(tuple(round(v*S) for v in box),fill=fill,outline=outline,width=round(width*S))
def star(cx,cy,r):return [(cx+math.sin(i*math.pi/5)*(r if i%2==0 else r*.43),cy-math.cos(i*math.pi/5)*(r if i%2==0 else r*.43)) for i in range(10)]
for i in range(7):
    im=Image.new('RGBA',(tile*S,tile*S));d=ImageDraw.Draw(im)
    if i==0:
        pts=[(124,24),(128,66),(160,93),(177,75),(190,112),(199,147),(190,184),(164,209),(128,219),(91,208),(64,185),(57,153),(69,120),(89,97),(86,146),(109,119),(119,85)]
        poly(d,pts,'#4c241c');poly(d,[(128+(a-128)*.9,128+(b-128)*.9) for a,b in pts],'#fff2c7')
        poly(d,[(132,108),(163,151),(164,179),(147,197),(121,203),(98,186),(98,163),(116,139),(118,170),(133,148)],'#ff9d35')
    elif i==1:
        for radius,color in [(91,'#e7676d'),(76,'#f6c968'),(61,'#91bf80'),(46,'#70b5d6'),(31,'#bf9fe6')]:
            pts=[(128+math.cos(a)*radius,175-math.sin(a)*radius) for a in np.linspace(0,math.pi,100)]
            line(d,pts,'#34283a',19);line(d,pts,color,13)
        for cx in [42,214]:
            ellipse(d,(cx-23,161,cx+23,192),'#fff2da')
    elif i==2:
        for pts in [[(48,67),(78,67),(182,180),(211,180)],[(48,184),(78,184),(183,72),(211,72)]]:
            line(d,pts,'#362c43',26);line(d,pts,'#fff6dc',17)
        for yy in [72,180]:poly(d,[(214,yy),(180,yy-27),(180,yy+27)],'#fff6dc')
    elif i==3:
        poly(d,star(128,128,103),'#543b1f');poly(d,star(128,125,89),'#ffe39a')
        poly(d,[(128,45),(128,124),(80,154),(96,121)],'#fff8d8');poly(d,[(128,124),(180,152),(160,202),(128,164)],'#d29836')
    elif i==4:
        line(d,[(148,65),(169,45),(192,53),(207,35)],'#432e21',14)
        ellipse(d,(191,18,228,55),'#ffc777');poly(d,star(210,35,29),'#fff0b8')
        ellipse(d,(49,72,204,225),'#fff0c2');ellipse(d,(57,80,196,219),'#26313b')
        ellipse(d,(77,98,121,126),'#a5b6c1');line(d,[(82,157),(87,181),(105,194)],'#526475',8)
        poly(d,[(135,65),(170,72),(163,92),(129,85)],'#b99758')
    elif i==5:
        pts=[(128,24),(211,92),(128,229),(45,92)];poly(d,pts,'#fff4dc')
        poly(d,[(128,35),(128,108),(58,92)],'#91dce1');poly(d,[(128,35),(199,92),(128,108)],'#ca9fdc')
        poly(d,[(58,100),(120,115),(126,213)],'#91baa0');poly(d,[(136,114),(197,100),(132,213)],'#e8b2c5')
        line(d,[(128,40),(128,109),(60,95)],'#fff8e6',5)
    else:
        pts=[(145,21),(65,139),(119,139),(99,234),(202,96),(145,96),(166,21)]
        poly(d,pts,'#263c4a');poly(d,[(130+(a-130)*.9,128+(b-128)*.9) for a,b in pts],'#fff0b2')
        line(d,[(141,45),(92,126),(142,123)],'#ffffff',5)
    # A gentle raised edge shadow, with transparent surroundings.
    shadow=Image.new('RGBA',im.size,(0,0,0,0));shadow.putalpha(im.getchannel('A').filter(ImageFilter.GaussianBlur(2*S)))
    shadow.alpha_composite(im,(0,0));atlas.alpha_composite(shadow,((i%4)*tile*S,(i//4)*tile*S))
atlas.resize((1024,512),Image.Resampling.LANCZOS).save(out/'skill-icons.png')
print('Created cherry bark, petal and leaf PBR maps and seven distinct illustrated skill emblems.')
