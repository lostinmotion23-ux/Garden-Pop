import * as T from 'three';
export class GardenAmbience {
  constructor(scene,art) {
    this.time=0;this.dummy=new T.Object3D();
    this.petals=new T.InstancedMesh(new T.SphereGeometry(1,8,5),art.mat('#f5d9dc','petal',.75),36);
    this.petals.frustumCulled=false;this.petals.name='DriftingCherryPetals';scene.add(this.petals);
  }
  update(dt) {
    this.time+=dt;
    for(let i=0;i<36;i++) {
      this.dummy.position.set(Math.sin(i*12.51+this.time*.025)*4.5,
        .7+((i*.43-this.time*.095+100)%8.1),-2.3-Math.cos(i*1.7)*1.6);
      this.dummy.scale.set(.035,.013,.049);
      this.dummy.rotation.set(this.time*.45+i,i*.7,this.time*.21);
      this.dummy.updateMatrix();this.petals.setMatrixAt(i,this.dummy.matrix);
    }
    this.petals.instanceMatrix.needsUpdate=true;
  }
  dispose(){this.petals.removeFromParent();this.petals.geometry.dispose();}
}
