import {browserExecutable} from './browser-options.mjs';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';

const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4194','--strictPort'],{stdio:'ignore'});
let browser;
try {
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:4194/game.html')).ok)break;}catch{}await delay(100);}
 browser=await chromium.launch({executablePath:browserExecutable,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const mobile of [false,true]){
  const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1366,height:768},hasTouch:mobile,isMobile:mobile});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='warn'&&m.text().includes('THREE.Color'))errors.push(m.text());});
  await page.goto('http://127.0.0.1:4194/game.html');await page.waitForFunction(()=>!!window.gardenGame,null,{timeout:90000});
  await page.evaluate(()=>{
   gardenGame.action('play');const {game:g}=gardenGame;
   g.score=20000;g.inventory.wild=1;g.grid.cells.clear();
   for(let r=0;r<3;r++)for(let c=0;c<g.grid.width(r);c++)g.grid.put(r,c,{type:'normal',color:5});
   g.current=5;g.next=6;g.revision++;gardenGame.process();
  });
  const click=async(id)=>{
   await page.waitForFunction(id=>gardenGame.ui.buttons.some(b=>b.id===id),id);
   const b=await page.evaluate(id=>gardenGame.ui.buttons.find(b=>b.id===id),id);
   assert.ok(b.x>=0&&b.y>=0&&b.x+b.w<=(mobile?390:1366)&&b.y+b.h<=(mobile?844:768));
   if(mobile)await page.touchscreen.tap(b.x+b.w/2,b.y+b.h/2);else await page.mouse.click(b.x+b.w/2,b.y+b.h/2);
  };
  await click('power:wild');await click('color-next');await click('color:5');
  assert.equal(await page.evaluate(()=>gardenGame.state.selectedColor),5);
  const point=await page.evaluate(()=>{
   const p=gardenP0.camera.position.clone().set(0,5,-1.6).project(gardenP0.camera);
   return {x:(p.x+1)*gardenP0.width/2,y:(1-p.y)*gardenP0.height/2};
  });
  if(mobile)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
  await page.waitForFunction(()=>gardenGame.game.shots===1&&!gardenGame.flight,null,{timeout:45000});
  const result=await page.evaluate(()=>{
   const {game:g,view:v}=gardenGame;
   return {count:g.colorCount,popped:g.popped,wild:g.inventory.wild,render:v.palette[5].getHexString(),pop:v.popEffects.colors[5].getHexString()};
  });
  assert.equal(result.count,7);assert.ok(result.popped>=3);assert.equal(result.wild,0);assert.equal(result.render,result.pop);
  // Exercise generated colors beyond the hand-picked palette, then restart.
  await page.evaluate(()=>{
   const {game:g,view:v,path}=gardenGame;g.score=100000;g.current=14;g.next=13;g.grid.put(0,0,{type:'normal',color:14});g.revision++;
   v.update(g,0,path,null,null);v.popEffects.add([g.grid.get(0,0)],g.grid);v.popEffects.update(.01);
  });
  assert.ok(await page.evaluate(()=>gardenGame.view.palette[14]&&gardenGame.view.popEffects.colors[14]));
  await page.evaluate(()=>gardenGame.action('retry'));
  assert.deepEqual(await page.evaluate(()=>[gardenGame.game.colorCount,gardenGame.state.selectedColor,gardenGame.ui.colorPage]),[5,0,0]);
  assert.deepEqual(errors,[]);
  console.log(`PASS: ${mobile?'phone touch':'desktop mouse'} unlocked Wild picker, new-color matching/rendering/pop effects, generated palette and restart.`);
  await page.close();
 }
} finally {await browser?.close();server.kill();}
