"""Original miniature arcade attraction. Writes public/lot only; never game files."""
import bpy, math, random, json, sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/lot';TEX=OUT/'textures'
sys.path.insert(0,str(ROOT/'scripts'))
from animal_mesh import Character, material as animal_material, animate
PALETTE=['#f29bc4','#b5a0ea','#8fcfee','#f2d589','#9dd4b1']
ACTORS=[];LEVEL=0;MATS={};BOARD_COUNT=0

def rgba(s):
 s=s.lstrip('#');v=[int(s[i:i+2],16)/255 for i in (0,2,4)]
 return tuple(x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in v)+(1,)
def xyz(p):return (p[0],-p[2],p[1])
def image_node(mat,path,noncolor=False):
 im=bpy.data.images.load(str(path),check_existing=True)
 if noncolor:im.colorspace_settings.name='Non-Color'
 im.pack();node=mat.node_tree.nodes.new('ShaderNodeTexImage');node.image=im;return node

def materials(level):
 garden=bpy.data.materials.new('Garden atlas');garden.use_nodes=True;n=garden.node_tree;bs=n.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.7
 color=n.nodes.new('ShaderNodeVertexColor');color.layer_name='GardenColor'
 tex=image_node(garden,TEX/f'garden-atlas-{[1024,512,256][level]}.png');mix=n.nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1;n.links.new(color.outputs['Color'],mix.inputs[1]);n.links.new(tex.outputs['Color'],mix.inputs[2]);n.links.new(mix.outputs[0],bs.inputs['Base Color'])
 if level==0:
  rough=image_node(garden,TEX/'garden-roughness-small.png',True);n.links.new(rough.outputs['Color'],bs.inputs['Roughness'])
  normal=image_node(garden,TEX/'garden-normal-small.png',True);nm=n.nodes.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=.24;n.links.new(normal.outputs['Color'],nm.inputs['Color']);n.links.new(nm.outputs[0],bs.inputs['Normal'])
 if level==0:
  em=image_node(garden,TEX/'garden-emission.png');n.links.new(em.outputs[0],bs.inputs['Emission Color']);bs.inputs['Emission Strength'].default_value=1.0
 result={'garden':garden,'animal':animal_material() if level==0 else garden}
 for name,alpha,roughness,metal in [('Magical bubbles',.96,.13,.22),('Protective soap film',.13,.10,.3),('Warm lantern glow',1,.35,0)]:
  if name=='Warm lantern glow' or level==2 or (level==1 and name!='Magical bubbles'):result[name]=garden;continue
  m=bpy.data.materials.new(name);m.use_nodes=True;nodes=m.node_tree;bs=nodes.nodes.get('Principled BSDF');col=nodes.nodes.new('ShaderNodeVertexColor');col.layer_name='GardenColor';nodes.links.new(col.outputs['Color'],bs.inputs['Base Color']);bs.inputs['Roughness'].default_value=roughness;bs.inputs['Metallic'].default_value=metal;bs.inputs['Alpha'].default_value=alpha
  if alpha<1:m.surface_render_method='DITHERED';m.use_transparency_overlap=False
  if name=='Warm lantern glow':nodes.links.new(col.outputs['Color'],bs.inputs['Emission Color']);bs.inputs['Emission Strength'].default_value=1.1
  result[name]=m
 return result

