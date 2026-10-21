import {browserExecutable} from './browser-options.mjs';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4188','--strictPort'],{stdio:'ignore'});let browser;
try{
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:4188/game.html')).ok)break;}catch{}await delay(100);}
 browser=await chromium.launch({executablePath:browserExecutable,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text());});
 await page.goto('http://127.0.0.1:4188/game.html');await page.waitForFunction(()=>!!window.gardenGame,null,{timeout:90000});await page.evaluate(()=>gardenGame.action('play'));
 const environment=await page.evaluate(()=>{const lamps=gardenP0.scene.children.filter(o=>o.name==='SwingingLantern');return {blossoms:gardenP0.scene.userData.botanical.blossoms,lamps:lamps.length,angle:lamps[0].rotation.z,ground:!!gardenP0.scene.getObjectByName('BotanicalGarden').children.find(m=>m.material?.map?.repeat.x===10)};});
 assert.equal(environment.lamps,2);assert.ok(environment.blossoms>3000&&environment.ground);
 await page.mouse.move(800,360);await page.waitForFunction(()=>gardenGame.view.ghost.visible);
 const aim=await page.evaluate(()=>{const {game,view,path}=gardenGame,p=game.grid.position(...path.cell);return{error:Math.hypot(p.x-view.ghost.position.x,p.y-view.ghost.position.y),opacity:view.ghost.material.opacity,dotOpacity:view.dots.material.opacity};});
 assert.equal(aim.error,0);assert.equal(aim.opacity,.4);assert.equal(aim.dotOpacity,.72);
 const before=await page.evaluate(()=>[gardenGame.game.current,gardenGame.game.next]);await page.mouse.click(800,360,{button:'right'});
 assert.deepEqual(await page.evaluate(()=>[gardenGame.game.current,gardenGame.game.next]),before.toReversed());await page.mouse.click(800,360,{button:'right'});
 // Multiple releases during one flight resolve just one shot.
 await page.mouse.click(800,360,{clickCount:5,delay:2});await page.waitForFunction(()=>gardenGame.game.shots===1&&!gardenGame.flight,null,{timeout:45000});
 const hud=await page.evaluate(()=>gardenGame.ui.buttons.find(b=>b.id==='power:fire'));await page.mouse.click(hud.x+hud.w/2,hud.y+hud.h/2);
 assert.equal(await page.evaluate(()=>gardenGame.game.shots),1);await page.waitForFunction(()=>!gardenGame.view.ghost.visible);
 const result=await page.evaluate(async()=>{
  const {BOARD,Game,trajectory,COLORS}=await import('/src/experience/game/rules.js');
  const {game:g,view:v,ui,state}=gardenGame;
  gardenP0.loop(()=>{});
  const saved=g.snapshot();
  let bounceGhost=true;
  for(const angle of [-1.3,-.6,0,.6,1.3]){
    const path=trajectory(g.grid,angle);v.aimActive=true;v.update(g,0,path,null,null);
    const pos=g.grid.position(...path.cell);bounceGhost&&=v.ghost.visible&&Math.hypot(pos.x-v.ghost.position.x,pos.y-v.ghost.position.y)<1e-9;
  }
  if(!bounceGhost)throw new Error('Bounce ghost disagrees with analytic snap cell');
  g.grid.cells.clear();g.nextUnlock=999999;
  const roof=g.grid.put(0,9,{type:'normal',color:0});
  g.grid.put(1,8,{type:'animal',kind:'bunny',name:'Mochi'});g.grid.put(1,9,{type:'animal',kind:'fox',name:'Clementine'});
  for(let r=2;r<5;r++)for(let c=5;c<13;c++)g.grid.put(r,c,{type:'normal',color:(r+c)%5});
  g.settle([roof]);g.revision++;const rescueEvents=g.events.splice(0);v.sync(g);v.events(rescueEvents,g);
  let mealIds=new Set(),duplicates=0,bombEvents=0,chewing=false,celebrating=false,detour=false;
  for(let i=0;i<2400;i++){
   g.updateGarden(.05);const events=g.events.splice(0);v.sync(g);v.events(events,g);
   for(const e of events){if(e.type==='eat'){if(mealIds.has(e.bubble.id))duplicates++;mealIds.add(e.bubble.id);}if(e.type==='bomb')bombEvents++;}
   v.update(g,.05,trajectory(g.grid,0),null,null);
   for(const a of v.animals.values()){
    if(a.celebratingUntil>v.time)celebrating=true;
    if(a.eatingUntil>v.time&&a.object.userData.animal.children[0].morphTargetInfluences[2]!==undefined)chewing=true;
    if(Math.abs(a.object.position.x)<.5&&a.object.position.z<BOARD.z-.7)detour=true;
   }
  }
  const eaten=g.rescued.reduce((n,a)=>n+a.totalEaten,0),expected=g.rescued.reduce((n,a)=>n+Math.floor(a.totalEaten/10),0);
  const feeding={eaten,remaining:g.ground.length,duplicates,bombEvents,bombs:g.inventory.bomb,expected,chewing,celebrating,detour};
  // Real production shader compilation while ripples/particles have nonzero counts.
  v.popEffects.add(Array.from({length:30},(_,i)=>({type:'normal',color:i%5,r:2,c:i%19})),g.grid);
  v.update(g,.08,trajectory(g.grid,0),null,null);const matrix=v.popEffects.bubbles.instanceMatrix.array;
  const expansion=Math.hypot(matrix[0],matrix[1],matrix[2]);
  v.update(g,.09,trajectory(g.grid,0),null,null);gardenGame.compositor.draw();
  const ripple=v.popEffects.ripples.count,particles=v.particles.length;
  for(let i=0;i<60;i++)v.update(g,.02,trajectory(g.grid,0),null,null);
  const expired=v.popEffects.active.length===0&&v.particles.length===0&&v.popEffects.free.length===512&&v.particlePool.length===1536;
  v.burst(0,5,COLORS[2],30);v.popEffects.add([{type:'normal',color:2,r:2,c:9}],g.grid);v.resetEffects();
  const clean=v.popEffects.free.length===512&&v.particlePool.length===1536&&v.particleMesh.count===0&&v.collectibles.length===0;
  g.restore(saved);v.sync(g);v.update(g,0,trajectory(g.grid,0),null,null);
  return{feeding,expansion,ripple,particles,expired,clean,diameter:v.sphere.parameters.radius*2};
 });
 assert.equal(result.diameter,.375);assert.ok(result.expansion>1&&result.expansion<1.11);assert.equal(result.ripple,30);assert.ok(result.particles>0&&result.expired&&result.clean);
 assert.equal(result.feeding.eaten,24);assert.equal(result.feeding.remaining,0);assert.equal(result.feeding.duplicates,0);assert.equal(result.feeding.bombs,result.feeding.expected);assert.equal(result.feeding.bombEvents,result.feeding.expected);assert.ok(result.feeding.chewing&&result.feeding.celebrating&&result.feeding.detour);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({environment,aim,rapidClicksOneShot:true,hudNeverFires:true,...result,errors}));
}finally{await browser?.close();server.kill();}
