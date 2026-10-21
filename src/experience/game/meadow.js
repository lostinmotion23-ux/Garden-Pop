import * as T from 'three';
import { BOARD, rng } from './rules.js';
import { softBlade, tintGeometry, combine, plantWind } from './garden-plants.js';

export const MAX_GRASS_HEIGHT=BOARD.diameter/3;
const COLORS=['#89b56d','#9fc58b','#71a96b','#5c905d'];

export function buildMeadow(art,scene) {
  const root=new T.Group();root.name='LivingMeadow';scene.add(root);
  const random=rng(8163157),time={value:0},geometries=[],materials=[];
  const own=g=>(geometries.push(g),g);
  const blade=own(softBlade()),petal=own(new T.SphereGeometry(1,5,3));
  // Three clump models: 3, 5 and 7 individually curved volumetric blades.
  const clumps=[3,5,7].map(count=>{
    const parts=[];
    for(let i=0;i<count;i++) {
      const a=i*2.39996+random(),h=.68+random()*.32;
      const g=blade.clone();g.scale(.13+random()*.09,h,.5);g.rotateY(a);
      g.translate(Math.cos(a)*.12,0,Math.sin(a)*.12);
      parts.push(tintGeometry(g,COLORS[i%COLORS.length]));
    }
    return own(combine(parts));
  });
  // Matte plants use diffuse lighting; tiny blades need no environment
  // reflection evaluation. They still share the scene's key and sky lights.
  const grassMat=new T.MeshLambertMaterial({vertexColors:true});
  plantWind(grassMat,time,.045,'short-meadow-wind-v1');materials.push(grassMat);
  const flowerColors=['#fff9e3','#ecc0d0','#edcf76','#bca1d5','#b5d9e4'];
  const flowers=flowerColors.map((color,kind)=>{
    const parts=[],height=.67+(kind%3)*.07;
    const stem=new T.CylinderGeometry(.024,.033,height,5);stem.translate(0,height/2,0);
    parts.push(tintGeometry(stem,'#6c995d'));
    for(const side of [-1,1]){
      const leaf=blade.clone();leaf.scale(.17,.34,.18);leaf.rotateZ(side*.75);leaf.translate(0,height*.24,0);
      parts.push(tintGeometry(leaf,'#80ad6a'));
    }
    const n=kind===0?7:5;
    for(let i=0;i<n;i++) {
      const a=i/n*Math.PI*2,g=petal.clone();g.scale(.12,.065,.22);g.rotateY(a);
      g.translate(Math.sin(a)*.16,height,Math.cos(a)*.16);parts.push(tintGeometry(g,color));
    }
    const center=petal.clone();center.scale(.105,.075,.105);center.translate(0,height+.025,0);
    parts.push(tintGeometry(center,'#e6bc52'));return own(combine(parts));
  });
  const flowerMat=new T.MeshLambertMaterial({vertexColors:true});
  plantWind(flowerMat,time,.035,'miniature-flower-wind-v1');materials.push(flowerMat);
  const grassPoints=[[],[],[]],flowerPoints=Array.from({length:5},()=>[]);
  const surface=(x,z)=>{
    const terrace=x*x/(6.06**2)+(z+.7)**2/(4.07**2)<.98;
    return terrace?.615:-.55+.9*Math.sqrt(Math.max(0,1-x*x/900-(z+9)**2/1024));
  };
  const path=(x,z)=>Math.abs(x-Math.sin((-.1-z)/.38*.37)*.63)<.55 && z<.7 && z>-8.5;
  let grassCount=0,flowerCount=0,maximumHeight=0;
  for(let i=0;i<6000;i++) {
    const near=i<3500;
    const x=(random()-.5)*(near?9.2:19),z=(near?2.5:3.1)-random()*(near?5.5:18);
    // Keep the basin, stone paths, launcher base and sparse natural gaps open.
    const pond=x*x/(6.95**2)+(z+8.8)**2/(3.55**2)<1;
    if(pond||path(x,z)||Math.hypot(x,z+1.6)<.48||Math.hypot(x-.67,z+1.6)<.25)continue;
    const lush=.5+.25*Math.sin(x*1.8+z*.9)+.2*Math.cos(z*2.3-x);
    if(random()>lush+.2)continue;
    const p=[x,surface(x,z),z],height=MAX_GRASS_HEIGHT*(.65+random()*.35);
    const kind=Math.floor(random()*3);grassPoints[kind].push({p,height,angle:random()*Math.PI*2});grassCount++;
    maximumHeight=Math.max(maximumHeight,height);
    if(random()<.095 && Math.sin(x*2.1+z)>-.2) {
      const type=Math.floor(random()*5),count=1+Math.floor(random()*3);
      for(let j=0;j<count;j++){
        const fx=x+(random()-.5)*.15,fz=z+(random()-.5)*.15;
        flowerPoints[type].push({p:[fx,surface(fx,fz),fz],height:MAX_GRASS_HEIGHT*(.85+random()*.2),angle:random()*6});flowerCount++;
      }
    }
  }
  const dummy=new T.Object3D();
  const batch=(geometry,material,points,name)=>{
    const mesh=new T.InstancedMesh(geometry,material,points.length);mesh.name=name;
    points.forEach(({p,height,angle},i)=>{
      dummy.position.set(...p);dummy.rotation.set(0,angle,0);dummy.scale.setScalar(height);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
    });
    mesh.computeBoundingSphere();root.add(mesh);return mesh;
  };
  clumps.forEach((g,i)=>batch(g,grassMat,grassPoints[i],`GrassClumps${[3,5,7][i]}`));
  flowers.forEach((g,i)=>batch(g,flowerMat,flowerPoints[i],`MeadowFlowers${i}`));
  const stats={grassClumps:grassCount,flowers:flowerCount,maxGrassHeight:maximumHeight,grassHeightLimit:MAX_GRASS_HEIGHT,bubbleDiameter:BOARD.diameter};
  root.userData=stats;scene.userData.meadow=stats;
  const fullCounts=root.children.map(m=>m.count);let average=.016,qualityAge=0;
  stats.reduced=false;
  return {root,stats,update(dt){
    if(!(dt>0))return;
    time.value+=dt;qualityAge+=dt;
    if(dt>0)average+=(Math.min(.12,dt)-average)*.08;
    if(qualityAge>2&&!stats.reduced&&average>.035){stats.reduced=true;qualityAge=0;}
    else if(qualityAge>10&&stats.reduced&&average<.022){stats.reduced=false;qualityAge=0;}
    root.children.forEach((mesh,i)=>{
      const target=Math.ceil(fullCounts[i]*(stats.reduced?.5:1));
      mesh.count+=Math.sign(target-mesh.count)*Math.min(Math.abs(target-mesh.count),Math.max(1,Math.ceil(dt*fullCounts[i]*.7)));
    });
  },dispose(){root.removeFromParent();root.children.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
