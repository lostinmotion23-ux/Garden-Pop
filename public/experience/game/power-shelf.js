import * as T from 'three';
import {POWERS} from './rules.js';
import {animatePower} from './power-art.js';
export class PowerShelf {
  constructor(p0,view,overlay){
    this.p0=p0;this.root=new T.Group();this.root.name='PowerShelfIcons';p0.camera.add(this.root);
    this.icons=new Map();this.materials=[];this.feedback=new Map();this.flights=[];this.pool=[];this.maxFlights=16;this.projected=new T.Vector3();
    overlay.environment=p0.scene.environment;
    this.light=new T.DirectionalLight('#fff3df',1.5);this.light.position.set(-1,2,3);
    this.light.target.position.set(0,0,-.45);p0.camera.add(this.light,this.light.target);
    this.fill=new T.HemisphereLight('#fff4e3','#8c967c',.65);overlay.add(this.fill);
    for(const kind of POWERS){
      const icon=view.power(kind,1).clone(true);icon.traverse(m=>{if(m.isMesh){
        m.material=m.material.clone();m.material.userData.baseOpacity=m.material.opacity;
        m.material.transparent=true;m.material.depthTest=false;m.material.depthWrite=false;
        m.renderOrder=110;m.frustumCulled=false;this.materials.push(m.material);
      }});this.root.add(icon);this.icons.set(kind,icon);
    }
  }
  flash(kind,time){this.feedback.set(kind,time+.7);}
  collect(kind,world,time,delay=0){
    if(this.flights.length>=this.maxFlights)return false;
    const point=this.projected.copy(world).project(this.p0.camera);
    const record=this.pool.pop()??{models:new Map()};
    let model=record.models.get(kind);
    if(!model){model=this.icons.get(kind).clone(true);record.models.set(kind,model);}
    this.root.add(model);Object.assign(record,{kind,model,x:(point.x+1)/2,y:(1-point.y)/2,start:time+delay});
    this.flights.push(record);return true;
  }
  reset(){this.feedback.clear();for(const f of this.flights){f.model.removeFromParent();this.pool.push(f);}this.flights.length=0;}

  update(slots,game,state,hover,time){
    this.root.visible=!state.menu;
    const p=this.p0,depth=.45,unit=2*depth*Math.tan(T.MathUtils.degToRad(p.camera.fov/2))/p.height;
    for(const [kind,icon]of this.icons){
      const slot=slots.find(s=>s.kind===kind);icon.visible=!!slot;if(!slot)continue;
      const pulse=Math.max(0,(this.feedback.get(kind)??0)-time)/.55;
      const selected=game.selected===kind,over=hover===`power:${kind}`;
      icon.position.set((slot.x-p.width/2)*unit,(p.height/2-slot.y)*unit,-depth);
      icon.scale.setScalar(slot.size*.43*unit*(1+(selected ? .06 : 0)+(over ? .04 : 0)+Math.sin(pulse*Math.PI)*.13));
      icon.traverse(m=>{if(m.isMesh)m.material.opacity=m.material.userData.baseOpacity*(slot.disabled && !pulse ? .42 : 1);});
      animatePower(icon,time);
    }
    for(let i=this.flights.length-1;i>=0;i--){
      const f=this.flights[i],age=time-f.start,slot=slots.find(s=>s.kind===f.kind);
      f.model.visible=age>=0&&!!slot;
      if(age>=.85){f.model.removeFromParent();this.pool.push(f);this.flights.splice(i,1);this.flash(f.kind,time);continue;}
      if(!f.model.visible)continue;
      const t=Math.max(0,age/.85),ease=t*t*(3-2*t),depth=.42;
      const unit=2*depth*Math.tan(T.MathUtils.degToRad(p.camera.fov/2))/p.height;
      const x=f.x*p.width+(slot.x-f.x*p.width)*ease;
      const y=f.y*p.height+(slot.y-f.y*p.height)*ease-Math.sin(t*Math.PI)*Math.min(75,p.height*.1);
      f.model.position.set((x-p.width/2)*unit,(p.height/2-y)*unit,-depth);
      f.model.scale.setScalar((slot.size*.43+8*Math.sin(t*Math.PI))*unit);animatePower(f.model,time);
    }
  }
  dispose(){this.reset();this.pool.length=0;this.root.removeFromParent();this.light.removeFromParent();this.light.target.removeFromParent();this.fill.removeFromParent();this.materials.forEach(m=>m.dispose());}
}
