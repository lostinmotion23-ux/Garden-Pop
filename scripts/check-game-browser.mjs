import {browserExecutable} from './browser-options.mjs';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Game, trajectory, BOARD } from '../src/experience/game/rules.js';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4177','--strictPort'],{stdio:'ignore'});
let browser;
try{
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:4177/game.html')).ok)break;}catch{}await delay(100);}
 browser=await chromium.launch({executablePath:browserExecutable,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:960,height:600},deviceScaleFactor:1}),page=await context.newPage(),errors=[],bad=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().includes('favicon'))bad.push(r.url());});
 await page.goto('http://127.0.0.1:4177/game.html');await page.waitForFunction(()=>!!window.gardenGame,null,{timeout:60000});
 const click=async(id)=>{await page.waitForFunction(id=>gardenGame.ui.buttons.some(b=>b.id===id),id);const b=await page.evaluate(id=>gardenGame.ui.buttons.find(b=>b.id===id),id);await page.mouse.click(b.x+b.w/2,b.y+b.h/2);await page.waitForTimeout(100);};
 await click('settings');await click('music');await click('sfx');await click('back');await click('help');await page.screenshot({path:'.local/continuous-help.png'});await click('back');await click('play');
 assert.equal(await page.evaluate(()=>gardenGame.game.grid.width(0)),20);
 assert.equal(await page.evaluate(()=>[...gardenGame.game.grid.cells.values()].filter(b=>b.type==='power').length),3);
 const material=await page.evaluate(()=>({physical:gardenGame.view.bubbles.material.isMeshPhysicalMaterial,film:!!gardenGame.view.bubbles.material.map,environment:!!gardenP0.scene.environment,
  woodNormal:[...gardenGame.view.art.materials.values()].some(m=>m.normalMap&&m.map)}));
 assert.deepEqual(material,{physical:true,film:true,environment:true,woodNormal:true});
 const colors=await page.evaluate(()=>[gardenGame.game.current,gardenGame.game.next]);await page.mouse.click(480,350,{button:'right'});
 assert.deepEqual(await page.evaluate(()=>[gardenGame.game.current,gardenGame.game.next]),colors.toReversed());await page.mouse.click(480,350,{button:'right'});
 await page.screenshot({path:'.local/continuous-garden-desktop.png'});
 const shoot=async(angle,touch=false)=>{
  const p=await page.evaluate(({angle,y,z})=>{const p=gardenP0.camera.position.clone().set(Math.sin(angle)*2.4,y+Math.cos(angle)*2.4,z).project(gardenP0.camera);return{x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2,shots:gardenGame.game.shots};},{angle,y:BOARD.launcher,z:BOARD.z});
  if(touch){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x+4,y:p.y+5}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x,y:p.y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
  else { await page.mouse.move(p.x,p.y); await page.mouse.down(); await page.mouse.up(); }
  try { await page.waitForFunction(n=>gardenGame.game.shots===n+1&&!gardenGame.flight,p.shots,{timeout:45000}); } catch(e) { console.log('FAILED SHOT',angle,p,await page.evaluate(()=>({shots:gardenGame.game.shots,menu:gardenGame.state.menu,status:gardenGame.game.status,flight:gardenGame.flight,path:gardenGame.path,pointer:gardenP0.input.pointer}))); await page.screenshot({path:'.local/continuous-input-debug.png'}); throw e; }
 };
 const replay=JSON.parse(await readFile('.local/game-continuous-replay.json','utf8'));let rescuedAt=-1;
 for(let i=0;i<replay.shots.length;i++){
  const step=replay.shots[i];if(step.swap)await page.mouse.click(480,350,{button:'right'});await shoot(step.angle);
  assert.equal(await page.evaluate(()=>gardenGame.game.status),'playing');assert.equal(await page.evaluate(()=>gardenGame.state.menu),null);
  assert.equal(await page.evaluate(()=>[...gardenGame.game.grid.cells.values()].filter(b=>b.type==='power').length),3);
  const pets=await page.evaluate(()=>gardenGame.game.rescued.length);
  if(pets&&rescuedAt<0){rescuedAt=i;await page.waitForTimeout(3000);assert.equal(await page.evaluate(()=>gardenGame.state.menu),null);}
  if(pets>=2&&i-rescuedAt>=8)break;
 }
 assert.ok(await page.evaluate(()=>gardenGame.game.rescued.length>=2));assert.equal(await page.evaluate(()=>gardenP0.wins??0),0);
 assert.ok(await page.evaluate(()=>[...gardenGame.view.animals.values()].every(a=>a.object.visible&&a.object.userData.animal.visible)));
 await page.screenshot({path:'.local/continuous-garden-rescued-pets.png'});
 await click('pause');const paused=await page.evaluate(()=>gardenGame.game.gardenTime);await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>gardenGame.game.gardenTime),paused);await click('resume');
 console.log('PASS: real shots rescue multiple pets without ending play; three skills stay visible; PBR textures/reflections, swap and pause work.');
 await page.keyboard.press('KeyR');let count=0;
 while(await page.evaluate(()=>gardenGame.game.status==='playing')){
  assert.ok(count++<55);const snap=await page.evaluate(()=>gardenGame.game.snapshot()),g=new Game().restore(snap);let selected;
  for(let a=-1.25;a<=1.25;a+=.06){const p=trajectory(g.grid,a);if(!p.cell)continue;const copy=new Game().restore(snap);copy.fire(p);if(copy.misses>g.misses&&(!selected||copy.grid.maxRow()>selected.row))selected={angle:a,row:copy.grid.maxRow()};}
  assert.ok(selected);await shoot(selected.angle);
  assert.equal(await page.evaluate(()=>gardenGame.game.rows),Math.floor((g.misses+1)/2));
 }
 await page.waitForFunction(()=>gardenGame.state.menu==='lost',null,{timeout:45000});assert.equal(await page.evaluate(()=>gardenP0.lastScore),await page.evaluate(()=>gardenGame.game.score));await click('retry');
 // Every skill kind is now exercised/replaced during normal play; retries reuse cached meshes.
 for(let i=0;i<3;i++)await page.keyboard.press('KeyR');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(350);
 await page.screenshot({path:'.local/continuous-garden-phone.png'});
 for(const step of replay.shots.slice(0,4)){if(step.swap)await click('swap');await shoot(step.angle,true);}
 assert.equal(await page.evaluate(()=>gardenGame.game.shots),4);assert.equal(await page.evaluate(()=>gardenGame.game.status),'playing');
 await click('pause');await page.setViewportSize({width:640,height:360});await page.waitForTimeout(250);await page.screenshot({path:'.local/continuous-garden-short-screen.png'});await click('resume');
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);console.log(JSON.stringify({continuousRescues:true,threeSkills:true,physicalTextures:true,realMissesReachGameOver:true,touch:true,errors,bad}));
}finally{await browser?.close();server.kill();}
