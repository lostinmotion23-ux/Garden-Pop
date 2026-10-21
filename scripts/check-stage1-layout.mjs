import {spawn} from 'node:child_process';import {setTimeout as delay} from 'node:timers/promises';import {chromium} from '@playwright/test';import assert from 'node:assert/strict';
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4187','--strictPort'],{stdio:'ignore'});let browser;
try{
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:4187/game.html')).ok)break;}catch{}await delay(100);}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4187/game.html');await page.waitForFunction(()=>!!window.gardenGame,null,{timeout:90000});await page.evaluate(()=>gardenGame.action('play'));
 for(const [width,height]of [[1920,1080],[1600,900],[1366,768]]){
  await page.setViewportSize({width,height});try{await page.waitForFunction(({width,height})=>gardenP0.width===width&&gardenP0.height===height&&gardenGame.ui.buttons.every(r=>r.x+r.w<=width+1&&r.y+r.h<=height+1),{width,height},{timeout:60000});}catch(e){console.log('RESIZE DEBUG',await page.evaluate(()=>({width:innerWidth,height:innerHeight,p0:[gardenP0.width,gardenP0.height],out:gardenGame.ui.buttons.filter(r=>r.x+r.w>innerWidth+1||r.y+r.h>innerHeight+1),menu:gardenGame.state.menu})),errors);throw e;}
  const layout=await page.evaluate(()=>{
   const p=gardenP0.camera.position.clone(),a=p.clone().set(-3.75,8.8875,-1.6).project(gardenP0.camera),b=p.clone().set(3.75,2.3,-1.6).project(gardenP0.camera);
   const board={x:(a.x+1)*innerWidth/2,y:(1-a.y)*innerHeight/2,right:(b.x+1)*innerWidth/2,bottom:(1-b.y)*innerHeight/2};
   const overlap=gardenGame.ui.regions.filter(r=>r.x<board.right&&r.x+r.w>board.x&&r.y<board.bottom&&r.y+r.h>board.y);
   return{overlap,icons:gardenGame.ui.iconSlots.length,portraits:!!gardenGame.ui.portraitAtlas,slots:[...gardenGame.shelf.icons.values()].filter(m=>m.visible).length,
    out:gardenGame.ui.buttons.filter(r=>r.x<0||r.y<0||r.x+r.w>innerWidth+1||r.y+r.h>innerHeight+1).map(r=>r.id)};
  });
  assert.deepEqual(layout.overlap,[]);assert.deepEqual(layout.out,[]);assert.equal(layout.icons,7);assert.equal(layout.slots,7);assert.ok(layout.portraits);
  console.log(JSON.stringify({width,height,...layout}));
 }
 await page.screenshot({path:'docs/previews/stage1-hud-shelf-desktop.png'});
 assert.ok(await page.evaluate(()=>{const a=gardenGame.shelf.icons.get('fire').getObjectByProperty('isMesh',true);const b=gardenGame.view.powerTemplates.get('fire').getObjectByProperty('isMesh',true);return a.material!==b.material&&b.material.depthTest;}));
 await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>gardenP0.width===390&&gardenGame.ui.iconSlots.length===7);
 await page.evaluate(()=>gardenGame.action('journal'));await page.waitForTimeout(100);await page.screenshot({path:'docs/previews/stage1-rescue-journal.png'});
 assert.ok(await page.evaluate(()=>gardenGame.ui.buttons.some(b=>b.id==='journal-next')));
 await page.evaluate(()=>{gardenGame.action('back');gardenGame.action('resume');});
 assert.deepEqual(errors,[]);console.log('PASS: parchment HUD, unchanged-model portraits, genuine isolated 3D shelf icons, no board overlap at all three required resolutions and phone journal.');
}finally{await browser?.close();server.kill();}
