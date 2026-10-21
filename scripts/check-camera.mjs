import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createGardenCamera, CAMERA_LIMITS } from '../public/experience/camera.js';
import { extendGarden } from '../public/experience/environment.js';

const handlers=new Map();
const p0={
  controls:{},me:{position:new THREE.Vector3()},camera:new THREE.PerspectiveCamera(60,16/9,.1,100),
  input:{keys:new Set()},width:640,height:360,
  on(name,fn){handlers.set(name,fn);},
};
const rig=createGardenCamera(p0);
assert.equal(p0.controls.mode,'none');
assert.equal(p0.controls.enabled,false);
function interior() {
  const pos=p0.camera.position;
  assert.ok(Math.abs(pos.x)<=CAMERA_LIMITS.x&&Math.abs(pos.z)<=CAMERA_LIMITS.z);
  assert.ok(pos.y>=CAMERA_LIMITS.minY&&pos.y<=CAMERA_LIMITS.maxY);
  assert.ok(pos.distanceTo(p0.me.position)<1e-9,'No trailing camera may cross the lot boundary');
}
for(const code of ['KeyS','KeyW','KeyA','KeyD','KeyE','KeyQ']) {
  p0.input.keys=new Set([code,'ShiftLeft']);
  for(let i=0;i<1000;i++) {rig.update(.1);interior();}
}
handlers.get('pointermove')({buttons:2,dx:1200,dy:-1500});
for(let i=0;i<1000;i++) {rig.update(.1);interior();}
p0.width=390;p0.height=844;
handlers.get('resize')();
assert.ok(p0.camera.fov>=100,'Phone must fit the complete cluster across its narrow view');
interior();

const scene=new THREE.Scene();
const environment=extendGarden(scene);
scene.updateMatrixWorld(true);
assert.ok(scene.background.isColor);
assert.ok(scene.fog,'The extended meadow should fade into its own sky');
const world=scene.getObjectByName('Private garden environment');
const raycaster=new THREE.Raycaster();
for(const eye of [[0,4.5,5.1],[5.1,17.8,-5.1],[-5.1,1.5,5.1]]) {
  for(const vector of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]) {
    raycaster.set(new THREE.Vector3(...eye),new THREE.Vector3(...vector));
    const hits=raycaster.intersectObject(world,true);
    assert.ok(hits.length,'Every viewing direction must meet the garden envelope');
    assert.equal(hits[0].object.material.transparent,false);
    assert.equal(hits[0].object.material.opacity,1);
  }
}
environment.dispose();
console.log('PASS: camera stays inside the lot under prolonged movement and turning; first-person offset is zero, phone framing fits, and an opaque garden surrounds every viewing direction.');
