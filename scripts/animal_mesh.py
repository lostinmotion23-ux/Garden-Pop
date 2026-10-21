"""Original UV-mapped sculpted mesh characters with five genuine facial/idle morphs."""
import bpy,math,random
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
KINDS=['bunny','fox','kitten','bird','deer','bear','puppy','dreamling','axolotl']
COATS={'bunny':'#fff6ef','fox':'#ef9c50','kitten':'#b7adc9','bird':'#6dbbe9','deer':'#ce945d','bear':'#e7c69f','puppy':'#eedac0','dreamling':'#f4a8cd','axolotl':'#f4a8cd'}
TILES={'bunny':0,'fox':1,'kitten':2,'bird':3,'deer':4,'bear':5,'puppy':6,'dreamling':7,'axolotl':7}
POSES=['Blink','Smile','Shock','Sad','Wiggle']
def lin(c):
 a=[int(c[i:i+2],16)/255 for i in (1,3,5)]
 return tuple(x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in a)+(1,)
def xyz(p):return (p[0],-p[2],p[1])
def material(level=0):
 m=bpy.data.materials.get('Critter coats')
 if m:return m
 m=bpy.data.materials.new('Critter coats');m.use_nodes=True;n=m.node_tree;bs=n.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.82;bs.inputs['Specular IOR Level'].default_value=.34
 c=n.nodes.new('ShaderNodeVertexColor');c.layer_name='GardenColor';t=n.nodes.new('ShaderNodeTexImage');t.image=bpy.data.images.load(str(ROOT/'public/animal-art/coats.png'),check_existing=True);t.image.pack();mul=n.nodes.new('ShaderNodeMixRGB');mul.blend_type='MULTIPLY';mul.inputs[0].default_value=1;n.links.new(c.outputs['Color'],mul.inputs[1]);n.links.new(t.outputs['Color'],mul.inputs[2]);n.links.new(mul.outputs[0],bs.inputs['Base Color'])
 for filename,slot in [('coats-rough.png','Roughness'),('coats-normal.png','Normal')]:
  t=n.nodes.new('ShaderNodeTexImage');t.image=bpy.data.images.load(str(ROOT/'public/animal-art'/filename),check_existing=True);t.image.colorspace_settings.name='Non-Color';t.image.pack()
  if slot=='Normal':
   nm=n.nodes.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=.22;n.links.new(t.outputs[0],nm.inputs['Color']);n.links.new(nm.outputs[0],bs.inputs['Normal'])
  else:n.links.new(t.outputs[0],bs.inputs[slot])
 return m
