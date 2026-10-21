import {browserExecutable} from './browser-options.mjs';
import {spawn} from 'node:child_process';import {setTimeout as delay} from 'node:timers/promises';import {chromium} from '@playwright/test';import assert from 'node:assert/strict';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4190','--strictPort'],{stdio:'ignore'});let browser;
try{
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:4190/game.html')).ok)break;}catch{}await delay(100);}
 browser=await chromium.launch({executablePath:browserExecutable,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text());});
 await page.goto('http://127.0.0.1:4190/game.html');await page.waitForFunction(()=>!!window.gardenGame,null,{timeout:90000});
 const result=await page.evaluate(async()=>{
  const {BOARD,trajectory}=await import('/src/experience/game/rules.js');const {Vector3,Raycaster}=gardenThree;
  gardenP0.loop(()=>{});gardenGame.action('play');
  const {game:g,view:v,shelf,ui,state,celebrations,ambience,pavilion}=gardenGame;
  const snapshot=JSON.stringify(g.snapshot()),path=trajectory(g.grid,0);
  for(let i=0;i<80;i++){v.update(g,.05,path,null,null);shelf.update(ui.iconSlots,g,state,null,v.time);ambience.update(.05);pavilion.update(.05);}
  const unchanged=JSON.stringify(g.snapshot())===snapshot;
  const ray=new Raycaster();ray.set(new Vector3(0,BOARD.launcher,5),new Vector3(0,0,-1));v.root.updateMatrixWorld(true);
  const firstHit=ray.intersectObject(v.root,true)[0]?.object===v.shot;
  const powers=[...g.grid.cells.values()].filter(b=>b.type==='power');g.settle(powers);g.revision++;gardenGame.process();
  const collected=Object.values(g.inventory).reduce((a,b)=>a+b,0),flights=shelf.flights.length;
  gardenGame.process();const notDuplicated=shelf.flights.length===flights;
  ui.last='';ui.draw(g,state,v.time);shelf.update(ui.iconSlots,g,state,null,v.time+.4);gardenGame.compositor.draw();
  shelf.update(ui.iconSlots,g,state,null,v.time+2);const flightsExpired=shelf.flights.length===0;
  const poolCount=shelf.pool.length;
  for(let round=0;round<30;round++){
    shelf.collect('fire',new Vector3(0,5,BOARD.z),v.time);shelf.update(ui.iconSlots,g,state,null,v.time+2);
  }
  const bounded=shelf.pool.length===poolCount;
  celebrations.show(12);celebrations.update(.1,ui,state);const combo=celebrations.mesh.visible&&celebrations.label==='Amazing!';
  celebrations.update(2,ui,state);const comboExpires=!celebrations.mesh.visible;
  // A real rescue/food fixture exercises authoritative events and ten-food rewards.
  gardenGame.action('retry');g.grid.cells.clear();g.nextUnlock=999999;
  const roof=g.grid.put(0,9,{type:'normal',color:0});g.grid.put(1,8,{type:'animal',kind:'bunny',name:'Mochi'});g.grid.put(1,9,{type:'animal',kind:'fox',name:'Clementine'});
  for(let r=2;r<5;r++)for(let c=5;c<13;c++)g.grid.put(r,c,{type:'normal',color:(r+c)%5});g.settle([roof]);g.revision++;gardenGame.process();
  let bombPose=false,social=false,maxFlights=0;
  for(let i=0;i<2400;i++){
    g.updateGarden(.05);if(g.events.length)gardenGame.process();v.update(g,.05,trajectory(g.grid,0),null,null);
    shelf.update(ui.iconSlots,g,state,null,v.time);ambience.update(.05);pavilion.update(.05);
    for(const a of v.animals.values()){if(a.bombAt!==undefined)bombPose=true;if(a.socialUntil>=v.time)social=true;}
    maxFlights=Math.max(maxFlights,shelf.flights.length);
  }
  const meals=g.rescued.reduce((s,a)=>s+a.totalEaten,0),bombs=g.inventory.bomb;
  const traits=[...v.animals.values()].map(a=>a.personality);
  const visitors={normal:[ambience.visitors.wings.count,ambience.visitors.fireflies.count]};
  ambience.reduced=true;ambience.update(0);visitors.reduced=[ambience.visitors.wings.count,ambience.visitors.fireflies.count];
  const stateBefore=JSON.stringify(g.snapshot());for(let i=0;i<10;i++)v.update(g,0,trajectory(g.grid,0),null,null);
  const pauseUnchanged=stateBefore===JSON.stringify(g.snapshot());
  gardenGame.action('retry');const reset=shelf.flights.length===0&&!celebrations.mesh.visible&&v.collectibles.length===0;
  return{unchanged,firstHit,collected,flights,notDuplicated,flightsExpired,bounded,combo,comboExpires,meals,bombs,bombPose,social,traits,maxFlights,visitors,pauseUnchanged,reset};
 });
 assert.ok(result.unchanged&&result.firstHit);assert.equal(result.collected,3);assert.equal(result.flights,3);
 for(const key of ['notDuplicated','flightsExpired','bounded','combo','comboExpires','bombPose','pauseUnchanged','reset'])assert.ok(result[key],key);
 assert.equal(result.meals,24);assert.equal(result.bombs,2);assert.deepEqual(result.traits,['bunny','fox']);assert.deepEqual(result.visitors,{normal:[6,8],reduced:[2,3]});assert.ok(result.maxFlights<=16);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({...result,errors}));
}finally{await browser?.close();server.kill();}
