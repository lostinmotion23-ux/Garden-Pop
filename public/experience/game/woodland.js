import * as T from 'three';
import { rng } from './rules.js';
import { softBlade, plantWind } from './garden-plants.js';

export function buildWoodland(art,scene) {
  const random=rng(731570),root=new T.Group();root.name='StorybookWoodland';scene.add(root);
  const barkGroup=new T.Group();root.add(barkGroup);
  const geometries=[],materials=[],time={value:0},crowns=[],leaves=[],trees=[];
  const own=g=>(geometries.push(g),g);
  const bark=art.mat('#92806a','bark',.9).clone();materials.push(bark);
  bark.onBeforeCompile=shader=>{
    shader.uniforms.woodlandTime=time;
    shader.vertexShader='uniform float woodlandTime;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      transformed.x+=sin(woodlandTime*.5+position.x*.2+position.z)*.018*smoothstep(3.0,10.0,position.y);`);
  };
  bark.customProgramCacheKey=()=> 'woodland-branch-wind-v1';
  const limb=(a,b,r1,r2)=>{
    const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.sub(start);
    const g=own(new T.CylinderGeometry(r2,r1,delta.length(),6));
    const m=new T.Mesh(g,bark);m.position.copy(start).addScaledVector(delta,.5);
    m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());barkGroup.add(m);
  };
  // Three reusable crowns with uneven lobes, leaf surface relief and soft normals.
  const canopyGeometry=[0,1,2].map(kind=>{
    const g=own(new T.SphereGeometry(1,10,7)),p=g.attributes.position,colors=[];
    const tint=new T.Color();
    for(let i=0;i<p.count;i++) {
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
      const bump=1+.15*Math.sin(x*6+kind)*Math.cos(y*5-z*6)+.07*Math.sin(z*12+y*9);
      p.setXYZ(i,x*bump,y*bump,z*bump);
      const light=.82+.12*(y+1)/2+.07*Math.sin(x*16+z*18)*Math.sin(y*19);
      tint.setRGB(light,light,light*.94);colors.push(tint.r,tint.g,tint.b);
    }
    g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
  });
  const canopyMaterial=new T.MeshLambertMaterial({vertexColors:true});
  plantWind(canopyMaterial,time,.009,'woodland-crown-wind-v1');materials.push(canopyMaterial);
  const leafGeometry=own(softBlade());
  const leafMaterial=new T.MeshLambertMaterial({color:'#b2c79a'});
  plantWind(leafMaterial,time,.035,'woodland-leaf-wind-v1');materials.push(leafMaterial);
  const palette=['#608151','#789854','#4e7654','#90a65e','#698b5d'];
  const tree=(x,z,h,kind,layer)=>{
    const width=h*(kind===1?.15:kind===2?.19:.23),lean=(random()-.5)*.8;
    const base=[x,.3,z],fork=[x+lean,h*.49,z+.12];
    limb(base,fork,h*.028,h*.014);limb(fork,[x+lean*.8,h*.88,z],h*.014,.035);
    const count=kind===2?4:6;
    for(let j=0;j<count;j++){
      const a=j*2.39996+random()*.4,spread=width*(.45+random()*.38);
      const cy=h*(.61+random()*.23),cx=x+Math.cos(a)*spread,cz=z+Math.sin(a)*spread*.8;
      limb([fork[0],h*(.34+j*.035),fork[2]],[cx,cy,cz],h*.009,.025);
      const s=width*(.52+random()*.17),height=s*(kind===1?1.5:kind===2?1.1:.9);
      const c=new T.Color(palette[(kind+j+layer)%palette.length]);
      if(layer>0)c.lerp(new T.Color('#81958a'),layer*.11);
      crowns.push({p:[cx,cy,cz],s:[s,height,s*.85],angle:a,kind,color:c});
      const leafCount=layer===0?14:layer===1?7:3;
      for(let k=0;k<leafCount;k++) {
        const theta=k*2.39996,yy=(random()-.25)*1.6,r=Math.sqrt(Math.max(.1,1-yy*yy*.4));
        leaves.push({p:[cx+Math.cos(theta)*s*r,cy+yy*height*.7,cz+Math.sin(theta)*s*.85*r],
          angle:theta,size:layer===0?.36:.28,color:c});
      }
    }
    trees.push({x,z,height:h,kind:['rounded','tall','sapling'][kind],layer});
  };
  // Distinct, staggered depth bands; the near band's central trunks stay low
  // enough to leave a quiet open pocket behind the active bubble rows.
  for(const [x,z,h,k] of [[-13,-18,13,0],[-8,-21,12,1],[-2.6,-22,9,2],[3.7,-23,10,0],[10,-20,14,1],[16,-21,12,0]])tree(x,z,h,k,0);
  for(let i=0;i<12;i++)tree(-27+i*4.8+(random()-.5)*1.4,-29-random()*7,13+random()*5,i%3,1);
  for(let i=0;i<13;i++)tree(-39+i*6.3+(random()-.5)*2,-43-random()*6,16+random()*6,(i+1)%3,2);
  // Side/rear trees complete the enclosing world without entering the meadow.
  for(let i=0;i<10;i++){
    const a=(i/10)*Math.PI*2;const x=Math.sin(a)*27,z=-2+Math.cos(a)*27;
    if(z< -15)continue;tree(x,z,11+random()*5,i%3,1);
  }
  art.merge(barkGroup);
  const dummy=new T.Object3D();
  for(let kind=0;kind<3;kind++) {
    const items=crowns.filter(a=>a.kind===kind),batch=new T.InstancedMesh(canopyGeometry[kind],canopyMaterial,items.length);
    batch.name=`WoodlandCrowns${kind}`;
    items.forEach((a,i)=>{dummy.position.set(...a.p);dummy.rotation.set(0,a.angle,0);dummy.scale.set(...a.s);dummy.updateMatrix();batch.setMatrixAt(i,dummy.matrix);batch.setColorAt(i,a.color);});
    batch.computeBoundingSphere();root.add(batch);
  }
  const foliage=new T.InstancedMesh(leafGeometry,leafMaterial,leaves.length);foliage.name='WoodlandLeafEdges';
  leaves.forEach((a,i)=>{dummy.position.set(...a.p);dummy.rotation.set((i%3)*.7,a.angle,.6*Math.sin(i));dummy.scale.set(a.size*.5,a.size,a.size*.5);dummy.updateMatrix();foliage.setMatrixAt(i,dummy.matrix);foliage.setColorAt(i,a.color);});
  foliage.computeBoundingSphere();root.add(foliage);
  const stats={trees:trees.length,types:3,layers:3,crowns:crowns.length,leafEdges:leaves.length,placements:trees};scene.userData.woodland=stats;
  return {root,stats,update(dt){time.value+=dt;},dispose(){root.removeFromParent();root.traverse(m=>{if(m.isInstancedMesh)m.dispose();});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
