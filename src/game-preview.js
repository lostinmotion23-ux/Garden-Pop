// Local browser harness. The city loads the same readable experience entry.
import * as THREE from "three";
import start from "./experience/main.js";
const events = new Map(),
  sounds = new Map();
let soundId = 0,
  loop = () => {},
  music = null;
const emit = (type, event) => {
  for (const fn of events.get(type) || []) fn(event);
};
const p0 = {
  scene: new THREE.Scene(),
  camera: new THREE.PerspectiveCamera(),
  bodies: { visible: true },
  controls: {},
  me: { position: new THREE.Vector3() },
  input: { pointer: { x: 0, y: 0, buttons: 0 }, keys: new Set() },
  pixelRatio: window.devicePixelRatio,
  time: 0,
  table: [],
  width: innerWidth,
  height: innerHeight,
  createRenderer(options) {
    this.renderer = new THREE.WebGLRenderer(options);
    document.body.append(this.renderer.domElement);
    this.renderer.setSize(this.width, this.height);
  },
  asset: (path) => `/experience/${path}`,
  on(type, fn) {
    const list = events.get(type) || [];
    list.push(fn);
    events.set(type, list);
  },
  loop: (fn) => (loop = fn),
  loading() {},
  hud(text) {
    p0.hudText = text;
  },
  score(n) {
    p0.lastScore = n;
  },
  win() {
    p0.wins = (p0.wins || 0) + 1;
  },
  exit() {
    emit("end");
  },
  sound: {
    play(path, opts) {
      const a = new Audio(path);
      a.volume = opts.volume;
      a.play().catch(() => {});
      const id = ++soundId;
      sounds.set(id, a);
      a.addEventListener("ended", () => sounds.delete(id));
      return id;
    },
    stopAll() {
      for (const a of sounds.values()) a.pause();
      sounds.clear();
    },
    pauseAll() {
      for (const a of sounds.values()) a.pause();
    },
    resumeAll() {
      for (const a of sounds.values()) a.play().catch(() => {});
    },
  },
  music: {
    play(path, opts) {
      music?.pause();
      music = new Audio(path);
      music.loop = true;
      music.volume = opts.volume;
      music.play().catch(() => {});
    },
    stop() {
      music?.pause();
    },
  },
};
p0.scene.add(new THREE.HemisphereLight("#fff2ec", "#9cabc1", 2));
window.addEventListener("resize", () => {
  p0.width = innerWidth;
  p0.height = innerHeight;
  p0.renderer.setSize(innerWidth, innerHeight);
  emit("resize");
});
for (const type of ["pointerdown", "pointerup", "pointermove"])
  window.addEventListener(type, (event) => {
    p0.input.pointer = {
      x: event.clientX,
      y: event.clientY,
      buttons: event.buttons,
    };
    emit(type, {
      buttons: event.buttons,
      button: event.button,
      touch: event.pointerType === "touch",
    });
  });
window.addEventListener("contextmenu", (event) => event.preventDefault());
for (const type of ["keydown", "keyup"])
  window.addEventListener(type, (event) => {
    if (type === "keydown") p0.input.keys.add(event.code);
    else p0.input.keys.delete(event.code);
    emit(type, { code: event.code });
  });
window.gardenGame = await start(p0);
window.gardenP0 = p0;
window.gardenThree = { Raycaster: THREE.Raycaster, Vector3: THREE.Vector3 };
let previous = performance.now();
function frame(now) {
  const dt = Math.max(0, Math.min(0.1, (now - previous) / 1000));
  previous = now;
  p0.time += dt;
  loop(dt, p0.time);
  if (p0.autoRender !== false) p0.renderer.render(p0.scene, p0.camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
