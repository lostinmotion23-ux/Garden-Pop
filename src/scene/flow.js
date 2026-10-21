import { LAYOUT } from './layout.js';

export const FLOW = {
  ...LAYOUT.motion,
  radius: LAYOUT.smallRadius,
  largeRadius: LAYOUT.largeRadius,
  solidCount: LAYOUT.solids.length,
};
export const FRIENDS = LAYOUT.animals.map(animal => ({name:animal.name,kind:animal.kind,at:animal.position}));
export const PALETTE = ['#edb5d1','#b4dcd1','#c5b3e9','#f3d99f','#b6d7ee','#eec2b4'];

export function mod(n,span) { return ((n%span)+span)%span; }
export function smooth(value) {
  const x=Math.max(0,Math.min(1,value));
  return x*x*(3-2*x);
}
export function verticalState(originalY,radius,seconds) {
  const y=FLOW.bottom+mod(originalY-FLOW.bottom-seconds*FLOW.spacing/FLOW.rowSeconds,FLOW.span);
  const band=radius*1.15;
  const scale=smooth((y-FLOW.bottom)/band)*smooth((FLOW.bottom+FLOW.span-y)/band);
  return {y,scale};
}
export function animalState(friend,seconds) {
  return {x:friend.at[0],z:friend.at[2],...verticalState(friend.at[1],FLOW.largeRadius,seconds)};
}
export function rowState(index,seconds) {
  return verticalState(FLOW.bottom+(index+.5)*FLOW.spacing,FLOW.radius,seconds);
}
export function solidState(index,seconds) {
  const circle=LAYOUT.solids[index];
  return {x:circle.x,z:circle.z,...verticalState(circle.y,FLOW.radius,seconds)};
}
