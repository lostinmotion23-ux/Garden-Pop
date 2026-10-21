export const guideOpacityForScore=score=>score>=5000?0:score>=3000?.3:1;

export class AimGuideFade {
  constructor(){this.reset();}
  reset(){this.value=1;this.target=1;this.from=1;this.elapsed=.4;}
  update(score,dt,flying=false){
    // A score event during flight takes effect in the next aiming state.
    if(flying)return this.value;
    const target=guideOpacityForScore(score);
    if(target!==this.target){this.target=target;this.from=this.value;this.elapsed=0;}
    this.elapsed=Math.min(.4,this.elapsed+Math.max(0,dt));
    const t=this.elapsed/.4,s=t*t*(3-2*t);this.value=this.from+(this.target-this.from)*s;
    return this.value;
  }
}
