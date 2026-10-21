import * as T from "three";
// The garden can reduce its pixel cost on slow devices while text and touch
// targets remain at native resolution. Two small overlay draws, no post effects.
export class GardenRenderer {
  constructor(p0) {
    this.p0 = p0;
    p0.autoRender = false;
    this.overlay = new T.Scene();
    this.overlay.add(p0.camera);
    this.target = new T.WebGLRenderTarget(1, 1, {
      depthBuffer: true,
      type: T.HalfFloatType,
      samples: 0,
      minFilter: T.LinearFilter,
      magFilter: T.LinearFilter,
    });
    this.material = new T.MeshBasicMaterial({
      map: this.target.texture,
      depthTest: false,
      depthWrite: false,
      toneMapped: true,
    });
    this.background = new T.Mesh(new T.PlaneGeometry(1, 1), this.material);
    this.background.position.z = -0.8;
    this.background.renderOrder = -100;
    p0.camera.add(this.background);
    this.scale = 1;
    this.resize();
  }
  resize() {
    const p = this.p0;
    // Keep labels at the display's pixel density. Only scenery is reduced.
    p.renderer.setPixelRatio(Math.min(p.pixelRatio || 1, 2));
    const worldRatio = Math.min(p.pixelRatio || 1, 1.5, 1600 / p.width);
    this.target.setSize(
      Math.max(1, Math.round(p.width * worldRatio * this.scale)),
      Math.max(1, Math.round(p.height * worldRatio * this.scale)),
    );
    const height = 1.6 * Math.tan(T.MathUtils.degToRad(p.camera.fov / 2));
    this.background.scale.set((height * p.width) / p.height, height, 1);
  }
  draw() {
    const p = this.p0;
    p.renderer.setRenderTarget(this.target);
    p.renderer.render(p.scene, p.camera);
    p.renderer.setRenderTarget(null);
    p.renderer.render(this.overlay, p.camera);
  }
  dispose() {
    this.background.removeFromParent();
    this.background.geometry.dispose();
    this.material.dispose();
    this.target.dispose();
  }
}
