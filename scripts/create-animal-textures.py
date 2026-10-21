"""Original directional fur, feathers, velvet and iris PBR atlas, 16 UV tiles."""
from PIL import Image,ImageDraw,ImageFilter
from pathlib import Path
import math,random
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/animal-art';OUT.mkdir(exist_ok=True)
random.seed(3157);size=1024;tile=256
base=Image.new('RGB',(size,size));height=Image.new('L',(size,size),128);rough=Image.new('RGB',(size,size))
for t in range(16):
 im=Image.new('RGB',(tile,tile),(246,)*3);h=Image.new('L',(tile,tile),128);d=ImageDraw.Draw(im);hd=ImageDraw.Draw(h)
 if t not in (10,12,14):
  for i in range(3300):
   x=random.randrange(-12,268);y=random.randrange(-20,268);length=random.randint(7,23);sway=math.sin(x*.035+y*.015)*3
   points=[(x,y),(x+sway,y+length*.5),(x+sway*.6+random.uniform(-2,2),y+length)]
   value=random.randint(218,245) if t!=7 else random.randint(208,239)
   d.line(points,fill=(value,)*3,width=2);hd.line(points,fill=random.randint(120,133),width=2)
   light=[(px+1,py) for px,py in points];d.line(light,fill=(random.randint(232,255),)*3,width=1);hd.line(light,fill=random.randint(136,153),width=1)
 if t==2:
  # Readable soft tabby stripes, kept in the texture rather than uniform lavender.
  mask=Image.new('L',(tile,tile));md=ImageDraw.Draw(mask)
  for i in range(6):md.line([(x,i*47+int(math.sin(x*.024+i)*15)) for x in range(tile)],fill=110,width=10)
  mask=mask.filter(ImageFilter.GaussianBlur(2));im=Image.composite(Image.new('RGB',(tile,tile),(150,)*3),im,mask)
 if t==3:
  for row in range(-1,9):
   for col in range(-1,9):
    x=col*36+(row%2)*18;y=row*36
    d.ellipse((x,y,x+39,y+52),fill=(208,)*3);d.ellipse((x+2,y,x+37,y+48),fill=(245,)*3)
    hd.ellipse((x,y,x+39,y+52),fill=146);hd.line((x+19,y+4,x+19,y+44),fill=158,width=2)
    for k in range(4):d.line((x+19,y+5+k*9,x+4,y+15+k*8),fill=(211,)*3);d.line((x+19,y+5+k*9,x+34,y+15+k*8),fill=(247,)*3)
 if t==4:
  for i in range(24):
   x=random.randint(0,255);y=random.randint(0,255);d.ellipse((x-4,y-6,x+4,y+6),fill=(255,)*3)
 if t==7:
  for i in range(100):
   x=random.randrange(tile);y=random.randrange(tile);d.ellipse((x,y,x+2,y+2),fill=(202,)*3)
 if t==10:
  im=Image.new('RGB',(tile,tile),(174,)*3);d=ImageDraw.Draw(im)
  for i in range(440):
   a=i*math.tau/440;r=random.randint(30,100);c=random.randint(140,250)
   d.line((128+math.cos(a)*r,128+math.sin(a)*r,128+math.cos(a)*124,128+math.sin(a)*124),fill=(c,)*3,width=1)
  h=Image.new('L',(tile,tile),128)
 if t in (12,14):im=Image.new('RGB',(tile,tile),(255,)*3);h=Image.new('L',(tile,tile),128)
 x=(t%4)*tile;y=(t//4)*tile;base.paste(im,(x,y));height.paste(h,(x,y));rv=55 if t in (10,12,14) else 165 if t in (8,11) else 211
 rough.paste(Image.new('RGB',(tile,tile),(rv,rv,rv)),(x,y))
normal=Image.new('RGB',(size,size),(128,128,255));np=normal.load();hp=height.filter(ImageFilter.GaussianBlur(.65)).load()
for y in range(1,size-1):
 for x in range(1,size-1):
  dx=(hp[x-1,y]-hp[x+1,y])*.8;dy=(hp[x,y-1]-hp[x,y+1])*.8;length=math.sqrt(dx*dx+dy*dy+64*64)
  np[x,y]=(int(128+127*dx/length),int(128+127*dy/length),int(128+127*64/length))
base.save(OUT/'coats.png');normal.save(OUT/'coats-normal.png');rough.resize((512,512),Image.Resampling.LANCZOS).save(OUT/'coats-rough.png')
# Prepare the existing pavilion maps for one fewer material and an emission atlas.
tex=ROOT/'public/lot/textures';garden=Image.open(tex/'garden-atlas-1024.png').convert('RGB');garden.paste(Image.new('RGB',(256,512),'#fff0cb'),(768,512));garden.save(tex/'garden-atlas-1024.png')
emission=Image.new('RGB',(256,256));emission.paste(Image.new('RGB',(64,128),'#ffbc64'),(192,128));emission.save(tex/'garden-emission.png')
Image.open(tex/'garden-normal.png').resize((512,512),Image.Resampling.LANCZOS).save(tex/'garden-normal-small.png')
Image.open(tex/'garden-roughness.png').resize((256,256),Image.Resampling.LANCZOS).save(tex/'garden-roughness-small.png')
# Middle-distance geometry shares one combined atlas to stay within two materials.
mid=Image.new('RGB',(512,512));mid.paste(garden.resize((256,512),Image.Resampling.LANCZOS),(0,0));mid.paste(base.resize((256,512),Image.Resampling.LANCZOS),(256,0));mid.save(tex/'garden-atlas-512.png')
print('Original detailed coat/feather/iris albedo, normal and roughness maps created; middle LOD atlas packed.')
