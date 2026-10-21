import * as THREE from 'three';

export const CAMERA_LIMITS = { x:5.1,z:5.1,minY:1.5,maxY:17.8 };

export function createGardenCamera(p0) {
  // The city clips an experience to its lot whenever the camera is outside.
  // Use an interior camera, without the city's trailing third-person offset.
  p0.controls.mode='none';
  p0.controls.enabled=false;
  const position=new THREE.Vector3(0,4.5,5.05);
  const forward=new THREE.Vector3();
  const right=new THREE.Vector3();
  const direction=new THREE.Vector3();
  let yaw=0,pitch=0;
  const apply=()=>{
    position.x=THREE.MathUtils.clamp(position.x,-CAMERA_LIMITS.x,CAMERA_LIMITS.x);
    position.z=THREE.MathUtils.clamp(position.z,-CAMERA_LIMITS.z,CAMERA_LIMITS.z);
    position.y=THREE.MathUtils.clamp(position.y,CAMERA_LIMITS.minY,CAMERA_LIMITS.maxY);
    p0.me.position.copy(position);
    p0.camera.position.copy(position);
    p0.camera.rotation.set(pitch,yaw,0,'YXZ');
    p0.camera.updateMatrixWorld();
  };
  const resize=()=>{
    p0.camera.fov=p0.width/p0.height<.8?114:70;
    p0.camera.updateProjectionMatrix();
  };
  p0.on('resize',resize);
  p0.on('pointermove',event=>{
    if(!(event.buttons&2)&&!(event.touch&&event.buttons)) return;
    yaw-=(event.dx||0)*.004;
    pitch=THREE.MathUtils.clamp(pitch-(event.dy||0)*.004,-1.35,1.35);
    apply();
  });
  p0.on('wheel',event=>{
    p0.camera.fov=THREE.MathUtils.clamp(p0.camera.fov+(event.dy||0)*.015,45,114);
    p0.camera.updateProjectionMatrix();
  });
  resize();
  apply();
  return {
    update(dt) {
      const keys=p0.input.keys;
      const ahead=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
      const sideways=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
      const lift=Number(keys.has('KeyE'))-Number(keys.has('KeyQ'));
      p0.camera.getWorldDirection(forward);
      right.set(Math.cos(yaw),0,-Math.sin(yaw));
      direction.copy(forward).multiplyScalar(ahead).addScaledVector(right,sideways);
      direction.y+=lift;
      if(direction.lengthSq()>0) direction.normalize();
      const boost=keys.has('ShiftLeft')||keys.has('ShiftRight')?1.7:1;
      position.addScaledVector(direction,Math.min(dt,.1)*2*boost);
      apply();
    },
  };
}
