import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

await mkdir('public/avatar-fern',{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:[
  '--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:800,height:800}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4178/avatar-fox-example.html');
  await page.waitForFunction(()=>window.foxExample,{timeout:60000});
  await page.evaluate(()=>foxExample.freeze());
  for(const lod of [0,1]){
    const encoded=await page.evaluate(async(lod)=>{
      const {exportFern,loadFernDistance}=await import('/src/fern-avatar-package.js');
      let distance=null;
      if(lod)distance=await loadFernDistance();
      const bytes=new Uint8Array(await exportFern(foxExample.character,distance));
      let s='';for(let i=0;i<bytes.length;i+=16384)s+=String.fromCharCode(...bytes.subarray(i,i+16384));
      return btoa(s);
    },lod);
    const path=`public/avatar-fern/${lod?'avatar-lod1':'avatar'}.glb`;
    await writeFile(path,Buffer.from(encoded,'base64'));console.log(`Exported ${path}`);
  }
  assert.deepEqual(errors,[]);
}finally{await browser.close();}
const config={
  name:'Fern · Woodland Fox',
  materials:{'*':{lighting:'standard'}},
  motion:{bank:.24,pitch:.17,bob:.025,bobSpeed:1.7,squash:.10},
  trail:'none',idle:[{clip:'blink',every:[2.5,5],overlay:true}],
  emotes:[{name:'Joy',clip:'joy',duration:2.2},{name:'Approval',clip:'approval',duration:2},
    {name:'Sadness',clip:'sadness',duration:2.6},{name:'Surprise',clip:'surprise',duration:1.8}],
  reactions:{pick:'approval',like:'Joy'},
};
await writeFile('public/avatar-fern/avatar.json',JSON.stringify(config,null,2)+'\n');
