import {browserExecutable} from './browser-options.mjs';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';

const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4193','--strictPort'],{stdio:'ignore'});
let browser;
try {
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:4193/game.html')).ok)break;}catch{}await delay(100);}
 browser=await chromium.launch({executablePath:browserExecutable,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const mobile of [false,true]){
  const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1366,height:768},hasTouch:mobile,isMobile:mobile});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4193/game.html');
  await page.waitForFunction(()=>!!window.gardenGame,null,{timeout:90000});
  await page.evaluate(()=>{
   gardenGame.action('play');const {game:g,ui,state}=gardenGame;
   g.inventory.fire=2;g.revision++;ui.draw(g,state,0);
  });
  const button=await page.evaluate(()=>gardenGame.ui.buttons.find(b=>b.id==='power:fire'));
  const tap=async(x,y)=>mobile?page.touchscreen.tap(x,y):page.mouse.click(x,y);
  await tap(button.x+button.w/2,button.y+button.h/2);
  await page.waitForFunction(()=>gardenGame.game.selected==='fire');
  const point=await page.evaluate(()=>{
   const p=gardenP0.camera.position.clone().set(0,5,-1.6).project(gardenP0.camera);
   return {x:(p.x+1)*gardenP0.width/2,y:(1-p.y)*gardenP0.height/2};
  });
  await page.mouse.move(point.x,point.y);
  await page.waitForFunction(()=>gardenGame.view.firePreview.count>0);
  const before=await page.evaluate(()=>{
   const {game:g,view:v,path}=gardenGame;
   return {popped:g.popped,shots:g.shots,targets:g.fireTargets(path).map(b=>b.id),rings:v.firePreview.count,shot:v.fireShot.visible,normal:v.shot.visible,dots:v.dots.count};
  });
  assert.equal(before.rings,before.targets.length);assert.ok(before.rings<=5&&before.shot&&!before.normal&&before.dots>0);
  await tap(point.x,point.y);
  await page.waitForFunction(shots=>gardenGame.game.shots===shots+1&&!gardenGame.flight,before.shots,{timeout:45000});
  const after=await page.evaluate(()=>{
   const {game:g,view:v}=gardenGame;
   return {popped:g.popped,inventory:g.inventory.fire,selected:g.selected,ids:[...g.grid.cells.values()].map(b=>b.id),rings:v.firePreview.count};
  });
  assert.equal(after.inventory,1);assert.equal(after.selected,null);assert.equal(after.rings,0);
  assert.ok(after.popped-before.popped<=5);assert.ok(before.targets.every(id=>!after.ids.includes(id)));
  // High score still shows fire's effect area even after normal guides fade.
  await page.evaluate(()=>{
   const {game:g,view:v,path}=gardenGame;g.score=100000;g.select('fire');v.aimActive=true;v.update(g,5,path,null,null);
  });
  assert.ok(await page.evaluate(()=>gardenGame.view.firePreview.count>0&&gardenGame.view.dots.count>0));
  assert.deepEqual(errors,[]);
  console.log(`PASS: ${mobile?'touch':'mouse'} fire selection, preview, launch, first-hit resolution, five-bubble limit and high-score preview.`);
  await page.close();
 }
} finally {await browser?.close();server.kill();}
