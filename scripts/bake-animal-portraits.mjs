import {spawn} from 'node:child_process';import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from '@playwright/test';import {writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4186','--strictPort'],{stdio:'ignore'});let browser;
try{
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:4186/game.html')).ok)break;}catch{}await delay(100);}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4186/game.html');await page.waitForFunction(()=>!!window.gardenGame,null,{timeout:90000});
 await page.evaluate(()=>gardenGame.action('play'));await page.waitForTimeout(150);
 assert.ok(await page.evaluate(()=>{
  const shot=gardenGame.view.shot,ray=new gardenThree.Raycaster(gardenP0.camera.position,shot.position.clone().sub(gardenP0.camera.position).normalize());
  const hits=ray.intersectObjects(gardenP0.scene.children,true).filter(h=>{for(let n=h.object;n;n=n.parent)if(!n.visible)return false;return h.object.isMesh;});return hits[0]?.object===shot;
 }), 'The flower does not obscure the current ball');
 const preview=await page.evaluate(()=>{const v=gardenGame.view,p=gardenGame.path,c=gardenGame.game.grid.position(...p.cell);return{error:Math.hypot(v.ghost.position.x-c.x,v.ghost.position.y-c.y),opacity:v.ghost.material.opacity};});
 assert.ok(preview.error<1e-6);assert.equal(preview.opacity,.4);
 const button=await page.evaluate(()=>gardenGame.ui.buttons.find(b=>b.id==='power:fire'));
 await page.mouse.move(button.x+5,button.y+5);await page.waitForTimeout(250);
 assert.equal(await page.evaluate(()=>gardenGame.view.dots.count),0);assert.equal(await page.evaluate(()=>gardenGame.view.ghost.visible),false);
 await page.mouse.click(button.x+5,button.y+5);assert.equal(await page.evaluate(()=>gardenGame.game.shots),0);
 await page.mouse.click(25,115);assert.equal(await page.evaluate(()=>gardenGame.game.shots),0,'HUD panel clicks never fire');
 await page.evaluate(()=>gardenP0.loop(()=>{}));
 const bytes=await page.evaluate(async()=>{const {bakePortraits}=await import('/src/portrait-baker.js');return bakePortraits(gardenP0.renderer,gardenGame.view.art,gardenP0.scene.environment);});
 await writeFile('public/experience/assets/animal-portraits.png',Buffer.from(bytes));assert.deepEqual(errors,[]);
 console.log('PASS: visible cannon ball, exact colored ghost, HUD aim suppression and click protection. Baked eight portraits from unchanged textured animal meshes.');
}finally{await browser?.close();server.kill();}
