// Re-import the actual deliverables, check skinning and sample every animation.
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){}});
const report=[];
const revised=process.argv.includes('--revision');
const folder=revised?'public/avatar-revision':'public/avatar';
let first;
for(const lod of [0,1]){
  const name=lod?'avatar-lod1.glb':'avatar.glb';
  const bytes=await readFile(`${folder}/${name}`),length=bytes.readUInt32LE(12);
  assert.equal(bytes.readUInt32LE(0),0x46546c67);
  const doc=JSON.parse(bytes.subarray(20,20+length)),bin=bytes.subarray(28+length);
  const meshes=doc.meshes.flatMap(m=>m.primitives);
  assert.equal(meshes.length,1);assert.equal(doc.materials.length,1);assert.equal(doc.skins.length,1);
  const triangles=meshes.reduce((n,p)=>n+doc.accessors[p.indices].count/3,0);
  assert.ok(triangles<=(lod?5000:20000));assert.ok(doc.skins[0].joints.length<=75);
  assert.equal(doc.images.length,3);assert.equal(doc.textures.length,3);
  for(const image of doc.images){
    const view=doc.bufferViews[image.bufferView],offset=view.byteOffset||0;
    assert.equal(bin.toString('ascii',offset+1,offset+4),'PNG');
    assert.equal(bin.readUInt32BE(offset+16),lod?512:1024);
    assert.equal(bin.readUInt32BE(offset+20),lod?512:1024);
  }
  const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const skinned=[];gltf.scene.traverse(o=>{if(o.isSkinnedMesh)skinned.push(o);});
  assert.equal(skinned.length,1);
  const mesh=skinned[0],skeleton=mesh.skeleton;
  gltf.scene.updateMatrixWorld(true);skeleton.update();
  const positions=mesh.geometry.getAttribute('position'),weights=mesh.geometry.getAttribute('skinWeight');
  const normal=mesh.geometry.getAttribute('normal');
  let maxRestError=0;
  for(let i=0;i<positions.count;i++){
    assert.ok(Math.abs(weights.getX(i)+weights.getY(i)+weights.getZ(i)+weights.getW(i)-1)<1e-5);
    const n=new T.Vector3().fromBufferAttribute(normal,i).length();
    assert.ok(Math.abs(n-1)<1e-4,`Unit vertex normal ${i}: ${n}`);
    const a=mesh.getVertexPosition(i,new T.Vector3()),b=new T.Vector3().fromBufferAttribute(positions,i);
    maxRestError=Math.max(maxRestError,a.distanceTo(b));
  }
  assert.ok(maxRestError<1e-5,'Inverse bind matrices preserve the intended full model');
  assert.ok(mesh.material.map&&mesh.material.normalMap&&mesh.material.roughnessMap,'Actual UV PBR maps');
  assert.deepEqual(Object.keys(mesh.morphTargetDictionary),['Blink','Smile','Sad']);
  const names=gltf.animations.map(a=>a.name);
  for(const name of ['idle','fly','fly_fast','ascend','descend','joy','approval','sadness','indignation','blink','look_around'])assert.ok(names.includes(name));
  const jointNames=skeleton.bones.map(b=>b.name);
  if(first){assert.deepEqual(names,first.names);assert.deepEqual(jointNames,first.joints);}
  else first={names,joints:jointNames};
  const animations=[];
  for(const clip of gltf.animations){
    const mixer=new T.AnimationMixer(gltf.scene),action=mixer.clipAction(clip);action.play();
    let overall=new T.Box3();
    for(let j=0;j<=8;j++){
      mixer.setTime(clip.duration*j/8);gltf.scene.updateMatrixWorld(true);skeleton.update();
      const box=new T.Box3().setFromObject(gltf.scene,true);
      assert.ok([...box.min.toArray(),...box.max.toArray()].every(Number.isFinite));
      assert.ok(box.max.y-box.min.y<=3.001,`${clip.name} height`);
      assert.ok(box.max.x-box.min.x<=2.501,`${clip.name} width`);
      overall.union(box);
    }
    for(const track of clip.tracks){
      const width=track.getValueSize();
      const start=Array.from(track.values.slice(0,width)),end=Array.from(track.values.slice(-width));
      assert.ok(start.every((v,i)=>Math.abs(v-end[i])<1e-5),`${clip.name}: clean loop/return to neutral`);
    }
    action.stop();mixer.uncacheRoot(gltf.scene);
    animations.push({name:clip.name,duration:clip.duration,bounds:{min:overall.min.toArray(),max:overall.max.toArray()}});
  }
  report.push({name,triangles,bones:jointNames.length,drawCalls:1,textures:3,maxRestError,animations});
  console.log(`PASS ${name}: ${triangles} triangles, ${jointNames.length} bones, all 11 clips and 3 facial morphs, normalized skin, finite posed bounds, shared LOD skeleton.`);
}
await writeFile(`docs/avatar${revised?'-revision':''}-rig-checks.json`,JSON.stringify(report,null,2)+'\n');
