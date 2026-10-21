// Actual textured mesh example; no account, city or experience writes.
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {applyExpression} from './experience/game/expressions.js';

const host=document.querySelector('#stage');
const renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.toneMapping=T.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.0;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
host.append(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#f1eae1');
const camera=new T.PerspectiveCamera(32,1,.05,30),controls=new OrbitControls(camera,renderer.domElement);
controls.target.set(0,.93,0);controls.enableDamping=true;controls.minDistance=2.0;controls.maxDistance=6;
const pm=new T.PMREMGenerator(renderer),room=new RoomEnvironment();scene.environment=pm.fromScene(room,.04).texture;
scene.environmentIntensity=.35;room.dispose();pm.dispose();
scene.add(new T.HemisphereLight('#fff4e9','#aaa5ba',.7));
for(const [color,intensity,p] of [['#fff0dc',2.5,[-3,5,5]],['#deebff',.8,[3,2,3]],['#fce5cb',1.1,[2,3,-3]]]){
 const l=new T.DirectionalLight(color,intensity);l.position.set(...p);scene.add(l);
 if(p[0]<0){l.castShadow=true;l.shadow.mapSize.set(1024,1024);Object.assign(l.shadow.camera,{left:-2,right:2,top:3,bottom:-1});l.shadow.normalBias=.008;}
}
const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({opacity:.12}));
floor.rotation.x=-Math.PI/2;floor.position.y=-.005;floor.receiveShadow=true;scene.add(floor);
const pack=await new GLTFLoader().loadAsync('/experience/assets/animals.glb');
const fox=pack.scene.getObjectByName('Critter_fox').clone(true);fox.geometry=fox.geometry.clone();fox.castShadow=true;fox.receiveShadow=true;
const character=new T.Group();character.position.y=.69;character.add(fox);scene.add(character);

// Two curved, double-surfaced leaves with raised veins form a tiny garden scarf.
const leafMaterial=new T.MeshStandardMaterial({color:'#91ad7e',roughness:.78,vertexColors:true});
const veinMaterial=new T.MeshStandardMaterial({color:'#c8d4a2',roughness:.8});
for(const sign of [-1,1]){
 const n=12,m=6,positions=[],colors=[],indices=[];
 function point(u,v,back=false){
  const x=u*.095*Math.sin(Math.PI*v),y=-v*.255;
  const a=sign*.60;
  return new T.Vector3(sign*.025+x*Math.cos(a)-y*Math.sin(a),-.015+x*Math.sin(a)+y*Math.cos(a),
   .355+.026*Math.sin(Math.PI*v)*(1-u*u)+.055*v*v-(back?.006:0));
 }
 for(const back of [false,true])for(let j=0;j<=n;j++)for(let i=0;i<=m;i++){
  const u=i/m*2-1,v=j/n,p=point(u,v,back);positions.push(...p.toArray());
  const shade=.86+.14*(1-Math.abs(u));colors.push(shade,shade,shade);
 }
 const count=(n+1)*(m+1);
 for(let side=0;side<2;side++)for(let j=0;j<n;j++)for(let i=0;i<m;i++){
  const a=side*count+j*(m+1)+i,faces=[a,a+m+1,a+1,a+1,a+m+1,a+m+2];
  if(side)for(let k=0;k<faces.length;k+=3)indices.push(faces[k],faces[k+2],faces[k+1]);else indices.push(...faces);
 }
 for(let j=0;j<n;j++)for(const i of [0,m]){
  const a=j*(m+1)+i,b=a+m+1;indices.push(a,b,a+count,b,b+count,a+count);
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 const leaf=new T.Mesh(geometry,leafMaterial);leaf.castShadow=true;character.add(leaf);
 const line=[];for(let j=0;j<=12;j++){const p=point(0,j/12);p.z+=.003;line.push(p);}
 character.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(line),18,.0027,4,false),veinMaterial));
 for(const v of [.30,.48,.66,.80])for(const s of [-1,1]){
  const a=point(0,v-.06),b=point(s*.76,v+.07);a.z+=.002;b.z+=.002;
  character.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([a,a.clone().lerp(b,.5),b]),4,.0015,3,false),veinMaterial));
 }
}
let pose='Smile',time=0,frozen=false;
function setPose(p){pose=p;applyExpression(fox,pose,time,0,.65);}
function view(v){controls.target.set(0,.93,0);camera.position.set(...({front:[0,1.25,4.15],threequarter:[2.1,1.55,3.75],back:[1.9,1.3,-3.8],face:[.7,1.50,2.5]}[v]));controls.update();}
function render(){applyExpression(fox,pose,time,0,.65);renderer.render(scene,camera);}
function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(host);resize();view('threequarter');
document.querySelectorAll('[data-pose]').forEach(b=>b.onclick=()=>setPose(b.dataset.pose));
document.querySelector('#rotate').onclick=()=>view(camera.position.z>0?'back':'threequarter');
const clock=new T.Clock();renderer.setAnimationLoop(()=>{const dt=Math.min(.05,clock.getDelta());if(!frozen){time+=dt;character.position.y=.69+Math.sin(time*1.8)*.018;}controls.update();render();});
window.foxExample={renderer,scene,camera,character,fox,view,setPose,
 freeze(){frozen=true;time=0;character.position.y=.69;render();},render};
document.body.dataset.ready='true';