class Character:
 def __init__(self,kind,detail=0):
  self.kind=kind;self.street=detail==2;self.detail=0 if self.street else detail;self.v=[];self.uv=[];self.colors=[];self.faces=[];self.tags=[];self.coat=COATS[kind];self.tile=TILES[kind];random.seed(220+KINDS.index(kind))
 def vertex(self,p,uv,c,tag):
  self.v.append(p);self.uv.append(uv);self.colors.append(c);self.tags.append(tag);return len(self.v)-1
 def ell(self,p,s,c=None,tile=None,tag='',seg=None,rings=None,tilt=0,sculpt=None):
  c=lin(c or self.coat);tile=self.tile if tile is None else tile;seg=seg or (12 if self.detail==0 else 8);rings=rings or (8 if self.detail==0 else 5)
  if self.street and sculpt!='head':
   seg=min(seg,8 if tag=='eye' else 10);rings=min(rings,4 if tag=='eye' else 5)
  start=len(self.v)
  for j in range(rings+1):
   ph=j*math.pi/rings
   for i in range(seg+1):
    a=i*math.tau/seg;x=math.sin(ph)*math.cos(a);y=math.cos(ph);z=math.sin(ph)*math.sin(a)
    if sculpt=='head':x*=1+.11*max(0,-y);y+=.04*(1-y*y)*max(0,z)
    if sculpt=='body':x*=1-.20*y
    xx=x*s[0];yy=y*s[1];zz=z*s[2]
    xx,yy=xx*math.cos(tilt)-yy*math.sin(tilt),xx*math.sin(tilt)+yy*math.cos(tilt)
    if tag=='mouth':yy+=(abs(xx)/s[0])**2*.035
    # Subtle coat gradients add shape definition independently of the city's lights.
    shade=.88+.12*((y+1)/2) if tile<8 else 1
    color=tuple(v*shade for v in c[:3])+(1,)
    uv=((tile%4+.02+.96*i/seg)/4,1-(tile//4+.02+.96*j/rings)/4)
    self.vertex((p[0]+xx,p[1]+yy,p[2]+zz),uv,color,tag)
  for j in range(rings):
   for i in range(seg):
    a=start+j*(seg+1)+i;b=a+seg+1
    if j>0:self.faces.append((a,a+1,b))
    if j<rings-1:self.faces.append((a+1,b+1,b))
 def curve(self,pts,r,c,tile=14,tag='',sides=5):
  start=len(self.v);color=lin(c)
  for i,p in enumerate(pts):
   tangent=(Vector(pts[min(len(pts)-1,i+1)])-Vector(pts[max(0,i-1)])).normalized();a=tangent.cross(Vector((0,0,1)))
   if a.length<.01:a=tangent.cross(Vector((0,1,0)))
   a.normalize();b=tangent.cross(a).normalized()
   for j in range(sides):
    v=Vector(p)+r*(math.cos(j*math.tau/sides)*a+math.sin(j*math.tau/sides)*b)
    self.vertex(tuple(v),((tile%4+.5)/4,1-(tile//4+.5)/4),color,tag)
  for i in range(len(pts)-1):
   for j in range(sides):
    a=start+i*sides+j;b=start+i*sides+(j+1)%sides;self.faces.extend([(a,b,a+sides),(b,b+sides,a+sides)])
 def build(self):
  k=self.kind;ax=k in ('axolotl','dreamling');bird=k=='bird'
  self.ell((0,-.19,-.02),(.42,.48,.32),sculpt='body')
  self.ell((0,.38,.045),(.60,.50,.43),seg=16 if self.street else 28 if self.detail==0 else 12,rings=10 if self.street else 18 if self.detail==0 else 7,sculpt='head')
  self.ell((0,-.24,.275),(.29,.31,.075),'#fff3dd',13)
  for side in (-1,1):
   self.ell((side*.28,-.53,.16),(.22,.15,.23))
   self.ell((side*.40,-.16,.14),(.14,.23,.16),tilt=-side*.22)
   # Three readable little toes, and paw pads on the forward-facing feet.
   if self.detail==0:
    for toe in range(3):self.ell((side*.28+(toe-1)*.072,-.57,.35),(.045,.035,.027),'#e4b9b1',8,seg=6,rings=4)
   self.ell((side*.28,.21,.438),(.15,.062,.027),'#eea3b5',8,seg=10,rings=6)
   self.ell((side*.12,.17,.455),(.17,.12,.09),'#fff8ec',13)
   # Actual eyelids, irises, pupils and catchlight meshes. All share one PBR atlas.
   ex=side*.236;ey=.465
   self.ell((ex,ey,.455),(.113,.138,.059),'#6b4a59',14,'eye',seg=10,rings=6)
   self.ell((ex,ey+.006,.491),(.102,.124,.044),'#3d2b39',12,'eye',seg=10,rings=6)
   self.ell((ex-side*.009,ey,.526),(.091,.114,.032),'#8c5745' if k!='kitten' else '#746087',10,'eye',seg=10,rings=6)
   self.ell((ex-side*.009,ey+.006,.550),(.058,.082,.018),'#302533',14,'eye',seg=10,rings=7)
   self.ell((ex-.025,ey+.044,.565),(.025,.031,.012),'#fffdf7',12,'eye',seg=8,rings=5)
   self.ell((ex+.029,ey-.038,.564),(.011,.014,.008),'#fff2e8',12,'eye',seg=6,rings=4)
   pts=[(ex+side*(j/4-.5)*.14,.647+math.sin(j*math.pi/4)*.018,.433) for j in range(5)]
   self.curve(pts,.012,'#987381',14,'brow')
   if k=='bunny':
    self.ell((side*.265,1.00,-.01),(.17,.48,.145),tag='ear',tilt=-side*.17,seg=12 if self.street else 18,rings=10 if self.street else 14)
    self.ell((side*.27,1.02,.117),(.092,.34,.031),'#f1a7bf',8,'ear',tilt=-side*.17)
   elif k in ('fox','kitten'):
    # Tapered pointed ears with softened rims and a sculpted inner bowl.
    self.ell((side*.425,.86,-.015),(.205,.32,.14),tag='ear',tilt=-side*.32,sculpt='body',seg=12 if self.street else 18,rings=8 if self.street else 12)
    self.ell((side*.439,.875,.112),(.115,.21,.025),'#e8a9b8',8,'ear',tilt=-side*.32)
   elif k=='deer':
    self.ell((side*.57,.72,-.03),(.28,.13,.13),tag='ear',tilt=side*.50)
    self.ell((side*.59,.73,.075),(.19,.065,.025),'#edb6bf',8,'ear',tilt=side*.5)
    self.curve([(side*.23,.78,-.07),(side*.30,1.00,-.06),(side*.29,1.25,-.09),(side*.40,1.34,-.08)],.045,'#b9814b',5,'ear',sides=12)
    self.curve([(side*.30,1.06,-.07),(side*.49,1.17,-.07),(side*.53,1.29,-.06)],.036,'#c9945e',5,'ear',sides=10)
   elif k=='bear':
    self.ell((side*.45,.81,-.02),(.205,.20,.13),tag='ear')
    self.ell((side*.46,.82,.097),(.12,.12,.035),'#efb6b5',8,'ear')
   elif k=='puppy':self.ell((side*.57,.37,-.005),(.19,.43,.18),'#bb875d',5,'ear',tilt=side*.10)
   elif bird:
    for j in range(4):self.ell((side*(.41+.035*j),-.12-j*.065,-.01-j*.025),(.16,.23,.09),'#92d7ed',3,'wing',tilt=-side*.45,seg=10,rings=6)
   elif ax:
    for j in range(3):
     xx=side*(.58+.08*math.sin(j*1.2));yy=.65-j*.22
     self.curve([(side*.46,yy-.02,0),(xx+.18*side,yy+.1,.0),(xx+.28*side,yy+.13,-.04)],.055,'#e879ad',7,'ear',sides=7)
     for f in range(3):self.ell((xx+side*(.15+f*.045),yy+.10+f*.037,.015),(.065,.16,.035),'#f3a0c4',7,'ear',tilt=-side*.55,seg=7,rings=5)
  if bird:
   self.ell((0,.205,.55),(.12,.075,.14),'#f2bd58',8)
   for s in (-1,1):self.ell((s*.20,-.61,.19),(.14,.055,.16),'#e9b65d',8,seg=10,rings=5)
   for j in range(3):self.ell(((j-1)*.065,.91+(.08 if j==1 else 0),0),(.07,.18,.075),'#8ad1ee',3,'ear',tilt=(j-1)*.2)
  elif ax:self.ell((0,.257,.505),(.035,.021,.020),'#b96087',14)
  else:self.ell((0,.266,.550),(.065,.047,.035),'#965b64',14)
  # Small mouth cavity and tongue are actual dimensional morphing geometry.
  self.ell((0,.12,.547),(.093,.026,.035),'#71404f',14,'mouth',seg=14,rings=8)
  self.ell((0,.106,.575),(.045,.013,.012),'#f39eb7',11,'tongue',seg=10,rings=5)
  if k=='fox':
   self.ell((.48,-.27,-.16),(.22,.42,.23),'#d88b49',1,'tail',tilt=-.65)
   self.ell((.65,-.02,-.17),(.17,.22,.20),'#fff3df',13,'tail',tilt=-.65)
   for s in (-1,1):self.ell((s*.40,.14,.33),(.18,.18,.06),'#fff1d9',13)
  elif k=='kitten':self.curve([(-.28,-.43,-.12),(-.58,-.35,-.08),(-.74,-.10,-.04),(-.69,.15,.015)],.085,'#b2a1c7',2,'tail',sides=10)
  elif bird:
   for j in range(3):self.ell(((j-1)*.11,-.27,-.32),(.11,.13,.28),'#86cbed',3,'tail',tilt=(j-1)*.15)
  elif ax:self.ell((.51,-.32,-.18),(.42,.16,.15),'#efb1d0',7,'tail',tilt=.20)
  else:self.ell((.40,-.37,-.18),(.17,.17,.18),'#fff2de' if k=='bunny' else self.coat,self.tile,'tail')
  # Low silhouette tufts form a sculpted coat, in addition to directional normal detail.
  if self.detail==0 and not ax:
   for side in (-1,1):
    for j in range(5):self.ell((side*(.49+.02*math.sin(j)),.20+j*.061,.12),(.13,.065,.065),tag='fur',tilt=side*(.2+j*.13),seg=7,rings=4)
   for j in range(5):self.ell(((j-2)*.075,-.06-abs(j-2)*.023,.302),(.075,.13,.035),'#fff4e5',13,'fur',tilt=(j-2)*.14,seg=7,rings=4)
  if k=='deer':
   for side in (-1,1):
    for j in range(3):self.ell((side*(.20+j*.10),.77-j*.05,.315),(.031,.035,.012),'#fff1d7',13,seg=7,rings=4)
  # A tiny flower is modeled in layers beside the ear; no billboard accessories.
  for j in range(5):
   a=j*math.tau/5;self.ell((.44+math.cos(a)*.07,.77+math.sin(a)*.07,.24),(.055,.043,.024),'#f4b3cd',15,seg=8,rings=5)
  self.ell((.44,.77,.265),(.031,.031,.021),'#f6d58c',15,seg=8,rings=5)
  return self
 def pose(self,p,tag,name):
  x,y,z=p
  if name=='Blink' and tag=='eye':y=.465+(y-.465)*.055
  if name=='Smile':
   if tag=='mouth':y=.12+(y-.12)*2.6+.018
   if tag=='tongue':y=.099+(y-.106)*2.1
   if tag=='eye':y=.465+(y-.465)*.9
  if name=='Shock':
   if tag=='mouth':y=.12+(y-.12-.035*(abs(x)/.093)**2)*3.8;x*=.62
   if tag=='tongue':x*=.2;y=.08+(y-.106)*.3;z-=.025
   if tag=='eye':y=.465+(y-.465)*1.12
   if tag=='brow':y+=.10
  if name=='Sad':
   if tag=='mouth':y=.12+(y-.12-.035*(abs(x)/.093)**2)*.5+.018-(abs(x)/.093)**2*.040
   if tag=='tongue':z-=.07
   if tag=='eye':y=.455+(y-.465)*.76
   if tag=='brow':y+=.10-abs(x)*.28
   if tag=='ear':x*=1.10;y-=max(0,y-.80)*.24
  if name=='Wiggle':
   if tag=='tail':z+=math.sin((x+.2)*2)*.14
   if tag in ('ear','wing'):x+=.035*y;y+=.035*abs(x)
  return (x,y,z)
 def object(self,name,position=(0,0,0),scale=1,mat=None,morphs=True,level=0):
  mesh=bpy.data.meshes.new(name+' sculpt');verts=[xyz(tuple(position[i]+p[i]*scale for i in range(3))) for p in self.v];mesh.from_pydata(verts,[],self.faces);mesh.update();obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj);mesh.materials.append(mat or material())
  uv=mesh.uv_layers.new(name='UVMap');colors=mesh.color_attributes.new(name='GardenColor',type='FLOAT_COLOR',domain='CORNER');uv=mesh.uv_layers.get('UVMap')
  for poly in mesh.polygons:
   poly.use_smooth=True
   for li in poly.loop_indices:
    vi=mesh.loops[li].vertex_index;u,v=self.uv[vi];uv.data[li].uv=(.5+u*.5,v) if level==1 else (u,v);colors.data[li].color=self.colors[vi]
  if morphs:
   obj.shape_key_add(name='Basis')
   for name in POSES:
    key=obj.shape_key_add(name=name)
    for i,(p,tag) in enumerate(zip(self.v,self.tags)):
     q=self.pose(p,tag,name);key.data[i].co=xyz(tuple(position[j]+q[j]*scale for j in range(3)))
  return obj

def animate(objects):
 # One idle clip animates all meshes, each with a different blink phase.
 for i,obj in enumerate(objects):
  keys=obj.data.shape_keys
  if not keys:continue
  keys.animation_data_create();action=bpy.data.actions.new('GardenIdle' if i==0 else 'GardenIdle');keys.animation_data.action=action
  for f in range(0,193,3):
   t=f/24;phase=(t+i*.51)%4.7;values={'Blink':1 if 1.22<phase<1.40 else 0,'Smile':.18+.15*math.sin(t*1.1+i),'Shock':0,'Sad':0,'Wiggle':math.sin(t*2+i)*.65}
   for name,value in values.items():keys.key_blocks[name].value=value;keys.key_blocks[name].keyframe_insert(data_path='value',frame=f)
  for fc in action.fcurves:
   for k in fc.keyframe_points:k.interpolation='LINEAR'
  for name in POSES:keys.key_blocks[name].value=0
 return objects
