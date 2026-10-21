import * as THREE from 'three';

export function extendGarden(scene) {
  const sky='#f6eaf2';
  scene.background=new THREE.Color(sky);
  scene.fog=new THREE.Fog(sky,15,42);
  const world=new THREE.Group();
  world.name='Private garden environment';
  const resources=[];
  const makeMaterial=(color,basic=false)=>{
    const material=basic?new THREE.MeshBasicMaterial({color}):new THREE.MeshStandardMaterial({color,roughness:1});
    resources.push(material);
    return material;
  };
  const skyMaterial=makeMaterial(sky,true);
  skyMaterial.side=THREE.BackSide;
  const domeGeometry=new THREE.SphereGeometry(45,24,12);
  resources.push(domeGeometry);
  const dome=new THREE.Mesh(domeGeometry,skyMaterial);
  dome.position.y=8;
  world.add(dome);
  const groundGeometry=new THREE.CircleGeometry(44,64);
  resources.push(groundGeometry);
  const ground=new THREE.Mesh(groundGeometry,makeMaterial('#d9e9cf',true));
  ground.rotation.x=-Math.PI/2;
  ground.position.y=.01;
  world.add(ground);
  const round=new THREE.SphereGeometry(1,8,6);
  resources.push(round);
  const leaves=makeMaterial('#ffffff',true);
  const hedges=new THREE.InstancedMesh(round,leaves,27);
  const dummy=new THREE.Object3D();
  const color=new THREE.Color();
  // Low distant hedges extend the meadow without adding more trees.
  for(let i=0;i<27;i++) {
    const angle=i*Math.PI*2/27;
    const distance=11+(i%4)*2.2;
    dummy.position.set(Math.cos(angle)*distance,.7,Math.sin(angle)*distance);
    dummy.scale.set(2+(i%3)*.5,.9,1.7);
    dummy.updateMatrix();
    hedges.setMatrixAt(i,dummy.matrix);
    hedges.setColorAt(i,color.set(['#bbd9c5','#cee4c6','#c3ddd4'][i%3]));
  }
  world.add(hedges);
  const cloudMaterial=makeMaterial('#f5edf3',true);
  const clouds=new THREE.InstancedMesh(round,cloudMaterial,7);
  for(let i=0;i<7;i++) {
    dummy.position.set(Math.cos(i*1.7)*17,17+(i%3)*2,Math.sin(i*1.7)*17);
    dummy.scale.set(4,1.0,1.8);
    dummy.updateMatrix();
    clouds.setMatrixAt(i,dummy.matrix);
  }
  world.add(clouds);
  scene.add(world);
  return {dispose(){resources.forEach(resource=>resource.dispose());scene.remove(world);}};
}
