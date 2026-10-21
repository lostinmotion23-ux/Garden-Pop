import * as T from 'three';
import {fadingMaterial} from './pop-fx.js';
// Three true 3D butterflies and eight pooled lights, all outside the playfield.
export class GardenVisitors {
  constructor(scene,art){
    this.time=0;this.reactionAt=-100;this.reduced=false;this.dummy=new T.Object3D();this.colors=[new T.Color('#efd0b3'),new T.Color('#c9bdde'),new T.Color('#dae1bc')];
    const shape=new T.Shape();shape.moveTo(0,0);shape.bezierCurveTo(.04,.23,.34,.37,.36,.19);
    shape.bezierCurveTo(.38,.08,.2,.02,.12,-.01);shape.bezierCurveTo(.32,-.01,.3,-.25,.15,-.22);shape.bezierCurveTo(.04,-.2,.03,-.08,0,0);
    const geo=new T.ExtrudeGeometry(shape,{depth:.012,bevelEnabled:true,bevelSize:.008,bevelThickness:.006,bevelSegments:1,curveSegments:5});
    const mat=new T.MeshStandardMaterial({color:'#ffffff',map:art.textures['butterfly-wing'],roughness:.6,metalness:.02});
    this.wings=new T.InstancedMesh(geo,mat,6);this.wings.name='GardenButterflies';this.wings.frustumCulled=false;
    this.bodies=new T.InstancedMesh(new T.SphereGeometry(1,8,6),art.mat('#9c845e','bark'),3);this.bodies.frustumCulled=false;
    this.flyGeometry=new T.IcosahedronGeometry(.025,0);
    this.alpha=new T.InstancedBufferAttribute(new Float32Array(8),1);this.flyGeometry.setAttribute('effectAlpha',this.alpha);
    this.fireflies=new T.InstancedMesh(this.flyGeometry,fadingMaterial(),8);this.fireflies.name='GardenFireflies';this.fireflies.frustumCulled=false;
    for(let i=0;i<8;i++)this.fireflies.setColorAt(i,new T.Color('#ffe5a0'));
    scene.add(this.wings,this.bodies,this.fireflies);this.update(0);
  }
  react(){this.reactionAt=this.time;}
  update(dt){
    this.time+=dt;const t=this.time,d=this.dummy,burst=Math.max(0,1-(t-this.reactionAt)/1.4),butterflies=this.reduced?1:3;
    for(let i=0;i<butterflies;i++){
      const side=i%2?1:-1,cycle=(t+i*7)%26,land=cycle>20;
      const blend=land?Math.min(1,(cycle-20)/1.5):Math.max(0,1-cycle/1.5);
      const x=i===2?Math.sin(t*.18)*1.2:side*(4.65+Math.sin(t*.27+i)*.27);
      const y=i===2?9.85+Math.sin(t*.4)*.12:1.3+(1-blend)*(2.6+Math.sin(t*.23+i)*2.1);
      const z=i===2?-1.8:-2.7+blend*1.3;
      const flap=land?.22+Math.sin(t*2)*.08:Math.sin(t*14+i)*.8;
      for(let wing=0;wing<2;wing++){
        d.position.set(x,y,z);d.rotation.set(.12,wing?Math.PI-flap:flap,.1*Math.sin(t+i));d.scale.setScalar(1);d.updateMatrix();
        this.wings.setMatrixAt(i*2+wing,d.matrix);this.wings.setColorAt(i*2+wing,this.colors[i]);
      }
      d.position.set(x,y,z);d.rotation.set(.12,0,0);d.scale.set(.025,.12,.025);d.updateMatrix();this.bodies.setMatrixAt(i,d.matrix);
    }
    this.wings.count=butterflies*2;this.bodies.count=butterflies;
    this.wings.instanceMatrix.needsUpdate=true;this.wings.instanceColor.needsUpdate=true;this.bodies.instanceMatrix.needsUpdate=true;
    const count=this.reduced?3:8;
    for(let i=0;i<count;i++){
      const side=i%2?1:-1;
      d.position.set(side*(4.18+.28*Math.sin(t*.31+i)),1.2+(i%4)*1.65+Math.sin(t*.4+i)*.18,-1.45);
      d.rotation.set(0,0,0);d.scale.setScalar(1+burst*.2);d.updateMatrix();this.fireflies.setMatrixAt(i,d.matrix);
      this.alpha.setX(i,(.12+.58*(.5+.5*Math.sin(t*1.2+i*2))**3)*(1+burst*.2));
    }
    this.fireflies.count=count;this.fireflies.instanceMatrix.needsUpdate=true;this.alpha.needsUpdate=true;
  }
  reset(){this.reactionAt=-100;}
  dispose(){for(const m of [this.wings,this.bodies,this.fireflies]){m.removeFromParent();m.geometry.dispose();}this.wings.material.dispose();this.fireflies.material.dispose();}
}
