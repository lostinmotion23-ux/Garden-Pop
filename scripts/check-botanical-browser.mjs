import {browserExecutable} from './browser-options.mjs';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {BOARD} from '../src/experience/game/rules.js';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4184','--strictPort'],{stdio:'ignore'});
let browser;
try{
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:4184/game.html')).ok)break;}catch{}await delay(100);}
 browser=await chromium.launch({executablePath:browserExecutable,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:960,height:600},deviceScaleFactor:1}),page=await context.newPage(),errors=[],bad=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().includes('favicon'))bad.push(r.url());});
 await page.goto('http://127.0.0.1:4184/game.html');await page.waitForFunction(()=>!!window.gardenGame,null,{timeout:90000});
 const click=async(id)=>{await page.waitForFunction(id=>gardenGame.ui.buttons.some(b=>b.id===id),id);const b=await page.evaluate(id=>gardenGame.ui.buttons.find(b=>b.id===id),id);await page.mouse.click(b.x+b.w/2,b.y+b.h/2);await page.waitForTimeout(100);};
 await click('play');
 const scene=await page.evaluate(()=>({botanical:gardenP0.scene.userData.botanical,
  blossoms:gardenP0.scene.getObjectByName('CherryBlossoms').count,
  leaves:gardenP0.scene.getObjectByName('VeinedFoliage').count,
  glass:gardenP0.scene.getObjectByName('GardenGlass').material.opacity,
  skills:[...gardenGame.game.grid.cells.values()].filter(b=>b.type==='power').length,
  atlas:!!gardenGame.ui.skillAtlas,diameter:gardenGame.view.sphere.parameters.radius*2,
  petalNormal:!!gardenP0.scene.getObjectByName('CherryBlossoms').material.normalMap}));
 assert.ok(scene.blossoms>3000&&scene.leaves>1000);assert.equal(scene.glass,.38);assert.equal(scene.skills,3);
 assert.equal(scene.diameter,BOARD.diameter);assert.ok(scene.atlas&&scene.petalNormal);
 await page.screenshot({path:'docs/previews/botanical-garden-desktop.png'});
 const colors=await page.evaluate(()=>[gardenGame.game.current,gardenGame.game.next]);
 await page.mouse.click(480,350,{button:'right'});assert.deepEqual(await page.evaluate(()=>[gardenGame.game.current,gardenGame.game.next]),colors.toReversed());await page.mouse.click(480,350,{button:'right'});
 const shoot=async(angle,touch=false)=>{
  const p=await page.evaluate(({angle,y,z})=>{const p=gardenP0.camera.position.clone().set(Math.sin(angle)*2.4,y+Math.cos(angle)*2.4,z).project(gardenP0.camera);return{x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2,shots:gardenGame.game.shots};},{angle,y:BOARD.launcher,z:BOARD.z});
  if(touch){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x+4,y:p.y+5}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x,y:p.y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
  else{await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.up();}
  await page.waitForFunction(n=>gardenGame.game.shots===n+1&&!gardenGame.flight,p.shots,{timeout:60000});
 };
 const replay=JSON.parse(await readFile('.local/game-continuous-replay.json','utf8'));let first=-1;
 for(let i=0;i<replay.shots.length;i++){
  const step=replay.shots[i];if(step.swap)await page.mouse.click(480,350,{button:'right'});await shoot(step.angle);
  const state=await page.evaluate(()=>({pets:gardenGame.game.rescued.length,status:gardenGame.game.status,menu:gardenGame.state.menu,skills:[...gardenGame.game.grid.cells.values()].filter(b=>b.type==='power').length}));
  assert.equal(state.status,'playing');assert.equal(state.menu,null);assert.equal(state.skills,3);
  if(state.pets&&first<0)first=i;if(first>=0&&i-first>=3)break;
 }
 assert.ok(first>=0);await page.screenshot({path:'docs/previews/botanical-garden-playing.png'});
 // Render every finished power at large scale using the actual production meshes/materials.
 await page.evaluate(()=>{
  gardenGame.action('pause');gardenGame.ui.mesh.visible=false;gardenGame.view.root.visible=false;
  const powers=['fire','rainbow','shuffle','star','bomb','wild','lightning'];
  window.skillGallery=[];
  powers.forEach((kind,i)=>{const m=gardenGame.view.power(kind,.48);m.position.set(i<4?-2.7+i*1.8:-1.8+(i-4)*1.8,i<4?5.9:4.1,-1.05);gardenP0.scene.add(m);skillGallery.push(m);});
 });
 await page.waitForTimeout(600);await page.screenshot({path:'docs/previews/botanical-skill-emblems.png'});
 await page.evaluate(()=>{skillGallery.forEach(m=>m.removeFromParent());gardenGame.view.root.visible=true;gardenGame.ui.mesh.visible=true;gardenGame.action('resume');gardenGame.action('retry');});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);await page.screenshot({path:'docs/previews/botanical-garden-phone.png'});
 for(const step of replay.shots.slice(0,3)){if(step.swap)await click('swap');await shoot(step.angle,true);}
 assert.equal(await page.evaluate(()=>gardenGame.game.shots),3);
 await click('pause');const time=await page.evaluate(()=>gardenGame.game.gardenTime);await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>gardenGame.game.gardenTime),time);await click('resume');
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
 console.log(JSON.stringify({scene,realShotsContinueAfterRescue:true,swap:true,touch:true,pause:true,sevenSkillMeshesRendered:true,errors,bad}));
}finally{await browser?.close();server.kill();}
