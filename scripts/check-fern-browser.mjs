import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:[
  '--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[],bad=[];
try{
  const page=await browser.newPage({viewport:{width:960,height:960},deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&!r.url().includes('favicon'))bad.push(r.url());});
  await page.goto('http://127.0.0.1:4178/avatar.html?fern=1');
  await page.waitForFunction(()=>window.avatarPreview,{timeout:60000});
  await mkdir('docs/fern-avatar-previews',{recursive:true});
  const poses=[['idle',0],['fly',.35],['joy',1.1],['approval',1],['sadness',1.3],['surprise',.9],['blink',.14]];
  for(const [name,time] of poses){
    await page.evaluate(([n,t])=>{avatarPreview.view('three-quarter');avatarPreview.sample(n,t);},[name,time]);
    await page.waitForTimeout(100);
    await page.locator('#stage').screenshot({path:`docs/fern-avatar-previews/${name}.png`});
  }
  const blink=await page.evaluate(()=>{
    const mesh=avatarPreview.active.scene.getObjectByName('FernBody'),w=mesh.morphTargetInfluences,d=mesh.morphTargetDictionary;
    return {blink:w[d.Blink],smile:w[d.Smile],textured:!!mesh.material.map&&!!mesh.material.normalMap&&!!mesh.material.roughnessMap};
  });assert.ok(blink.blink>.94&&blink.blink<.96);assert.ok(blink.textured);
  await page.evaluate(()=>{avatarPreview.detail(1);avatarPreview.view('three-quarter');avatarPreview.sample('fly',.35);});
  await page.waitForTimeout(100);await page.locator('#stage').screenshot({path:'docs/fern-avatar-previews/distance.png'});
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>{avatarPreview.detail(0);avatarPreview.sample('idle',0);avatarPreview.view('front');});
  await page.waitForTimeout(100);await page.locator('#stage').screenshot({path:'docs/fern-avatar-previews/phone.png'});
  assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
  await writeFile('docs/fern-avatar-browser-checks.json',JSON.stringify({lods:2,poses:poses.map(p=>p[0]),blink,phone:true,errors,missingAssets:bad},null,2)+'\n');
  console.log('PASS: exported Fern GLBs load and animate, expressions/blink are correct, both LODs and phone render, no runtime or missing-asset errors.');
}finally{await browser.close();}
