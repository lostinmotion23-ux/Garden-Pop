// Ground-plane circles and deterministic local steering. No mesh physics and
// no dependency on the board's random generator, scoring or shot trajectory.
export const PET_RADII=Object.freeze({bunny:.23,fox:.255,kitten:.23,bird:.20,deer:.27,bear:.29,puppy:.25,dreamling:.235});
export const PET_GROUND=Object.freeze({left:-3.55,right:3.55,back:-3.55,front:-.60,gap:.035,speed:.85});
export const PET_OBSTACLES=Object.freeze([
  {x:0,z:-1.6,radius:.46,name:'cannon'},
  {x:.67,z:-1.6,radius:.20,name:'next-bubble stem'},
  {x:-2.8,z:-3.4,radius:.26,name:'back garden rock'},
  {x:-.4,z:-3.4,radius:.26,name:'back garden rock'},
  {x:2,z:-3.4,radius:.26,name:'back garden rock'},
]);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const radius=a=>a.radius??PET_RADII[a.kind]??.25;
const detour=x=>.78*(1-Math.min(1,Math.abs(x)/1.05)**2)**2;

// Use the same final ground coordinates for the rendered food and navigation.
// Older saves can contain food in the cannon footprint: move its destination
// to the nearest safe edge so every reserved meal remains reachable.
export function foodGroundPosition(food) {
  const p={x:food.x,z:(food.z??-1.66)-detour(food.x)};
  for(const o of PET_OBSTACLES){
    const dx=p.x-o.x,dz=p.z-o.z,d=Math.hypot(dx,dz),min=o.radius+.33;
    if(d<min){p.x=o.x+(d>.001?dx/d:0)*min;p.z=o.z+(d>.001?dz/d:-1)*min;}
  }
  p.x=clamp(p.x,-3.2,3.2);p.z=clamp(p.z,-3.15,-.95);return p;
}

export function isPetPositionClear(x,z,r,animals,ignore=null) {
  const b=PET_GROUND;
  if(x<b.left+r||x>b.right-r||z<b.back+r||z>b.front-r)return false;
  for(const o of PET_OBSTACLES)if(Math.hypot(x-o.x,z-o.z)<r+o.radius+b.gap-1e-7)return false;
  for(const a of animals)if(a!==ignore&&Number.isFinite(a.z)&&Math.hypot(x-a.x,z-a.z)<r+radius(a)+b.gap-1e-7)return false;
  return true;
}

export function placeRescuedPet(a,animals) {
  a.radius=radius(a);let best=null;
  for(let row=0;row<6;row++)for(let col=0;col<17;col++) {
    const x=-3.1+col*.3875,z=-1.02-row*.39;
    if(!isPetPositionClear(x,z,a.radius,animals,a))continue;
    let nearest=2;
    for(const other of animals)if(other!==a&&Number.isFinite(other.z))nearest=Math.min(nearest,Math.hypot(x-other.x,z-other.z));
    const cost=Math.abs(x-a.x)+Math.abs(z+2)*.25-Math.min(nearest,1)*.16;
    if(!best||cost<best.cost)best={x,z,cost};
  }
  // Eight supported species fit comfortably in this fixed meadow. Keep the
  // search deterministic so snapshot/restore and rule replays remain stable.
  if(!best)throw Error('No free rescued-pet landing position');
  a.x=best.x;a.z=best.z;a.vx=0;a.vz=0;a.avoidSide=a.id%2?1:-1;a.waitUntil=0;
}

function neighbours(animals) {
  const cells=new Map(),size=.8;
  for(const a of animals){const k=`${Math.floor(a.x/size)},${Math.floor(a.z/size)}`;if(!cells.has(k))cells.set(k,[]);cells.get(k).push(a);}
  return a=>{
    const x=Math.floor(a.x/size),z=Math.floor(a.z/size),found=[];
    for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)for(const b of cells.get(`${x+i},${z+j}`)??[])if(b!==a)found.push(b);
    return found;
  };
}

function wanderGoal(a,animals,time) {
  if(a.wanderX!==undefined&&Math.hypot(a.wanderX-a.x,a.wanderZ-a.z)>.13&&time<(a.wanderUntil??0))return;
  const crowded=animals.length>5,reach=crowded?.65:1.5;
  for(let i=0;i<12;i++){
    const angle=a.id*2.39996+Math.floor(time/2)*1.7+i*2.39996;
    const x=clamp(a.x+Math.cos(angle)*reach,-3.1,3.1),z=clamp(a.z+Math.sin(angle)*reach,-3.12,-1);
    if(isPetPositionClear(x,z,a.radius,animals,a)){
      a.wanderX=x;a.wanderZ=z;a.wanderUntil=time+5;a.waitUntil=time+.18+(a.id%3)*.06;return;
    }
  }
  a.wanderX=a.x;a.wanderZ=a.z;a.waitUntil=time+.35;
}

