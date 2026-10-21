import * as T from 'three';
// One reusable, small overlay texture. No per-frame full-HUD canvas uploads.
export class Celebrations {
  constructor(p0){
    this.p0=p0;this.age=10;this.canvas=new OffscreenCanvas(560,104);
    this.texture=new T.CanvasTexture(this.canvas);this.texture.colorSpace=T.SRGBColorSpace;
    this.texture.generateMipmaps=false;this.texture.minFilter=T.LinearFilter;
    this.material=new T.MeshBasicMaterial({map:this.texture,transparent:true,depthTest:false,depthWrite:false,toneMapped:false});
    this.mesh=new T.Mesh(new T.PlaneGeometry(1,1),this.material);this.mesh.renderOrder=120;this.mesh.visible=false;p0.camera.add(this.mesh);
  }
  show(count){
    if(count<6||this.age<.8)return false;
    this.age=0;this.label=count>=24?'SUPER POP!':count>=16?'Bloomtastic!':count>=10?'Amazing!':'Lovely!';
    const c=this.canvas.getContext('2d');c.clearRect(0,0,560,104);
    c.fillStyle='#fff2dceF';c.beginPath();c.roundRect(4,4,552,96,22);c.fill();
    c.strokeStyle='#b38c53';c.lineWidth=3;c.stroke();c.fillStyle='#644b2d';
    c.font='bold 44px "Trebuchet MS", sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(this.label,280,53);
    this.texture.needsUpdate=true;return true;
  }
  update(dt,ui,state){
    this.age+=dt;const p=this.p0,phone=p.width/p.height<1.1,layout=ui.hudLayout;
    this.mesh.visible=this.age<1.45&&!state.menu&&!!layout&&!(phone?p.height<740:layout.compact);
    if(!this.mesh.visible)return;
    const width=phone?Math.min(p.width-36,260):Math.min(layout.pw,260),height=width*104/560;
    const x=phone?p.width/2:14+layout.pw/2,y=phone?201:Math.min(p.height-64,layout.leftBottom+38);
    const unit=.88*Math.tan(T.MathUtils.degToRad(p.camera.fov/2))/p.height;
    const scale=1+Math.sin(Math.min(1,this.age/.25)*Math.PI)*.08;
    this.mesh.position.set((x-p.width/2)*unit,(p.height/2-y+this.age*9)*unit,-.44);
    this.mesh.scale.set(width*unit*scale,height*unit*scale,1);
    this.material.opacity=Math.min(1,this.age/.1)*Math.min(1,(1.45-this.age)/.35);
  }
  reset(){this.age=10;this.mesh.visible=false;}
  dispose(){this.mesh.removeFromParent();this.mesh.geometry.dispose();this.material.dispose();this.texture.dispose();}
}
