import * as THREE from 'three';
import { FLOW, FRIENDS, PALETTE, animalState, solidState } from './flow.js';

export function createBubbleFlow(garden) {
  // The GLB has a static fallback for the city. The experience uses one instanced
  // mesh so the entire touching cluster moves in one draw call.
  garden.traverse(node => {
    if (!node.isMesh) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    if (materials.some(material => material.name === 'Pastel bubbles')) node.visible = false;
  });
  const geometry = new THREE.SphereGeometry(1, 12, 8);
  const material = new THREE.MeshStandardMaterial({ roughness: .35 });
  const solids = new THREE.InstancedMesh(geometry, material, FLOW.solidCount);
  solids.name = 'Flowing pastel rows';
  solids.frustumCulled = false;
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const animals = FRIENDS.map(friend => ({ friend, node: garden.getObjectByName(friend.name), pose: animalState(friend,0) }));
  const color = new THREE.Color();
  for (let index=0;index<FLOW.solidCount;index++) {
    color.set(PALETTE[(index*3+Math.floor(index/2))%PALETTE.length]);
    solids.setColorAt(index,color);
  }
  garden.add(solids);
  function update(seconds) {
    for (const animal of animals) {
      animal.pose = animalState(animal.friend, seconds);
      if (!animal.node) continue;
      const p = animal.pose;
      animal.node.position.set(p.x,p.y,p.z);
      animal.node.scale.setScalar(Math.max(.00001,p.scale));
      animal.node.visible = p.scale > .01;
    }
    for (let index=0;index<FLOW.solidCount;index++) {
        const p = solidState(index,seconds);
        position.set(p.x,p.y,p.z);
        scale.setScalar(Math.max(.000001,FLOW.radius*p.scale));
        matrix.compose(position,rotation,scale);
        solids.setMatrixAt(index,matrix);
    }
    solids.instanceMatrix.needsUpdate = true;
  }
  update(0);
  return {
    animals, solids, update,
    dispose() { geometry.dispose(); material.dispose(); },
  };
}
