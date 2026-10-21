import * as T from 'three';
import {ANIMALS} from './experience/game/rules.js';
export async function bakePortraits(renderer,art,environment){
  const atlas=new OffscreenCanvas(1024,512),ctx=atlas.getContext('2d');
  const scene=new T.Scene();scene.environment=environment;
  scene.add(new T.HemisphereLight('#fff3e6','#8a937e',.75));
  const sun=new T.DirectionalLight('#fff0df',1.8);sun.position.set(-2,4,5);scene.add(sun);
  const fill=new T.DirectionalLight('#deeafa',.45);fill.position.set(3,2,3);scene.add(fill);
  const target=new T.WebGLRenderTarget(256,256);target.texture.colorSpace=T.SRGBColorSpace;
  const pixels=new Uint8Array(256*256*4),oldColor=renderer.getClearColor(new T.Color()),oldAlpha=renderer.getClearAlpha();
  renderer.setClearColor(0,0);
  for(let i=0;i<ANIMALS.length;i++){
    const animal=art.animal(ANIMALS[i],1);scene.add(animal);
    const box=new T.Box3().setFromObject(animal),center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3());
    const r=Math.max(size.x,size.y)*.57;
    const camera=new T.OrthographicCamera(-r,r,r,-r,.01,20);camera.position.set(center.x,center.y,center.z+6);camera.lookAt(center);
    await renderer.compileAsync(scene,camera);renderer.setRenderTarget(target);renderer.render(scene,camera);
    renderer.readRenderTargetPixels(target,0,0,256,256,pixels);
    const upright=new Uint8ClampedArray(pixels.length);
    for(let y=0;y<256;y++)upright.set(pixels.subarray((255-y)*1024,(256-y)*1024),y*1024);
    ctx.putImageData(new ImageData(upright,256,256),i%4*256,Math.floor(i/4)*256);animal.removeFromParent();
  }
  renderer.setRenderTarget(null);renderer.setClearColor(oldColor,oldAlpha);target.dispose();
  return Array.from(new Uint8Array(await (await atlas.convertToBlob({type:'image/png'})).arrayBuffer()));
}
