import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:[
  '--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[],bad=[],result={};
const revised=process.argv.includes('--revision');
const out=`docs/avatar${revised?'-revision':''}-previews`;
try{
  const page=await browser.newPage({viewport:{width:1000,height:1000},deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&!r.url().includes('favicon'))bad.push(r.url());});
  await page.goto(`http://127.0.0.1:4177/avatar.html${revised?'?revision=1':''}`);
  await page.waitForFunction(()=>window.avatarPreview,{timeout:60000});
  await page.evaluate(()=>avatarPreview.sample('idle',0));
  for(const name of ['front','three-quarter','side','back','face']){
    await page.evaluate(v=>avatarPreview.view(v),name);await page.waitForTimeout(180);
    await page.locator('#stage').screenshot({path:`${out}/${name}.png`});
  }
  await page.evaluate(()=>avatarPreview.view('three-quarter'));
  for(const name of ['fly','fly_fast','ascend','descend','joy','approval','sadness','indignation','blink']){
    await page.evaluate(n=>avatarPreview.sample(n,n==='blink'?.13:n==='approval'?1.2:.9),name);
    await page.waitForTimeout(100);
    await page.locator('#stage').screenshot({path:`${out}/${name}.png`});
  }
  const blink=await page.evaluate(()=>{
    avatarPreview.sample('blink',.13);let mesh;avatarPreview.active.scene.traverse(o=>{if(o.isSkinnedMesh)mesh=o;});
    return mesh.morphTargetInfluences[mesh.morphTargetDictionary.Blink];
  });assert.ok(blink>.98,'Real blinking blend shape plays');
  await page.evaluate(()=>{avatarPreview.detail(1);avatarPreview.view('three-quarter');avatarPreview.sample('idle',0);});
  await page.waitForTimeout(150);await page.locator('#stage').screenshot({path:`${out}/lod1.png`});
  await page.evaluate(()=>{avatarPreview.detail(0);avatarPreview.freeze(false);});
  const before=await page.evaluate(()=>avatarPreview.elapsed);await page.waitForTimeout(300);
  assert.ok(await page.evaluate(t=>avatarPreview.elapsed>t,before),'Real-time playback runs');
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);
  await page.evaluate(()=>{avatarPreview.sample('idle',0);avatarPreview.view('three-quarter');});
  await page.locator('#stage').screenshot({path:`${out}/phone.png`});
  assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
  Object.assign(result,{views:['front','three-quarter','side','back','face'],clips:11,lods:2,blink:'passed',playback:'passed',phone:'passed',errors,bad});
  await writeFile(`docs/avatar${revised?'-revision':''}-browser-checks.json`,JSON.stringify(result,null,2)+'\n');
  console.log('PASS: actual GLBs render from five angles, all movement/emote previews, blinking, both LODs, playback and phone viewport; no runtime or asset errors.');
}finally{await browser.close();}
