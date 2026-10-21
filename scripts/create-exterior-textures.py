"""Original PBR atlas for the miniature attraction. No reference-image pixels."""
from PIL import Image,ImageDraw,ImageFilter,ImageFont
from pathlib import Path
import math,random
OUT=Path(__file__).resolve().parents[1]/'public/lot/textures';OUT.mkdir(parents=True,exist_ok=True)
random.seed(3157)
w,h=1024,1024;tw,th=256,512
base=Image.new('RGB',(w,h));rough=Image.new('RGB',(w,h));height=Image.new('L',(w,h),128)
for index in range(8):
 tile=Image.new('RGB',(tw,th));p=tile.load();he=Image.new('L',(tw,th),128);hp=he.load()
 for y in range(th):
  for x in range(tw):
   noise=random.gauss(0,2.2)
   if index==0:grain=math.sin(x*.36+math.sin(y*.016)*2.4)*8+math.sin(x*.8+y*.002)*3;value=218+grain+noise
   elif index==1:value=218+math.sin(x*.08)*math.sin(y*.063)*6+noise*2.5
   elif index==2:value=224+math.sin(x*1.1+y*.4)*4+noise*3
   elif index==3:value=246+math.sin(x*.7+y*.5)*1.2+noise
   elif index==4:value=249+math.sin(x*.013)*4+noise*.4
   elif index==5:value=224+math.sin(x*.045+y*.014)*7+noise
   elif index==6:value=220+math.sin(y*.09+math.sin(x*.03))*12+noise*.5
   else:value=230+noise
   v=max(0,min(255,int(value)));p[x,y]=(v,v,v);hp[x,y]=max(0,min(255,int(128+(v-225)*.5)))
 d=ImageDraw.Draw(tile)
 if index==0:
  for knotx,knoty in [(80,120),(190,360)]:
   for k in range(6):d.ellipse((knotx-3-k*2,knoty-10-k*5,knotx+3+k*2,knoty+10+k*5),outline=(185+k*3,)*3,width=1)
 if index==5:
  d.line((128,0,128,512),fill=(251,)*3,width=3)
  for yy in range(0,512,44):
   d.line((128,yy,20,yy-70),fill=(239,)*3,width=2);d.line((128,yy,236,yy-70),fill=(239,)*3,width=2)
 if index==7:
  # LOD2's own baked board detail; LOD0 uses hundreds of real 3D spheres.
  d.rectangle((0,0,tw,th),fill='#766a9c')
  palette=['#f4a6ce','#b7a4e9','#91cfee','#f5d88c','#a4d9b6']
  for r in range(13):
   for c in range(25-r%2):
    xx=6+c*10+r%2*5;yy=65+r*17;col=random.choice(palette);d.ellipse((xx-4,yy-6,xx+4,yy+6),fill=col);d.ellipse((xx-2,yy-4,xx,yy-2),fill='#fff9ff')
  font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',21)
  d.text((128,8),'BUBBLE CRITTER',font=font,anchor='mt',fill='#fff5de');d.text((128,33),'GARDEN',font=font,anchor='mt',fill='#ffd1e5')
 x=(index%4)*tw;y=(index//4)*th;base.paste(tile,(x,y));height.paste(he,(x,y))
 rv=[165,220,230,210,165,185,55,180][index];rough.paste(Image.new('RGB',(tw,th),(rv,rv,rv)),(x,y))
# Normal map from the atlas's small physical variations, kept deliberately gentle.
norm=Image.new('RGB',(w,h),(128,128,255));np=norm.load();hp=height.filter(ImageFilter.GaussianBlur(.65)).load()
for y in range(1,h-1):
 for x in range(1,w-1):np[x,y]=(max(0,min(255,128+(hp[x-1,y]-hp[x+1,y])*2)),max(0,min(255,128+(hp[x,y-1]-hp[x,y+1])*2)),254)
for size in (1024,512,256):base.resize((size,size),Image.Resampling.LANCZOS).save(OUT/f'garden-atlas-{size}.png')
rough.save(OUT/'garden-roughness.png');norm.save(OUT/'garden-normal.png')
print('Created original wood grain, stone, grass, fur, petal, leaf, water and distant-board atlas maps.')
