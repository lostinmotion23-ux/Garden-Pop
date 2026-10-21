import {applyExpression} from './expressions.js';
// Poses only. Ground x/z comes exclusively from the collision-aware navigator.
const TRAITS={bunny:[8.5,.075,1.3],fox:[2.1,.018,.6],kitten:[5,.035,1.8],bird:[9,.055,2],deer:[4,.035,.8],bear:[1.6,.012,.45],puppy:[6,.045,1.7],dreamling:[3,.025,.9]};
export function enrichPet(a,pet,game,animals,time,dt){
  const root=a.object,animal=root.userData.animal,face=animal.children[0],dict=face.morphTargetDictionary;
  const [tempo,hop,wiggle]=TRAITS[pet.kind]??TRAITS.bunny;
  const busy=time<(a.eatingUntil??0)||time<(a.celebratingUntil??0);
  a.personality=pet.kind;
  const idle=!busy&&a.bombAt===undefined;
  if(idle){
    const cycle=(time+a.phase*2)%15;
    root.position.y+=Math.max(0,Math.sin(time*tempo+a.phase))*hop;
    animal.rotation.z=Math.sin(time*.6+a.phase)*.025;
    face.morphTargetInfluences[dict.Wiggle]=Math.sin(time*(pet.kind==='puppy'?6:2)+a.phase)*Math.min(.9,.4*wiggle);
    if(pet.kind==='fox'&&cycle<2){animal.rotation.x=.07+Math.sin(time*4)*.025;root.rotation.y+=.18;}
    if(pet.kind==='kitten'&&cycle<1.2)root.rotation.y+=Math.sin(cycle/1.2*Math.PI*2)*.45;
    if(pet.kind==='bear'&&cycle<2){animal.scale.y*=.94;animal.rotation.x=.04;}
    if(pet.kind==='deer'&&cycle<2)root.rotation.y+=Math.sin(time*.9)*.2;
  }
  // Neighbours notice one another only between meals. Their logical walking is unchanged.
  if(!pet.target&&!busy&&a.bombAt===undefined){
    let neighbour=null,distance=1.05;
    for(const other of game.rescued){
      if(other.id===pet.id||other.target)continue;
      const d=Math.hypot(other.x-pet.x,other.z-pet.z);if(d<distance){distance=d;neighbour=other;}
    }
    if(neighbour){
      const phase=(Math.min(pet.id,neighbour.id)*.73)%9,cycle=(time+phase)%13;
      if(cycle<2.1){
        const t=Math.sin(cycle/2.1*Math.PI),toward=Math.sign(neighbour.x-pet.x)||1;
        root.rotation.y=toward*.6*t;root.rotation.z+=toward*.055*t;
        root.position.y+=Math.max(0,Math.sin(cycle*8))*.035*t;
        a.socialUntil=time+.05;applyExpression(face,'Smile',time,a.phase,.85);
      }
    }
  }
  if(a.bombAt!==undefined){
    const age=time-a.bombAt;
    if(age<.6)root.rotation.z=Math.sin(age*20)*.045;
    if(age<.6){const swell=Math.sin(Math.min(1,age/.6)*Math.PI)*.045;animal.scale.x*=1+swell;animal.scale.z*=1+swell;}
    if(age>.18&&age<.65)applyExpression(face,'Shock',time,a.phase);
    if(age>.35&&age<.78)root.position.y+=Math.sin((age-.35)/.43*Math.PI)*.12;
    if(age>=.65&&age<1.25)applyExpression(face,'Smile',time,a.phase,.95);
    if(age>=1.25)delete a.bombAt;
  }
}
