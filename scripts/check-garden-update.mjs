import assert from 'node:assert/strict';
import {Game,Grid,BOARD,ANIMALS,trajectory,pointAlong} from '../src/experience/game/rules.js';
import * as baseline from '../docs/checkpoints/stage1-experience/game/rules.js';
import {placeRescuedPet,isPetPositionClear,PET_OBSTACLES,foodGroundPosition} from '../src/experience/game/pet-navigation.js';
import {AimGuideFade,guideOpacityForScore} from '../src/experience/game/aim-guide.js';

assert.deepEqual(BOARD,baseline.BOARD);
assert.equal(Grid.toString(),baseline.Grid.toString());
assert.equal(trajectory.toString(),baseline.trajectory.toString());
assert.equal(pointAlong.toString(),baseline.pointAlong.toString());
for(const method of ['fire','use','select','swap','progress','ensurePowers','addFormation','randomColor','chooseColor'])
  assert.equal(Game.prototype[method].toString(),baseline.Game.prototype[method].toString(),`${method} changed`);
for(const score of [0,2999,3000,4999,5000,15000])assert.equal(guideOpacityForScore(score),score<3000?1:score<5000?.3:0);
const fade=new AimGuideFade();fade.update(3000,.2);assert.ok(fade.value>.3&&fade.value<1);fade.update(3000,.2);assert.ok(Math.abs(fade.value-.3)<1e-9);
const deferred=fade.value;fade.update(7000,1,true);assert.equal(fade.value,deferred);fade.update(7000,.4);assert.equal(fade.value,0);
fade.update(0,.4);assert.equal(fade.value,1);fade.reset();fade.update(9000,.4);assert.equal(fade.value,0);fade.reset();assert.equal(fade.value,1);

const game=new Game();
for(let i=0;i<8;i++){
  const a={id:100+i,kind:ANIMALS[i],x:0,facing:i%2?1:-1,readyAt:0,cooldown:0,target:null,eaten:0,totalEaten:0};
  placeRescuedPet(a,game.rescued);game.rescued.push(a);
  assert.ok(isPetPositionClear(a.x,a.z,a.radius,game.rescued,a),'overlapping rescue landing');
}
for(let i=0;i<80;i++)game.ground.push({id:1000+i,x:-3.15+(i%17)*.39,z:-1.66+(Math.floor(i/17)%3)*.4,y:.815,landedAt:0});
const eaten=new Set();let maxStep=0;
for(let frame=0;frame<7200;frame++){
  const previous=game.rescued.map(a=>[a.x,a.z]);game.updateGarden(.025);
  const targets=game.rescued.map(a=>a.target).filter(id=>id!==null);assert.equal(new Set(targets).size,targets.length,'shared food target');
  game.rescued.forEach((a,i)=>{
    assert.ok(isPetPositionClear(a.x,a.z,a.radius,game.rescued,a),'body overlaps an animal, obstacle or edge');
    const step=Math.hypot(a.x-previous[i][0],a.z-previous[i][1]);maxStep=Math.max(maxStep,step);
    assert.ok(step<=.85*.025+1e-8,'movement teleported');
  });
  for(const e of game.events.splice(0))if(e.type==='eat'){assert.ok(!eaten.has(e.bubble.id),'duplicate meal');eaten.add(e.bubble.id);}
}
assert.equal(game.ground.length,0,'crowded animals failed to reach all meals');assert.equal(eaten.size,80);
assert.equal(game.rescued.reduce((n,a)=>n+a.totalEaten,0),80);
assert.equal(game.inventory.bomb,game.rescued.reduce((n,a)=>n+Math.floor(a.totalEaten/10),0));
assert.ok(game.rescued.every(a=>a.totalEaten>0),'a pet starved');
const saved=game.snapshot(),restored=new Game().restore(saved);
for(let i=0;i<100;i++){game.updateGarden(.05);restored.updateGarden(.05);}assert.deepEqual(game.snapshot(),restored.snapshot());
// Two animals must pass around the cannon, with opposite food goals.
const crossing=new Game();
for(const [id,x,target] of [[1,-2.5,51],[2,2.5,52]]){
  const a={id,kind:'fox',x,z:-2,radius:.255,facing:Math.sign(-x),readyAt:0,cooldown:0,target,eaten:0,totalEaten:0,vx:0,vz:0,avoidSide:id%2?1:-1,waitUntil:0};crossing.rescued.push(a);
}
crossing.ground=[{id:51,x:2.5,z:-1.9,landedAt:0},{id:52,x:-2.5,z:-1.9,landedAt:0}];
for(let i=0;i<1600;i++){crossing.updateGarden(.025);for(const a of crossing.rescued)assert.ok(isPetPositionClear(a.x,a.z,a.radius,crossing.rescued,a));}
assert.equal(crossing.ground.length,0);assert.equal(crossing.rescued[0].totalEaten,1);assert.equal(crossing.rescued[1].totalEaten,1);
console.log(JSON.stringify({boardPreserved:true,shotAndPowerFunctionsUnchanged:true,crowdedPets:8,meals:eaten.size,bombs:game.inventory.bomb,maxStep,crossing:true,guideThresholds:true,flightDeferral:true,reset:true,deterministicRestore:true,obstacles:PET_OBSTACLES.length}));
