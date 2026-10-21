"""Canonicalize Blender's named vertex colors into glTF COLOR_0.
The exporter sometimes inserts a white COLOR_0 before the real GardenColor.
No geometry, materials or game files are changed.
"""
from pathlib import Path
import json,struct
ROOT=Path(__file__).resolve().parents[1]
def fix(path):
 b=path.read_bytes();n=struct.unpack_from('<I',b,12)[0];doc=json.loads(b[20:20+n]);count=0
 for mesh in doc['meshes']:
  for p in mesh['primitives']:
   a=p['attributes']
   if 'COLOR_1' in a:a['COLOR_0']=a.pop('COLOR_1');count+=1
 for m in doc.get('materials',[]):
  if m.get('name')=='Warm lantern glow':m['emissiveFactor']=[1,.72,.36]
 data=json.dumps(doc,separators=(',',':')).encode();data+=b' '*((-len(data))%4)
 rest=b[20+n:];out=struct.pack('<III',0x46546c67,2,20+len(data)+len(rest))+struct.pack('<II',len(data),0x4e4f534a)+data+rest;path.write_bytes(out)
 print(path.name,'canonicalized',count,'vertex-color streams')
if __name__=='__main__':
 for level in range(3):fix(ROOT/f'public/lot/lod{level}.glb')