def finish(obj,color='#ffffff',tile=3,material=None,group='Attraction'):
 if material is not None and material==MATS['Warm lantern glow'] and LEVEL<2:tile=7
 obj.name=group;obj.data.materials.clear();obj.data.materials.append(material or MATS['garden'])
 attr=obj.data.color_attributes.new(name='GardenColor',type='FLOAT_COLOR',domain='CORNER');col=rgba(color)
 for d in attr.data:d.color=col
 uv=obj.data.uv_layers.active
 if uv is None:
  uv=obj.data.uv_layers.new(name='UVMap')
  for poly in obj.data.polygons:
   for li in poly.loop_indices:
    v=obj.data.vertices[obj.data.loops[li].vertex_index].co;uv.data[li].uv=(v.x*.1+.5,v.z*.1+.5)
 # Atlas rows are top-down in the PNG and bottom-up in Blender UV coordinates.
 for d in uv.data:
  u,v=d.uv;d.uv=((tile%4+.025+.95*u)/4,1-(tile//4+.025+.95*(1-v))/2)
 if LEVEL==1:
  for d in uv.data:d.uv.x*=.5
 for p in obj.data.polygons:p.use_smooth=True
 return obj

def orb(p,s,color,tile=3,material=None,group='Attraction',detail=None):
 seg,rings=detail or [(10,6),(7,4),(6,3)][LEVEL]
 bpy.ops.mesh.primitive_uv_sphere_add(segments=seg,ring_count=rings,location=xyz(p));o=bpy.context.object
 if isinstance(s,(float,int)):s=(s,s,s)
 o.scale=(s[0],s[2],s[1]);return finish(o,color,tile,material,group)

def beam(p,s,color='#d5a272',bevel=.10,tile=0,group='Attraction'):
 bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(p));o=bpy.context.object;o.dimensions=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if LEVEL<2 and bevel:
  mod=o.modifiers.new('Rounded timber edges','BEVEL');mod.width=bevel;mod.segments=3 if LEVEL==0 else 1;bpy.ops.object.modifier_apply(modifier=mod.name)
 return finish(o,color,tile,group=group)

def tube(points,r,color='#d6ad87',tile=0,group='Attraction',sides=None,material=None):
 sides=sides or (8 if LEVEL==0 else 5);points=[Vector(xyz(p)) for p in points];verts=[];uvs=[]
 for i,p in enumerate(points):
  tangent=(points[min(i+1,len(points)-1)]-points[max(i-1,0)]).normalized();axis=Vector((0,1,0))
  if abs(tangent.dot(axis))>.98:axis=Vector((1,0,0))
  a=tangent.cross(axis).normalized();b=tangent.cross(a).normalized()
  for j in range(sides):
   ang=j*math.tau/sides;verts.append(p+r*(math.cos(ang)*a+math.sin(ang)*b));uvs.append((j/sides,i/max(1,len(points)-1)))
 faces=[]
 for i in range(len(points)-1):
  for j in range(sides):faces.append((i*sides+j,i*sides+(j+1)%sides,(i+1)*sides+(j+1)%sides,(i+1)*sides+j))
 faces.extend([tuple(reversed(range(sides))),tuple((len(points)-1)*sides+j for j in range(sides))]);mesh=bpy.data.meshes.new('Curved sculpted timber');mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(group,mesh);bpy.context.collection.objects.link(o);uv=mesh.uv_layers.new(name='UVMap')
 for poly in mesh.polygons:
  for li in poly.loop_indices:uv.data[li].uv=uvs[mesh.loops[li].vertex_index]
 return finish(o,color,tile,material,group)

def ring(p,r,color='#fff3f9',group='Attraction',material=None):
 bpy.ops.mesh.primitive_torus_add(major_segments=28 if LEVEL==0 else 12,minor_segments=4 if LEVEL==0 else 3,major_radius=r,minor_radius=.012 if r<1 else .022,location=xyz(p),rotation=(math.pi/2,0,0));return finish(bpy.context.object,color,4,material,group)

def leaf(p,size,color='#add29e',angle=0,group='Attraction'):
 o=orb(p,(size*.38,size,size*.09),color,5,group=group,detail=(6,4));o.rotation_euler.y=angle;return o

def flower(p,size,color='#f7bad5',front=True,group='Attraction'):
 x,y,z=p
 for j in range(5):
  a=j*math.tau/5;pp=(x+math.cos(a)*size*.7,y+math.sin(a)*size*.7,z) if front else (x+math.cos(a)*size*.7,y,z+math.sin(a)*size*.7)
  shape=(size*.58,size*.38,size*.20) if front else (size*.58,size*.20,size*.38)
  o=orb(pp,shape,color,4,group=group,detail=(6,4));o.rotation_euler.y=a if front else 0
 orb((x,y,z+.03) if front else (x,y+.03,z),size*.28,'#f9d78d',4,group=group,detail=(6,3))

def creature(kind,p,scale=1,group='Attraction'):
 return Character(kind,detail=2 if LEVEL==0 else 1).build().object(group,p,scale,MATS['animal'],morphs=LEVEL==0,level=LEVEL)


def text_label(text,p,size,color,group='Attraction'):
 curve=bpy.data.curves.new('Raised original lettering','FONT');curve.body=text;curve.align_x='CENTER';curve.align_y='CENTER';curve.size=size;curve.extrude=.018 if LEVEL==0 else .006;curve.bevel_depth=.008 if LEVEL==0 else 0;curve.bevel_resolution=1;curve.resolution_u=4
 ob=bpy.data.objects.new('Sign lettering',curve);bpy.context.collection.objects.link(ob);ob.location=xyz(p);ob.rotation_euler=(math.pi/2,0,0);bpy.context.view_layer.objects.active=ob;ob.select_set(True);bpy.ops.object.convert(target='MESH');finish(bpy.context.object,color,4,group=group)


def build(level):
 global LEVEL,MATS,ACTORS,BOARD_COUNT
 LEVEL=level;random.seed(3157);ACTORS=[];bpy.ops.wm.read_factory_settings(use_empty=True);MATS=materials(level)
 # Layered island with a raised grass shelf and rounded stone rim, all inside ±6 m.
 orb((0,.42,0),(5.76,.35,5.48),'#d2b3bf',1,detail=(28,10) if level==0 else (16,6) if level==1 else (8,4))
 orb((0,.70,0),(5.61,.38,5.33),'#a1c89d',2,detail=(28,10) if level==0 else (16,6) if level==1 else (8,4))
 orb((0,.88,-.30),(5.20,.30,4.75),'#bad4a1',2,detail=(24,8) if level==0 else (12,6) if level==1 else (8,4))
 if level<2:
  for i in range(12):
   z=4.7-i*.55;x=.22+math.sin(i*.5)*.33
   orb((x,1.10,z),(.40,.10,.33),'#ded7d0' if i%2 else '#eddfcf',1,detail=(10,5) if level==0 else (6,3))
  for i in range(20 if level==0 else 10):
   a=i*math.tau/(20 if level==0 else 10);orb((math.sin(a)*5.25,.76,math.cos(a)*4.95),(.39,.25,.35),'#cebfc7',1,detail=(8,4) if level==0 else (6,3))
 # Two matching curved arches and four dimensional posts make a real pavilion.
 for z in (-2.75,-.80):
  for x in (-4.40,4.40):
   beam((x,4.95,z),(.42,7.9,.46),bevel=.10)
   beam((x,1.20,z),(.72,.32,.77),'#d9c9c5',.10,1)
   beam((x,8.73,z),(.66,.26,.68),'#e4bc87',.06)
   if level<2:orb((x,9.08,z),.27,'#dcae77',0,detail=(10,6))
  segments=22 if level==0 else 12 if level==1 else 7
  arch=[(-4.62+9.24*i/segments,9.16+1.00*math.sin(math.pi*i/segments),z) for i in range(segments+1)]
  tube(arch,.23,'#d9a272',0,sides=10 if level==0 else 6)
 for x in (-4.40,4.40):tube([(x,9.05,-2.92),(x,9.05,-.58)],.18,'#bb895e',0)
 # A visibly thick inset board. Its darker backdrop makes pastels legible in a white city.
 beam((0,6.16,-1.85),(8.22,6.0,.22),'#766b99',.12,1)
 for yy in (3.13,9.18):beam((0,yy,-1.58),(8.40,.20,.23),'#b88a6b',.07)
 if level<2:
  for r in range(17):
   for c in range(25-r%2):
    x=(c-(12 if r%2==0 else 11.5))*.32;y=8.72-r*math.sqrt(3)*.16
    if r>=9 and random.random()>.83-(r-9)*.06:continue
    if any(math.hypot(x-xx,y-4.72)<.83 for xx in (-2.25,2.28)):continue
    color=PALETTE[random.randrange(5)]
    if level==0:BOARD_COUNT+=1
    orb((x,y,-1.51),.16,color,4,MATS['Magical bubbles'],'Board bubbles',detail=(10,5) if level==0 else (7,4))
    if level==0:orb((x-.043,y+.058,-1.365),(.023,.039,.012),'#fff5ff',4,MATS['Warm lantern glow'],detail=(6,4))
 else:
  # The far silhouette alone bakes small board detail into our own atlas.
  plate=beam((0,6.16,-1.67),(8.0,5.68,.03),'#ffffff',0,7)
 # A carved timber title with raised 3D letters.
 if level<2:
  beam((0,10.14,-.35),(6.6,1.42,.26),'#bd8f69',.18)
  text_label('Bubble Critter',(0,10.45,-.175),.56,'#fff0ce');text_label('Garden',(0,9.87,-.175),.64,'#ffd0e5')
 # Flowering vines climb the posts and trail around the curved front arch.
 if level<2:
  for side in (-1,1):
   pts=[]
   for i in range(20 if level==0 else 10):
    yy=1.3+i*(7.8/(19 if level==0 else 9));xx=side*4.4+math.sin(i*.9)*.19;pts.append((xx,yy,-.49))
    if level==0 or i%2==0:
     leaf((xx+side*.14,yy,-.37),.19,'#9fc58d',side*.7)
     if i%4==1:flower((xx,yy,-.30),.24,PALETTE[(i//4)%5])
   tube(pts,.045,'#a1ba7a',5,sides=6)
  for i in range(15 if level==0 else 7):
   x=-4.4+i*(8.8/(14 if level==0 else 6));yy=9.18+.95*math.sin(math.pi*(x+4.6)/9.2)
   leaf((x,yy-.13,-.47),.23,'#a9cc94',math.sin(i))
   if i%3==0:flower((x,yy,-.43),.25,'#f6bfd4')
 # Warm lanterns sit outside the board's outline, avoiding the bubbles.
 if level<2:
  for side in (-1,1):
   x=side*4.14;y=6.2
   tube([(side*4.4,7.3,-.55),(x,7.25,-.04),(x,y+.48,-.04)],.035,'#b98956',0,sides=6)
   orb((x,y,-.04),(.19,.34,.18),'#ffdc9c',4,MATS['Warm lantern glow'],detail=(12,8) if level==0 else (7,4))
   for yy in (y-.34,y+.34):beam((x,yy,-.04),(.43,.10,.40),'#be9259',.04)
   for dx in (-.15,.15):tube([(x+dx,y-.34,.08),(x+dx,y+.34,.08)],.022,'#cfa56c',0,sides=5)
 # The cherry tree is behind and beside the board, never in front of its main rows.
 tree=(-4.55,1.0,.30)
 tube([tree,(-4.65,2.7,.30),(-4.30,4.40,.30)],.20,'#b98e77',0)
 for side in (-1,1):tube([(-4.52,2.5,.30),(-4.55+side*.65,3.8,.30)],.11,'#bf9581',0)
 crowns=[(-4.55,4.7,.30,.98),(-5.12,4.2,.43,.67),(-3.68,4.45,.30,.82),(-4.4,5.27,.33,.74)]
 for i,(x,y,z,r) in enumerate(crowns):orb((x,y,z),(r,r*.72,r*.78),['#f6bfdb','#edbad6','#f9d2df','#e3b8d3'][i],4,detail=(14,8) if level==0 else (8,5) if level==1 else (6,3))
 if level==0:
  for i in range(20):
   x=-4.5+random.uniform(-.9,.9);y=4.7+random.uniform(-.55,.65);flower((x,y,.94),.13,'#fff1df')
 # Textured shrubs, clover, flowers, stones and grass cover the island's edges.
 if level<2:
  for i in range(14 if level==0 else 7):
   a=i*math.tau/(14 if level==0 else 7);x=math.sin(a)*4.7;z=math.cos(a)*4.3
   orb((x,1.13,z),(.53,.40,.48),'#a2c79c' if i%2 else '#bdd6a2',5,detail=(10,5) if level==0 else (7,4))
   if level==0:
    for j in range(3):leaf((x+(j-1)*.19,1.34,z+.18),.21,'#9bc894',.4*(j-1))
    flower((x,1.44,z+.3),.15,PALETTE[(i+1)%5])
  for i in range(45 if level==0 else 10):
   x=random.uniform(-4.9,4.9);z=random.uniform(-4.4,4.4)
   if x*x/26+z*z/23>.90 or abs(x)<.6:continue
   if level==0 and i%2:
    for j in range(3):
     a=j*math.tau/3;orb((x+math.cos(a)*.07,1.12,z+math.sin(a)*.07),(.075,.025,.07),'#a7cf9d',5,detail=(6,3))
   else:leaf((x,1.20,z),.18,'#94be8c',random.uniform(-.6,.6))
 # A compact stone spring and a real shaped waterfall on the right-hand side.
 if level<2:
  orb((4.35,1.12,1.0),(.85,.12,.72),'#b3e0df',6,detail=(16,7) if level==0 else (8,4))
  for i,(x,y,z) in enumerate([(4.9,1.4,-.12),(4.45,1.75,-.12),(4.8,2.05,-.4)]):orb((x,y,z),(.49,.47,.42),'#c9bec9',1,detail=(12,6) if level==0 else (7,4))
  for k in range(3):tube([(4.55+k*.12,2.23,-.07),(4.55+k*.12,1.86,.09),(4.47+k*.12,1.4,.36),(4.45+k*.12,1.24,.70)],.10,'#a9dfe3',6,sides=7)
  if level==0:
   for i in range(8):orb((4.45+random.uniform(-.3,.4),1.30+random.uniform(0,.2),.6+random.uniform(-.15,.3)),(.025,.045,.025),'#f3fded',6,MATS['Warm lantern glow'],detail=(6,3))
 # Rescued animals are exterior decoration, not the game's earned progression.
 animals=[(kind,name,(-3.9+i*1.3,1.58,3.0)) for i,(kind,name) in enumerate([('bunny','Mochi'),('fox','Clementine'),('kitten','Clover'),('bird','Pip'),('deer','Fern'),('bear','Maple'),('axolotl','Petal')])]
 for kind,name,p in animals:
  group=name if level==0 else 'Attraction'
  if level<2:creature(kind,p,.60 if kind!='bird' else .66,group)
  else:
   for pp,ss in [((p[0],1.48,p[2]),(.30,.34,.25)),((p[0],1.86,p[2]),(.35,.32,.28))]:orb(pp,ss,{'bunny':'#fff6f1','fox':'#f3b078','kitten':'#c0b0dd','bird':'#91d2e9','deer':'#cf9e73','bear':'#e7c69f','axolotl':'#f4a8cd'}[kind],3,detail=(6,3))
  if level==0:ACTORS.append({'node':name,'position':p,'amplitude':.016})
 # Two purely decorative protective bubbles near the board, with actual creatures inside.
 if level<2:
  for kind,name,p in [('bunny','BubbleMochi',(-2.25,4.72,-1.06)),('kitten','BubbleClover',(2.28,4.72,-1.04))]:
   group=name if level==0 else 'Attraction';creature(kind,(p[0],p[1]-.13,p[2]),.38,group)
   if level==0:
    orb(p,.65,'#dae9f3',4,MATS['Protective soap film'],'BubbleShells',detail=(24,14));ring(p,.64,'#eddef5','BubbleShells')
    for j in range(4):
     a=math.radians(110+j*8);orb((p[0]+math.cos(a)*.54,p[1]+math.sin(a)*.54,p[2]+.35),(.022,.045,.014),'#fff5fa',4,group='BubbleShells',detail=(6,4))
    ACTORS.append({'node':name,'position':p,'amplitude':.045})
 # Flower launcher belongs only to this exterior attraction, never the game entry.
 if level<2:
  beam((0,1.30,1.08),(.85,.24,.7),'#cda572',.12)
  for layer in range(2):
   for j in range(7):
    a=j*math.tau/7+layer*.3;r=.33+layer*.13;o=orb((math.cos(a)*r,1.90+math.sin(a)*r,1.12-layer*.12),(.25,.16,.09),'#f8d2e1' if layer==0 else '#ffe2a2',4,detail=(10,5) if level==0 else (6,3));o.rotation_euler.y=a
  orb((0,1.90,1.24),.28,'#efa9d0',4,MATS['Magical bubbles'],'Board bubbles',detail=(16,10) if level==0 else (8,5))
  if level==0:orb((-.08,2.0,1.48),(.045,.06,.012),'#fff6ff',4,MATS['Warm lantern glow'],detail=(8,4))
 # Sculpted butterflies: four folded wings and a little body, in one animated group.
 if level==0:
  for i,(x,y,z) in enumerate([(-3.4,3.0,1.7),(3.3,3.1,1.6),(1.5,8.9,-.5)]):
   for side in (-1,1):
    o=orb((x+side*.11,y+.055,z),(.14,.11,.035),PALETTE[i],4,group='Butterflies',detail=(8,4));o.rotation_euler.z=side*.45
    orb((x+side*.07,y-.08,z),(.09,.08,.028),'#ffe7ad',4,group='Butterflies',detail=(6,4))
   orb((x,y,z+.025),(.025,.13,.025),'#986b86',3,group='Butterflies',detail=(6,4))
  ACTORS.append({'node':'Butterflies','position':[0,0,0],'amplitude':.075})
 # Merge by actor first, preserving named origins and a small number of primitives.
 names=['Attraction','Board bubbles','Butterflies','BubbleShells']+[a['node'] for a in ACTORS if a['node']!='Butterflies'] if level==0 else ['Everything']
 for name in names:
  objects=[o for o in bpy.context.scene.objects if o.type=='MESH' and (name=='Everything' or o.name==name or o.name.startswith(name+'.'))]
  if not objects:continue
  bpy.ops.object.select_all(action='DESELECT')
  for o in objects:o.select_set(True)
  bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();o=bpy.context.object;o.name=name;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
  mats=[];mapping=[]
  for m in o.data.materials:
   if m not in mats:mats.append(m)
   mapping.append(mats.index(m))
  remap=[mapping[p.material_index] for p in o.data.polygons];o.data.materials.clear()
  for m in mats:o.data.materials.append(m)
  for p,mi in zip(o.data.polygons,remap):p.material_index=mi
  actor=next((a for a in ACTORS if a['node']==name),None);bpy.context.scene.cursor.location=xyz(actor['position']) if actor else (0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
  tris=sum(len(p.vertices)-2 for p in o.data.polygons)
  target=9200 if level==1 else 940 if level==2 else None
  if target and tris>target:
   mod=o.modifiers.new('Authored distance simplification','DECIMATE');mod.ratio=target/tris;bpy.ops.object.modifier_apply(modifier=mod.name)
 # Preserve separate actors and materials while fitting close-view mesh density.
 if level==0:
  objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
  total=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objects)
  fixed=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objects if o.data.shape_keys or o.name=='Board bubbles')
  if total>68000:
   ratio=max(.12,(68000-fixed)/(total-fixed))
   for o in objects:
    if o.data.shape_keys or o.name=='Board bubbles':continue
    bpy.context.view_layer.objects.active=o
    mod=o.modifiers.new('Close view topology optimization','DECIMATE');mod.ratio=ratio
    bpy.ops.object.modifier_apply(modifier=mod.name)
 # Hard geometry budget before exporting; no game package is touched here.
 tris=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in bpy.context.scene.objects if o.type=='MESH');print(f'Exterior LOD{level}: {tris} triangles')
 assert tris<=[70000,10000,1000][level],f'LOD{level} too dense: {tris}'
 if level==0:
  bpy.context.scene.frame_start=0;bpy.context.scene.frame_end=192;bpy.context.scene.render.fps=24
  animate([o for o in bpy.context.scene.objects if o.type=='MESH' and o.data.shape_keys])
 bpy.ops.export_scene.gltf(filepath=str(OUT/f'lod{level}.glb'),export_format='GLB',export_yup=True,export_extras=False,export_animations=level==0,export_animation_mode='SCENE',export_anim_scene_split_object=False,export_morph_normal=False,export_cameras=False,export_lights=False,export_draco_mesh_compression_enable=False)
 if level==0:(OUT/'exterior-motion.json').write_text(json.dumps(ACTORS,indent=2))

for level in range(3):build(level)
import runpy
runpy.run_path(str(ROOT/'scripts/fix-exterior-colors.py'),run_name='__main__')
runpy.run_path(str(ROOT/'scripts/add-animal-clips.py'),run_name='__main__')
(OUT/'garden.json').write_text(json.dumps({'lot':3157,'dimensions':[12,19,12],'design':'Miniature magical arcade pavilion','board':{'columns':[25,24],'rows':17,'radius':.16,'colors':PALETTE,'realSpheres':BOARD_COUNT},'animals':[{'kind':k,'name':n,'position':[-3.9+i*1.3,1.58,3.0],'radius':.63} for i,(k,n) in enumerate([('bunny','Mochi'),('fox','Clementine'),('kitten','Clover'),('bird','Pip'),('deer','Fern'),('bear','Maple'),('axolotl','Petal')])],'decorativeAnimalBubbles':2,'maxHeight':11.0},indent=2))
(OUT/'manifest.json').write_text(json.dumps({'name':'Bubble Critter Garden','description':'A miniature magical arcade pavilion: a glossy pastel hex-bubble board under curved textured timber, flowered vines and warm lanterns. Seven animated textured critters welcome visitors onto a layered garden island with a cherry tree, stone path, clover, butterflies, a small waterfall and a flower bubble launcher. Enter to play the full bubble shooter.','credits':[{'work':'Original pavilion, creatures, procedural PBR atlases and geometry','by':'Garden Pop'}]},indent=2))
(OUT/'lot.json').write_text(json.dumps({'materials':{'Garden atlas':{'glow':.45}},'script':'build.js'},indent=2))
actors=json.loads((OUT/'exterior-motion.json').read_text())
script='// Decorative exterior motion only; the playable game has separate rules.\nconst actors='+json.dumps(actors,indent=2)+';\nexport default function build(b){\n b.play("GardenIdle",{loop:true,at:b.time%8});\n let until=0,active=null;\n const react=(clip)=>{b.stop("GardenIdle",{fade:.1});if(active)b.stop(active,{fade:.1});active=clip;b.play(clip,{loop:false,fade:.1});until=b.time+1.6;};\n b.on("tap",()=>react("GardenShock"));b.on("enter",()=>react("GardenSmile"));b.on("leave",()=>react("GardenSad"));\n b.loop((dt,time)=>{\n  if(active&&time>=until){b.stop(active,{fade:.15});active=null;b.play("GardenIdle",{loop:true,fade:.15,at:time%8});}\n  actors.forEach((a,i)=>{const p=a.position;b.node(a.node,{position:[p[0],p[1]+Math.sin(time*.9+i)*a.amplitude,p[2]]});});\n });\n}\n'
(OUT/'build.js').write_text(script)
print('Exterior only: three LODs, embedded textures, manifest and gentle decorative motion exported.')
