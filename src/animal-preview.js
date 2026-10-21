import * as T from 'three';
import {applyExpression} from './experience/game/expressions.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
const host=document.querySelector('#stage'),renderer=new T.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
host.append(renderer.domElement);const scene=new T.Scene();scene.background=new T.Color('#f6eee7');
const pm=new T.PMREMGenerator(renderer),room=new RoomEnvironment();scene.environment=pm.fromScene(room,.04).texture;scene.environmentIntensity=.35;room.dispose();pm.dispose();
scene.add(new T.HemisphereLight('#fff1e6','#aaa1b5',.65));const key=new T.DirectionalLight('#fff1df',2.4);key.position.set(-4,6,8);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-7,right:7,top:6,bottom:-6,near:.1,far:30});key.shadow.bias=-.0004;key.shadow.normalBias=.02;scene.add(key);const fill=new T.DirectionalLight('#d5e9ff',.65);fill.position.set(5,1,4);scene.add(fill);
const camera=new T.OrthographicCamera(-5,5,3,-3,.1,40);camera.position.set(0,.20,12);camera.lookAt(0,.20,0);
const pack=await new GLTFLoader().loadAsync('/experience/assets/animals.glb');
const kinds=['bunny','fox','kitten','bird','deer','bear','axolotl'],names=['Bunny','Fox','Kitten','Bird','Deer','Bear','Axolotl'];
const models=kinds.map((kind,i)=>{
 const mesh=pack.scene.getObjectByName('Critter_'+kind).clone(true);mesh.rotation.y=i%2===0?.12:-.12;mesh.position.set(i<4?-3.65+i*2.43:-2.43+(i-4)*2.43,i<4?1.25:-1.48,0);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
 const pad=new T.Mesh(new T.CylinderGeometry(.94,.98,.07,64),new T.MeshStandardMaterial({color:'#ede0d5',roughness:.9}));pad.position.set(mesh.position.x,mesh.position.y-.72,0);pad.receiveShadow=true;scene.add(pad);
 const label=document.createElement('span');label.className='label';label.textContent=names[i];document.querySelector('#labels').append(label);return {mesh,label};
});
let pose='Smile',fixedTime=null;const start=performance.now();
function weights(time){for(const [i,{mesh}] of models.entries())applyExpression(mesh,pose,time,i*.51,.85);}

function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);const halfY=Math.max(3.1,5.25*h/w);camera.left=-halfY*w/h;camera.right=halfY*w/h;camera.top=halfY;camera.bottom=-halfY;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(host);resize();
function setPose(name){pose=name;weights(fixedTime??0);document.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pose===name)));}
document.querySelectorAll('button').forEach(b=>b.onclick=()=>setPose(b.dataset.pose));
window.artReview={models,setPose,setTime(t){fixedTime=t;weights(t);},renderer};document.querySelector('#status').hidden=true;document.body.dataset.ready='true';
renderer.setAnimationLoop(()=>{const time=fixedTime??(performance.now()-start)/1000;weights(time);renderer.render(scene,camera);for(const {mesh,label} of models){const p=new T.Vector3(mesh.position.x,mesh.position.y-.82,.4).project(camera);label.style.left=`${(p.x+1)*host.clientWidth/2}px`;label.style.top=`${(1-p.y)*host.clientHeight/2}px`;}});
