import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import * as THREE from 'three';
const root=new URL('../',import.meta.url);
const lot=JSON.parse(await readFile(new URL('docs/lot3157.json',root)));
const garden=JSON.parse(await readFile(new URL('public/lot/garden.json',root)));
assert.deepEqual(garden.board.columns,[25,24]);
assert.equal(garden.board.colors.length,5);
assert.ok(garden.board.realSpheres>=250);
assert.equal(garden.board.rows,17);
assert.deepEqual(garden.animals.map(a=>a.kind),['bunny','fox','kitten','bird','deer','bear','axolotl']);
assert.equal(garden.decorativeAnimalBubbles,2);
const stats=[];
for(let level=0;level<3;level++) {
 const bytes=await readFile(new URL(`public/lot/lod${level}.glb`,root));
 assert.equal(bytes.readUInt32LE(0),0x46546c67);
 const length=bytes.readUInt32LE(12),doc=JSON.parse(bytes.subarray(20,20+length));
 const bin=bytes.subarray(28+length);
 const primitives=doc.meshes.flatMap(m=>m.primitives);
 const triangles=primitives.reduce((t,p)=>t+doc.accessors[p.indices??p.attributes.POSITION].count/3,0);
 const images=(doc.images??[]).map(im=>{
  const v=doc.bufferViews[im.bufferView],data=bin.subarray(v.byteOffset??0,(v.byteOffset??0)+v.byteLength);
  assert.equal(data.toString('ascii',1,4),'PNG','Embedded image must be PNG');
  return {width:data.readUInt32BE(16),height:data.readUInt32BE(20)};
 });
 const budget=lot.budgets[`lod${level}`];
 const box=new THREE.Box3();
 function visit(index,parent){
  const n=doc.nodes[index],local=n.matrix?new THREE.Matrix4().fromArray(n.matrix):new THREE.Matrix4().compose(new THREE.Vector3().fromArray(n.translation??[0,0,0]),new THREE.Quaternion().fromArray(n.rotation??[0,0,0,1]),new THREE.Vector3().fromArray(n.scale??[1,1,1]));
  const world=parent.clone().multiply(local);
  if(n.mesh!==undefined)for(const p of doc.meshes[n.mesh].primitives){const a=doc.accessors[p.attributes.POSITION];box.union(new THREE.Box3(new THREE.Vector3().fromArray(a.min),new THREE.Vector3().fromArray(a.max)).applyMatrix4(world));}
  for(const i of n.children??[])visit(i,world);
 }
 for(const i of doc.scenes[doc.scene??0].nodes)visit(i,new THREE.Matrix4());
 const s={level,triangles,drawCalls:primitives.length,materials:doc.materials.length,textures:images.length,images,texels:Math.floor(images.reduce((t,i)=>t+i.width*i.height,0)*4/3),bytes:bytes.length,bounds:{min:box.min.toArray(),max:box.max.toArray()}};
 for(const key of ['triangles','drawCalls','materials','textures','texels'])assert.ok(s[key]<=budget[key],`LOD${level} ${key}: ${s[key]} > ${budget[key]}`);
 assert.ok(bytes.length<=budget.uploadBytes,`LOD${level} upload size ${bytes.length}`);
 assert.ok(images.every(i=>Math.max(i.width,i.height)<=budget.maxTextureSize));
 assert.ok(!doc.skins?.length);
 if(level>0)assert.ok(!doc.animations?.length,'Distance LODs must stay static');
 else assert.deepEqual(doc.animations.map(a=>a.name),['GardenIdle','GardenSmile','GardenShock','GardenSad']);
 assert.ok(!doc.extensionsUsed?.some(e=>['KHR_draco_mesh_compression','EXT_meshopt_compression','EXT_mesh_gpu_instancing'].includes(e)));
 assert.ok(box.min.x>=-6.001&&box.max.x<=6.001&&box.min.z>=-6.001&&box.max.z<=6.001&&box.min.y>=-.001&&box.max.y<=19.001,'Lot bounds');
 if(level===0){
  assert.ok(primitives.every(p=>p.attributes.COLOR_0!==undefined&&p.attributes.TEXCOORD_0!==undefined));
  const mat=doc.materials.find(m=>m.name==='Garden atlas');
  assert.ok(mat.pbrMetallicRoughness.baseColorTexture&&mat.normalTexture&&mat.pbrMetallicRoughness.metallicRoughnessTexture,'Real PBR atlas textures');
  // Catch a real exporter regression: a white COLOR_0 hid animal coat and eyes.
  const averageColors={},blueCoatVertices={};
  for(const name of ['Mochi','Clementine','Clover','Pip','Fern','Maple','Petal']){
   const n=doc.nodes.find(n=>n.name===name),p=doc.meshes[n.mesh].primitives[0];
   assert.equal(p.attributes.COLOR_1,undefined,'Only the canonical color stream should remain');
   const a=doc.accessors[p.attributes.COLOR_0],v=doc.bufferViews[a.bufferView],offset=(v.byteOffset??0)+(a.byteOffset??0);
   const width=a.componentType===5126?4:a.componentType===5123?2:1,components=a.type==='VEC4'?4:3,stride=v.byteStride??width*components;
   const read=width===4?(o)=>bin.readFloatLE(o):width===2?(o)=>bin.readUInt16LE(o)/65535:(o)=>bin[o]/255;
   const avg=[0,0,0];let darkest=1;blueCoatVertices[name]=0;
   for(let i=0;i<a.count;i++){const o=offset+i*stride;if(read(o+2*width)>read(o)*1.5&&read(o+2*width)>.25)blueCoatVertices[name]++;}
   for(let i=0;i<a.count;i++)for(let k=0;k<3;k++){const c=read(offset+i*stride+k*width);assert.ok(Math.abs(read(offset+i*stride+3*width)-1)<.0001,'UV/color corruption regression');avg[k]+=c/a.count;darkest=Math.min(darkest,c);}
   assert.ok(darkest<.1,'Expressive dark eyes must retain their color');averageColors[name]=avg;
  }
  assert.ok(averageColors.Clementine[0]>averageColors.Clementine[2]*1.3,'Orange fox coat');
  assert.ok(blueCoatVertices.Pip>100,'Blue feather vertices must survive export, independently of cream belly and dark eyes');
  const actors=JSON.parse(await readFile(new URL('public/lot/exterior-motion.json',root)));
  for(const a of actors)assert.ok(doc.nodes.some(n=>n.name===a.node),'Named decorative actor');
  for(const a of actors){const n=doc.nodes.find(n=>n.name===a.node);for(const p of doc.meshes[n.mesh].primitives){const acc=doc.accessors[p.attributes.POSITION];assert.ok(acc.min[1]+a.position[1]-a.amplitude>=0&&acc.max[1]+a.position[1]+a.amplitude<=19,'Animated actor stays in lot');}}
 }
 if(level===2){assert.equal(primitives.length,1);assert.equal(doc.materials.length,1);}
 stats.push(s);console.log(JSON.stringify(s));
}
await writeFile(new URL('docs/exterior-model-stats.json',root),JSON.stringify(stats,null,2)+'\n');
console.log('PASS: all three exterior LODs satisfy exact geometry, draw, material, texture, raw upload and lot-bound budgets; server publication checks optimized file size.');
