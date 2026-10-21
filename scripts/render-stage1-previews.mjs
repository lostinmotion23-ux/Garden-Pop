import {browserExecutable} from './browser-options.mjs';
import {chromium} from '@playwright/test';import {spawn} from 'node:child_process';import {setTimeout as delay} from 'node:timers/promises';import {readFile,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4189','--strictPort'],{stdio:'ignore'});let browser;
try{
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:4189/game.html')).ok)break;}catch{}await delay(100);}
 browser=await chromium.launch({executablePath:browserExecutable,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text());});
 await page.goto('http://127.0.0.1:4189/game.html');await page.waitForFunction(()=>!!window.gardenGame,null,{timeout:90000});await page.evaluate(()=>gardenGame.action('play'));
 const perf=await page.evaluate(async()=>{const frames=[];let last=performance.now();for(let i=0;i<20;i++){await new Promise(requestAnimationFrame);const now=performance.now();frames.push(now-last);last=now;}return{renderer:'Chromium SwiftShader software GPU',frames:frames.length,meanMs:frames.reduce((a,b)=>a+b)/frames.length,worstMs:Math.max(...frames),...gardenP0.renderer.info.render,target:[gardenGame.compositor.target.width,gardenGame.compositor.target.height]};});
 const replay=JSON.parse(await readFile('.local/game-continuous-replay.json','utf8'));
 await page.evaluate(async replay=>{
  gardenP0.loop(()=>{});const {trajectory}=await import('/src/experience/game/rules.js');const {game:g,view:v,ui,state}=gardenGame;
  for(const step of replay.shots){if(step.swap)g.swap();g.fire(trajectory(g.grid,step.angle));const events=g.events.splice(0);v.sync(g);v.events(events,g);for(const e of events)if(e.type==='rescue')ui.markRescue(e.animal.kind,v.time);for(let i=0;i<20;i++){g.updateGarden(.05);const events=g.events.splice(0);v.sync(g);v.events(events,g);v.update(g,.05,trajectory(g.grid,0),null,null);}if(g.rescued.length>=2)break;}
  for(let i=0;i<20;i++){g.updateGarden(.05);const events=g.events.splice(0);v.sync(g);v.events(events,g);v.update(g,.05,trajectory(g.grid,0),null,null);}
  v.aimActive=true;v.update(g,0,trajectory(g.grid,.2),null,null);ui.last='';ui.draw(g,state,v.time);gardenGame.shelf.update(ui.iconSlots,g,state,null,v.time);
  gardenGame.compositor.target.setSize(innerWidth,innerHeight);gardenGame.compositor.draw();
 },replay);
 await page.screenshot({path:'docs/previews/stage1-garden-desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>gardenP0.width===390);
 await page.evaluate(()=>{const {game:g,ui,state,view:v}=gardenGame;ui.last='';ui.draw(g,state,v.time);gardenGame.shelf.update(ui.iconSlots,g,state,null,v.time);gardenGame.compositor.target.setSize(innerWidth,innerHeight);gardenGame.compositor.draw();});
 await page.screenshot({path:'docs/previews/stage1-garden-phone.png'});
 await writeFile('.local/stage1-performance.json',JSON.stringify(perf,null,2));assert.deepEqual(errors,[]);console.log(JSON.stringify({perf,errors}));
}finally{await browser?.close();server.kill();}