function segmentClear(a,b,r,animals,ignore){
  const dx=b.x-a.x,dz=b.z-a.z,length=dx*dx+dz*dz;
  const clear=o=>{
    const t=length?clamp(((o.x-a.x)*dx+(o.z-a.z)*dz)/length,0,1):0;
    return Math.hypot(a.x+t*dx-o.x,a.z+t*dz-o.z)>=r+radius(o)+PET_GROUND.gap-.00001;
  };
  for(const o of PET_OBSTACLES)if(!clear(o))return false;
  for(const o of animals)if(o!==ignore&&Number.isFinite(o.z)&&!clear(o))return false;
  return true;
}

function routeGoal(a,goal,animals,time){
  if(segmentClear(a,goal,a.radius,animals,a))return goal;
  const changed=Math.hypot(goal.x-(a.routeX??99),goal.z-(a.routeZ??99))>.15;
  if(changed||time>=(a.routeUntil??0)){
    const step=.22,left=PET_GROUND.left+a.radius+.045,back=PET_GROUND.back+a.radius+.045;
    const cols=Math.floor((PET_GROUND.right-a.radius-.045-left)/step)+1;
    const rows=Math.floor((PET_GROUND.front-a.radius-.045-back)/step)+1;
    const points=[],valid=[];
    let start=-1,end=-1,startCost=Infinity,endCost=Infinity;
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const p={x:left+col*step,z:back+row*step},index=points.length;points.push(p);
      valid.push(isPetPositionClear(p.x,p.z,a.radius,animals,a));if(!valid[index])continue;
      const d=Math.hypot(p.x-a.x,p.z-a.z),e=Math.hypot(p.x-goal.x,p.z-goal.z);
      if(d<startCost&&segmentClear(a,p,a.radius,animals,a)){start=index;startCost=d;}
      if(e<endCost){end=index;endCost=e;}
    }
    const route=[];
    if(start>=0&&end>=0){
      const costs=new Map([[start,0]]),parents=new Map(),open=new Set([start]),closed=new Set();
      let found=false;
      while(open.size){
        let current=-1,best=Infinity;
        for(const i of open){const p=points[i],score=costs.get(i)+Math.hypot(p.x-points[end].x,p.z-points[end].z);if(score<best){best=score;current=i;}}
        if(current===end){found=true;break;}open.delete(current);closed.add(current);
        const row=Math.floor(current/cols),col=current%cols;
        for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
          if(!dx&&!dz)continue;const x=col+dx,z=row+dz,next=z*cols+x;
          if(x<0||x>=cols||z<0||z>=rows||!valid[next]||closed.has(next))continue;
          if(!segmentClear(points[current],points[next],a.radius,animals,a))continue;
          const cost=costs.get(current)+step*Math.hypot(dx,dz);
          if(cost<(costs.get(next)??Infinity)){costs.set(next,cost);parents.set(next,current);open.add(next);}
        }
      }
      if(found){let i=end;while(i!==start){route.unshift(points[i]);i=parents.get(i);}route.push(goal);}
    }
    a.route=route;a.routeIndex=0;a.routeUntil=time+.65;a.routeX=goal.x;a.routeZ=goal.z;
  }
  const route=a.route??[];
  while(a.routeIndex<route.length-1&&Math.hypot(route[a.routeIndex].x-a.x,route[a.routeIndex].z-a.z)<.16)a.routeIndex++;
  return route[a.routeIndex]??goal;
}

