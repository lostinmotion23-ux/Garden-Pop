// Standalone account-avatar inspector. Does not import or change the lot or game.
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

const stage=document.querySelector('#stage');
const renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.toneMapping=T.ACESFilmicToneMapping;
renderer.toneMappingExposure=.95;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=T.PCFSoftShadowMap;
stage.append(renderer.domElement);
const scene=new T.Scene();
const pmrem=new T.PMREMGenerator(renderer),environment=new RoomEnvironment();
scene.environment=pmrem.fromScene(environment,.04).texture;
scene.environmentIntensity=.4;
environment.dispose();
const camera=new T.PerspectiveCamera(32,1,.01,30);
const controls=new OrbitControls(camera,renderer.domElement);
controls.target.set(0,1.03,0);
controls.enableDamping=true;controls.minDistance=1.0;controls.maxDistance=7;
scene.add(new T.HemisphereLight('#fff7e9','#b3a6b3',.7));
for(const [color,intensity,p] of [['#fff1de',2.2,[-3,5,4]],['#e3e8ff',.7,[3,2,1]],['#ffead9',.9,[1,3,-3]]]){
  const light=new T.DirectionalLight(color,intensity);light.position.set(...p);
  if(p[0]<0){light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=-2;light.shadow.camera.right=2;light.shadow.camera.top=3;light.shadow.camera.bottom=-1;light.shadow.bias=-.0003;light.shadow.normalBias=.008;}
  scene.add(light);
}
const floor=new T.Mesh(new T.CylinderGeometry(1.00,1.04,.045,96),new T.MeshStandardMaterial({color:'#ddd6cb',roughness:.85}));
floor.position.y=-.028;floor.receiveShadow=true;scene.add(floor);
const shadow=new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({opacity:.12}));
shadow.rotation.x=-Math.PI/2;shadow.position.y=-.052;shadow.receiveShadow=true;scene.add(shadow);
const loader=new GLTFLoader(),models=[];
const parameters=new URLSearchParams(location.search),fern=parameters.get('fern')==='1';
const assetFolder=fern?'avatar-fern':parameters.get('revision')==='1'?'avatar-revision':'avatar';
if(fern){document.querySelector('h1').textContent='Fern · Woodland Fox';document.title='Fern · Woodland Fox — avatar';}
let active,mixer,action,elapsed=0,frozen=false;
const errors=[];
function view(name){
  controls.target.set(0,1.03,0);
  const p={front:[0,1.29,4.4],'three-quarter':[2.7,1.65,3.8],side:[4.4,1.35,.0],back:[0,1.38,-4.4],face:[.37,1.76,1.48]}[name];
  if(name==='face')controls.target.set(0,1.68,.02);
  if(fern&&name==='face'){controls.target.set(0,1.13,.04);p.splice(0,3,.45,1.3,2.1);}
  camera.position.set(...p);controls.update();
}
function clip(name,time=0){
  action?.stop();const animation=T.AnimationClip.findByName(active.animations,name);
  if(!animation)throw Error(`Missing animation ${name}`);
  action=mixer.clipAction(animation);action.reset().play();mixer.setTime(time);elapsed=time;
}
function detail(n){
  if(active)scene.remove(active.scene);mixer?.stopAllAction();
  active=models[n];scene.add(active.scene);mixer=new T.AnimationMixer(active.scene);
  clip(document.querySelector('#clip').value||'idle');
}
const resize=()=>{const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};
new ResizeObserver(resize).observe(stage);
view('three-quarter');resize();
for(const lod of [0,1]){
  const gltf=await loader.loadAsync(`/${assetFolder}/${lod?'avatar-lod1':'avatar'}.glb`);
  gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
  models.push(gltf);
}
document.querySelector('#clip').innerHTML=models[0].animations.map(c=>`<option>${c.name}</option>`).join('');
document.querySelector('#clip').onchange=e=>clip(e.target.value);
document.querySelector('#lod').onchange=e=>detail(Number(e.target.value));
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));
detail(0);
const clock=new T.Clock();
renderer.setAnimationLoop(()=>{
  const dt=Math.min(.05,clock.getDelta());controls.update();
  if(!frozen){elapsed+=dt;mixer.update(dt);}renderer.render(scene,camera);
});
window.avatarPreview={models,renderer,scene,camera,controls,view,clip,detail,errors,
  freeze(value=true){frozen=value;},
  sample(name,t){frozen=true;clip(name,t);renderer.render(scene,camera);},
  get active(){return active;},get elapsed(){return elapsed;}};
