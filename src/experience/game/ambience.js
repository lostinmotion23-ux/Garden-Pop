import * as T from 'three';
import {GardenVisitors} from './visitors.js';
export class GardenAmbience {
  constructor(scene,art) {
    this.time=0;this.reactionAt=-100;this.reduced=false;this.visitors=new GardenVisitors(scene,art);this.dummy=new T.Object3D();
    this.petals=new T.InstancedMesh(new T.SphereGeometry(1,8,5),art.mat('#f5d9dc','petal',.75),36);
    this.petals.frustumCulled=false;this.petals.name='DriftingCherryPetals';scene.add(this.petals);
  }
  react(){this.reactionAt=this.time;this.visitors.react();}
  reset(){this.reactionAt=-100;this.visitors.reset();}
  update(dt) {
    this.time+=dt;
    this.visitors.reduced=this.reduced;this.visitors.update(dt);
    const burst=Math.max(0,1-(this.time-this.reactionAt)/1.4),count=this.reduced?12:36;this.petals.count=count;
    for(let i=0;i<count;i++) {
      this.dummy.position.set(Math.sin(i*12.51+this.time*.025)*4.5,
        .7+((i*.43-this.time*.095+100)%8.1)+burst*.18*Math.sin(i),-2.3-Math.cos(i*1.7)*1.6);
      this.dummy.scale.set(.035,.013,.049);
      this.dummy.rotation.set(this.time*.45+i,i*.7,this.time*.21);
      this.dummy.updateMatrix();this.petals.setMatrixAt(i,this.dummy.matrix);
    }
    this.petals.instanceMatrix.needsUpdate=true;
  }
  dispose(){this.visitors.dispose();this.petals.removeFromParent();this.petals.geometry.dispose();}
}
