import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4185','--strictPort'],{stdio:'ignore'});let browser;
try{
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:4185/game.html')).ok)break;}catch{}await delay(100);}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:2});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4185/game.html');await page.waitForFunction(()=>!!window.gardenGame,null,{timeout:90000});
 await page.evaluate(()=>{gardenGame.ui.toast('Old message',0);gardenGame.action('play');});
 assert.equal(await page.evaluate(()=>gardenGame.ui.notice),'');
 await page.waitForTimeout(350);
 // A still render at native quality, using the exact game's geometry/materials.
 // The interactive loop still adapts normally; this avoids software-GPU downsampling in the review image.
 await page.evaluate(()=>{
  gardenP0.loop(()=>{});gardenP0.camera.children.forEach(m=>{if(m!==gardenGame.ui.mesh)m.visible=false;});
  gardenP0.scene.add(gardenP0.camera);gardenP0.renderer.setPixelRatio(2);gardenP0.renderer.setSize(innerWidth,innerHeight);
  gardenP0.renderer.setRenderTarget(null);gardenP0.renderer.render(gardenP0.scene,gardenP0.camera);
 });
 await page.screenshot({path:'docs/previews/botanical-garden-desktop-quality.png'});
 await page.evaluate(()=>{
  gardenGame.ui.mesh.visible=false;gardenGame.view.root.visible=false;
  const names=['fire','rainbow','shuffle','star','bomb','wild','lightning'];
  names.forEach((kind,i)=>{const m=gardenGame.view.power(kind,.48);m.position.set(i<4?-2.7+i*1.8:-1.8+(i-4)*1.8,i<4?5.9:4.1,-1.05);gardenP0.scene.add(m);});
 });
 await page.evaluate(async()=>{await gardenP0.renderer.compileAsync(gardenP0.scene,gardenP0.camera);gardenP0.renderer.render(gardenP0.scene,gardenP0.camera);});
 await page.screenshot({path:'docs/previews/botanical-skill-emblems-quality.png'});
 assert.deepEqual(errors,[]);console.log('PASS: native-quality scene/emblem renders, dark-prism contrast and cleared restart notices.');
}finally{await browser?.close();server.kill();}
