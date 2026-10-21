import bpy,sys,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts'))
from animal_mesh import Character,KINDS,material
bpy.ops.wm.read_factory_settings(use_empty=True)
for kind in KINDS:Character(kind).build().object('Critter_'+kind)
out=ROOT/'public/experience/assets/animals.glb'
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',export_yup=True,export_extras=False,export_animations=False,export_morph=True,export_morph_normal=False,export_all_vertex_colors=True,export_cameras=False,export_lights=False)
from importlib.machinery import SourceFileLoader
fix=SourceFileLoader('fix_colors',str(ROOT/'scripts/fix-exterior-colors.py')).load_module();fix.fix(out)
print('Exported nine original textured morph-mesh characters to',out)
