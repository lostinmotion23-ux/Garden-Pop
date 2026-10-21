"""Add compact real morph animation clips to the already exported street GLB."""
from pathlib import Path
import json,struct
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'public/lot/lod0.glb';b=p.read_bytes();n=struct.unpack_from('<I',b,12)[0];doc=json.loads(b[20:20+n]);binary=bytearray(b[28+n:]);binary=binary[:doc['buffers'][0]['byteLength']]
assert len(doc.get('animations',[]))==1,'Street idle must be a single shared clip'
doc['animations'][0]['name']='GardenIdle'
def floats(values,kind='SCALAR',minimum=None,maximum=None):
 while len(binary)%4:binary.append(0)
 offset=len(binary);binary.extend(struct.pack('<'+'f'*len(values),*values));vi=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(values)*4});a={'bufferView':vi,'componentType':5126,'count':len(values),'type':kind}
 if minimum is not None:a['min']=minimum;a['max']=maximum
 index=len(doc['accessors']);doc['accessors'].append(a);return index
for pose,clip in [('Smile','GardenSmile'),('Shock','GardenShock'),('Sad','GardenSad')]:
 animation={'name':clip,'samplers':[],'channels':[]};times=floats([0,.16,1.25,1.6],minimum=[0],maximum=[1.6])
 for ni,node in enumerate(doc['nodes']):
  if 'mesh' not in node:continue
  mesh=doc['meshes'][node['mesh']];names=mesh.get('extras',{}).get('targetNames',[])
  if pose not in names:continue
  values=[]
  for w in (0,1,1,0):values.extend([w if name==pose else 0 for name in names])
  out=floats(values);si=len(animation['samplers']);animation['samplers'].append({'input':times,'output':out,'interpolation':'LINEAR'});animation['channels'].append({'sampler':si,'target':{'node':ni,'path':'weights'}})
 assert len(animation['channels'])==9
 doc['animations'].append(animation)
doc['buffers'][0]['byteLength']=len(binary)
while len(binary)%4:binary.append(0)
data=json.dumps(doc,separators=(',',':')).encode();data+=b' '*((-len(data))%4)
p.write_bytes(struct.pack('<III',0x46546c67,2,28+len(data)+len(binary))+struct.pack('<II',len(data),0x4e4f534a)+data+struct.pack('<II',len(binary),0x004e4942)+binary)
print('Street clips: GardenIdle, GardenSmile, GardenShock, GardenSad; nine independently textured morph meshes.')
