import * as T from "three";
import {enrichPet} from './pet-life.js';
import {PopEffects,fadingMaterial} from "./pop-fx.js";
import {buildPower,animatePower} from "./power-art.js";
import { FlowerCannon } from "./cannon.js";
import {applyExpression} from "./expressions.js";
import { BOARD, COLORS, POWERS, pointAlong } from "./rules.js";
import { foodGroundPosition } from './pet-navigation.js';
import { AimGuideFade } from './aim-guide.js';
export class GardenView {
  constructor(p0, art) {
    this.p0 = p0;
    this.art = art;
    this.root = new T.Group();
    p0.scene.add(this.root);
    this.time = 0;this.nextPollen=5;this.nextChangedAt=-100;this.previousNext=null;this.lastNextShots=0;
    this.cannon = new FlowerCannon(art);
    this.root.add(this.cannon.root);
    this.aimActive = true;
    this.guideFade=new AimGuideFade();
    this.expression = "Smile";
    this.expressionUntil = 0;
    this.lastRevision = -1;
    this.visuals = new Map();
    this.particles = [];
    this.particlePool = Array.from({length:1536},()=>({color:new T.Color()}));
    this.animals = new Map();
    this.tweens = new Map();
    this.collectibles = [];
    this.powerTemplates = new Map();
    this.mascots = [
      [-2.2, "bunny"],
      [2.2, "fox"],
    ].map(([x, kind]) => {
      const animal = art.animal(kind, 0.39);
      animal.position.set(x, 1.12, BOARD.z + 0.8);
      this.root.add(animal);
      return animal;
    });
    this.dummy = new T.Object3D();
    this.palette=COLORS.map(c=>new T.Color(c));
    this.sphere = new T.SphereGeometry(BOARD.radius, 24, 16);
    this.bubbles = new T.InstancedMesh(this.sphere, art.bubbleMaterial, 2048);
    this.bubbles.instanceMatrix.setUsage(T.DynamicDrawUsage);
    this.root.add(this.bubbles);
    this.bubbles.frustumCulled = false;
    this.shellGeometry = new T.SphereGeometry(BOARD.radius * 1.15, 28, 20);
    this.shellMaterial = new T.MeshPhysicalMaterial({
      clearcoat: 1, iridescence: 0.65, envMapIntensity: 1.2,
      color: "#e9c8ef",
      transparent: true,
      opacity: 0.18,
      roughness: 0.12,
      metalness: 0.45,
      depthWrite: false,
    });
    this.rimGeometry = new T.TorusGeometry(BOARD.radius * 1.13, 0.007, 5, 32);
    this.rimMaterial = new T.MeshBasicMaterial({
      color: "#f9e5fa",
      transparent: true,
      opacity: 0.8,
    });
    this.glintMaterial = new T.MeshBasicMaterial({
      color: "#fff8ff",
      transparent: true,
      opacity: 0.7,
    });
    this.glints = new T.InstancedMesh(
      new T.SphereGeometry(1, 8, 6),
      this.glintMaterial,
      2048,
    );
    this.root.add(this.glints);
    this.glints.frustumCulled = false;
    this.contactGeometry = new T.PlaneGeometry(1, 1);
    this.contactMaterial = new T.MeshBasicMaterial({ map: art.textures["contact-shadow"],
      transparent: true, depthWrite: false, toneMapped: false, opacity: 0.8 });
    this.contacts = new T.InstancedMesh(this.contactGeometry, this.contactMaterial, 2056);
    this.contacts.frustumCulled = false;
    this.root.add(this.contacts);
    this.skillMaterials = [];
    this.powerGeometries = [];
    this.skillGeometry = new T.SphereGeometry(1, 28, 20);
    this.skillRim = new T.TorusGeometry(1.1, 0.06, 6, 40);
    this.skillRimMaterial = new T.MeshStandardMaterial({ color: "#d9be83", emissive: "#aa8346", emissiveIntensity: 0.25, metalness: 0.65, roughness: 0.28 });
    this.dotMaterial = new T.MeshBasicMaterial({
      color: "#fff3d4",
      transparent: true,
      opacity: 0.72,
      depthTest: false,
    });
    this.dots = new T.InstancedMesh(
      new T.SphereGeometry(0.018, 6, 4),
      this.dotMaterial,
      150,
    );
    this.dots.renderOrder = 5;
    this.root.add(this.dots);
    this.dots.frustumCulled = false;
    this.dotHalo = new T.InstancedMesh(new T.SphereGeometry(.034, 6, 4),
      new T.MeshBasicMaterial({color:'#fff1ce',transparent:true,opacity:.12,depthWrite:false,depthTest:false}),150);
    this.dotHalo.frustumCulled=false;this.dotHalo.renderOrder=4;this.root.add(this.dotHalo);
    this.shot = new T.Mesh(this.sphere, art.bubbleMaterial.clone());
    this.root.add(this.shot);
    this.nextShot = new T.Mesh(this.sphere, art.bubbleMaterial.clone());
    this.nextShot.scale.setScalar(0.8);
    this.nextShot.position.set(0.67, BOARD.launcher - 0.2, BOARD.z);
    this.root.add(this.nextShot);
    const ghostMaterial = art.bubbleMaterial.clone();
    ghostMaterial.transparent=true;ghostMaterial.opacity=.4;ghostMaterial.depthWrite=false;
    this.ghost = new T.Mesh(this.sphere, ghostMaterial);
    this.ghost.renderOrder = 5;
    this.root.add(this.ghost);
    this.popEffects = new PopEffects(this.root,this.sphere,art.bubbleMaterial,(...args)=>this.burst(...args));
    this.particleMesh = new T.InstancedMesh(
      new T.IcosahedronGeometry(0.025, 0),
      fadingMaterial(),
      1536,
    );
    this.particleAlpha=new T.InstancedBufferAttribute(new Float32Array(1536),1);
    this.particleMesh.geometry.setAttribute("effectAlpha",this.particleAlpha);
    this.particleMesh.setColorAt(0,new T.Color());
    this.particleMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    this.particleMesh.frustumCulled = false;
    this.root.add(this.particleMesh);
    const dangerPoints = [
      new T.Vector3(-3.75, BOARD.danger, BOARD.z + 0.25),
      new T.Vector3(3.75, BOARD.danger, BOARD.z + 0.25),
    ];
    this.danger = new T.LineSegments(
      new T.BufferGeometry().setFromPoints(dangerPoints),
      new T.LineDashedMaterial({
        color: "#c9719f",
        dashSize: 0.09,
        gapSize: 0.07,
        transparent: true,
        opacity: 0.65,
      }),
    );
    this.danger.computeLineDistances();
    this.root.add(this.danger);
    this.target = new T.Group();
    this.root.add(this.target);
    this.targetRing = new T.Mesh(
      new T.TorusGeometry(0.62, 0.022, 5, 48),
      new T.MeshBasicMaterial({
        color: "#ffe7ad",
        depthTest: false,
        transparent: true,
        opacity: 0.8,
      }),
    );
    this.target.add(this.targetRing);
    this.target.visible = false;
  }
  power(kind, size=BOARD.radius) {return buildPower(this,kind,size);}
  star(g, x, y, z, r, color) {
    const shape = new T.Shape();
    for (let i = 0; i < 10; i++) {
      const t = (i * Math.PI) / 5 + Math.PI / 2;
      const rr = i % 2 ? r * 0.44 : r;
      const px = Math.cos(t) * rr,
        py = Math.sin(t) * rr;
      if (i) shape.lineTo(px, py);
      else shape.moveTo(px, py);
    }
    shape.closePath();
    const geometry = new T.ExtrudeGeometry(shape, {
      depth: r * 0.12,
      bevelEnabled: true,
      bevelSize: r * 0.04,
      bevelThickness: r * 0.04,
      bevelSegments: 1,
      steps: 1,
    });
    const mesh = new T.Mesh(geometry, this.art.mat(color));
    mesh.position.set(x, y, z);
    g.add(mesh);
  }
  creature(b, trapped = true) {
    const root = new T.Group();
    const animal = this.art.animal(b.kind, trapped ? 0.15 : 0.38);
    root.add(animal);
    if (trapped) {
      const shell = new T.Mesh(this.shellGeometry, this.shellMaterial);
      root.add(shell);
      const rim = new T.Mesh(this.rimGeometry, this.rimMaterial);
      rim.position.z = 0.025;
      root.add(rim);
    }
    root.userData.animal = animal;
    return root;
  }
  sync(game) {
    const wanted = new Set();
    for (const b of game.grid.cells.values())
      if (b.type !== "normal") {
        wanted.add(b.id);
        if (!this.visuals.has(b.id)) {
          const object =
            b.type === "animal" ? this.creature(b) : this.power(b.power);
          this.root.add(object);
          this.visuals.set(b.id, object);
        }
        const object = this.visuals.get(b.id),
          p = game.grid.position(b.r, b.c);
        object.position.set(p.x, p.y, BOARD.z);
      }
    for (const [id, object] of this.visuals)
      if (!wanted.has(id)) {
        this.root.remove(object);
        this.visuals.delete(id);
      }
    for (const a of game.rescued)
      if (!this.animals.has(a.id)) {
        const object = this.creature(a, false);
        object.position.set(
          a.x,
          0.96,
          a.z,
        );
        this.root.add(object);
        this.animals.set(a.id, {
          object,
          born: this.time,
          phase: this.animals.size * 1.9,
        });
      }
    // Restarted/replayed games remove the previous garden and its animated meshes.
    for (const [id, a] of this.animals)
      if (!game.rescued.some((b) => b.id === id)) {
        this.root.remove(a.object);
        this.animals.delete(id);
      }
    this.lastRevision = game.revision;
  }
  burst(x,y,color,count=10,duration=.55) {
    for(let i=0;i<count;i++){
      const p=this.particlePool.pop();if(!p)break;
      Object.assign(p,{x,y,z:BOARD.z+.2,vx:(Math.random()-.5)*1.5,vy:Math.random()*1.2,life:0,duration});
      p.color.set(color??"#fff3bd");this.particles.push(p);
    }
  }
  resetEffects(){
    this.guideFade.reset();
    this.popEffects.reset();this.particlePool.push(...this.particles);this.particles.length=0;
    this.particleMesh.count=0;this.cannon.reset();this.slide=null;this.tweens.clear();
    this.collectibles.forEach(c=>c.object.removeFromParent());this.collectibles.length=0;
    this.dots.count=this.dotHalo.count=0;this.ghost.visible=false;this.nextPollen=this.time+5;this.previousNext=null;
  }
  events(events, game) {
    for (const e of events) {
      if(['miss','row','lose'].includes(e.type)){this.expression='Sad';this.expressionUntil=this.time+(e.type==='lose'?30:2.3);}
      else if(e.type==='formation'){this.expression='Shock';this.expressionUntil=this.time+1.4;}
      else if(['pop','rescue','win','eat'].includes(e.type)){this.expression='Smile';this.expressionUntil=this.time+2;}

      if(e.type==="pop"){
        this.popEffects.add(e.bubbles,game.grid);
        if(e.bubbles.length>=6){this.cannon.celebrate();for(const a of this.animals.values())a.happyUntil=this.time+1.1;}
      }
      if (e.type === "rescue") {
        const p = game.grid.position(e.bubble.r, e.bubble.c);
        this.burst(p.x, p.y, "#ffe6a0", 20);
        this.tweens.set(e.animal.id, { x: p.x, y: p.y, life: 0 });
      }
      if (e.type === "collect" && !this.inventoryInOverlay) {
        const p = game.grid.position(e.bubble.r, e.bubble.c),
          object = this.power(e.power, 0.2);
        object.position.set(p.x, p.y, BOARD.z + 0.2);
        this.root.add(object);
        this.collectibles.push({ object, x: p.x, y: p.y, life: 0 });
      }
      if (e.type === "bomb" || e.type === "eat") {
        const a = this.animals.get(e.animal);
        if (a) {
          a.eatingUntil = this.time + 0.5;
          a.happyUntil = this.time + 1.15;
          if(e.type === "bomb"){a.bombUntil=this.time+.65;a.bombAt=this.time;a.bombX=a.object.position.x;}
          if (e.bubble) this.burst(e.bubble.x, e.bubble.y, "#ffe5b8", 3);
          if (e.type === "bomb") {
            this.burst(a.object.position.x, 1.2, "#ffe49e", 12);
            const object = this.power("bomb", 0.16);
            object.position.copy(a.object.position);
            object.position.x -= (game.rescued.find((pet) => pet.id === e.animal)?.facing ?? 1) * 0.25;
            this.root.add(object);
            this.collectibles.push({
              object,
              delay:.55,
              x: object.position.x,
              y: 0.85,
              z:object.position.z,
              dropped: true,
              life: 0,
            });
          }
        }
      }
      if (e.type === "row")
        this.slide = {
          start: this.time,
          amount: BOARD.step,
        };
    }
  }
  update(game, dt, path, flight, selectedCell) {
    this.time += dt;
    this.popEffects.update(dt);
    const first = path?.points?.[1];
    const aimAngle = first ? Math.atan2(first.x, first.y - BOARD.launcher) : 0;
    this.cannon.context={flying:!!flight,petX:game.rescued.reduce((x,a)=>Math.abs(a.x)<Math.abs(x)?a.x:x,10)};
    this.cannon.update(dt,aimAngle,this.time);
    if(dt>0&&this.time>=this.nextPollen&&!flight&&!this.showcase){
      this.burst(-.32,BOARD.launcher+.12,'#f5dfaa',2,1.1);this.nextPollen=this.time+7;
    }
    if (this.lastRevision !== game.revision) this.sync(game);
    let index = 0, contact = 0;
    const footprint = (x, y, z, sx, sy, floor = false) => {
      const d = this.dummy;
      d.position.set(x, y, z); d.rotation.set(floor ? -Math.PI / 2 : 0, 0, 0);
      d.scale.set(sx, sy, 1); d.updateMatrix();
      this.contacts.setMatrixAt(contact++, d.matrix); d.rotation.set(0, 0, 0);
    };
    const dummy = this.dummy;
    const add = (x, y, z, color, scale = 1, shadow = "board") => {
      if (index >= 2048) return;
      if (shadow === "board") footprint(x + 0.045, y - 0.06, -1.925, 0.56, 0.56);
      if (shadow === "floor") footprint(x, 0.636, z, 0.5, 0.45, true);
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      this.bubbles.setMatrixAt(index, dummy.matrix);
      this.bubbles.setColorAt(index, this.palette[COLORS.indexOf(color)]);
      dummy.position.set(
        x - 0.056 * scale,
        y + 0.065 * scale,
        z + 0.159 * scale,
      );
      dummy.scale.set(0.028 * scale, 0.045 * scale, 0.01 * scale);
      dummy.rotation.z = -0.48;
      dummy.updateMatrix();
      this.glints.setMatrixAt(index, dummy.matrix);
      dummy.rotation.z = 0;
      index++;
    };
    const slide = this.slide
      ? Math.max(0, 1 - (this.time - this.slide.start) / 0.38) *
        this.slide.amount
      : 0;
    for (const b of game.grid.cells.values()) {
      const p = game.grid.position(b.r, b.c);
      if (b.type === "normal") add(p.x, p.y + slide, BOARD.z, COLORS[b.color]);
      else {
        footprint(p.x + 0.045, p.y + slide - 0.06, -1.925, 0.6, 0.6);
        const object = this.visuals.get(b.id);
        if (object) {
          object.position.y = p.y + slide;
          if (b.type === "power") animatePower(object,this.time+b.id*.13);
          const animal = object.userData.animal;
          if (animal) this.animateAnimal(animal, b.id, dt);
        }
      }
    }
    for (const b of game.ground) {
      const ground=foodGroundPosition(b);
      const duration = Math.sqrt(Math.max(0, b.startY - 0.815) / 3.5);
      const age = Math.max(0, game.gardenTime - b.landedAt + duration);
      const t = Math.min(1, duration > 0 ? age / duration : 1);
      const bounceAge = game.gardenTime - b.landedAt;
      const bounce = bounceAge > 0 && bounceAge < 0.65
        ? Math.abs(Math.sin(bounceAge * 12)) * 0.09 * (1 - bounceAge / 0.65) : 0;
      add(b.startX + (ground.x - b.startX) * t,
        Math.max(b.y, b.startY - 3.5 * age * age) + bounce,
        BOARD.z + (ground.z - BOARD.z) * t, COLORS[b.color], 1, bounceAge >= 0 ? "floor" : "none");
    }
    this.bubbles.count = this.glints.count = index;
    this.bubbles.instanceMatrix.needsUpdate = true;
    this.glints.instanceMatrix.needsUpdate = true;
    if (this.bubbles.instanceColor)
      this.bubbles.instanceColor.needsUpdate = true;
    for (const [id, a] of this.animals) {
      const tween = this.tweens.get(id);
      const pet = game.rescued.find((pet) => pet.id === id);
      if (!pet) continue;
      const walking = this.time >= a.eatingUntil || !a.eatingUntil;
      let y = 0.91 + (walking ? Math.abs(Math.sin(this.time * 7 + a.phase)) * 0.025 : -0.025),
        x = pet.x;
      if (tween) {
        tween.life += dt;
        const t = Math.min(1, tween.life / 1.5),
          smooth = t * t * (3 - 2 * t);
        x = tween.x + (x - tween.x) * smooth;
        y = tween.y + (y - tween.y) * smooth;
        if (t === 1) {
          this.tweens.delete(id);
          a.celebratingUntil=this.time+.85;
          this.burst(x, y, "#ffeec3", 10);
        }
      }
      const celebrating=this.time<(a.celebratingUntil??0),happy=this.time<(a.happyUntil??0),eating=!walking;
      if(celebrating)y+=Math.abs(Math.sin((a.celebratingUntil-this.time)*10))*.11;
      else if(happy&&!eating)y+=Math.max(0,Math.sin((a.happyUntil-this.time)*10))*.055;
      const depth=pet.z;
      a.object.position.set(x,y,depth);
      a.object.rotation.y = pet.facing * .35 + Math.sin(this.time*.8+a.phase)*.065;
      a.object.rotation.z = Math.sin(this.time * (walking ? 7 : 13) + a.phase) * 0.035;
      if(this.time<(a.bombUntil??0))a.object.rotation.z+=Math.sin((a.bombUntil-this.time)*22)*.065;
      const animal=a.object.userData.animal;
      this.animateAnimal(animal,a.phase);
      const face=animal.children[0],dict=face.morphTargetDictionary;
      if(eating){
        face.morphTargetInfluences[dict.Smile]=.6+.3*Math.sin(this.time*20);
        face.morphTargetInfluences[dict.Shock]=.18*(1+Math.sin(this.time*20));
        animal.rotation.x=Math.sin(this.time*16)*.055;
      }else{
        animal.rotation.x=Math.sin(this.time*.9+a.phase)*.018;
        if(happy||celebrating)applyExpression(face,'Smile',this.time,a.phase,.95);
      }
      enrichPet(a,pet,game,this.animals,this.time,dt);
      footprint(a.object.position.x,.637,a.object.position.z,.85,.55,true);
    }
    this.contacts.count = contact;
    this.contacts.instanceMatrix.needsUpdate = true;
    const shotPosition = flight
      ? pointAlong(flight.path, flight.distance)
      : { x: 0, y: BOARD.launcher };
    this.shot.position.set(shotPosition.x, shotPosition.y, BOARD.z + 0.03);
    this.shot.material.color.set(COLORS[flight?.color ?? (game.selected === "wild" ? this.selectedColor ?? game.current : game.current)]);
    this.shot.visible = game.status === "playing";
    this.mascots.forEach((animal, i) => {
      animal.visible = Boolean(this.showcase);
      if (animal.visible) {
        this.animateAnimal(animal, i * 1.7);
        animal.position.y =
          1.12 + Math.max(0, Math.sin(this.time * 2 + i)) * 0.08;
      }
    });
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const c = this.collectibles[i];
      c.life += dt;
      if(c.dropped&&this.inventoryInOverlay){
        c.object.visible=c.life>=.55&&c.life<1.15;
        c.object.position.set(c.x,c.y+Math.max(0,Math.sin((c.life-.55)/.6*Math.PI))*.18,c.z);
        c.object.scale.setScalar(.16);animatePower(c.object,this.time);
        if(c.life>=1.15){c.object.removeFromParent();this.collectibles.splice(i,1);}
        continue;
      }
      const delay=c.delay??0;
      c.object.visible=c.life>=delay;
      const age=Math.max(0,c.life-delay);
      const drop = c.dropped ? 0.65 : 0;
      const t = Math.max(0, Math.min(1, (age - drop) / 1.2));
      c.object.position.set(
        c.x + (4.7 - c.x) * t,
        c.y + (6.5 - c.y) * t + Math.sin(t * Math.PI) +
          (c.dropped && age < drop ? Math.sin(age / drop * Math.PI) * 0.23 : 0),
        BOARD.z + 0.4,
      );
      c.object.rotation.z = t * 2;
      animatePower(c.object,this.time);
      c.object.scale.setScalar(0.2 * (1 - t * 0.7));
      if (t === 1) {
        this.root.remove(c.object);
        this.collectibles.splice(i, 1);
      }
    }
    if(this.previousNext!==game.next||this.lastNextShots!==game.shots){
      this.previousNext=game.next;this.lastNextShots=game.shots;this.nextChangedAt=this.time;
    }
    const advance=Math.max(0,1-(this.time-this.nextChangedAt)/.3);
    this.nextShot.position.y=BOARD.launcher-.2+Math.sin(advance*Math.PI)*.10;
    this.nextShot.material.color.set(COLORS[game.next]);
    const assistance=this.guideFade.update(game.score,dt,!!flight);
    this.dotMaterial.opacity=.72*assistance;
    this.dotHalo.material.opacity=.12*assistance;
    this.ghost.material.opacity=.4*assistance;
    let dot = 0;
    if (
      assistance>0 && this.aimActive && path && !flight && game.status === "playing" &&
      (!game.selected || game.selected === "wild")
    ) {
      for (let d = 0.3; d < path.distance && dot < 150; d += 0.17) {
        const p = pointAlong(path, d);
        dummy.position.set(p.x, p.y, BOARD.z + 0.25);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        this.dotHalo.setMatrixAt(dot, dummy.matrix);
        this.dots.setMatrixAt(dot++, dummy.matrix);
      }
    }
    this.dots.count = this.dotHalo.count = dot;
    this.dotHalo.instanceMatrix.needsUpdate = true;
    this.dots.instanceMatrix.needsUpdate = true;
    this.ghost.visible = Boolean(
      assistance>0 && this.aimActive && path?.cell && !flight &&
      (!game.selected || game.selected === "wild") && game.status === "playing",
    );
    if (this.ghost.visible) {
      const p = game.grid.position(...path.cell);
      this.ghost.position.set(p.x, p.y, BOARD.z + 0.03);
      this.ghost.material.color.set(COLORS[game.selected === "wild" ? this.selectedColor ?? game.current : game.current]);
    }
    this.target.visible = Boolean(
      this.aimActive && game.selected && game.selected !== "wild" && selectedCell,
    );
    if (this.target.visible) {
      const p = game.grid.position(selectedCell.r, selectedCell.c);
      this.target.position.set(p.x, p.y, BOARD.z + 0.28);
      this.targetRing.scale.set(
        game.selected === "fire"
          ? 6
          : game.selected === "lightning"
            ? 0.25
            : game.selected === "bomb"
              ? 1.85
              : 1,
        game.selected === "fire"
          ? 0.2
          : game.selected === "lightning"
            ? 5
            : game.selected === "bomb"
              ? 1.85
              : 1,
        1,
      );
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt / p.duration;
      if (p.life > 1) {
        this.particlePool.push(p);
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += (p.vy - p.life * 1.7) * dt;
    }
    this.particles.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.setScalar(1 - p.life);
      dummy.updateMatrix();
      this.particleMesh.setMatrixAt(i, dummy.matrix);
      this.particleMesh.setColorAt(i,p.color);this.particleAlpha.setX(i,(1-p.life)**2*.85);
    });
    this.particleMesh.count = this.particles.length;
    this.particleMesh.instanceMatrix.needsUpdate = true;
    this.particleAlpha.needsUpdate=true;
    if(this.particleMesh.instanceColor)this.particleMesh.instanceColor.needsUpdate=true;
  }
  animateAnimal(animal, phase) {
    animal.scale.set(
      animal.userData.base,
      animal.userData.base * (1 + Math.sin(this.time * 2.5 + phase) * 0.025),
      animal.userData.base,
    );
    applyExpression(animal.children[0],this.time<this.expressionUntil?this.expression:'Smile',this.time,phase);


  }
  dispose() {
    this.root.removeFromParent();
    this.cannon.dispose();
    this.popEffects.dispose();
    this.sphere.dispose();
    this.contactGeometry.dispose(); this.contactMaterial.dispose();
    this.skillGeometry.dispose(); this.skillRim.dispose(); this.skillRimMaterial.dispose();
    this.skillMaterials.forEach((m) => m.dispose());
    this.powerGeometries.forEach(g=>g.dispose());
    this.shellGeometry.dispose();
    this.shellMaterial.dispose();
    this.rimGeometry.dispose();
    this.rimMaterial.dispose();
    this.glints.geometry.dispose();
    this.glintMaterial.dispose();
    this.dotHalo.geometry.dispose(); this.dotHalo.material.dispose();
    this.dots.geometry.dispose();
    this.dotMaterial.dispose();
    this.shot.material.dispose();
    this.nextShot.material.dispose();

    this.ghost.material.dispose();
    this.particleMesh.geometry.dispose();
    this.particleMesh.material.dispose();
    this.danger.geometry.dispose();
    this.danger.material.dispose();
  }
}