function steer(a,goal,food,animals,nearby,time,dt) {
  goal=routeGoal(a,goal,animals,time);
  const dx=goal.x-a.x,dz=goal.z-a.z,distance=Math.hypot(dx,dz);
  if(distance<(food?.10:.12)||a.cooldown>0||time<a.waitUntil){a.vx=0;a.vz=0;return;}
  const heading=Math.atan2(dz,dx),speed=Math.min(PET_GROUND.speed,distance/dt);
  let best=null;
  // Persist a preferred passing side; penalize heading reversals and choose a
  // forward arc with clearance instead of repeatedly flipping left/right.
  for(const turn of [0,.35,-.35,.7,-.7,1.05,-1.05,1.4,-1.4,1.85,-1.85,2.5,-2.5]) {
    const angle=heading+turn,vx=Math.cos(angle)*speed,vz=Math.sin(angle)*speed;
    const blend=Math.min(1,dt*8),svx=(a.vx??0)+(vx-(a.vx??0))*blend,svz=(a.vz??0)+(vz-(a.vz??0))*blend;
    const x=a.x+svx*dt,z=a.z+svz*dt;
    if(!isPetPositionClear(x,z,a.radius,nearby,a))continue;
    // Look ahead, slowing before a neighbour rather than bouncing on contact.
    let safety=0;
    for(const b of nearby){
      const clearance=Math.hypot(x+svx*.32-b.x,z+svz*.32-b.z)-a.radius-radius(b)-PET_GROUND.gap;
      safety+=Math.max(0,.22-clearance)*1.3;
    }
    for(const o of PET_OBSTACLES){const d=Math.hypot(x+svx*.28-o.x,z+svz*.28-o.z)-a.radius-o.radius; safety+=Math.max(0,.15-d)*1.6;}
    const progress=(svx*dx+svz*dz)/Math.max(.01,distance);
    const cost=-progress+safety+Math.abs(turn)*.035+(turn*a.avoidSide<0?.025:0);
    if(!best||cost<best.cost)best={x,z,vx:svx,vz:svz,cost,turn};
  }
  if(best){
    // Check every body for the final step as a conservative safeguard around
    // hash-cell boundaries; there are at most eight rescued animals.
    if(isPetPositionClear(best.x,best.z,a.radius,animals,a)){
      a.x=best.x;a.z=best.z;a.vx=best.vx;a.vz=best.vz;
      if(Math.abs(best.vx)>.02)a.facing=Math.sign(best.vx);
      if(Math.abs(best.turn)>.5)a.avoidSide=Math.sign(best.turn);
      a.blockedFor=0;return;
    }
  }
  a.vx=0;a.vz=0;a.blockedFor=(a.blockedFor??0)+dt;
  if(a.blockedFor>.6){a.waitUntil=time+.25;a.avoidSide*=-1;a.wanderUntil=0;a.blockedFor=0;}
}

export function updateGardenPets(game,dt) {
  const animals=game.rescued;
  for(const a of animals)if(!Number.isFinite(a.z))placeRescuedPet(a,animals);
  const steps=Math.max(1,Math.ceil(dt/.025)),step=dt/steps;
  for(let n=0;n<steps;n++){
    game.gardenTime+=step;
    const nearby=neighbours(animals),reserved=new Set(),feeding=[];
    // Reserve the approach space as well as the meal. Closely stacked food
    // must be served in turns; otherwise several valid targets can deadlock
    // bodies at the same feeding spot. Fewer meals gets first choice.
    const order=[...animals].sort((a,b)=>a.totalEaten-b.totalEaten||a.id-b.id);
    for(const a of order){
      if(game.gardenTime<a.readyAt)continue;
      a.cooldown=Math.max(0,a.cooldown-step);
      const available=f=>{
        if(f.landedAt>game.gardenTime||reserved.has(f.id))return false;
        const p=foodGroundPosition(f);
        return feeding.every(b=>Math.hypot(p.x-b.x,p.z-b.z)>a.radius+b.radius+.14);
      };
      let food=game.ground.find(f=>f.id===a.target&&available(f));
      if(!food){
        let best=Infinity;
        for(const f of game.ground){
          if(!available(f))continue;
          const p=foodGroundPosition(f),d=Math.hypot(p.x-a.x,p.z-a.z);
          if(d<best){best=d;food=f;}
        }
      }
      a.target=food?.id??null;
      if(food){reserved.add(food.id);feeding.push({...foodGroundPosition(food),radius:a.radius});}
      if(!food)wanderGoal(a,animals,game.gardenTime);
      const goal=food?foodGroundPosition(food):{x:a.wanderX??a.x,z:a.wanderZ??a.z};
      steer(a,goal,!!food,animals,nearby(a),game.gardenTime,step);
      if(food&&Math.hypot(goal.x-a.x,goal.z-a.z)<.14&&a.cooldown===0){
        const index=game.ground.indexOf(food);if(index<0)continue;
        game.ground.splice(index,1);a.target=null;a.cooldown=.65;
        // Eating continues at full storage, but extra meals cannot bank bombs.
        if(!game.bombsFull())a.eaten++;
        a.totalEaten++;
        game.emit('eat',{animal:a.id,bubble:{...food}});
        if(a.eaten===10){a.eaten=0;if(game.grantPower('bomb'))game.emit('bomb',{animal:a.id});}
        game.revision++;
      }
    }
  }
}
