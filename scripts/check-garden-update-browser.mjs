import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {browserExecutable} from './browser-options.mjs';

await mkdir('.local',{recursive:true});
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4193','--strictPort'],{stdio:'ignore'});let browser;
try{
  for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:4193/game.html')).ok)break;}catch{}await delay(100);}
  browser=await chromium.launch({executablePath:browserExecutable,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[],bad=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400&&!r.url().includes('favicon'))bad.push(r.url());});
  await page.goto('http://127.0.0.1:4193/game.html');
  await page.waitForFunction(()=>!!window.gardenGame,null,{timeout:90000});
  const result=await page.evaluate(async()=>{
    gardenP0.loop(()=>{});gardenGame.action('play');
    const {BOARD,trajectory}=await import('/src/experience/game/rules.js');
    const {game:g,view:v,pavilion}=gardenGame,scene=gardenP0.scene;
    const meshes=[];scene.getObjectByName('LivingMeadow').traverse(m=>{if(m.isInstancedMesh)meshes.push(m);});
    const matrix=v.dummy.matrix.clone(),scale=v.dummy.scale.clone(),p=v.dummy.position.clone(),q=v.dummy.quaternion.clone();
    let grassHeight=0,flowerHeight=0;
    for(const m of meshes){m.geometry.computeBoundingBox();for(let i=0;i<m.count;i++){
      m.getMatrixAt(i,matrix);matrix.decompose(p,q,scale);const h=m.geometry.boundingBox.max.y*scale.y;
      if(m.name.startsWith('Grass'))grassHeight=Math.max(grassHeight,h);else flowerHeight=Math.max(flowerHeight,h);
    }}
    const snapshot=JSON.stringify(g.snapshot());
    pavilion.update(.5);assertSnapshot();
    function assertSnapshot(){if(JSON.stringify(g.snapshot())!==snapshot)throw Error('Scenery mutated game state');}
    const levels=[];v.aimActive=true;
    for(const score of [2999,3000,4999,5000]){
      g.score=score;v.update(g,.4,trajectory(g.grid,.9),null,null);
      levels.push({score,opacity:v.dotMaterial.opacity,halo:v.dotHalo.material.opacity,dots:v.dots.count,ghost:v.ghost.visible,pointer:v.cannon.pointer.visible});
    }
    const angles=[];
    for(const angle of [-1.3,-.6,0,.6,1.3]){
      v.update(g,.05,trajectory(g.grid,angle),null,null);
      const direction=new gardenThree.Vector3(0,1,0).applyQuaternion(v.cannon.pointer.quaternion);
      angles.push({angle,error:Math.hypot(direction.x-Math.sin(angle),direction.y-Math.cos(angle))});
    }
    g.score=0;v.resetEffects();v.update(g,.4,trajectory(g.grid,0),null,null);
    const reset=v.dots.count>0&&v.ghost.visible&&v.dotMaterial.opacity===.72;
    gardenGame.ui.last='';gardenGame.ui.draw(g,gardenGame.state,v.time);
    gardenGame.shelf.update(gardenGame.ui.iconSlots,g,gardenGame.state,null,v.time);
    gardenP0.renderer.info.autoReset=false;gardenP0.renderer.info.reset();gardenGame.compositor.draw();
    const render={...gardenP0.renderer.info.render,memory:{...gardenP0.renderer.info.memory}};gardenP0.renderer.info.autoReset=true;
    return {grassHeight,flowerHeight,diameter:BOARD.diameter,meadow:scene.userData.meadow,forest:scene.userData.woodland,wall:scene.userData.fieldstoneWall,levels,angles,reset,render};
  });
  assert.ok(result.grassHeight<=result.diameter/3+1e-8);assert.ok(result.flowerHeight<=result.diameter*.4);
  assert.ok(result.meadow.grassClumps>800&&result.meadow.flowers>100);assert.ok(result.forest.trees>=25&&result.forest.layers===3&&result.forest.types===3);assert.ok(result.wall.stones>300&&result.wall.shapeVariants>=4);
  assert.equal(result.levels[0].opacity,.72);assert.ok(Math.abs(result.levels[1].opacity-.216)<1e-8);assert.equal(result.levels[2].opacity,result.levels[1].opacity);
  assert.equal(result.levels[3].opacity,0);assert.equal(result.levels[3].dots,0);assert.equal(result.levels[3].ghost,false);assert.ok(result.levels.every(l=>l.pointer));
  assert.ok(result.angles.every(a=>a.error<1e-8));assert.ok(result.reset);assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
  await writeFile('.local/garden-update-browser.json',JSON.stringify({...result,errors,bad},null,2));
  await page.screenshot({path:'.local/garden-update-desktop.png'});
  await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>gardenP0.width===390);
  await page.evaluate(()=>{const {game:g,view:v,ui,state}=gardenGame;ui.last='';ui.draw(g,state,v.time);gardenGame.shelf.update(ui.iconSlots,g,state,null,v.time);gardenGame.compositor.draw();});
  await page.screenshot({path:'.local/garden-update-phone.png'});
  console.log(JSON.stringify({grassHeight:result.grassHeight,flowers:result.meadow.flowers,trees:result.forest.trees,stones:result.wall.stones,aim:result.levels,render:result.render,errors,bad}));
}finally{await browser?.close();server.kill();}
