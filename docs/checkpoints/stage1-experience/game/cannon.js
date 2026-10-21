import * as T from 'three';
import {BOARD} from './rules.js';
export class FlowerCannon {
  constructor(art) {
    this.root=new T.Group();this.root.name='FlowerCannon';
    this.head=new T.Group();this.root.add(this.head);
    this.angle=0;this.firedAt=-100;this.time=0;
    this.geometries=[];this.materials=[];this.dummy=new T.Object3D();
    const petals=new T.SphereGeometry(1,14,10);this.geometries.push(petals);
    const petalMat=new T.MeshStandardMaterial({color:'#ffffff',map:art.textures.petal,
      normalMap:art.textures['petal-normal'],normalScale:new T.Vector2(.24,.24),roughness:.62});
    this.materials.push(petalMat);
    this.petals=new T.InstancedMesh(petals,petalMat,8);this.petals.frustumCulled=false;this.head.add(this.petals);
    for(let i=0;i<8;i++)this.petals.setColorAt(i,new T.Color(i%3===0?'#c8b3df':'#efb4cc'));
    const ringGeo=new T.TorusGeometry(.215,.042,8,40);this.geometries.push(ringGeo);
    const gold=new T.MeshStandardMaterial({color:'#e6c574',metalness:.35,roughness:.35});this.materials.push(gold);
    this.center=new T.Mesh(ringGeo,gold);this.center.position.z=.055;this.head.add(this.center);
    const curve=new T.CatmullRomCurve3([new T.Vector3(0,.64,BOARD.z-.32),
      new T.Vector3(-.065,.85,BOARD.z-.29),new T.Vector3(0,BOARD.launcher-.08,BOARD.z-.23)]);
    const stemGeo=new T.TubeGeometry(curve,16,.035,7,false);this.geometries.push(stemGeo);
    this.root.add(new T.Mesh(stemGeo,art.mat('#79935a','botanical-leaf',.75)));
    this.leaves=new T.InstancedMesh(petals,art.mat('#809b5c','botanical-leaf',.75),2);this.leaves.frustumCulled=false;
    for(let i=0;i<2;i++){
      this.dummy.position.set(i? .16:-.17,.81,BOARD.z-.28);
      this.dummy.rotation.set(0,0,i?-.55:.55);this.dummy.scale.set(.15,.065,.025);this.dummy.updateMatrix();this.leaves.setMatrixAt(i,this.dummy.matrix);
    }
    this.root.add(this.leaves);this.update(0,0,0);
  }
  fire(){this.firedAt=this.time;}
  reset(){this.firedAt=-100;this.angle=0;}
  update(dt,angle,time=this.time+dt){
    this.time=time;this.angle+=(angle-this.angle)*Math.min(1,dt*14);
    const age=time-this.firedAt,t=Math.max(0,Math.min(1,age/.28));
    const recoil=age>=0&&age<.28?Math.sin(t*Math.PI)*(1-t):0;
    this.head.position.set(-Math.sin(this.angle)*recoil*.075,
      BOARD.launcher-Math.cos(this.angle)*recoil*.075,BOARD.z-.18);
    this.head.rotation.z=-this.angle+Math.sin(time*1.1)*.012;
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4;
      this.dummy.position.set(Math.sin(a)*.285,Math.cos(a)*.285,-.045);
      this.dummy.rotation.set(Math.sin(a)*.12,Math.cos(a)*.12,-a);
      this.dummy.scale.set(.128*(1+recoil*.035),.205*(1-recoil*.12),.042);
      this.dummy.updateMatrix();this.petals.setMatrixAt(i,this.dummy.matrix);
    }
    this.petals.instanceMatrix.needsUpdate=true;
    this.root.visible=true;
  }
  dispose(){this.root.removeFromParent();this.geometries.forEach(g=>g.dispose());this.materials.forEach(m=>m.dispose());}
}
