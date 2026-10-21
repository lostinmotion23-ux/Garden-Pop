// Facial morphs only. Keep a blink closed without inverting expressive eyes.
export function applyExpression(mesh, expression, time, phase = 0, smile = .65) {
  const cycle=(time+phase)%4.7;
  const weights={Smile:expression==='Smile'?smile:0,Shock:expression==='Shock'?1:0,Sad:expression==='Sad'?1:0,Wiggle:Math.sin(time*2+phase)*.65,Blink:0};
  const open=1-.10*weights.Smile+.12*weights.Shock-.24*weights.Sad;
  if(expression==='Blink'||(cycle>1.22&&cycle<1.40))weights.Blink=(open-.04)/.945;
  const dict=mesh.morphTargetDictionary;
  for(const [name,value] of Object.entries(weights))mesh.morphTargetInfluences[dict[name]]=value;
  return weights;
}
