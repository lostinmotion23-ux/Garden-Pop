import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Art} from '../src/experience/game/art.js';
import {applyExpression} from '../src/experience/game/expressions.js';
import {ANIMALS} from '../src/experience/game/rules.js';
// Decode real embedded GLB geometry in Node; bitmap pixels are checked in browsers.
globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){}});
globalThis.ProgressEvent=class extends Event{constructor(type,values){super(type);Object.assign(this,values)}};
const bytes=await readFile('public/experience/assets/animals.glb');
const pack=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const art=new Art({},pack.scene);
for(const kind of [...ANIMALS,'axolotl']){
 const first=art.animal(kind,.39);first.visible=false;first.position.set(3,2,1);first.rotation.z=.3;
 first.children[0].morphTargetInfluences[0]=1;
 const baby=art.animal(kind,.118),mesh=baby.children[0];
 assert.ok(baby.visible);assert.deepEqual(baby.position.toArray(),[0,0,0]);assert.equal(baby.quaternion.w,1);assert.equal(baby.scale.x,.118);
 assert.ok(mesh.isMesh&&mesh.geometry.attributes.uv&&mesh.geometry.attributes.color);
 for(const name of ['Blink','Smile','Shock','Sad','Wiggle'])assert.ok(name in mesh.morphTargetDictionary);
 assert.ok(mesh.morphTargetInfluences.every(x=>x===0),'Clones have independent reset expression weights');
 for(let i=0;i<mesh.geometry.attributes.color.count;i++)assert.ok(Math.abs(mesh.geometry.attributes.color.getW(i)-1)<.0001,'Coat colors must not be overwritten by UV coordinates');
 assert.ok(mesh.material.map&&mesh.material.normalMap&&mesh.material.roughnessMap,'Actual coat PBR maps');
 const b=new THREE.Box3().setFromObject(baby,true);
 assert.ok(b.min.x>-.19&&b.max.x<.19&&b.min.y>-.18&&b.max.y<.19,`${kind} protective bubble bounds`);
 for(const pose of ['Smile','Shock','Sad','Blink']){const w=applyExpression(mesh,pose,1.3);const eye=1-.1*w.Smile+.12*w.Shock-.24*w.Sad-.945*w.Blink;assert.ok(Math.abs(eye-.04)<.00001,'Blink closes expressive eyes without inversion');}
 const morphs=mesh.geometry.morphAttributes.position;
 assert.equal(morphs.length,5);
 for(const a of morphs)assert.ok(Array.from(a.array).some(v=>v!==0),'Nonempty genuine mesh pose');
}
art.dispose();console.log('PASS: nine UV/PBR mesh species, five real morphs, independent expression clones and protective bubble bounds.');
