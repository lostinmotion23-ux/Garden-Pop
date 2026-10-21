"""Original procedural garden models. Coordinates are metres, +Y up in exports."""
import bpy
import json
import math
import random
import shutil
import sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'lot'
OUT.mkdir(parents=True, exist_ok=True)

sys.path.insert(0,str(ROOT/'scripts'))
from packing import BUBBLES, SOLIDS, SMALL_RADIUS, BIG_RADIUS, ANIMAL_SCALE, BOTTOM, SPAN, ROW_SPACING, DEPTH
TEMPLATE_RADIUS = 1.2
PALETTE = ['#edb5d1', '#b4dcd1', '#c5b3e9', '#f3d99f', '#b6d7ee', '#eec2b4']

def rgba(hex_color, alpha=1):
    h = hex_color.lstrip('#')
    # Vertex colours are linear in glTF.
    def linear(c):
        c = int(c, 16) / 255
        return c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4
    return (*[linear(h[i:i+2]) for i in (0, 2, 4)], alpha)

def point(p):
    return (p[0], -p[2], p[1])

def mat(name, alpha=1, roughness=.7):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    colors = m.node_tree.nodes.new('ShaderNodeVertexColor')
    colors.layer_name = 'GardenColor'
    m.node_tree.links.new(colors.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Alpha'].default_value = alpha
    bsdf.inputs['Roughness'].default_value = roughness
    if alpha < 1:
        m.surface_render_method = 'DITHERED'
        m.use_transparency_overlap = False
    return m

def finish(obj, color, material, group='Garden'):
    obj.name = group
    obj.data.materials.clear()
    obj.data.materials.append(material)
    attr = obj.data.color_attributes.new(name='GardenColor', type='FLOAT_COLOR', domain='CORNER')
    for datum in attr.data:
        datum.color = rgba(color)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj

def orb(p, size, color, material=None, group='Garden', detail=None):
    segments, rings = detail or DETAILS
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=point(p))
    obj = bpy.context.object
    if isinstance(size, (int, float)):
        size = (size, size, size)
    obj.scale = (size[0], size[2], size[1])
    return finish(obj, color, material or OPAQUE, group)

def stick(a, b, radius, color, group='Garden'):
    aa, bb = Vector(point(a)), Vector(point(b))
    direction = bb-aa
    bpy.ops.mesh.primitive_cone_add(vertices=8 if LEVEL < 2 else 5, radius1=radius, radius2=radius*.72, depth=direction.length, location=(aa+bb)*.5)
    obj = bpy.context.object
    obj.rotation_euler = direction.to_track_quat('Z', 'Y').to_euler()
    return finish(obj, color, OPAQUE, group)

def ring(p, radius, color, material=None, group='Garden', tilt=0):
    bpy.ops.mesh.primitive_torus_add(major_segments=36 if LEVEL == 0 else 16, minor_segments=5 if LEVEL == 0 else 3, major_radius=radius, minor_radius=.016 if radius > .4 else .011, location=point(p), rotation=(math.pi/2+tilt, 0, 0))
    return finish(bpy.context.object, color, material or OPAQUE, group)

def animal(spec):
    x, y, z = spec['position']
    c = spec['color']
    g = spec['name']
    # Every face looks towards +Z, with soft, toy-like proportions.
    orb((x,y-.40,z), (.40,.42,.32), c, group=g)
    orb((x,y+.14,z+.04), (.53,.47,.43), c, group=g)
    orb((x,y-.41,z+.29), (.26,.27,.06), '#fff7e9', group=g)
    for side in (-1, 1):
        orb((x+side*.34,y-.65,z+.19), (.22,.16,.23), c, group=g)
        orb((x+side*.43,y-.30,z+.05), (.17,.23,.18), c, group=g)
        if spec['kind'] == 'bunny':
            orb((x+side*.23,y+.72,z), (.145,.49,.14), c, group=g)
            if LEVEL == 0:
                orb((x+side*.23,y+.73,z+.125), (.073,.32,.025), '#f5a8c7', group=g)
        elif spec['kind'] == 'bear':
            orb((x+side*.39,y+.51,z), .21, c, group=g)
            if LEVEL == 0:
                orb((x+side*.39,y+.51,z+.16), (.11,.11,.025), '#eebcb0', group=g)
        elif spec['kind'] == 'kitten':
            ear = orb((x+side*.36,y+.54,z), (.21,.31,.15), c, group=g)
            ear.rotation_euler.y = side*-.28
            if LEVEL == 0:
                orb((x+side*.36,y+.56,z+.14), (.10,.17,.025), '#f4b9d6', group=g)
        else:
            ear = orb((x+side*.48,y+.17,z), (.20,.39,.18), '#e8bd9e', group=g)
            ear.rotation_euler.y = side*.22
        if LEVEL == 0:
            orb((x+side*.30,y+.02,z+.425), (.105,.055,.018), '#f8a9c2', group=g)
        orb((x+side*.18,y+.18,z+.447), (.047,.065,.023), '#534153', group=g)
        if LEVEL == 0:
            orb((x+side*.17-.010,y+.202,z+.469), .013, '#ffffff', group=g, detail=(8,4))
    orb((x,y+.055,z+.474), (.042,.031,.018), '#bc8093', group=g)
    if LEVEL == 0:
        # A tiny w-shaped smile, made from two curved polylines.
        for side in (-1,1):
            points = [(x,y+.025,z+.472),(x+side*.035,y-.012,z+.475),(x+side*.075,y+.006,z+.47)]
            for a,b in zip(points,points[1:]):
                stick(a,b,.009,'#8e647c',g)

