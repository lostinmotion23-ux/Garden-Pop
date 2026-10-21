import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { BOARD, COLORS } from "./rules.js";
import { buildBotanicalGarden } from "./botanical.js";
const sphere = new T.SphereGeometry(1, 16, 12);
const box = new T.BoxGeometry(1, 1, 1, 2, 2, 2);
const cylinder = new T.CylinderGeometry(1, 1, 1, 12);
export class Art {
  constructor(textures, critters) {
    this.critters = critters;
    this.textures = textures;
    this.materials = new Map();
    this.geometries = [];
    this.animalTemplates = new Map();
    this.bubbleMaterial = new T.MeshPhysicalMaterial({
      color: 0xffffff,
      map: textures["bubble-film"] ?? null,
      roughness: 0.11,
      metalness: 0.025,
      transparent: true,
      opacity: 0.93,
      clearcoat: 1,
      clearcoatRoughness: 0.055,
      iridescence: 0.2,
      iridescenceIOR: 1.32,
      iridescenceThicknessRange: [100, 380],
      envMapIntensity: 0.95,
      vertexColors: false,
    });
  }
  mat(color, map = "fur", rough = 0.8) {
    const key = color + map + rough;
    if (!this.materials.has(key))
      this.materials.set(
        key,
        new T.MeshStandardMaterial({
          color,
          map: this.textures[map],
          roughnessMap: this.textures[`${map}-rough`],
          normalMap: this.textures[`${map}-normal`],
          normalScale: new T.Vector2(map === "wood" ? 0.65 : map === "velvet" ? 0.06 : 0.35, map === "wood" ? 0.65 : map === "velvet" ? 0.06 : 0.35),
          roughness: rough,
          metalness: map === "wood" ? 0.025 : 0,
        }),
      );
    return this.materials.get(key);
  }
  shape(parent, kind, p, s, color, map = "fur", rough = 0.8) {
    const mesh = new T.Mesh(
      kind === "box" ? box : kind === "cylinder" ? cylinder : sphere,
      this.mat(color, map, rough),
    );
    mesh.position.set(...p);
    mesh.scale.set(...s);
    parent.add(mesh);
    return mesh;
  }
  orb(g, p, s, c, map = "fur") {
    return this.shape(
      g,
      "orb",
      p,
      typeof s === "number" ? [s, s, s] : s,
      c,
      map,
    );
  }
  stick(g, a, b, r, c, map = "wood") {
    const v = new T.Vector3(...b).sub(new T.Vector3(...a)),
      m = this.shape(
        g,
        "cylinder",
        new T.Vector3(...a).addScaledVector(v, 0.5).toArray(),
        [r, v.length(), r],
        c,
        map,
      );
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), v.normalize());
    return m;
  }
  flower(g, x, y, z, size, color) {
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const p = this.orb(
        g,
        [x + Math.cos(a) * size * 0.55, y + Math.sin(a) * size * 0.55, z],
        [size * 0.44, size * 0.28, size * 0.2],
        color,
      );
      p.rotation.z = a;
    }
    this.orb(
      g,
      [x, y, z + 0.07],
      [size * 0.25, size * 0.25, size * 0.16],
      "#ffe89c",
    );
  }
  leaf(g, x, y, z, size, angle = 0) {
    const m = this.orb(
      g,
      [x, y, z],
      [size * 0.35, size, size * 0.16],
      "#b9e292",
      "leaf",
    );
    m.rotation.z = angle;
    return m;
  }
  // Collapse static shapes by material while retaining true textured 3D geometry.
  merge(group) {
    group.updateMatrixWorld(true);
    const batches = new Map();
    group.traverse((m) => {
      if (m.isMesh) {
        const source = m.geometry.clone();
        const geometry = source.applyMatrix4(m.matrixWorld);
        const list = batches.get(m.material) || [];
        list.push(geometry);
        batches.set(m.material, list);
      }
    });
    group.clear();
    group.position.set(0, 0, 0);
    group.quaternion.identity();
    group.scale.set(1, 1, 1);
    for (const [material, parts] of batches) {
      const mixed = parts.some((g) => !g.index);
      const inputs = mixed
        ? parts.map((g) => (g.index ? g.toNonIndexed() : g))
        : parts;
      const geometry = mergeGeometries(inputs);
      if (mixed)
        inputs.forEach((g, i) => {
          if (g !== parts[i]) g.dispose();
        });
      parts.forEach((g) => g.dispose());
      this.geometries.push(geometry);
      group.add(new T.Mesh(geometry, material));
    }
    return group;
  }
  animal(kind, size = 0.22) {
    const source=this.critters.getObjectByName('Critter_'+kind);
    if(!source)throw new Error('Missing textured critter mesh: '+kind);
    const root=new T.Group(), mesh=source.clone(true);
    mesh.visible=true;mesh.position.set(0,0,0);mesh.quaternion.identity();mesh.scale.set(1,1,1);
    mesh.morphTargetInfluences.fill(0);
    root.add(mesh);root.scale.setScalar(size);root.userData={base:size,kind};
    return root;
  }
  pavilion(scene) {
    return buildBotanicalGarden(this, scene);
  }

  dispose() {
    for (const m of this.materials.values()) m.dispose();
    for (const g of this.geometries) g.dispose();
    this.bubbleMaterial.dispose();
    const materials=new Set(),geometries=new Set(),textures=new Set();
    this.critters.traverse(n=>{if(n.isMesh){geometries.add(n.geometry);materials.add(n.material);}});
    for(const g of geometries)g.dispose();
    for(const m of materials){for(const k of ['map','normalMap','roughnessMap','metalnessMap'])if(m[k])textures.add(m[k]);m.dispose();}
    for(const t of textures)t.dispose();
    Object.values(this.textures).forEach((t) => t.dispose());
  }
}
export async function loadTextures(p0) {
  const loader = new T.ImageBitmapLoader().setOptions({
      imageOrientation: "flipY",
    }),
    textures = {};
  const surfaces = ["wood", "stone", "fur", "bark", "petal", "botanical-leaf", "botanical-ground"];
  for (const name of [...surfaces, ...surfaces.map((n) => `${n}-rough`),
    ...surfaces.map((n) => `${n}-normal`), "bubble-film", "contact-shadow", "skill-icons", "animal-portraits", "butterfly-wing"]) {
    let bitmap;
    try { bitmap = await loader.loadAsync(p0.asset(`assets/${name}.png`)); }
    catch(error){throw new Error(`Texture ${name}.png could not be decoded: ${error.message}`);}
    const t = new T.Texture(bitmap);
    t.flipY = false;
    t.needsUpdate = true;
    t.colorSpace = name.endsWith("rough") || name.endsWith("normal") ? T.NoColorSpace : T.SRGBColorSpace;
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.anisotropy = 2;
    if(name.startsWith("botanical-ground"))t.repeat.set(10,10);
    textures[name] = t;
  }
  return textures;
}

export async function loadCritters(p0) {
  const pack=await new GLTFLoader().loadAsync(p0.asset('assets/animals.glb'));
  pack.scene.traverse(n=>{if(n.isMesh){n.material.normalScale.set(.55,.55);n.material.roughness=.62;n.material.envMapIntensity=.6;}});
  return pack.scene;
}
