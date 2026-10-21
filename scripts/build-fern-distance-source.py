"""Build only Fern's lighter body; never rebuild the city or game assets."""
import bpy,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from animal_mesh import Character,material
from importlib.machinery import SourceFileLoader
bpy.ops.wm.read_factory_settings(use_empty=True)
Character('fox',detail=1).build().object('Critter_fox')
out=ROOT/'public/fern-avatar-source/body-lod1.glb'
out.parent.mkdir(exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',export_yup=True,
    export_extras=False,export_animations=False,export_morph=True,
    export_morph_normal=False,export_all_vertex_colors=True,
    export_cameras=False,export_lights=False)
fix=SourceFileLoader('fix_colors',str(ROOT/'scripts/fix-exterior-colors.py')).load_module()
fix.fix(out)
print('Exported only Fern distance-body source:',out)