def flower(x,y,z,color,scale=1):
    orb((x,y,z), (.065*scale,.06*scale,.065*scale), '#ffe8a4', detail=(8,4))
    for i in range(5):
        t = i*math.tau/5
        orb((x+math.cos(t)*.10*scale,y+.01,z+math.sin(t)*.10*scale), (.08*scale,.035*scale,.08*scale), color, detail=(8,4))

def build(level):
    global LEVEL, DETAILS, OPAQUE, GLASS, CLOUD
    LEVEL = level
    DETAILS = [(12,8),(10,6),(6,4)][level]
    random.seed(3157)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    OPAQUE = mat('Marshmallow palette')
    GLASS = mat('Soap film', .065 if level < 2 else 1, .12) if level < 2 else OPAQUE
    CLOUD = mat('Cloud whisper', .12, 1) if level == 0 else GLASS

    # Rounded garden island, with a pink macaron edge and mint turf.
    orb((0,.40,0), (5.55,.38,5.2), '#e5bad5')
    orb((0,.64,0), (5.43,.32,5.10), '#c8e8c5')
    if level < 2:
        # A ribbon of little stepping stones wandering into the garden.
        for i in range(9):
            z = 4.2-i*.61
            x = .65*math.sin(i*.7)+.6
            orb((x,.93,z), (.35,.075,.26), '#f9edda', detail=(12,6))

    # Exactly one tree: curved trunk, little branches, and a cloud-like pink crown.
    stick((-2.8,.82,-1.3),(-2.95,2.65,-1.3),.29,'#cda997')
    stick((-2.95,2.65,-1.3),(-2.55,4.4,-1.3),.22,'#cda997')
    stick((-2.9,2.5,-1.3),(-4,3.6,-1.1),.16,'#cda997')
    stick((-2.75,3.1,-1.3),(-1.35,3.9,-1.55),.14,'#cda997')
    crowns = [(-3.9,4.25,-1.2,1.25),(-2.75,5.0,-1.5,1.55),(-1.45,4.4,-1.4,1.25),(-2.8,4.25,-.35,1.2),(-3.4,4.5,-2.4,1.0)]
    for i,(x,y,z,r) in enumerate(crowns):
        orb((x,y,z),(r,r*.82,r*.83),['#ffcddd','#f9d9e8','#e4d0ed'][i%3])
    if level == 0:
        # Sparse blossoms; enough texture without visual noise.
        for _ in range(20):
            t=random.random()*math.tau
            rr=random.uniform(.5,1.9)
            flower(-2.8+math.cos(t)*rr,4.65+random.uniform(-.5,.5),-1.3+math.sin(t)*rr,'#fff5e2',.65)

    # Low shrubs ringing the meadow. No other tree trunks.
    shrubs = [(-4.1,2.8),(3.8,2.8),(4.0,-1.5),(1.6,-3.7),(-3.6,-3.3)]
    for k,(x,z) in enumerate(shrubs):
        for i in range(3 if level < 2 else 1):
            orb((x+(i-1)*.43,1.10+(.18 if i==1 else 0),z),(.65,.60,.56),['#a8d8bc','#b9dfc0','#a8d7cc'][k%3])

    if level < 2:
        for _ in range(70 if level==0 else 20):
            x,z=random.uniform(-4.7,4.7),random.uniform(-4.1,4.1)
            if x*x/25+z*z/20 > .87: continue
            if abs(x-(.65*math.sin((4.2-z)/.61*.7)+.6))<.48: continue
            for dx in (-.055,.055):
                stick((x,.85,z),(x+dx*2,1.10+random.random()*.18,z+.035),.025,'#8ac5a3')
        for _ in range(26 if level==0 else 8):
            x,z=random.uniform(-4.6,4.6),random.uniform(-4.0,4)
            if x*x/25+z*z/20 < .85:
                flower(x,.99,z,random.choice(['#fff4da','#f6c5df','#d6c7f2']),random.uniform(.8,1.25))

    # Every circle is tangent to its neighbours, including the animal bubbles.
    solid = mat('Pastel bubbles', 1, .35) if level == 0 else OPAQUE
    if level == 0:
        # Retain UVs through city optimisation, storing each exact bubble centre.
        image=bpy.data.images.new('Packed bubble centres',width=1,height=1,alpha=False)
        image.colorspace_settings.name='Non-Color'
        image.pixels=[.35,.35,.35,1]
        image.pack()
        tex=solid.node_tree.nodes.new('ShaderNodeTexImage')
        tex.image=image
        solid.node_tree.links.new(tex.outputs['Color'],solid.node_tree.nodes.get('Principled BSDF').inputs['Roughness'])
    if level < 2:
        for index,circle in enumerate(SOLIDS):
            p=(circle['x'],circle['y'],circle['z'])
            obj=orb(p,SMALL_RADIUS,PALETTE[(index*3+index//2)%len(PALETTE)],solid,'Solid bubbles',detail=(12,6) if level==0 else (8,4))
            if level==0:
                for uv in obj.data.uv_layers.active.data: uv.uv=((p[0]+3)/6,1-(p[1]-BOTTOM)/SPAN)

    for spec in BUBBLES:
        p=spec['position']
        if level < 2:
            animal(spec)
            orb(p,TEMPLATE_RADIUS,'#d4eff3',GLASS,spec['name'],detail=(24,12) if level==0 else (16,8))
            ring(p,TEMPLATE_RADIUS,'#e6d5f3',group=spec['name'])
            if level==0:
                # A delicate second rainbow rim and a soft white reflection.
                ring((p[0],p[1],p[2]-.08),TEMPLATE_RADIUS*.975,'#c0e7e5',group=spec['name'],tilt=.20)
                for j in range(5):
                    angle=math.radians(112+j*7)
                    orb((p[0]+math.cos(angle)*.93,p[1]+math.sin(angle)*.93,p[2]+.76),(.045,.07,.025),'#ffffff',group=spec['name'],detail=(8,4))
            centre=Vector(point(p))
            for obj in bpy.context.scene.objects:
                if obj.type=='MESH' and (obj.name==spec['name'] or obj.name.startswith(spec['name']+'.')):
                    obj.location=centre+(obj.location-centre)*ANIMAL_SCALE
                    obj.scale*=ANIMAL_SCALE
        else:
            orb(p,BIG_RADIUS,'#e1d9ef',group='Garden')

    if level==0:
        for cx,cy,cz in [(-1.4,12.2,-3.4),(3.5,11.9,-3.6)]:
            for dx,dy,r in [(-.75,0,.55),(0,.15,.75),(.75,0,.55)]:
                orb((cx+dx,cy+dy,cz),(r,r*.5,r*.50),'#fff9fe',CLOUD,'Clouds')

    # Each animal uses two primitives; meadow, solid bubbles, and clouds share draws.
    if level == 0:
        groups = ['Garden','Solid bubbles','Clouds']+[s['name'] for s in BUBBLES]
    else:
        groups = ['Everything']
    for group in groups:
        objects=[o for o in bpy.context.scene.objects if o.type=='MESH' and (group=='Everything' or o.name==group or o.name.startswith(group+'.'))]
        if not objects: continue
        bpy.ops.object.select_all(action='DESELECT')
        for o in objects: o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        bpy.ops.object.join()
        obj=bpy.context.object
        obj.name=group
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        # Remove repeated slots: glTF primitives are grouped by material.
        materials=[]
        indices=[]
        for m in obj.data.materials:
            if m not in materials: materials.append(m)
            indices.append(materials.index(m))
        remap=[indices[p.material_index] for p in obj.data.polygons]
        obj.data.materials.clear()
        for m in materials: obj.data.materials.append(m)
        for p,idx in zip(obj.data.polygons,remap): p.material_index=idx
        # Stable bubble-centre origins let the same motion drive city and experience.
        animal_spec = next((a for a in BUBBLES if a['name'] == group), None)
        bpy.context.scene.cursor.location = point(animal_spec['position']) if animal_spec else (0,0,0)
        bpy.ops.object.origin_set(type='ORIGIN_CURSOR')

    # Simplify the already authored middle/far versions to leave budget headroom.
    if level in (1, 2):
        obj=next(o for o in bpy.context.scene.objects if o.type=='MESH')
        modifier=obj.modifiers.new('Distant silhouette','DECIMATE')
        tris=sum(len(p.vertices)-2 for p in obj.data.polygons)
        modifier.ratio=min(1,(9200 if level==1 else 940)/tris)
        bpy.context.view_layer.objects.active=obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)

    bpy.ops.export_scene.gltf(filepath=str(OUT/f'lod{level}.glb'),export_format='GLB',export_yup=True,export_extras=False,export_animations=False,export_cameras=False,export_lights=False,export_draco_mesh_compression_enable=False)

for level in range(3):
    build(level)

experience_assets = ROOT / 'public' / 'experience' / 'assets'
experience_assets.mkdir(parents=True, exist_ok=True)
shutil.copyfile(OUT / 'lod0.glb', experience_assets / 'garden.glb')

(OUT/'garden.json').write_text(json.dumps({'lot':3157,'dimensions':[12,19,12],'smallBubbleRadius':SMALL_RADIUS,'largeBubbleRadius':BIG_RADIUS,'animals':BUBBLES},indent=2))
(OUT/'manifest.json').write_text(json.dumps({'name':'Garden Pop','description':'A tiny pastel sanctuary. One miniature baby bunny nestles in a small bubble among touching pastel bubbles. The bubbles drift very slowly toward a flower-filled meadow and one candyfloss tree. Enter for a private garden sky, away from the city.','credits':[{'work':'Garden Pop original procedural models','by':'Garden Pop'}]},indent=2))

layout={'smallRadius':SMALL_RADIUS,'largeRadius':BIG_RADIUS,'animals':BUBBLES,'solids':SOLIDS,'motion':{'rowSeconds':45,'spacing':ROW_SPACING,'bottom':BOTTOM,'span':SPAN,'depth':DEPTH}}
layout_source='// Original tangent packing from scripts/packing.py.\nexport const LAYOUT = '+json.dumps(layout,indent=2)+';\n'
(ROOT/'src/scene/layout.js').write_text(layout_source)
(ROOT/'public/experience/layout.js').write_text(layout_source)
(OUT/'rows.glsl').write_text(f'''// Constant UVs store each packed bubble's exact original centre.
vec3 p0Vertex(vec3 position, vec3 normal, vec2 uv) {{
  vec3 centre=vec3(uv.x*6.0-3.0,{BOTTOM:.12f}+uv.y*{SPAN:.12f},{DEPTH:.12f});
  float y={BOTTOM:.12f}+mod(centre.y-{BOTTOM:.12f}-rowTime*{ROW_SPACING/45:.12f},{SPAN:.12f});
  float scale=smoothstep(0.0,{SMALL_RADIUS*1.15:.12f},y-{BOTTOM:.12f})*smoothstep(0.0,{SMALL_RADIUS*1.15:.12f},{BOTTOM+SPAN:.12f}-y);
  return vec3(centre.x,y,centre.z)+(position-centre)*scale;
}}
''')

# Keep the exact same readable motion rules in the city build and experience.
flow_source = '\n'.join(line for line in (ROOT/'src/scene/flow.js').read_text().splitlines() if not line.startswith('import ')).replace('export ', '')
city_script = '''
export default function build(b) {
  let origin;
  b.loop((dt, time) => {
    if (origin === undefined) origin = time;
    const elapsed = time-origin;
    b.uniform('rowTime', elapsed);
    for (const friend of FRIENDS) {
      const pose = animalState(friend, elapsed);
      b.node(friend.name, { position: [pose.x,pose.y,pose.z], scale: [pose.scale,pose.scale,pose.scale] });
    }
  });
}
'''
(OUT/'build.js').write_text(layout_source.replace('export ','')+flow_source+city_script)
print('Garden Pop: three authored LODs exported.')
