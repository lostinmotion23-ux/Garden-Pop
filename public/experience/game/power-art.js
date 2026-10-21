import * as T from 'three';
import {COLORS,POWERS} from './rules.js';
export function buildPower(view,kind,size){
  if(view.powerTemplates.has(kind)){const m=view.powerTemplates.get(kind).clone(true);m.scale.setScalar(size);return m;}
  const a=view.art,root=new T.Group(),index=POWERS.indexOf(kind);
  const colors=['#efa65e','#c69cdd','#a397d3','#ecd38b','#656383','#719589','#91cad8'];
  const material=a.bubbleMaterial.clone();material.color.set(colors[index]);material.transparent=true;
  material.opacity=.32;material.depthWrite=false;material.roughness=.12;material.iridescence=.18;
  view.skillMaterials.push(material);root.add(new T.Mesh(view.skillGeometry,material));
  const rim=new T.Mesh(view.skillRim,view.skillRimMaterial);rim.position.z=.04;root.add(rim);
  const ownGeo=(g)=>{view.powerGeometries.push(g);return g;};
  const ownMat=(m)=>{view.skillMaterials.push(m);return m;};
  const gold=()=>ownMat(new T.MeshStandardMaterial({color:'#efd292',map:a.textures['bubble-film'],metalness:.25,roughness:.32}));
  const moving=new T.Group();moving.name='PowerMotion';
  if(kind==='fire'){
    const shape=new T.Shape();shape.moveTo(0,-.68);
    shape.bezierCurveTo(-.9,-.55,-.69,.16,-.3,.45);shape.bezierCurveTo(-.35,.1,-.16,-.02,-.13,.1);
    shape.bezierCurveTo(.15,.4,-.02,.55,.1,.9);shape.bezierCurveTo(.3,.47,.76,.2,.57,-.22);
    shape.bezierCurveTo(.79,-.53,.34,-.75,0,-.68);
    const geo=ownGeo(new T.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:true,bevelSegments:2,bevelSize:.035,bevelThickness:.035,curveSegments:7}));
    const outer=ownMat(new T.MeshStandardMaterial({color:'#f8bb66',map:a.textures['bubble-film'],emissive:'#f69b28',emissiveIntensity:.6,roughness:.4}));
    const inner=ownMat(new T.MeshStandardMaterial({color:'#fff0ba',emissive:'#ffe39a',emissiveIntensity:.75,roughness:.35}));
    const flame=new T.Mesh(geo,outer);flame.scale.setScalar(.7);flame.position.z=.34;moving.add(flame);
    const heart=new T.Mesh(geo,inner);heart.scale.set(.29,.4,.4);heart.position.set(.02,-.13,.48);moving.add(heart);
  }else if(kind==='rainbow'){
    const geo=ownGeo(new T.OctahedronGeometry(.65,0)),array=[];
    for(let i=0;i<geo.attributes.position.count;i++){const c=new T.Color(COLORS[Math.floor(i/3)%5]);array.push(c.r,c.g,c.b);}
    geo.setAttribute('color',new T.Float32BufferAttribute(array,3));
    const mat=ownMat(new T.MeshPhysicalMaterial({color:'#ffffff',map:a.textures['bubble-film'],vertexColors:true,metalness:.16,roughness:.13,clearcoat:1,envMapIntensity:1.1}));
    const crystal=new T.Mesh(geo,mat);crystal.name='PowerCrystal';crystal.scale.y=1.18;crystal.position.z=.18;moving.add(crystal);
  }else if(kind==='shuffle'){
    const geo=ownGeo(new T.SphereGeometry(.23,12,8));
    for(let i=0;i<5;i++){const mat=a.bubbleMaterial.clone();mat.color.set(COLORS[i]);view.skillMaterials.push(mat);const b=new T.Mesh(geo,mat);b.name='Orbit'+i;moving.add(b);}
  }else if(kind==='bomb'){
    const mat=ownMat(new T.MeshPhysicalMaterial({color:'#303c48',map:a.textures['bubble-film'],roughness:.24,metalness:.25,clearcoat:1}));
    const body=new T.Mesh(ownGeo(new T.SphereGeometry(.6,18,12)),mat);body.position.set(-.02,-.13,.22);moving.add(body);
    const curve=new T.CatmullRomCurve3([new T.Vector3(.1,.38,.2),new T.Vector3(.24,.65,.22),new T.Vector3(.49,.79,.25)]);
    moving.add(new T.Mesh(ownGeo(new T.TubeGeometry(curve,10,.045,6,false)),gold()));
    const spark=new T.Mesh(ownGeo(new T.IcosahedronGeometry(.105,0)),ownMat(new T.MeshStandardMaterial({color:'#fff0b5',emissive:'#ffcd6f',emissiveIntensity:1.1,roughness:.4})));
    spark.name='PowerFuse';spark.position.set(.49,.79,.25);moving.add(spark);
  }else if(kind==='star'){
    view.star(root,0,0,.35,.75,'#f6dfa0');
  }else if(kind==='lightning'){
    const shape=new T.Shape();shape.moveTo(.11,.8);shape.lineTo(-.48,-.05);shape.lineTo(-.05,-.05);
    shape.lineTo(-.23,-.75);shape.lineTo(.49,.25);shape.lineTo(.1,.25);shape.closePath();
    const geo=ownGeo(new T.ExtrudeGeometry(shape,{depth:.11,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:2}));
    const m=new T.Mesh(geo,gold());m.position.z=.38;root.add(m);
  }else{
    const geo=ownGeo(new T.PlaneGeometry(1.52,1.52,12,12)),p=geo.attributes.position,uv=geo.attributes.uv;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i);p.setZ(i,Math.sqrt(Math.max(.08,1-x*x-y*y))+.055);
      uv.setXY(i,(index%4+uv.getX(i))/4,1-(Math.floor(index/4)+1-uv.getY(i))/2);
    }geo.computeVertexNormals();
    const mat=ownMat(new T.MeshStandardMaterial({map:a.textures['skill-icons'],transparent:true,alphaTest:.025,roughness:.35,metalness:.1,depthWrite:false}));root.add(new T.Mesh(geo,mat));
  }
  a.merge(root);root.add(moving);root.userData.power=kind;root.scale.setScalar(size);
  animatePower(root,0);view.powerTemplates.set(kind,root);return root;
}
export function animatePower(root,time){
  const kind=root.userData.power,motion=root.getObjectByName('PowerMotion');if(!motion)return;
  if(kind==='rainbow'){const c=motion.getObjectByName('PowerCrystal');c.rotation.y=time*.65;c.rotation.z=.13;}
  if(kind==='shuffle')for(let i=0;i<5;i++){const a=i*Math.PI*2/5+time*.65,b=motion.getObjectByName('Orbit'+i);b.position.set(Math.cos(a)*.52,Math.sin(a)*.52,.25+Math.sin(a)*.15);}
  if(kind==='fire'){motion.scale.y=.96+Math.sin(time*2.1)*.04;motion.rotation.z=Math.sin(time*1.6)*.025;}
  const fuse=motion.getObjectByName('PowerFuse');if(fuse)fuse.scale.setScalar(.88+Math.sin(time*3.3)*.12);
}
