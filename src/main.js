import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const host = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = .9;
host.append(renderer.domElement);
renderer.domElement.setAttribute('aria-label', 'Bubble Critter Garden: a miniature wooden arcade pavilion with seven baby animals');
renderer.domElement.setAttribute('role', 'img');

const scene = new THREE.Scene();
const pmrem=new THREE.PMREMGenerator(renderer);
const room=new RoomEnvironment();
scene.environment=pmrem.fromScene(room,.04).texture;
scene.environmentIntensity=.55;
room.dispose();pmrem.dispose();
const street=new URLSearchParams(location.search).has('street');
if(street){
 document.body.classList.add('street-view');
 scene.background=new THREE.Color('#f4f3f5');
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#e5e4e9',roughness:.9}));
 floor.rotation.x=-Math.PI/2;floor.position.y=-.015;scene.add(floor);
 const outline=new THREE.Box3Helper(new THREE.Box3(new THREE.Vector3(-6,0,-6),new THREE.Vector3(6,19,6)),0xd6c7d2);
 outline.material.transparent=true;outline.material.opacity=.10;scene.add(outline);
}
scene.add(new THREE.HemisphereLight(0xfff5ff, 0xafa8c4, 1.0));
const sun = new THREE.DirectionalLight(0xfff5ed, 2.0);
sun.position.set(-8, 20, 15);
scene.add(sun);
const fill = new THREE.DirectionalLight(0xccebf5, .6);
fill.position.set(10, 10, -8);
scene.add(fill);

const camera = new THREE.PerspectiveCamera(35, 1, .1, 150);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 5.25, 0);
controls.enableDamping = true;
controls.autoRotateSpeed = .35;
controls.autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
controls.minDistance = 14;
controls.maxDistance = 58;
controls.maxPolarAngle = Math.PI * .66;
controls.enablePan = false;

let model;
let metadata;
let picked = null;
let didDrag = false;
let pointerStart;
const timer = new THREE.Timer();
timer.connect(document);
const raycaster = new THREE.Raycaster();
const pickables = [];
let actors = [];
let mixer;let clips=[];
let frozenTime = null;
let resetPosition;

function resize() {
  const { width, height } = host.getBoundingClientRect();
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  const distance = camera.aspect < .8 ? 38 : street ? 26 : 25;
  resetPosition = new THREE.Vector3(distance*.15, street ? 9 : 10, distance);
  if (!model) camera.position.copy(resetPosition);
}
new ResizeObserver(resize).observe(host);
resize();

function reset() {
  camera.position.copy(resetPosition);
  controls.target.set(0, 5.25, 0);
  controls.update();
}

async function init() {
  metadata = await (await fetch('/lot/garden.json')).json();
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync('/lot/lod0.glb');
  model = gltf.scene;
  clips=gltf.animations;mixer=new THREE.AnimationMixer(model);
  const idle=clips.find(c=>c.name==="GardenIdle");if(idle)mixer.clipAction(idle).play();
  scene.add(model);
  model.traverse(node => {
    if (!node.isMesh) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const mat of materials) {
      if (mat.name === 'Protective soap film') {
        mat.depthWrite = false;
        mat.side = THREE.FrontSide;
        mat.opacity = .13;
      }
      if (mat.name === 'Cloud whisper') mat.depthWrite = false;
    }
  });
  actors = await (await fetch('/lot/exterior-motion.json')).json();
  for (const animal of metadata.animals) {
    const group = model.getObjectByName(animal.name);
    const pick = new THREE.Mesh(new THREE.SphereGeometry(animal.radius, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
    pick.position.fromArray(animal.position);
    pick.userData.animal = animal;
    pick.userData.group = group;
    scene.add(pick);
    pickables.push(pick);
  }
  await renderer.compileAsync(scene, camera);
  document.querySelector('#loading').hidden = true;
  document.body.dataset.ready = 'true';
  window.garden = { scene, camera, renderer, model, metadata, controls, pickables, actors,
    setTime(seconds) { frozenTime = seconds; updateActors(seconds); },
    setExpression(name){mixer.stopAllAction();const c=clips.find(c=>c.name===name);if(c)mixer.clipAction(c).play();},
  };
}

function showAnimal(animal) {
  picked = animal;
  document.querySelector('#animal-name').textContent = animal.name;
  document.querySelector('#animal-kind').textContent = `baby ${animal.kind}`;
  document.querySelector('#animal-card').hidden = false;
}

host.addEventListener('pointerdown', e => { pointerStart = [e.clientX, e.clientY]; didDrag = false; });
host.addEventListener('pointermove', e => {
  if (pointerStart && Math.hypot(e.clientX-pointerStart[0], e.clientY-pointerStart[1]) > 7) didDrag = true;
});
host.addEventListener('pointerup', e => {
  if (!didDrag && metadata) {
    const rect = host.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);
    scene.updateMatrixWorld(true);
    const hit = raycaster.intersectObjects(pickables)[0];
    if (hit) showAnimal(hit.object.userData.animal);
  }
  pointerStart = null;
});
document.querySelector('#close-card').addEventListener('click', () => {
  picked = null;
  document.querySelector('#animal-card').hidden = true;
});
document.querySelector('#explore').addEventListener('click', () => {
  if (metadata) showAnimal(metadata.animals[0]);
  host.scrollIntoView({ behavior: 'smooth', block: 'center' });
});
document.querySelector('#rotate').addEventListener('click', e => {
  controls.autoRotate = !controls.autoRotate;
  e.currentTarget.textContent = controls.autoRotate ? 'Ⅱ' : '▷';
  e.currentTarget.setAttribute('aria-pressed', String(controls.autoRotate));
  e.currentTarget.setAttribute('aria-label', controls.autoRotate ? 'Pause automatic rotation' : 'Start automatic rotation');
});
document.querySelector('#reset').addEventListener('click', reset);

renderer.setAnimationLoop(() => {
  timer.update();
  const time = timer.getElapsed();
  updateActors(frozenTime ?? (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : time));
  controls.update();
  renderer.render(scene, camera);
});

function updateActors(time) {
  if (!model) return;
  mixer?.setTime(time);
  for (const [i,a] of actors.entries()) {
    const node=model.getObjectByName(a.node);
    node?.position.set(a.position[0],a.position[1]+Math.sin(time*.9+i)*a.amplitude,a.position[2]);
    const pick=pickables.find(p=>p.userData.animal.name===a.node);
    if(pick&&node)pick.position.copy(node.position);
  }
}

init().catch(error => {
  document.querySelector('#loading').textContent = 'The garden could not load. Please refresh to try again.';
  console.error(error);
});
