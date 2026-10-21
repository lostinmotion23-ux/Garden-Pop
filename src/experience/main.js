// Bubble Critter Garden. Readable modules, original art/audio, no external requests.
import * as THREE from "three";
import { Game, BOARD, trajectory, POWERS, POWER_NAMES } from "./game/rules.js";
import { Art, loadTextures, loadCritters } from "./game/art.js";
import {Celebrations} from "./game/celebrations.js";
import { PowerShelf } from "./game/power-shelf.js";
import { GardenView } from "./game/view.js";
import { GardenUI } from "./game/ui.js";
import { GardenAudio } from "./game/audio.js";
import { GardenRenderer } from "./game/render.js";
import { GardenAmbience } from "./game/ambience.js";

export default async function start(p0) {
  p0.createRenderer({ antialias: true });
  p0.bodies.visible = false;
  p0.controls.mode = "none";
  p0.controls.enabled = false;
  p0.loading(0.12, "planting the blossom garden");
  const art = new Art(await loadTextures(p0), await loadCritters(p0));
  const pavilion = art.pavilion(p0.scene);
  const ambience = new GardenAmbience(p0.scene, art);
  for (const light of p0.scene.children) if (light.isLight && !light.isPointLight) light.intensity = 0.3;
  p0.scene.add(new THREE.HemisphereLight("#dceaff", "#706580", 0.65));
  // Capture a soft studio sky once, then reuse its filtered reflections on all PBR surfaces.
  const studio = new THREE.Scene();
  studio.background = new THREE.Color("#8d94b0");
  const panels = [[-5, 6, 4, 4, 7, "#fff5df"], [5, 3, 2, 3, 5, "#a9d5ff"], [0, 9, -4, 8, 2, "#fac5e9"]];
  for (const [x, y, z, w, h, color] of panels) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    mesh.position.set(x, y, z); mesh.lookAt(0, 3, 0); studio.add(mesh);
  }
  const pmrem = new THREE.PMREMGenerator(p0.renderer);
  const reflections = pmrem.fromScene(studio, 0.06, 0.1, 100);
  p0.scene.environment = reflections.texture;
  pmrem.dispose();
  studio.traverse((m) => { if (m.isMesh) { m.geometry.dispose(); m.material.dispose(); } });
  const sun = new THREE.DirectionalLight("#fff0d3", 2.05);
  sun.position.set(-3, 11, 8);
  p0.scene.add(sun);
  const fill = new THREE.DirectionalLight("#d7e4e4", 0.5);
  fill.position.set(6, 5, 3);
  p0.scene.add(fill);
  p0.renderer.setClearColor("#cbd8d7", 1);
  p0.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  p0.renderer.toneMappingExposure = 1.0;
  const game = new Game(1),
    audio = new GardenAudio(p0),
    view = new GardenView(p0, art),
    ui = new GardenUI(p0, art.textures["skill-icons"].image, art.textures["animal-portraits"].image);
  const compositor = new GardenRenderer(p0);
  const shelf = new PowerShelf(p0,view,compositor.overlay);
  ui.use3dIcons=true;view.inventoryInOverlay=true;
  const celebrations=new Celebrations(p0);
  const state = { menu: "main", back: "main", audio, selectedColor: 0 };
  let angle = 0,
    path = trajectory(game.grid, angle),
    flight = null,
    down = null,
    selectedCell = null,
    time = 0,
    endDelay = 0,
    reported = false,
    slow = 0,
    resolution = 1,
    lastFrame = 0,
    lastScoreReport = 0;
  const rays = new THREE.Raycaster(),
    plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -BOARD.z),
    point = new THREE.Vector3();
  const resize = () => {
    const aspect = p0.width / p0.height,
      distance = 7.15;
    const vertical =
      aspect < 1.1
        ? Math.max(10.2, 8.6 / aspect)
        : Math.max(9.9, 12.5 / aspect);
    p0.camera.position.set(0, 4.95, 5.55);
    p0.me.position.copy(p0.camera.position);
    p0.camera.rotation.set(0, 0, 0);
    p0.camera.fov = THREE.MathUtils.radToDeg(
      2 * Math.atan(vertical / (2 * distance)),
    );
    p0.camera.aspect = aspect;
    p0.camera.near = 0.05;
    p0.camera.far = 100;
    p0.camera.updateProjectionMatrix();
    p0.camera.updateMatrixWorld();
    compositor.scale = resolution;
    compositor.resize();
    ui.last = "";
    ui.draw(game, state, time);
  };
  resize();
  p0.on("resize", resize);
  function aim() {
    const p = p0.input.pointer;
    rays.setFromCamera(
      new THREE.Vector2((p.x / p0.width) * 2 - 1, 1 - (p.y / p0.height) * 2),
      p0.camera,
    );
    if (!rays.ray.intersectPlane(plane, point)) return;
    angle = Math.max(
      -1.35,
      Math.min(
        1.35,
        Math.atan2(point.x, Math.max(0.05, point.y - BOARD.launcher)),
      ),
    );
    path = trajectory(game.grid, angle);
    let nearest = Infinity;
    selectedCell = null;
    for (const b of game.grid.cells.values()) {
      const q = game.grid.position(b.r, b.c),
        d = Math.hypot(q.x - point.x, q.y - point.y);
      if (d < nearest && d < 0.5) {
        nearest = d;
        selectedCell = b;
      }
    }
  }
  function process() {
    const events = game.events.splice(0);
    view.sync(game);
    view.events(events, game);
    for (const e of events) {
      if (e.type === "pop") {
        audio.play("pop",time);
        if(e.bubbles.length>=6){
          if(celebrations.show(e.bubbles.length))audio.play('garden-combo',time,{volume:.12,cooldown:2});
          pavilion.react();ambience.react();
        }
      }
      if (e.type === "fall") audio.play("fall", time);
      if (e.type === "row") audio.play("warning", time);
      if (e.type === "miss")
        ui.toast("Miss 1 of 2 · one more miss adds a row", time);
      if (e.type === "power") {audio.play("power", time);ui.flashPower(e.power,time);shelf.flash(e.power,view.time);}
      if (e.type === "rescue") {
        audio.play("rescue", time);
        ui.markRescue(e.animal.kind,time);
        audio.play('pet-chirp',time,{volume:.10,rate:e.animal.kind==='bird'?1.2:.92,cooldown:.8});
        ui.toast(`${e.animal.name} is safe!`, time);
      }
      if (e.type === "formation")
        ui.toast("A little friend appeared! Clear its supports.", time);
      if (e.type === "refill")
        ui.toast("Fresh bubbles are blooming · your pets stay with you", time);
      if (e.type === "collect") {
        audio.play("rescue",time);
        const pos=game.grid.position(e.bubble.r,e.bubble.c);
        shelf.collect(e.power,new THREE.Vector3(pos.x,pos.y,BOARD.z+.2),view.time);
        ui.flashPower(e.power,time);shelf.flash(e.power,view.time);
        ui.toast(`${POWER_NAMES[POWERS.indexOf(e.power)]} collected`, time);
      }
      if (e.type === "bomb") {
        audio.play("bomb", time);
        const pet=view.animals.get(e.animal);
        if(pet){
          const facing=game.rescued.find(p=>p.id===e.animal)?.facing??1;
          shelf.collect('bomb',new THREE.Vector3(pet.object.position.x-facing*.25,.85,pet.object.position.z),view.time,1.15);
        }
        ui.flashPower("bomb",time);shelf.flash("bomb",view.time);
        ui.toast("Ten fallen bubbles eaten · Big Bomb earned!", time);
      }
      if (e.type === "eat") {
        const pet=game.rescued.find(p=>p.id===e.animal);
        audio.play('eat',time,{rate:pet?.kind==='bear'?.88:pet?.kind==='bird'?1.15:1});
      }
      if (e.type === "lose") endDelay = time + 2.1;
    }
    path = trajectory(game.grid, angle);
    ui.last = "";
    p0.hud(
      `Bubble Critter Garden · Continuous garden\nScore ${game.score} · Pets rescued ${game.rescued.length}\nShots ${game.shots} · Rows ${game.rows}\nDrag / click to aim and shoot. Two missed matches add one row. Right-click swaps colors.\nP: pause · R: retry · Esc: leave`,
    );
  }
  function reset(level) {
    game.begin(level);
    ui.resetPresentation();
    shelf.reset();celebrations.reset();ambience.reset();pavilion.reset();audio.reset();
    flight = null;
    reported = false;
    endDelay = 0;
    state.menu = null;
    view.resetEffects();
    view.lastRevision = -1;
    process();
  }
  function action(id) {
    if(["play","retry","next"].includes(id)){view.expression="Smile";view.expressionUntil=0;}
    audio.unlock();
    if (id === "play") {
      reset(1);
      return;
    }
    if (id === "retry") {
      reset(game.level);
      return;
    }
    if (id === "continue" || id === "resume") {
      p0.sound.resumeAll();
      state.menu =
        game.status === "playing" ? null : "lost";
    }
    if (id === "pause") {
      state.menu = "pause";
      audio.p0.sound.pauseAll();
    }
    if (id === "main") state.menu = "main";
    if (id === "help-prev" || id === "help-next") {
      ui.helpPage += id === "help-next" ? 1 : -1;
    }
    if (id === "help") ui.helpPage = 0;
    if (id === "journal-prev" || id === "journal-next") ui.journalPage = Math.max(0,Math.min((ui.journalPages??2)-1,ui.journalPage+(id === "journal-next" ? 1 : -1)));
    if (["settings", "help", "leaderboard", "journal"].includes(id)) {
      state.back = state.menu || "pause";
      state.menu = id;
    }
    if (id === "back") state.menu = state.back;
    if (id === "sound" || id === "sfx") audio.toggleSFX();
    if (id === "music") audio.toggleMusic();
    if (id === "exit") p0.exit();
    if (id === "swap" && !flight && !state.menu) game.swap();
    if (id === "cancel" && !flight) game.cancel();
    if (id.startsWith("color:")) state.selectedColor = Number(id.split(":")[1]);
    if (id.startsWith("power:") && !flight && !state.menu) {
      const power = id.split(":")[1];
      game.select(power);
      if (game.selected)
        ui.toast(
          `${POWER_NAMES[POWERS.indexOf(power)]} selected · tap a target`,
          time,
        );
    }
    ui.last = "";
  }
  function shoot() {
    if (state.menu || flight || game.status !== "playing") return false;
    if (game.selected && game.selected !== "wild") {
      if (selectedCell && game.use(selectedCell.r, selectedCell.c)) {
        process();
        return true;
      }
      return false;
    }
    if (!path?.cell) return false;
    flight = {
      path,
      color: game.selected === "wild" ? state.selectedColor : game.current,
      distance: 0,
    };
    view.cannon.fire();
    audio.play("shoot", time);
    return true;
  }
  p0.on("pointermove", () => {
    aim();
    const hit = ui.hit(p0.input.pointer.x, p0.input.pointer.y);
    if (ui.hover !== hit?.id) {
      ui.hover = hit?.id;
      ui.last = "";
    }
  });
  p0.on("pointerdown", (event) => {
    if (event.button === 2 || event.buttons === 2) {
      down = null;
      action("swap");
      return;
    }
    if (event.buttons && event.buttons !== 1) return;
    audio.unlock();
    aim();
    const p = p0.input.pointer,
      hit = ui.hit(p.x, p.y);
    down = { x: p.x, y: p.y, id: hit?.id, disabled: hit?.disabled, blocked: ui.blocksAim(p.x,p.y) };
  });
  p0.on("pointerup", (event) => {
    if (event.button === 2) return;
    if (!down) return;
    aim();
    const p = p0.input.pointer,
      hit = ui.hit(p.x, p.y);
    if (down.id) {
      if (hit?.id === down.id && !down.disabled) action(down.id);
    } else if (!hit && !state.menu && !down.blocked && !ui.blocksAim(p.x,p.y)) shoot();
    down = null;
  });
  p0.on("keydown", (event) => {
    audio.unlock();
    const code = event.code;
    if (code === "KeyP") action(state.menu === "pause" ? "resume" : "pause");
    if (code === "KeyR") action("retry");
    if (code === "KeyX") action("swap");
    if (code === "Space") shoot();
  });
  p0.on("table", () => {
    ui.last = "";
  });
  p0.on("reconnect", () => {
    ui.toast("Back in the garden · your current game is safe", time);
  });
  p0.on("update", () =>
    ui.toast("A fresh garden is ready next time you enter", time),
  );
  process();
  view.update(game, 0, path, null, null);
  ui.draw(game, state, 0);
  p0.loading(0.8, "polishing bubbles and little paws");
  await p0.renderer.compileAsync(p0.scene, p0.camera);
  await p0.renderer.compileAsync(compositor.overlay, p0.camera);
  shelf.update(ui.iconSlots,game,state,ui.hover,view.time);
  compositor.draw();
  p0.loop((dt) => {
    dt = Math.max(0, Math.min(dt, 0.12));
    time += dt;
    const now = performance.now();
    if (lastFrame)
      slow = now - lastFrame > 65 ? slow + 1 : Math.max(0, slow - 0.2);
    lastFrame = now;
    if (slow >= 4 && resolution > 0.6) {
      resolution = Math.max(0.6, resolution * 0.85);
      ambience.reduced=true;
      resize();
      slow = 0;
    }
    if (!state.menu && flight) {
      flight.distance += dt * 13;
      if (flight.distance >= flight.path.distance) {
        game.fire(flight.path, flight.color);
        flight = null;
        process();
      }
    }
    if (!state.menu && endDelay && time >= endDelay) {
      endDelay = 0;
      state.menu = "lost";
      audio.play("lose", time);
      if (!reported) {
        reported = true;
        p0.score(game.score);
      }
    }
    if (game.score > 0 && time > 12 && Math.floor(time / 20) > lastScoreReport) {
      p0.score(game.score);
      lastScoreReport = Math.floor(time / 20);
    }
    if (p0.input.keys.has("ArrowLeft")) {
      angle = Math.max(-1.35, angle - dt * 0.7);
      path = trajectory(game.grid, angle);
    }
    if (p0.input.keys.has("ArrowRight")) {
      angle = Math.min(1.35, angle + dt * 0.7);
      path = trajectory(game.grid, angle);
    }
    if (state.menu !== "pause") {
      game.updateGarden(dt);
      if (game.events.length) process();
    }
    view.aimActive = !state.menu && !ui.blocksAim(p0.input.pointer.x,p0.input.pointer.y);
    view.selectedColor = state.selectedColor;
    view.showcase = state.menu === "main";
    view.update(
      game,
      state.menu === "pause" ? 0 : dt,
      path,
      flight,
      selectedCell,
    );
    pavilion.update(state.menu === "pause" ? 0 : dt);
    ambience.update(state.menu === "pause" ? 0 : dt);
    ui.draw(game, state, time);
    shelf.update(ui.iconSlots,game,state,ui.hover,view.time);
    celebrations.update(state.menu==='pause'?0:dt,ui,state);
    audio.update(state.menu==='pause'?0:dt,!state.menu);
    compositor.draw();
  });
  p0.on("end", () => {
    celebrations.dispose();
    ambience.dispose();
    compositor.dispose();
    audio.dispose();
    shelf.dispose();
    ui.dispose();
    view.dispose();
    pavilion.dispose();
    art.dispose();
    p0.scene.environment = null;
    reflections.dispose();
    pavilion.sky.geometry.dispose();
    pavilion.sky.material.dispose();
  });
  p0.loading(1, "the garden is ready");
  // The local development harness uses this controller; no globals or hidden play modes.
  return {
    game,
    state,
    compositor,
    shelf,
    celebrations,
    ambience,
    pavilion,
    process,
    view,
    ui,
    action,
    shoot,
    aim,
    get path() {
      return path;
    },
    get flight() {
      return flight;
    },
  };
}
