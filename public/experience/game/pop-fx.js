import * as T from 'three';
import {BOARD,COLORS} from './rules.js';
export function fadingMaterial(){
  return new T.ShaderMaterial({transparent:true,depthWrite:false,toneMapped:false,
    vertexShader:`attribute float effectAlpha;
      varying float vAlpha; varying vec3 vColor;
      void main(){vAlpha=effectAlpha;vColor=vec3(1.0);
      #ifdef USE_INSTANCING_COLOR
        vColor=instanceColor;
      #endif
        gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}`,
    fragmentShader:`varying float vAlpha; varying vec3 vColor;
      void main(){gl_FragColor=vec4(vColor,vAlpha);
      #include <colorspace_fragment>
      }`});
}
export class PopEffects {
  constructor(root,sphere,bubbleMaterial,spawn){
    this.spawn=spawn;this.colors=COLORS.map(c=>new T.Color(c));this.active=[];this.free=Array.from({length:512},()=>({}));this.dummy=new T.Object3D();
    this.bubbles=new T.InstancedMesh(sphere,bubbleMaterial,512);this.bubbles.frustumCulled=false;this.bubbles.count=0;
    const geometry=new T.TorusGeometry(BOARD.radius,.008,5,28);
    this.alpha=new T.InstancedBufferAttribute(new Float32Array(512),1);geometry.setAttribute('effectAlpha',this.alpha);
    this.ripples=new T.InstancedMesh(geometry,fadingMaterial(),512);this.ripples.frustumCulled=false;this.ripples.count=0;
    this.bubbles.setColorAt(0,this.colors[0]);this.ripples.setColorAt(0,this.colors[0]);
    this.bubbles.instanceMatrix.setUsage(T.DynamicDrawUsage);this.ripples.instanceMatrix.setUsage(T.DynamicDrawUsage);
    root.add(this.bubbles,this.ripples);
  }
  add(bubbles,grid){
    let i=0;for(const b of bubbles){if(b.type!=='normal')continue;const p=this.free.pop();if(!p)break;
      const pos=grid.position(b.r,b.c);Object.assign(p,{x:pos.x,y:pos.y,color:b.color,age:0,delay:Math.min(.055,i++*.003),emitted:false});this.active.push(p);
    }
  }
  update(dt){
    const d=this.dummy;
    for(let i=this.active.length-1;i>=0;i--){const p=this.active[i];p.age+=dt;
      if(p.age-p.delay>.41){this.free.push(p);this.active.splice(i,1);}
    }
    this.active.forEach((p,i)=>{
      const age=p.age-p.delay,t=Math.max(0,Math.min(1,age/.14));
      const s=age<.14?1+.08*Math.sin(t*Math.PI/2):0,w=Math.sin(t*Math.PI*4)*.025;
      d.position.set(p.x,p.y,BOARD.z+.035);d.rotation.set(0,0,0);d.scale.set(s*(1+w),s*(1-w),s);d.updateMatrix();
      this.bubbles.setMatrixAt(i,d.matrix);this.bubbles.setColorAt(i,this.colors[p.color]);
      if(age>=.14&&!p.emitted){p.emitted=true;this.spawn(p.x,p.y,COLORS[p.color],3,.27);}
      const r=Math.max(0,Math.min(1,(age-.14)/.24));
      d.scale.setScalar(1+r*.85);d.updateMatrix();this.ripples.setMatrixAt(i,d.matrix);
      this.ripples.setColorAt(i,this.colors[p.color]);this.alpha.setX(i,age>=.14 ? .5*(1-r)**2 : 0);
    });
    this.bubbles.count=this.ripples.count=this.active.length;
    this.bubbles.instanceMatrix.needsUpdate=this.ripples.instanceMatrix.needsUpdate=true;this.alpha.needsUpdate=true;
    if(this.bubbles.instanceColor)this.bubbles.instanceColor.needsUpdate=true;
    if(this.ripples.instanceColor)this.ripples.instanceColor.needsUpdate=true;
  }
  reset(){this.free.push(...this.active);this.active.length=0;this.bubbles.count=this.ripples.count=0;}
  dispose(){this.reset();this.bubbles.removeFromParent();this.ripples.removeFromParent();this.ripples.geometry.dispose();this.ripples.material.dispose();}
}
