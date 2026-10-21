import * as THREE from 'three';

export function createGardenHints(p0) {
  const canvas=new OffscreenCanvas(1000,100);
  const context=canvas.getContext('2d');
  const texture=new THREE.CanvasTexture(canvas);
  texture.generateMipmaps=false;
  texture.minFilter=THREE.LinearFilter;
  const material=new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false,toneMapped:false,fog:false});
  const sprite=new THREE.Sprite(material);
  sprite.renderOrder=100;
  sprite.name='Garden instructions';
  p0.camera.add(sprite);
  if(!p0.camera.parent) p0.scene.add(p0.camera);
  function show(text) {
    context.clearRect(0,0,1000,100);
    context.fillStyle='rgba(255,249,253,0.94)';
    context.beginPath();context.roundRect(0,0,1000,100,36);context.fill();
    context.fillStyle='#816879';context.textAlign='center';context.textBaseline='middle';context.font='500 46px sans-serif';
    context.fillText(text,500,51,950);
    texture.needsUpdate=true;
  }
  function update() {
    const height=4*Math.tan(p0.camera.fov*Math.PI/360);
    const width=Math.min(height*p0.camera.aspect*.88,3.5);
    sprite.scale.set(width,width/10,1);
    sprite.position.set(0,-height/2+width/10*.8,-2);
  }
  show('Tap a friend · WASD / stick: move · Esc: leave');
  update();
  return {show,update,dispose(){sprite.removeFromParent();texture.dispose();material.dispose();}};
}
