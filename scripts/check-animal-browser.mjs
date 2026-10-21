import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1536,height:1120},deviceScaleFactor:1}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4176/animal-art.html');await page.waitForSelector('body[data-ready=true]',{timeout:60000});
 await mkdir('docs/previews',{recursive:true});
 for(const pose of ['Smile','Shock','Sad','Blink']){
  await page.evaluate(p=>{artReview.setTime(0);artReview.setPose(p)},pose);await page.waitForTimeout(350);
  assert.ok(await page.evaluate(p=>artReview.models.every(({mesh})=>mesh.morphTargetInfluences[mesh.morphTargetDictionary[p]]>0),pose));
  await page.screenshot({path:`docs/previews/mesh-animals-${pose.toLowerCase()}.png`});
 }
 await page.evaluate(()=>{artReview.setPose('Smile');artReview.setTime(1.3)});
 assert.ok(await page.evaluate(()=>artReview.models[0].mesh.morphTargetInfluences[0])>.8,'Timed blink');
 const stats=await page.evaluate(()=>({animals:artReview.models.length,triangles:artReview.renderer.info.render.triangles,textured:artReview.models.every(({mesh})=>!!mesh.material.map&&!!mesh.material.normalMap&&!!mesh.material.roughnessMap)}));assert.equal(stats.animals,7);assert.ok(stats.textured);
 await page.goto('http://127.0.0.1:4176/game.html');await page.waitForFunction(()=>window.gardenGame?.view,{timeout:60000});
 await page.evaluate(()=>{const g=gardenGame;g.view.events([{type:'miss'}],g.game);g.view.showcase=true;});await page.waitForTimeout(350);
 const reactions=await page.evaluate(()=>{const v=gardenGame.view;return {expression:v.expression,weights:v.mascots[0].children[0].morphTargetInfluences.slice(),dictionary:v.mascots[0].children[0].morphTargetDictionary};});
 assert.equal(reactions.weights[reactions.dictionary.Sad],1);
 await page.screenshot({path:'docs/previews/mesh-animals-game-menu.png'});
 assert.deepEqual(errors,[]);await writeFile('docs/animal-art-verification.json',JSON.stringify({stats,poses:['Smile','Shock','Sad','Blink'],timedBlink:true,gameLoading:true,errors},null,2)+'\n');console.log(JSON.stringify({stats,poses:'passed',gameLoading:'passed',errors}));
}finally{await browser.close();}
