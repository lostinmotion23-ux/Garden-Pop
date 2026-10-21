import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { FLOW, FRIENDS, animalState, rowState, solidState } from '../src/scene/flow.js';
import { LAYOUT } from '../src/scene/layout.js';
import build from '../public/lot/build.js';

const metadata=JSON.parse(await readFile(new URL('../public/lot/garden.json',import.meta.url)));
assert.equal(FLOW.radius,.18);
assert.equal(FLOW.largeRadius,.45);
assert.equal(FRIENDS.length,1,'Exactly one baby animal bubble in the city, viewer, and experience');
assert.ok(FLOW.solidCount>=120);
for(const friend of FRIENDS) assert.deepEqual(metadata.animals.find(a=>a.name===friend.name).position,friend.at);
const initial=[...FRIENDS.map(f=>({x:f.at[0],y:f.at[1],radius:FLOW.largeRadius})),...LAYOUT.solids];
for(let i=0;i<initial.length;i++) {
  const a=initial[i];
  const touching=initial.some((b,j)=>i!==j&&Math.abs(Math.hypot(a.x-b.x,a.y-b.y)-a.radius-b.radius)<1e-5);
  assert.ok(touching,`Bubble ${i} must touch a neighbour, rather than floating across a gap`);
  for(let j=0;j<i;j++) {
    const b=initial[j];
    const dy=((a.y-b.y+FLOW.span*1.5)%FLOW.span)-FLOW.span/2;
    assert.ok(Math.hypot(a.x-b.x,dy)>=a.radius+b.radius-1e-6,'Packed bubbles must not intersect');
  }
}
const calls=new Map();let callback;const uniforms=new Map();
build({loop(fn){callback=fn;},node(name,pose){calls.set(name,pose);},uniform(name,value){uniforms.set(name,value);}});
callback(0,1000);
for(const seconds of [0,1,44.99,45,90,180,269.99,270,359.99,360,1080,3600]) {
  callback(.033,1000+seconds);
  assert.ok(Math.abs(uniforms.get('rowTime')-seconds)<1e-9);
  for(const friend of FRIENDS) {
    const pose=animalState(friend,seconds),city=calls.get(friend.name);
    [pose.x,pose.y,pose.z].forEach((value,i)=>assert.ok(Math.abs(city.position[i]-value)<1e-9));
    city.scale.forEach(value=>assert.ok(Math.abs(value-pose.scale)<1e-9));
    assert.ok(pose.y-FLOW.largeRadius*pose.scale>=.9);
    assert.ok(pose.y+FLOW.largeRadius*pose.scale<8);
  }
  for(let index=0;index<FLOW.solidCount;index++) {
    const pose=solidState(index,seconds);
    assert.ok(pose.scale>=0&&pose.scale<=1);
    assert.ok(pose.y-FLOW.radius*pose.scale>=.9);
    assert.ok(Math.abs(pose.x)+FLOW.radius*pose.scale<=6);
  }
}
assert.ok(Math.abs(rowState(8,0).y-rowState(8,FLOW.rowSeconds).y-FLOW.spacing)<1e-9);
const wrap=.5*FLOW.rowSeconds;
assert.ok(rowState(0,wrap-.001).scale<1e-6&&rowState(0,wrap+.001).scale<1e-6);
for(const file of ['flow.js','rows.js','layout.js']) assert.equal(await readFile(new URL(`../src/scene/${file}`,import.meta.url),'utf8'),await readFile(new URL(`../public/experience/${file}`,import.meta.url),'utf8'));
console.log('PASS: all bubbles touch neighbours without intersecting; smaller radii, slow packed descent, ground fade, recycling, and city/experience agreement over an hour.');
