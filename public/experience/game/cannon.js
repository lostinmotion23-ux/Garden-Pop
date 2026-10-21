import * as T from 'three';
import {BOARD} from './rules.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
export class FlowerCannon {
  constructor(art) {
    this.root=new T.Group();this.root.name='FlowerCannon';
    this.head=new T.Group();this.root.add(this.head);
    this.angle=0;this.firedAt=-100;this.time=0;this.comboAt=-100;this.context={};
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
    const mainStem=new T.TubeGeometry(curve,16,.035,7,false);
    const queueCurve=new T.CatmullRomCurve3([new T.Vector3(.3,.64,BOARD.z-.27),
      new T.Vector3(.81,.69,BOARD.z-.27),new T.Vector3(.67,.87,BOARD.z-.24)]);
    const queueStem=new T.TubeGeometry(queueCurve,12,.021,7,false);
    const stemGeo=mergeGeometries([mainStem,queueStem]);mainStem.dispose();queueStem.dispose();this.geometries.push(stemGeo);
    this.root.add(new T.Mesh(stemGeo,art.mat('#79935a','botanical-leaf',.75)));
    this.leaves=new T.InstancedMesh(petals,art.mat('#809b5c','botanical-leaf',.75),4);this.leaves.frustumCulled=false;
    this.root.add(this.leaves);this.update(0,0,0);
    const leaf=new T.Shape();leaf.moveTo(0,.43);
    leaf.bezierCurveTo(-.078,.49,-.06,.555,0,.62);
    leaf.bezierCurveTo(.06,.555,.078,.49,0,.43);
    const pointerGeometry=new T.ExtrudeGeometry(leaf,{depth:.012,bevelEnabled:true,bevelSize:.009,bevelThickness:.006,bevelSegments:1,steps:1,curveSegments:5});
    const pointerMaterial=new T.MeshStandardMaterial({color:'#ffecb0',emissive:'#e8bc54',emissiveIntensity:.38,roughness:.42});
    this.geometries.push(pointerGeometry);this.materials.push(pointerMaterial);
    this.pointer=new T.Mesh(pointerGeometry,pointerMaterial);this.pointer.name='CannonDirectionPointer';
    this.root.add(this.pointer);this.update(0,0,0);
  }
  fire(){this.firedAt=this.time;}
  reset(){this.firedAt=-100;this.comboAt=-100;this.angle=0;}
  celebrate(){this.comboAt=this.time;}
  update(dt,angle,time=this.time+dt){
    this.time=time;this.angle=angle;
    const age=time-this.firedAt,t=Math.max(0,Math.min(1,age/.28));
    const recoil=age>=0&&age<.28?Math.sin(t*Math.PI)*(1-t):0;
    this.head.position.set(-Math.sin(this.angle)*recoil*.075,
      BOARD.launcher-Math.cos(this.angle)*recoil*.075,BOARD.z-.18);
    const idle=age>1&&!this.context.flying,breath=idle?Math.sin(time*.9)*.035:0;
    const combo=Math.max(0,1-(time-this.comboAt)/.8);
    const curiosity=idle&&Math.abs(this.context.petX??10)<1.5?Math.sin(time*.65)*.035:0;
    this.head.rotation.z=-this.angle;
    if(this.pointer){this.pointer.position.set(this.head.position.x,this.head.position.y,BOARD.z+.08);this.pointer.rotation.z=-angle;}
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4;
      this.dummy.position.set(Math.sin(a)*.285*(1+breath+combo*.04),Math.cos(a)*.285*(1+breath+combo*.04),-.045+breath*.45);
      this.dummy.rotation.set(Math.sin(a)*.12,Math.cos(a)*.12,-a);
      this.dummy.scale.set(.128*(1+recoil*.035),.205*(1-recoil*.12),.042);
      this.dummy.updateMatrix();this.petals.setMatrixAt(i,this.dummy.matrix);
    }
    for(let i=0;i<4;i++){
      const queue=i>=2,side=i%2?1:-1;
      this.dummy.position.set(queue?.67+side*.095:side*.16,queue?.82:.81,BOARD.z-.25);
      this.dummy.rotation.set(0,0,side*(queue?.62:-.55)+Math.sin(time*19+i)*recoil*.16);
      this.dummy.scale.set(queue?.12:.15,queue?.045:.065,.025);this.dummy.updateMatrix();this.leaves.setMatrixAt(i,this.dummy.matrix);
    }
    this.leaves.instanceMatrix.needsUpdate=true;
    this.petals.instanceMatrix.needsUpdate=true;
    this.root.visible=true;
  }
  dispose(){this.root.removeFromParent();this.geometries.forEach(g=>g.dispose());this.materials.forEach(m=>m.dispose());}
}
