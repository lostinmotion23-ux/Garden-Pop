"""Original seeded texture maps and quiet synthesized garden sounds; no external art."""
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
import math, random, wave, struct, subprocess
OUT=Path(__file__).resolve().parents[1]/'public/experience/assets'
OUT.mkdir(exist_ok=True)
random.seed(3157)
for name,base in [('wood',(146,91,64)),('stone',(185,175,183)),('fur',(247,235,224)),('leaf',(133,178,123)),('soil',(152,136,120))]:
    im=Image.new('RGB',(256,256));px=im.load()
    for y in range(256):
        for x in range(256):
            grain=math.sin(y*.35+math.sin(x*.018)*2)*6+math.sin(y*1.7+x*.008)*3 if name=='wood' else math.sin(x*.12)*math.sin(y*.09)*3
            noise=random.gauss(0,3 if name=='fur' else 7)
            px[x,y]=tuple(max(0,min(255,int(c+grain+noise))) for c in base)
    draw=ImageDraw.Draw(im)
    if name=='wood':
        for j in range(12):
            yy=random.randint(0,255)
            draw.line([(x,int(yy+math.sin(x*.024+j)*3)) for x in range(256)],fill=(110,64,48),width=1)
        for xx,yy in [(68,80),(203,188)]:
            for k in range(5):draw.ellipse((xx-12-k*3,yy-3-k,xx+12+k*3,yy+3+k),outline=(127+k*3,75+k*2,52+k))
    if name=='leaf':
        draw.line((128,0,128,256),fill=(186,211,149),width=3)
        for y in range(0,256,28):
            draw.line((128,y,20,y-38),fill=(157,192,134),width=2);draw.line((128,y,236,y-38),fill=(157,192,134),width=2)
    im.save(OUT/f'{name}.png')
    Image.new('RGB',(64,64),(175 if name=='wood' else 205,)*3).save(OUT/f'{name}-rough.png')
# Soft original melodies and effects. All notes fade at both ends; conservative peak.
def write(name,duration,notes,music=False):
    rate=22050; samples=[]
    for i in range(int(rate*duration)):
        t=i/rate;value=0
        for start,freq,length in notes:
            a=t-start
            if 0<=a<length:
                env=min(1,a/.018)*math.exp(-a/(.34 if music else .12))*min(1,(length-a)/.06)
                value+=env*(math.sin(math.tau*freq*a)+.22*math.sin(math.tau*freq*2*a))
        samples.append(struct.pack('<h',int(max(-.7,min(.7,value*.13))*32767)))
    with wave.open(str(OUT/f'{name}.wav'),'wb') as f:f.setparams((1,2,rate,0,'NONE',''));f.writeframes(b''.join(samples))
fx={'shoot':[440,660],'pop':[880,1175,1397],'fall':[660,523,392],'rescue':[523,659,784,1047], 'warning':[330,294], 'power':[392,587,784,1175], 'win':[523,659,784,1047,1319], 'lose':[440,392,330], 'eat':[784,988], 'bomb':[196,392,784]}
for name,notes in fx.items():write(name,len(notes)*.09+.6,[(i*.09,f,.45) for i,f in enumerate(notes)])
melody=[523,659,784,659,587,698,880,698,523,659,784,1047,880,784,659,587]
notes=[]
for i in range(64):
    t=i*.5;notes.append((t,melody[i%16],1.1))
    if i%4==0:
        root=[131,175,165,147][(i//4)%4];notes.extend([(t,root,1.8),(t,root*1.5,1.5)])
write('garden-music',32,notes,True)
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(OUT/'garden-music.wav'),'-codec:a','libmp3lame','-b:a','80k',str(OUT/'garden-music.mp3')],check=True)
(OUT/'garden-music.wav').unlink()
print('Created original wood, stone, fur, leaf and soil textures, roughness maps, ten effects and a 32-second music loop.')
