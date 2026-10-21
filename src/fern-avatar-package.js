// Export the previewed fox and its scarf as a self-contained city avatar.
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export async function loadFernDistance(){
  return (await new GLTFLoader().loadAsync('/fern-avatar-source/body-lod1.glb')).scene.getObjectByName('Critter_fox');
}

function buildModel(preview,distanceBody=null){
  const root=new T.Group();root.name='FernFox';
  const model=new T.Group();model.name='FernModel';model.position.y=.69;root.add(model);
  const source=preview.children.find(o=>o.morphTargetDictionary);
  const body=(distanceBody||source).clone(true);body.geometry=body.geometry.clone();
  body.name='FernBody';body.position.set(0,0,0);body.rotation.set(0,0,0);body.scale.setScalar(1);
  body.material=body.material.clone();body.material.name='Fern Fur';
  body.morphTargetInfluences.fill(0);body.morphTargetInfluences[body.morphTargetDictionary.Smile]=.65;
  model.add(body);
  const groups=new Map();
  for(const child of preview.children){
    if(child===source)continue;
    if(!child.isMesh)throw Error('Unexpected non-mesh scarf object');
    child.updateMatrix();const geometry=child.geometry.clone().applyMatrix4(child.matrix);
    if(!groups.has(child.material))groups.set(child.material,[]);
    groups.get(child.material).push(geometry);
  }
  let i=0;
  for(const [material,geometries] of groups){
    // At distance, keep each leaf's central vein and omit the tiny side veins.
    const parts=distanceBody&&!material.vertexColors
      ?geometries.filter((_,j)=>j===0||j===Math.floor(geometries.length/2)):geometries;
    const geometry=mergeGeometries(parts,false);
    if(!geometry)throw Error('Scarf geometry could not be merged');
    const mat=material.clone();mat.name=i===0?'Fern Leaf Scarf':'Fern Leaf Veins';
    const mesh=new T.Mesh(geometry,mat);mesh.name=i===0?'FernScarf':'FernVeins';model.add(mesh);i++;
  }
  if(i!==2)throw Error('Fern must have exactly two scarf materials');
  return {root,body};
}

function makeClips(body){
  const names=Object.keys(body.morphTargetDictionary);
  const specs=[['idle',3.2],['fly',1.4],['fly_fast',.8],['ascend',1.4],['descend',1.4],
    ['joy',2.2],['approval',2.0],['sadness',2.6],['surprise',1.8],['blink',.28]];
  return specs.map(([name,duration])=>{
    const times=Array.from({length:name==='blink'?9:33},(_,i)=>i*duration/(name==='blink'?8:32));
    const morph=[],positions=[],rotations=[],scales=[];
    for(const t of times){
      const u=t/duration,a=u*Math.PI*2,w=Math.sin(a),e=Math.sin(u*Math.PI)**2;
      const weights={Blink:0,Smile:.65,Shock:0,Sad:0,Wiggle:.45*w};
      let y=.014*w,xrot=0,zrot=.012*w,sy=1+.008*w;
      if(['fly','fly_fast','ascend','descend'].includes(name)){
        xrot={fly:.10,fly_fast:.20,ascend:-.10,descend:.22}[name];
        zrot=.018*w;weights.Wiggle=.8*w;sy=1+.006*w;
      }
      if(name==='joy'){weights.Smile=.65+.35*e;weights.Wiggle=.85*Math.sin(a*2);y=.18*e;zrot=.11*w*e;}
      if(name==='approval'){xrot=.13*Math.sin(a*2)*e;weights.Smile=.65+.25*e;weights.Wiggle=.9*Math.sin(a*2);y=0;}
      if(name==='sadness'){weights.Smile=.65*(1-e);weights.Sad=e;weights.Wiggle=.10*w;xrot=.08*e;y=0;}
      if(name==='surprise'){weights.Smile=.65*(1-e);weights.Shock=e;weights.Wiggle=.25*w;xrot=-.08*e;y=.075*e;}
      if(name==='blink'){weights.Blink=(.935-.04)/.945*Math.sin(u*Math.PI)**2;weights.Wiggle=0;}
      morph.push(...names.map(n=>weights[n]));
      positions.push(0,y,0);
      rotations.push(...new T.Quaternion().setFromEuler(new T.Euler(xrot,0,zrot)).toArray());
      scales.push(1,sy,1);
    }
    const tracks=[new T.NumberKeyframeTrack('FernBody.morphTargetInfluences',times,morph)];
    // An overlay blink affects only the facial targets, retaining current flight.
    if(name!=='blink')tracks.push(
      new T.VectorKeyframeTrack('FernFox.position',times,positions),
      new T.QuaternionKeyframeTrack('FernFox.quaternion',times,rotations),
      new T.VectorKeyframeTrack('FernFox.scale',times,scales));
    return new T.AnimationClip(name,duration,tracks);
  });
}

export async function exportFern(preview,distanceBody=null){
  const {root,body}=buildModel(preview,distanceBody),animations=makeClips(body);
  const result=await new GLTFExporter().parseAsync(root,{
    binary:true,onlyVisible:true,animations,maxTextureSize:distanceBody?512:1024,
    includeCustomExtensions:false,truncateDrawRange:true});
  if(!(result instanceof ArrayBuffer))throw Error('Expected binary GLB');
  return result;
}
