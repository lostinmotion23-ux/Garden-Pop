import { chromium, expect } from '@playwright/test';
import { createServer } from 'vite';
import { mkdir, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const server=await createServer({server:{host:'127.0.0.1',port:4174,strictPort:true}});
let browser;
try {
 await server.listen();
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:1});
 const published=process.env.EXTERIOR_PUBLISHED_MODEL;
 const prefix=published?'exterior-live':'exterior';
 if(published){const body=await readFile(published);await page.route('**/lot/lod0.glb',route=>route.fulfill({body,contentType:'model/gltf-binary'}));}
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await mkdir('docs/previews',{recursive:true});
 await page.goto('http://127.0.0.1:4174/?street=1');
 await page.waitForSelector('body[data-ready="true"]',{timeout:60000});
 await page.evaluate(()=>{const g=window.garden;g.controls.autoRotate=false;g.setTime(0);g.camera.position.set(3.4,8.0,25);g.controls.target.set(0,5.15,0);g.controls.update();});
 await page.waitForTimeout(800);
 const rendered=await page.evaluate(()=>window.garden.renderer.info.render.triangles);
 assert.ok(rendered>20000,'Detailed genuine 3D geometry must render');
 await page.screenshot({path:`docs/previews/${prefix}-street-front.png`});
 await page.evaluate(()=>{window.garden.camera.position.set(-18,10,20);window.garden.controls.update();});
 await page.waitForTimeout(400);
 await page.screenshot({path:`docs/previews/${prefix}-street-angle.png`});
 await page.goto('http://127.0.0.1:4174/');
 await page.waitForSelector('body[data-ready="true"]',{timeout:60000});
 await page.evaluate(()=>{const g=window.garden;g.controls.autoRotate=false;g.setTime(0);});
 await page.waitForTimeout(700);
 for(let i=0;i<7;i++){
  const point=await page.evaluate(i=>{const g=window.garden,p=g.pickables[i].position.clone().project(g.camera),r=g.renderer.domElement.getBoundingClientRect();return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2,name:g.metadata.animals[i].name};},i);
  await page.mouse.click(point.x,point.y);
  await expect(page.locator('#animal-name')).toHaveText(point.name,{timeout:10000});
  assert.ok(await page.locator('#animal-card').isVisible());
  await page.locator('#close-card').click();
 }
 const before=await page.evaluate(()=>window.garden.model.getObjectByName('Mochi').position.y);
 await page.evaluate(()=>window.garden.setTime(1));
 const after=await page.evaluate(()=>{const g=window.garden;return {node:g.model.getObjectByName('Mochi').position.y,pick:g.pickables[0].position.y};});
 assert.notEqual(before,after.node);assert.equal(after.node,after.pick);
 await page.locator('#rotate').click();assert.equal(await page.locator('#rotate').getAttribute('aria-pressed'),'true');
 await page.locator('#reset').click();
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Phone horizontal overflow');
 await page.screenshot({path:`docs/previews/${prefix}-gallery-phone.png`,fullPage:true});
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({renderedTriangles:rendered,animalsPicked:7,decorativeMotion:'passed',streetCaptures:2,phone:'passed',errors}));
}finally{await browser?.close();await server.close();}
