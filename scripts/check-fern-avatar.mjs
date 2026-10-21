import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){}});
const load=async path=>{const b=await readFile(path);return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
const original=(await load('public/experience/assets/animals.glb')).scene.getObjectByName('Critter_fox');
const stats=[];
let expectedNames,expectedMaterials;
for(const lod of [0,1]){
  const path=`public/avatar-fern/${lod?'avatar-lod1':'avatar'}.glb`,bytes=await readFile(path);
  assert.equal(bytes.readUInt32LE(0),0x46546c67);
  const n=bytes.readUInt32LE(12),doc=JSON.parse(bytes.subarray(20,20+n)),binary=bytes.subarray(28+n);
  const prim=doc.meshes.flatMap(m=>m.primitives);
  const triangles=prim.reduce((t,p)=>t+(p.indices!==undefined?doc.accessors[p.indices].count:doc.accessors[p.attributes.POSITION].count)/3,0);
  assert.ok(triangles<=(lod?5000:20000));assert.equal(prim.length,3);assert.equal(doc.materials.length,3);
  assert.equal(doc.images.length,3);assert.equal(doc.textures.length,3);
  const sizes=doc.images.map(image=>{
    const view=doc.bufferViews[image.bufferView],o=view.byteOffset||0;
    assert.equal(binary.toString('ascii',o+1,o+4),'PNG');
    const width=binary.readUInt32BE(o+16),height=binary.readUInt32BE(o+20);
    assert.ok(Math.max(width,height)<=(lod?512:1024));return {width,height};
  });
  const gltf=await load(path),body=gltf.scene.getObjectByName('FernBody');
  assert.ok(body?.isMesh);assert.deepEqual(Object.keys(body.morphTargetDictionary),['Blink','Smile','Shock','Sad','Wiggle']);
  assert.ok(body.material.map&&body.material.normalMap&&body.material.roughnessMap);
  if(lod===0){
    for(const name of ['position','normal','uv','color']){
      const a=original.geometry.getAttribute(name),b=body.geometry.getAttribute(name);
      assert.equal(a.count,b.count);assert.equal(a.itemSize,b.itemSize);
      for(let i=0;i<a.array.length;i++)assert.ok(Math.abs(a.array[i]-b.array[i])<1e-6,`${name}: close-up body must match the approved preview`);
    }
    assert.ok(Math.abs(body.morphTargetInfluences[body.morphTargetDictionary.Smile]-.65)<1e-6);
  }
  const names=gltf.animations.map(c=>c.name),materials=doc.materials.map(m=>m.name);
  assert.deepEqual(names,['idle','fly','fly_fast','ascend','descend','joy','approval','sadness','surprise','blink']);
  if(expectedNames){assert.deepEqual(names,expectedNames);assert.deepEqual(materials,expectedMaterials);}
  else{expectedNames=names;expectedMaterials=materials;}
  gltf.scene.updateMatrixWorld(true);
  const rest=new T.Box3().setFromObject(gltf.scene,true);assert.ok(rest.min.y>=-.001);
  const animationBounds={};
  for(const clip of gltf.animations){
    const mixer=new T.AnimationMixer(gltf.scene),action=mixer.clipAction(clip).play(),box=new T.Box3();
    for(let j=0;j<=16;j++){
      mixer.setTime(clip.duration*j/16);gltf.scene.updateMatrixWorld(true);
      const b=new T.Box3().setFromObject(gltf.scene,true);
      assert.ok([...b.min.toArray(),...b.max.toArray()].every(Number.isFinite));
      assert.ok(b.max.y-b.min.y<=3.001&&b.max.x-b.min.x<=2.501,`${clip.name} bounds`);
      const w=body.morphTargetInfluences,d=body.morphTargetDictionary;
      const opening=1-.1*w[d.Smile]+.12*w[d.Shock]-.24*w[d.Sad]-.945*w[d.Blink];
      assert.ok(opening>=.039,`${clip.name}: eyes never invert`);box.union(b);
    }
    for(const track of clip.tracks){const k=track.getValueSize();for(let j=0;j<k;j++)assert.ok(Math.abs(track.values[j]-track.values[track.values.length-k+j])<1e-5,`${clip.name}: seamless return/loop`);}
    animationBounds[clip.name]={min:box.min.toArray(),max:box.max.toArray()};
    action.stop();mixer.uncacheRoot(gltf.scene);
  }
  stats.push({lod,triangles,drawCalls:prim.length,materials:materials.length,textures:sizes,bytes:bytes.length,
    bounds:{min:rest.min.toArray(),max:rest.max.toArray()},clips:names,animationBounds});
  console.log(`PASS Fern LOD${lod}: ${triangles} triangles, 3 draws/materials/textures, 10 valid clips, 5 expressions, correct scale and safe eye blinks.`);
}
await writeFile('docs/fern-avatar-checks.json',JSON.stringify(stats,null,2)+'\n');
