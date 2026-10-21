import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// A closed, curved blade with a soft ridge and rounded tip, rooted at y=0.
export function softBlade() {
  const positions=[], indices=[],uv=[];
  for(let j=0;j<=2;j++) {
    const t=j/2, width=Math.sin(Math.PI*(.08+t*.86))*.5;
    for(const [u,z] of [[-1,0],[0,.18],[1,-.04]]){
      positions.push(u*width,t,.24*t*t+z*Math.sin(Math.PI*t));uv.push((u+1)/2,t);
    }
  }
  for(let j=0;j<2;j++)for(let k=0;k<3;k++) {
    const a=j*3+k,b=j*3+(k+1)%3,c=a+3,d=b+3;indices.push(a,c,b,b,c,d);
  }
  indices.push(0,1,2,6,8,7);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  g.setIndex(indices);g.computeVertexNormals();return g;
}

export function tintGeometry(geometry, color) {
  const c=new T.Color(color), colors=[];
  for(let i=0;i<geometry.attributes.position.count;i++)colors.push(c.r,c.g,c.b);
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));return geometry;
}

export function combine(parts) {
  const inputs=parts.map(g=>g.index?g.toNonIndexed():g);
  const geometry=mergeGeometries(inputs);
  inputs.forEach((g,i)=>{g.dispose();if(g!==parts[i])parts[i].dispose();});return geometry;
}

export function plantWind(material, time, strength, key) {
  material.onBeforeCompile=shader=>{
    shader.uniforms.plantTime=time;
    shader.vertexShader='uniform float plantTime;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vec3 origin=instanceMatrix[3].xyz;
      float phase=origin.x*1.7+origin.z*.91;
      float sway=sin(plantTime*.8+phase)+.25*sin(plantTime*1.17+phase*2.3);
      float wave=pow(max(0.0,sin(plantTime*.23-origin.x*.19-origin.z*.13)),8.0);
      float anchored=pow(max(0.0,position.y),1.5);
      transformed.x+=(sway+wave*.35)*${strength.toFixed(4)}*anchored;
      transformed.z+=sin(plantTime*.63+phase)*${(strength*.45).toFixed(4)}*anchored;`);
  };
  material.customProgramCacheKey=()=>key;
}
