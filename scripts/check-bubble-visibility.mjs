import {browserExecutable} from './browser-options.mjs';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4195','--strictPort'],{stdio:'ignore'});
let browser;
const reports=[];
try {
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:4195/game.html')).ok)break;}catch{}await delay(100);}
 browser=await chromium.launch({executablePath:browserExecutable,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const mobile of [false,true]){
  const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1366,height:768}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'||m.type()==='warn'&&m.text().includes('THREE.Color'))errors.push(m.text());});
  await page.goto('http://127.0.0.1:4195/game.html');await page.waitForFunction(()=>!!window.gardenGame,null,{timeout:90000});
  const report=await page.evaluate(async()=>{
   const {trajectory}=await import('/src/experience/game/rules.js');
   gardenGame.action('play');gardenP0.loop(()=>{});
   const {game:g,view:v}=gardenGame,p=gardenP0;
   // More than the previous fixed instance budget, with a still-active board.
   g.ground=Array.from({length:2200},(_,i)=>({id:10000+i,color:i%5,slot:i,startX:0,startY:4,x:0,y:.815,z:-1.6,landedAt:0}));
   g.gardenTime=10;v.update(g,0,trajectory(g.grid,0),null,null);
   const expected=[...g.grid.cells.values()].filter(b=>b.type==='normal').length+g.ground.length;
   const capacity={expected,rendered:v.bubbles.count,glints:v.glints.count,contacts:v.contacts.count,matrixCapacity:v.bubbles.instanceMatrix.count,contactCapacity:v.contacts.instanceMatrix.count};
   g.ground=[];g.grid.cells.clear();g.score=350000;
   const colors=g.colorCount;
   for(let i=0;i<colors;i++)g.grid.put(Math.floor(i/19),i%19,{type:'normal',color:i});
   g.current=colors-1;g.next=colors-2;g.revision++;v.update(g,0,trajectory(g.grid,0),null,null);
   // Compare real rendered pixels with and without each mesh. Positive changes
   // at bubble centers verify visible bodies, not merely populated scene data.
   const canvas=document.createElement('canvas');canvas.width=p.renderer.domElement.width;canvas.height=p.renderer.domElement.height;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   const pixels=()=>{p.renderer.setRenderTarget(null);p.renderer.render(p.scene,p.camera);ctx.drawImage(p.renderer.domElement,0,0);return ctx.getImageData(0,0,canvas.width,canvas.height).data;};
   v.glints.visible=false;v.contacts.visible=false;
   const withBubbles=pixels();v.bubbles.visible=false;const without=pixels();v.bubbles.visible=true;
   const changed=(position,a,b)=>{
    const q=p.camera.position.clone().set(position.x,position.y,position.z).project(p.camera);
    const x=Math.round((q.x+1)*canvas.width/2),y=Math.round((1-q.y)*canvas.height/2);let changes=0;
    for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
     const offset=((y+dy)*canvas.width+x+dx)*4;
     if(Math.abs(a[offset]-b[offset])+Math.abs(a[offset+1]-b[offset+1])+Math.abs(a[offset+2]-b[offset+2])>10)changes++;
    }
    return changes;
   };
   const colorPixels=[...g.grid.cells.values()].map(b=>({color:b.color,pixels:changed({...g.grid.position(b.r,b.c),z:-1.6},withBubbles,without)}));
   const launcherWith=pixels();v.shot.visible=false;v.nextShot.visible=false;const launcherWithout=pixels();
   const currentPixels=changed(v.shot.position,launcherWith,launcherWithout),nextPixels=changed(v.nextShot.position,launcherWith,launcherWithout);
   v.shot.visible=true;v.nextShot.visible=true;
   g.inventory.fire=1;g.select('fire');v.update(g,0,trajectory(g.grid,0),null,null);
   const fireWith=pixels();v.fireShot.visible=false;const fireWithout=pixels();
   const firePixels=changed(v.fireShot.position,fireWith,fireWithout);
   v.glints.visible=true;v.contacts.visible=true;g.cancel();
   // Check instance colors and transforms through many row/queue updates.
   let invalid=0;
   for(let frame=0;frame<80;frame++){
    if(frame%10===0)g.addRandomRow();g.current=frame%colors;g.next=(frame+1)%colors;
    v.update(g,.016,trajectory(g.grid,0),null,null);
    for(const mesh of [v.bubbles,v.glints,v.contacts]){
     if(mesh.count>mesh.instanceMatrix.count)invalid++;
     for(let i=0;i<mesh.count*16;i++)if(!Number.isFinite(mesh.instanceMatrix.array[i]))invalid++;
    }
    for(let i=0;i<v.bubbles.count*3;i++)if(!Number.isFinite(v.bubbles.instanceColor.array[i]))invalid++;
   }
   return {capacity,colors,colorPixels,currentPixels,nextPixels,firePixels,invalid};
  });
  reports.push({mobile,...report});
  console.log(JSON.stringify({mobile,...report}));
  assert.equal(report.capacity.rendered,report.capacity.expected,'Every live bubble must have a rendered instance');
  assert.equal(report.capacity.glints,report.capacity.expected);assert.ok(report.capacity.contacts<=report.capacity.contactCapacity);
  assert.ok(report.colorPixels.every(c=>c.pixels>=15),'Every unlocked color must change real pixels at its center');
  assert.ok(report.currentPixels>=15&&report.nextPixels>=15&&report.firePixels>=15,'Current, next and fire balls must be visible');
  assert.equal(report.invalid,0);assert.deepEqual(errors,[]);
  await page.close();
 }
 await mkdir('.local',{recursive:true});await writeFile('.local/bubble-visibility-check.json',JSON.stringify(reports,null,2));
 console.log('PASS: desktop/phone pixel visibility, expanding instance capacity, all 40 colors, launcher/fire and repeated row updates.');
} finally {await browser?.close();server.kill();}
