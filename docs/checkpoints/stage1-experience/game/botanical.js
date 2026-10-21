import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng } from './rules.js';

// True curved petal/leaf surfaces, tapered branches and instanced blossoms.
// No canopy blobs, scenery photographs or flower billboards.
function blade(petal = false) {
  const positions=[], uv=[], indices=[], nx=petal?3:2, ny=petal?4:3;
  for(let j=0;j<=ny;j++) for(let i=0;i<=nx;i++) {
    const v=j/ny, u=i/nx, width=Math.pow(Math.sin(Math.PI*v),petal?.55:.8);
    positions.push((u-.5)*width*(petal?1.05:.58),v,
      Math.sin(Math.PI*v)*.13 + (u-.5)**2*(petal?.3:-.18)+v*v*.08);
    uv.push(u,v);
  }
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++) {
    const a=j*(nx+1)+i,b=a+nx+1;indices.push(a,b,a+1,b,b+1,a+1);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function blossomGeometry(detail=5) {
  const outline=new T.Shape();
  outline.moveTo(0,0);
  outline.bezierCurveTo(-.16,.12,-.47,.32,-.49,.68);
  outline.bezierCurveTo(-.51,.95,-.18,1.08,0,.94);
  outline.bezierCurveTo(.18,1.08,.51,.95,.49,.68);
  outline.bezierCurveTo(.47,.32,.16,.12,0,0);
  const petal=new T.ShapeGeometry(outline,detail), parts=[];
  const p=petal.attributes.position,u=petal.attributes.uv;
  for(let i=0;i<p.count;i++) {
    const x=p.getX(i),y=p.getY(i);p.setZ(i,.1*Math.sin(Math.PI*y)+x*x*.25);
    u.setXY(i,x+.5,y);
  }
  petal.computeVertexNormals();
  for(let i=0;i<5;i++) {
    const g=petal.clone();const m=new T.Matrix4().makeRotationZ(i*Math.PI*2/5);
    g.applyMatrix4(m);parts.push(g);
  }
  const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());petal.dispose();return g;
}
export function buildBotanicalGarden(art, scene) {
  const random=rng(63157),g=new T.Group();g.name='BotanicalGarden';scene.add(g);
  const geometry=[], looseMaterials=[], flowers=[], leaves=[], centers=[], lanterns=[];
  const wood=art.mat('#b49b7a','wood',.66), bark=art.mat('#e3d9cd','bark',.86);
  const stone=art.mat('#c2bda9','stone',.87), metal=new T.MeshStandardMaterial({color:'#a6966b',metalness:.72,roughness:.36});
  looseMaterials.push(metal);
  const mesh=(geo,mat,p=[0,0,0],s=[1,1,1])=>{const m=new T.Mesh(geo,mat);m.position.set(...p);m.scale.set(...s);g.add(m);return m;};
  const sphere=new T.SphereGeometry(1,10,7),box=new T.BoxGeometry(1,1,1);geometry.push(sphere,box);
  const path=(points,r,mat=bark)=>{
    const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
    const geo=new T.TubeGeometry(curve,Math.max(5,points.length*3),r,7,false);geometry.push(geo);return mesh(geo,mat);
  };
  const limb=(a,b,r1,r2,mat=bark)=>{
    const start=new T.Vector3(...a),end=new T.Vector3(...b),v=end.clone().sub(start);
    const geo=new T.CylinderGeometry(r2,r1,v.length(),7,1);geometry.push(geo);
    const m=mesh(geo,mat,start.addScaledVector(v,.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m;
  };
  const place=(list,p,size,rotation=[0,0,0],color=null)=>list.push({p,size,rotation,color});
  const bloom=(p,size)=>{
    place(flowers,p,size,[random()*2.2-1.1,random()*2.2-1.1,random()*Math.PI*2],new T.Color().setHSL(.965+random()*.02,.12+random()*.16,.82+random()*.13));
    place(centers,[p[0],p[1],p[2]+.018],size*.15);
  };
  // A private, fully modelled garden remains behind the playfield.
  scene.background=new T.Color('#cbd8d7');scene.fog=new T.Fog('#c9d6c7',18,40);
  const skyGeo=new T.SphereGeometry(48,16,10),skyColors=[],low=new T.Color('#d4e2d6'),high=new T.Color('#8bb8ca');
  for(let i=0;i<skyGeo.attributes.position.count;i++) {
    const t=T.MathUtils.clamp((skyGeo.attributes.position.getY(i)+4)/30,0,1);
    const c=low.clone().lerp(high,t);skyColors.push(c.r,c.g,c.b);
  }
  skyGeo.setAttribute('color',new T.Float32BufferAttribute(skyColors,3));
  const sky=new T.Mesh(skyGeo,new T.MeshBasicMaterial({vertexColors:true,side:T.BackSide,toneMapped:false,fog:false}));scene.add(sky);
  mesh(sphere,art.mat('#c1c5a3','botanical-ground'),[0,-.1,-5],[15,.65,16]);
  mesh(box,stone,[0,.43,-1.5],[9.15,.38,4.45]);
  mesh(box,art.mat('#b4bd92','botanical-ground'),[0,.615,-1.5],[8.98,.025,4.3]);
  // Individual flagstones and a meandering path lead toward the tree.
  for(let i=0;i<22;i++) {
    const z=-.1-i*.38,x=Math.sin(i*.37)*.63;
    const rock=mesh(sphere,stone,[x,.63,z],[.58,.055,.29]);rock.rotation.y=Math.sin(i)*.28;
  }
  for(let i=0;i<18;i++) {
    const x=-4.35+i*.51;
    mesh(sphere,stone,[x,.64,.72],[.26,.07,.38]).rotation.y=random()*.4;
  }
  // Smoked glass lets the actual garden show through, keeping bubble silhouettes clear.
  const glass=new T.MeshStandardMaterial({color:'#283d3a',transparent:true,opacity:.38,
    roughness:.65,metalness:.05,depthWrite:false,side:T.DoubleSide});looseMaterials.push(glass);
  const glassGeo=new T.PlaneGeometry(8.25,7.65);geometry.push(glassGeo);
  const backing=new T.Mesh(glassGeo,glass);backing.name='GardenGlass';backing.position.set(0,5.45,-2.03);scene.add(backing);
  // Laminated timber, tapered posts, brass collars and carved arch ribs.
  for(const side of [-1,1]) {
    const x=side*4.02;
    mesh(box,stone,[x,.81,-1.5],[.62,.39,.72]);
    mesh(box,wood,[x,4.97,-1.62],[.25,8.12,.42]);
    for(const dx of [-.105,.105])path([[x+dx,1,-1.38],[x+dx,5,-1.38],[x+dx,9.02,-1.38]],.022,wood);
    for(const y of [1.2,6.9,8.85])mesh(box,metal,[x,y,-1.62],[.285,.065,.45]);
    path([[x,7.9,-1.65],[x-side*.35,8.7,-1.65],[x-side*1.05,9.05,-1.65]],.095,wood);
    for(const y of [1.25,8.8])for(const z of [-1.38,-1.86])mesh(sphere,metal,[x,y,z],[.045,.045,.016]);
  }
  for(const [y,r]of [[9.25,.16],[9.55,.055],[9.03,.045]])
    path([[-4.2,y-.2,-1.64],[-2.2,y+.12,-1.64],[0,y+.25,-1.64],[2.2,y+.12,-1.64],[4.2,y-.2,-1.64]],r,wood);
  // Glass and bronze garden lanterns with actual interior lights.
  const lampGlass=new T.MeshStandardMaterial({color:'#ebd4a2',emissive:'#ffa947',emissiveIntensity:1.3,roughness:.22,metalness:.08});
  looseMaterials.push(lampGlass);
  for(const side of [-1,1]) {
    const x=side*3.78;
    path([[side*4.03,8.13,-1.43],[x,8.03,-1.25],[x,7.58,-1.1]],.025,metal);
    const begin=g.children.length;
    mesh(box,lampGlass,[x,7.26,-1.1],[.23,.51,.21]);
    for(const yy of [6.98,7.54])mesh(box,metal,[x,yy,-1.1],[.34,.055,.3]);
    for(const dx of [-.135,.135])for(const dz of [-.115,.115])limb([x+dx,7.02,-1.1+dz],[x+dx,7.51,-1.1+dz],.012,.012,metal);
    const body=new T.Group();g.children.slice(begin).forEach(m=>body.add(m));art.merge(body);
    const pivot=new T.Group();pivot.name='SwingingLantern';pivot.position.set(x,7.58,-1.1);
    body.position.set(-x,-7.58,1.1);pivot.add(body);scene.add(pivot);
    const light=new T.PointLight('#ffd499',3.2,3.3,2);light.position.set(0,-.38,.25);pivot.add(light);
    lanterns.push({pivot,light,phase:side});
  }
  const tree=(tx,tz,height,spread,count)=>{
    const trunk=[[tx,.54,tz],[tx+.13,height*.22,tz+.06],
      [tx-.17,height*.4,tz+.08],[tx+.09,height*.58,tz-.1],[tx+.2,height*.73,tz]];
    const trunkCurve=new T.CatmullRomCurve3(trunk.map(p=>new T.Vector3(...p)));
    const trunkGeo=new T.TubeGeometry(trunkCurve,32,.31,11,false);
    const positions=trunkGeo.attributes.position;
    for(let i=0;i<positions.count;i++) {
      const t=Math.floor(i/12)/32,center=trunkCurve.getPointAt(t);
      const taper=(1-t*.88)*(1+Math.sin(i*.57)*.045);
      positions.setXYZ(i,center.x+(positions.getX(i)-center.x)*taper,
        center.y+(positions.getY(i)-center.y)*taper,center.z+(positions.getZ(i)-center.z)*taper);
    }
    trunkGeo.computeVertexNormals();geometry.push(trunkGeo);mesh(trunkGeo,bark);
    for(let k=0;k<5;k++) {
      const a=k*1.256,r=.45+random()*.25;
      limb([tx,.64,tz],[tx+Math.cos(a)*r,.53,tz+Math.sin(a)*r],.11,.015);
    }
    const leaders=[];
    for(let k=0;k<6;k++) {
      const a=k*2.4+.3, start=[tx-.05,height*(.28+k*.035),tz];
      const elbow=[tx+Math.cos(a)*spread*.28,height*(.48+k*.022),tz+Math.sin(a)*spread*.2];
      const tip=[tx+Math.cos(a)*spread*.62,height*(.62+k*.025),tz+Math.sin(a)*spread*.39];
      limb(start,elbow,.1-k*.008,.055);limb(elbow,tip,.055,.021);
      leaders.push({elbow,tip});
    }
    for(let k=0;k<count*2;k++) {
      const angle=k*2.39996, elevation=random();
      const reach=spread*Math.sqrt(1-(elevation-.4)**2)*(.28+Math.sqrt(random())*.72);
      const tip=[tx+Math.cos(angle)*reach,height*(.58+elevation*.45),tz+Math.sin(angle)*reach*.54];
      const nearest=[...leaders].sort((a,b)=>new T.Vector3(...a.tip).distanceToSquared(new T.Vector3(...tip))-
        new T.Vector3(...b.tip).distanceToSquared(new T.Vector3(...tip)))[0];
      const t=.25+random()*.75;
      const attach=nearest.elbow.map((v,i)=>v*(1-t)+nearest.tip[i]*t);
      const elbow=attach.map((v,i)=>v*.5+tip[i]*.5);elbow[1]-=.12;
      limb(attach,elbow,.018,.009);limb(elbow,tip,.009,.0035);
      for(let j=0;j<3;j++) {
        const p=[tip[0]+(j-1)*.2,tip[1]+random()*.23-.08,tip[2]+random()*.36-.18];
        limb(tip,p,.0045,.002);
        for(let q=0;q<10;q++) {
          const radius=.04+random()*.22,a=random()*Math.PI*2;
          bloom([p[0]+Math.cos(a)*radius,p[1]+Math.sin(a)*radius*.75,p[2]+(random()-.5)*.2],.085+random()*.045);
        }
        if(j===1)place(leaves,[p[0]+.09,p[1]-.08,p[2]+.03],.18,[.1,random(),random()*6],new T.Color('#96a568'));
      }
    }
  };
  tree(2,-6.2,6.6,4.1,30);tree(-4.8,-6.7,5.2,2.8,14);
  tree(-1.6,-10.4,5.9,3.2,9);
  // Sparse climbing stems with thin, veined leaves and small matching blossoms.
  for(const side of [-1,1]) {
    const x=side*4.02,points=[];
    for(let i=0;i<20;i++)points.push([x+Math.sin(i*.72)*.1,1+i*.4,-1.32+Math.cos(i*.56)*.04]);
    path(points,.012,bark);
    for(let i=0;i<34;i++) {
      const yy=1.2+i*.225,xx=x+Math.sin(i*.91)*.17;
      place(leaves,[xx,yy,-1.23],.16+random()*.09,[.12,random()*.8-.4,(i%2?1:-1)*.85],new T.Color('#778c59'));
      if(i%3===0)for(let q=0;q<3;q++)bloom([xx+random()*.12-.06,yy+random()*.15,-1.13],.064+random()*.016);
    }
  }
  for(let i=0;i<42;i++) {
    const x=-4+i*.19,y=9.27+.18*Math.cos(x*.4);
    if(i%2===0)place(leaves,[x,y,-1.35],.18,[.1,.1,Math.sin(i)*.9],new T.Color('#7c9264'));
    if(i%3===0)for(let j=0;j<3;j++)bloom([x+random()*.17,y+random()*.13,-1.19],.063);
  }
  // Ferns, blossom beds and weathered rocks replace round placeholder shrubs.
  for(let patch=0;patch<28;patch++) {
    const x=patch<14?-5.2+patch*.8:-5.4+(patch-14)*.8,z=patch<14?-3.4:1.1;
    if(Math.abs(x)<1.35&&z>0)continue;
    for(let stem=0;stem<5;stem++) {
      const a=random()*Math.PI*2,r=.13+random()*.2;
      const bx=x+Math.cos(a)*r,bz=z+Math.sin(a)*r;
      for(let k=0;k<5;k++) {
        const y=.65+k*.075;
        for(const side of [-1,1])place(leaves,[bx+side*k*.018,y,bz],.12+(4-k)*.015,
          [random()*.4-.2,a,side*(.7-k*.09)],new T.Color().setHSL(.23,.2+random()*.12,.32+random()*.15));
      }
      if(stem<2)for(let j=0;j<3;j++)bloom([bx+random()*.12,.81+random()*.13,bz+.05],.075);
    }
    if(patch%3===0)mesh(sphere,stone,[x,.72,z],[.26,.17,.2]);
  }
  art.merge(g);
  const instanced=(geo,mat,items,name)=>{
    const inst=new T.InstancedMesh(geo,mat,items.length),dummy=new T.Object3D();inst.name=name;
    items.forEach((a,i)=>{dummy.position.set(...a.p);dummy.rotation.set(...(a.rotation??[0,0,0]));dummy.scale.setScalar(a.size);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);if(a.color)inst.setColorAt(i,a.color);});
    inst.computeBoundingSphere();scene.add(inst);return inst;
  };
  const petalGeo=blossomGeometry(4),farPetalGeo=blossomGeometry(2),leafGeo=blade(false),centerGeo=new T.OctahedronGeometry(1,0);
  geometry.push(petalGeo,farPetalGeo,leafGeo,centerGeo);
  const petalMat=new T.MeshStandardMaterial({color:'#ffffff',map:art.textures.petal,normalMap:art.textures['petal-normal'],
    roughnessMap:art.textures['petal-rough'],normalScale:new T.Vector2(.2,.2),roughness:.72,side:T.DoubleSide});
  const leafMat=new T.MeshStandardMaterial({color:'#ffffff',map:art.textures['botanical-leaf'],normalMap:art.textures['botanical-leaf-normal'],
    normalScale:new T.Vector2(.45,.45),roughness:.72,side:T.DoubleSide});
  const centerMat=new T.MeshStandardMaterial({color:'#ae8139',roughness:.7});looseMaterials.push(petalMat,leafMat,centerMat);
  const flowerMesh=instanced(petalGeo,petalMat,flowers.filter(a=>a.p[2]>-3),'CherryBlossoms');
  const farFlowerMesh=instanced(farPetalGeo,petalMat,flowers.filter(a=>a.p[2]<=-3),'DistantCherryBlossoms');
  const leafMesh=instanced(leafGeo,leafMat,leaves,'VeinedFoliage');
  const centerMesh=instanced(centerGeo,centerMat,centers,'BlossomCenters');
  // One uniform moves instanced petals/leaves in the vertex shader; no per-plant CPU work.
  const wind={value:0};
  for(const mat of [petalMat,leafMat]){
    mat.onBeforeCompile=shader=>{
      shader.uniforms.gardenTime=wind;
      shader.vertexShader='uniform float gardenTime;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        vec3 gardenOrigin=instanceMatrix[3].xyz;
        float breeze=sin(gardenTime*.85+gardenOrigin.x*.7+gardenOrigin.z*.4);
        transformed.x+=breeze*.055*position.y;
        transformed.z+=sin(gardenTime*.7+gardenOrigin.y)*.035*position.y;`);
    };
    mat.customProgramCacheKey=()=> 'garden-sway-v1';
  }
  bark.onBeforeCompile=shader=>{
    shader.uniforms.gardenTime=wind;
    shader.vertexShader='uniform float gardenTime;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      float vine=step(3.7,abs(position.x))*step(abs(position.x),4.3)*step(-1.5,position.z)*step(position.z,-1.1);
      transformed.x+=vine*sin(gardenTime*.8+position.y)*.012;`);
  };
  bark.customProgramCacheKey=()=> 'garden-vine-v1';
  const stats={blossoms:flowers.length,leaves:leaves.length,staticMeshes:g.children.length};
  scene.userData.botanical=stats;
  let time=0;
  return {root:g,sky,stats,update(dt){
    time+=dt;wind.value=time;
    for(const l of lanterns){l.pivot.rotation.z=Math.sin(time*.75+l.phase)*.025;l.light.intensity=3.2*(.96+.04*Math.sin(time*1.1+l.phase));}
  },dispose(){
    lanterns.forEach(l=>l.pivot.removeFromParent());g.removeFromParent();sky.removeFromParent();
    for(const m of [flowerMesh,farFlowerMesh,leafMesh,centerMesh,backing])m.removeFromParent();
    geometry.forEach(geo=>geo.dispose());looseMaterials.forEach(mat=>mat.dispose());
  }};
}
