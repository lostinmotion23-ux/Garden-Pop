import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { Game, Grid, BOARD, GARDEN, POWERS, ANIMALS, trajectory, pointAlong } from '../src/experience/game/rules.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} ≈ ${b}`);
const powers=(g)=>[...g.grid.cells.values()].filter(b=>b.type==='power');
const fixture=()=>{const g=new Game();g.grid.cells.clear();g.nextUnlock=999999;return g;};
const tick=(g,seconds)=>{for(let t=0;t<seconds;t+=.05)g.updateGarden(.05);};
{
 const g=new Game();assert.equal(BOARD.columns,20);assert.equal(BOARD.radius,.1875);
 assert.equal(g.level,1);assert.equal(new Game(10).level,1);assert.equal(g.grid.cells.size,117);
 assert.equal(powers(g).length,3);assert.equal(new Set(powers(g).map(b=>b.power)).size,3);
 assert.equal(g.rescued.length,0);assert.equal(g.introduced,0);
 assert.deepEqual(g.snapshot(),new Game().snapshot());
 for(let r=0;r<6;r++)assert.equal(g.grid.width(r),r%2?19:20);
 let same=0,total=0;
 for(const b of g.grid.cells.values())for(const [r,c]of g.grid.neighbors(b.r,b.c)){
  const p=g.grid.position(b.r,b.c),q=g.grid.position(r,c);near(Math.hypot(p.x-q.x,p.y-q.y),BOARD.diameter);
  assert.ok(g.grid.neighbors(r,c).some(([rr,cc])=>rr===b.r&&cc===b.c));
  const n=g.grid.get(r,c);if(n?.type==='normal'&&b.type==='normal'&&n.id>b.id){total++;if(n.color===b.color)same++;}
 }
 assert.ok(same/total<.34);
 const before=[...g.grid.cells.values()].map(b=>({...b,p:g.grid.position(b.r,b.c)}));
 g.addRandomRow();assert.equal(g.grid.width(0),19);
 for(const old of before){const b=[...g.grid.cells.values()].find(n=>n.id===old.id);const p=g.grid.position(b.r,b.c);near(p.x,old.p.x);near(p.y,old.p.y-BOARD.step);}
 for(const angle of [-1.3,-.6,0,.6,1.3]){const p=trajectory(g.grid,angle);assert.ok(p.cell);const last=pointAlong(p,p.distance);near(last.x,p.points.at(-1).x);near(last.y,p.points.at(-1).y);}
}
{
 const g=new Game();g.current=1;g.next=4;g.swap();assert.deepEqual([g.current,g.next],[4,1]);g.swap();assert.deepEqual([g.current,g.next],[1,4]);
 for(let misses=1;misses<=2;misses++){
  let path,color;
  search:for(let a=-1.3;a<=1.3;a+=.03){const p=trajectory(g.grid,a);if(!p.cell)continue;for(let c=0;c<5;c++){
   const copy=new Game().restore(g.snapshot());copy.fire(p,c);if(copy.misses===g.misses+1){path=p;color=c;break search;}
  }}
  assert.ok(path);g.fire(path,color);assert.equal(g.rows,Math.floor(misses/2));assert.equal(g.pendingMisses,misses%2);assert.equal(powers(g).length,3);
 }
}
{
 const g=new Game();g.cleared=GARDEN.unlock;const positions=[...g.grid.cells.values()].map(b=>[b.id,b.r,b.c]);g.progress();
 assert.equal(g.introduced,1);assert.equal(g.rows,0);
 for(const [id,r,c]of positions){const b=[...g.grid.cells.values()].find(b=>b.id===id);if(b)assert.deepEqual([b.r,b.c],[r,c]);}
 assert.equal([...g.grid.cells.values()].filter(b=>b.type==='animal').length,1);
 const animal=[...g.grid.cells.values()].find(b=>b.type==='animal');
 g.settle([animal]);g.progress();assert.equal(g.rescued.length,1);assert.equal(g.status,'playing');assert.ok(!g.events.some(e=>e.type==='win'));
 const pet=g.rescued[0], inventory={...g.inventory};g.grid.cells.clear();g.progress();
 assert.equal(g.rescued[0],pet);assert.equal(g.status,'playing');assert.deepEqual(g.inventory,inventory);assert.ok(g.refills>0);assert.equal(powers(g).length,3);
 for(let i=0;i<8;i++){const power=powers(g)[0];g.settle([power]);g.progress();assert.equal(powers(g).length,3);}
 assert.ok(Object.values(g.inventory).reduce((n,a)=>n+a,0)>=8);
 assert.ok(!g.grid.danger());
}
{
 const g=fixture(),roof=g.grid.put(0,9,{type:'normal',color:0});
 g.grid.put(1,8,{type:'animal',kind:'bunny',name:'Mochi'});
 for(let r=2;r<5;r++)for(let c=5;c<13;c++)g.grid.put(r,c,{type:'normal',color:1});
 g.settle([roof]);assert.equal(g.rescued.length,1);assert.equal(g.ground.length,24);assert.equal(g.inventory.bomb,0);
 const saved=g.snapshot();g.updateGarden(0);assert.deepEqual(g.snapshot(),saved);
 const copy=new Game().restore(saved);tick(g,120);tick(copy,120);assert.deepEqual(g.snapshot(),copy.snapshot());
 assert.equal(g.ground.length,0);assert.equal(g.rescued[0].totalEaten,24);assert.equal(g.rescued[0].eaten,4);assert.equal(g.inventory.bomb,2);
 assert.equal(saved.ground.length,24);assert.equal(saved.rescued[0].totalEaten,0);
 g.settle([]);assert.equal(g.inventory.bomb,2);
 const h=fixture(),top=h.grid.put(0,9,{type:'normal',color:0});h.grid.put(1,9,{type:'normal',color:1});h.settle([top]);tick(h,90);
 assert.equal(h.ground.length,1);assert.equal(h.inventory.bomb,0);
 h.rescued.push({id:1000,kind:'bunny',name:'Mochi',eaten:0,totalEaten:0,x:-3,facing:1,readyAt:0,cooldown:0,target:null});tick(h,20);
 assert.equal(h.ground.length,0);assert.equal(h.rescued[0].totalEaten,1);
 const direct=[h.grid.put(0,1,{type:'normal',color:1}),h.grid.put(0,2,{type:'normal',color:1})];h.settle(direct);tick(h,5);assert.equal(h.rescued[0].totalEaten,1);
}
for(const power of POWERS){
 const g=new Game();g.inventory[power]=1;g.pendingMisses=1;assert.ok(g.select(power));g.cancel();assert.equal(g.inventory[power],1);g.select(power);
 if(power==='wild')assert.ok(g.fire(trajectory(g.grid,0),2));else assert.ok(g.use(4,9));
 assert.equal(g.rows,0);assert.equal(g.misses,0);assert.equal(g.pendingMisses,1);assert.equal(g.selected,null);assert.equal(powers(g).length,3);
 assert.ok(g.events.some(e=>e.type===(power==='wild'?'miss':'power'))||power==='wild');
}
console.log('PASS: 20/19 touching columns, 25% larger spheres, three starting/replenishing skills, two-miss rows, continuing rescue/refill, persistent food, individual meals/bombs and deterministic snapshots.');
// Play real analytic aim trajectories through multiple rescues and ceiling refills.
const g=new Game(),shots=[];let afterFirst=0;
for(let attempt=0;attempt<180;attempt++){
 let best=null;
 for(const swap of [false,true]){
  const targets=new Set();
  for(let angle=-1.293;angle<=1.3;angle+=.04){
   const path=trajectory(g.grid,angle);if(!path.cell||targets.has(path.cell.join(',')))continue;targets.add(path.cell.join(','));
   const copy=new Game().restore(g.snapshot());if(swap)copy.swap();copy.fire(path);
   const value=(copy.status==='lost'?-1e6:0)+(copy.rescued.length-g.rescued.length)*10000+(copy.cleared-g.cleared)*100-copy.grid.maxRow()*3-(copy.misses-g.misses)*250;
   if(!best||value>best.value)best={path,angle,swap,value};
  }
 }
 assert.ok(best);if(best.swap)g.swap();g.fire(best.path);tick(g,1.5);shots.push({angle:best.angle,swap:best.swap});
 assert.equal(g.status,'playing',`Rescue must not end the continuous garden (shot ${attempt+1})`);
 assert.equal(powers(g).length,3);assert.ok([...g.grid.cells.values()].filter(b=>b.type==='animal').length<=1);
 if(g.rescued.length)afterFirst++;g.events=[];
 if(g.rescued.length>=3&&g.refills>=2&&afterFirst>=40)break;
}
assert.ok(g.rescued.length>=3);assert.ok(g.refills>=2);assert.ok(afterFirst>=40);
assert.ok(g.ground.length+g.rescued.reduce((n,a)=>n+a.totalEaten,0)===g.detached);
await mkdir('.local',{recursive:true});
await writeFile('.local/game-continuous-replay.json',JSON.stringify({shots,score:g.score,rescued:g.rescued.length,refills:g.refills,misses:g.misses},null,2));
console.log(JSON.stringify({ordinaryShots:shots.length,rescued:g.rescued.length,refills:g.refills,misses:g.misses,status:g.status,skillBubbles:powers(g).length}));
