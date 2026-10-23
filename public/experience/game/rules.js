// Renderer-independent rules. Metres, positive Y up, row zero at the ceiling.
import { placeRescuedPet, updateGardenPets } from './pet-navigation.js';
export const BOARD = {
  columns: 20,
  radius: 0.1875,
  diameter: 0.375,
  step: Math.sqrt(3) * 0.1875,
  top: 8.7,
  left: -3.5625,
  right: 3.5625,
  danger: 2.3,
  launcher: 1.15,
  z: -1.6,
};
export const COLORS = ["#f28fbd", "#b09be8", "#79c5ee", "#f3cf71", "#93cea3"];
export const COLOR_NAMES = ['Pink','Lilac','Blue','Gold','Mint'];
export const COLOR_STEP = 10000;
const EXTRA_COLORS = [['#ee7458','Coral'],['#35aaa6','Teal'],['#ef982f','Orange'],['#4864c8','Indigo'],['#f1eee3','Pearl'],['#96485d','Berry']];
function ensureColors(count) {
  while (COLORS.length < count) {
    const index = COLORS.length, extra = EXTRA_COLORS[index - 5];
    // Continue deterministically beyond the named palette; no difficulty cap.
    COLORS.push(extra?.[0] ?? `hsl(${((index * 137.507764) % 360).toFixed(6)}, 65%, ${index % 2 ? 42 : 68}%)`);
    COLOR_NAMES.push(extra?.[1] ?? `Hue ${index + 1}`);
  }
}
export const BOMB_CAP = 3;
export const POWERS = [
  "fire",
  "rainbow",
  "shuffle",
  "star",
  "bomb",
  "wild",
  "lightning",
];
export const POWER_NAMES = [
  "Fire Ball",
  "Rainbow Clear",
  "Shuffle",
  "Star Bomb",
  "Big Bomb",
  "Wild Bubble",
  "Lightning",
];
export const ANIMALS = [
  "bunny",
  "fox",
  "kitten",
  "bird",
  "deer",
];
export const NAMES = [
  "Mochi",
  "Clementine",
  "Clover",
  "Pip",
  "Fern",
];
// One continuous garden. Rescue milestones never end or reset the run.
export const GARDEN = { seed: 3157, unlock: 30, between: 36, skillBubbles: 3 };
export function rng(seed) {
  const next = () => {
    next.state = (Math.imul(next.state, 1664525) + 1013904223) >>> 0;
    return next.state / 4294967296;
  };
  next.state = seed >>> 0;
  return next;
}
export const key = (r, c) => `${r},${c}`;
export class Grid {
  constructor() {
    this.cells = new Map();
    this.phase = 0;
    this.serial = 0;
  }
  width(r) {
    return BOARD.columns - ((r + this.phase) % 2);
  }
  valid(r, c) {
    return (
      Number.isInteger(r) &&
      Number.isInteger(c) &&
      r >= 0 &&
      c >= 0 &&
      c < this.width(r)
    );
  }
  get(r, c) {
    return this.cells.get(key(r, c));
  }
  put(r, c, data) {
    if (!this.valid(r, c)) throw Error("Invalid hex cell");
    const b = { ...data, r, c, id: data.id ?? ++this.serial };
    this.cells.set(key(r, c), b);
    return b;
  }
  position(r, c) {
    return {
      x: BOARD.left + (c + ((r + this.phase) % 2) * 0.5) * BOARD.diameter,
      y: BOARD.top - r * BOARD.step,
    };
  }
  neighbors(r, c) {
    const odd = (r + this.phase) % 2;
    return [
      [r, c - 1],
      [r, c + 1],
      [r - 1, c - 1 + odd],
      [r - 1, c + odd],
      [r + 1, c - 1 + odd],
      [r + 1, c + odd],
    ].filter(([a, b]) => this.valid(a, b));
  }
  group(r, c, predicate) {
    const first = this.get(r, c);
    if (!first || !predicate(first)) return [];
    const found = new Set([key(r, c)]),
      queue = [first];
    for (let i = 0; i < queue.length; i++)
      for (const [a, b] of this.neighbors(queue[i].r, queue[i].c)) {
        const n = this.get(a, b),
          k = key(a, b);
        if (n && !found.has(k) && predicate(n)) {
          found.add(k);
          queue.push(n);
        }
      }
    return queue;
  }
  remove(items) {
    for (const b of items) this.cells.delete(key(b.r, b.c));
    return items;
  }
  supported() {
    const support = new Set(),
      queue = [];
    for (const b of this.cells.values())
      if (b.r === 0) {
        support.add(key(b.r, b.c));
        queue.push(b);
      }
    for (let i = 0; i < queue.length; i++)
      for (const [r, c] of this.neighbors(queue[i].r, queue[i].c)) {
        const k = key(r, c),
          b = this.get(r, c);
        if (b && !support.has(k)) {
          support.add(k);
          queue.push(b);
        }
      }
    return support;
  }
  detach() {
    const support = this.supported();
    return this.remove(
      [...this.cells.values()].filter((b) => !support.has(key(b.r, b.c))),
    );
  }
  insert(make) {
    const old = [...this.cells.values()];
    this.cells.clear();
    this.phase = 1 - this.phase;
    for (const b of old) this.put(b.r + 1, b.c, b);
    for (let c = 0; c < this.width(0); c++) this.put(0, c, make(c));
  }
  danger() {
    const support = this.supported();
    return [...this.cells.values()].some(
      (b) =>
        support.has(key(b.r, b.c)) &&
        this.position(b.r, b.c).y - BOARD.radius <= BOARD.danger,
    );
  }
  maxRow() {
    return Math.max(0, ...[...this.cells.values()].map((b) => b.r));
  }
}
// Exact ray/circle collision with analytic wall reflections. The same path powers
// both the preview and the moving projectile; a slow frame cannot tunnel.
export function trajectory(grid, angle) {
  angle = Math.max(-1.35, Math.min(1.35, angle));
  let x = 0,
    y = BOARD.launcher,
    dx = Math.sin(angle),
    dy = Math.cos(angle),
    total = 0;
  const points = [{ x, y, distance: 0 }];
  let hit = null;
  for (let bounce = 0; bounce < 12; bounce++) {
    let t = (BOARD.top - y) / dy;
    let type = "ceiling";
    const wall =
      dx > 0
        ? (BOARD.right - x) / dx
        : dx < 0
          ? (BOARD.left - x) / dx
          : Infinity;
    if (wall < t) {
      t = wall;
      type = "wall";
    }
    hit = null;
    for (const b of grid.cells.values()) {
      const p = grid.position(b.r, b.c),
        ox = x - p.x,
        oy = y - p.y,
        proj = ox * dx + oy * dy;
      const disc = proj * proj - (ox * ox + oy * oy - BOARD.diameter ** 2);
      if (disc < 0) continue;
      const near = -proj - Math.sqrt(disc);
      if (near >= -0.000001 && near < t) {
        t = Math.max(0, near);
        type = "bubble";
        hit = b;
      }
    }
    x += dx * t;
    y += dy * t;
    total += t;
    points.push({ x, y, distance: total });
    if (type !== "wall") break;
    dx = -dx;
    x += dx * 0.000001;
  }
  let candidates = [];
  if (hit)
    candidates = grid
      .neighbors(hit.r, hit.c)
      .filter(([r, c]) => !grid.get(r, c));
  else
    for (let c = 0; c < grid.width(0); c++)
      if (!grid.get(0, c)) candidates.push([0, c]);
  candidates.sort((a, b) => {
    const p = grid.position(...a),
      q = grid.position(...b);
    return (p.x - x) ** 2 + (p.y - y) ** 2 - (q.x - x) ** 2 - (q.y - y) ** 2;
  });
  return {
    points,
    cell: candidates[0] ?? null,
    distance: total,
    hit: hit?.id ?? null,
  };
}
export function pointAlong(path, distance) {
  for (let i = 1; i < path.points.length; i++) {
    const a = path.points[i - 1],
      b = path.points[i];
    if (distance <= b.distance) {
      const t = (distance - a.distance) / (b.distance - a.distance || 1);
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
  }
  return path.points.at(-1);
}
export class Game {
  constructor(level = 1) {
    this.begin(level);
  }
  begin(level = 1) {
    this.level = 1;
    this.config = GARDEN;
    this.random = rng(this.config.seed);
    this.grid = new Grid();
    this.status = "playing";
    this.score = 0;
    this.cleared = 0;
    this.popped = 0;
    this.detached = 0;
    this.shots = 0;
    this.misses = 0;
    this.pendingMisses = 0;
    this.rows = 0;
    this.rescued = [];
    this.ground = [];
    this.gardenTime = 0;
    this.introduced = 0;
    this.powerCursor = 0;
    this.refills = 0;
    this.nextUnlock = this.config.unlock;
    this.inventory = Object.fromEntries(POWERS.map((p) => [p, 0]));
    this.events = [];
    this.selected = null;
    this.swapped = false;
    this.revision = 0;
    for (let r = 0; r < 6; r++)
      for (let c = 0; c < this.grid.width(r); c++)
        this.grid.put(r, c, {
          type: "normal",
          color: this.randomColor(r, c),
        });
    this.ensurePowers();
    this.current = this.chooseColor();
    this.next = this.chooseColor(this.current);
    return this;
  }
  emit(type, data = {}) {
    this.events.push({ type, ...data });
  }
  get colorCount() {
    const count = 5 + Math.floor(this.score / COLOR_STEP);
    ensureColors(count);
    return count;
  }
  randomColor(r, c) {
    // Shuffle candidates rather than painting stripes. Keep generated connected
    // patches small, while allowing useful pairs/triples for normal matches.
    const choices = Array.from({length: this.colorCount}, (_, i) => i);
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    if (this.random() < 0.45) {
      const nearby = this.grid
        .neighbors(r, c)
        .map(([rr, cc]) => this.grid.get(rr, cc))
        .filter((n) => n?.type === "normal");
      if (nearby.length)
        choices.unshift(
          nearby[Math.floor(this.random() * nearby.length)].color,
        );
    }
    for (const color of choices) {
      const joined = new Set();
      for (const [rr, cc] of this.grid.neighbors(r, c))
        for (const b of this.grid.group(
          rr,
          cc,
          (n) => n.type === "normal" && n.color === color,
        ))
          joined.add(b.id);
      if (joined.size < 4) return color;
    }
    return choices[0];
  }
  addRandomRow() {
    this.grid.insert((c) => ({
      type: "normal",
      color: this.randomColor(0, c),
    }));
  }
  usefulColors() {
    const weights = [];
    for (const b of this.grid.cells.values())
      if (
        b.type === "normal" &&
        this.grid.neighbors(b.r, b.c).some(([r, c]) => !this.grid.get(r, c))
      ) {
        const n = this.grid.group(
          b.r,
          b.c,
          (a) => a.type === "normal" && a.color === b.color,
        ).length;
        if (n >= 2) weights.push(b.color);
      }
    if (!weights.length)
      for (const b of this.grid.cells.values())
        if (b.type === "normal") weights.push(b.color);
    return weights;
  }
  chooseColor(exclude = null) {
    const useful = this.usefulColors(),
      other = useful.filter((color) => color !== exclude);
    const weights = other.length ? other : useful;
    return weights.length
      ? weights[Math.floor(this.random() * weights.length)]
      : Math.floor(this.random() * this.colorCount);
  }
  swap() {
    if (this.status !== "playing" || this.selected) return false;
    [this.current, this.next] = [this.next, this.current];
    this.swapped = true;
    this.revision++;
    return true;
  }
  settle(removed, reason = "match") {
    const previousColors = this.colorCount;
    const direct = this.grid.remove(removed);
    const fallen = this.grid.detach();
    const ordinary = direct.filter((b) => b.type === "normal"),
      food = fallen.filter((b) => b.type === "normal");
    this.popped += ordinary.length;
    this.detached += food.length;
    this.cleared += ordinary.length + food.length;
    this.score += ordinary.length * 10 + food.length * 20;
    if (food.length >= 5) {
      this.score += 100;
      this.emit("chain");
    }
    for (const b of [...direct, ...fallen]) {
      if (b.type === "animal" && !this.rescued.some((a) => a.id === b.id)) {
        const animal = {
          id: b.id,
          kind: b.kind,
          name: b.name,
          eaten: 0,
          totalEaten: 0,
          x: this.grid.position(b.r, b.c).x,
          facing: 1,
          readyAt: this.gardenTime + 1.5,
          cooldown: 0,
          target: null,
        };
        placeRescuedPet(animal, this.rescued);
        this.rescued.push(animal);
        this.score += 250;
        this.emit("rescue", { bubble: b, animal });
      } else if (b.type === "power") {
        if (this.grantPower(b.power))
          this.emit("collect", { bubble: b, power: b.power });
      }
    }
    // Detached, unpopped bubbles remain food, even before the first rescue.
    for (const b of food) {
      const p = this.grid.position(b.r, b.c);
      const occupied = new Set(this.ground.map((f) => f.slot));
      const preferred = Math.max(0, Math.min(18, Math.round((p.x + 3.375) / BOARD.diameter)));
      let slot = preferred;
      while (occupied.has(slot)) slot += 19;
      this.ground.push({
        id: b.id, color: b.color, slot, startX: p.x, startY: p.y,
        x: -3.375 + (slot % 19) * BOARD.diameter,
        y: 0.815 + Math.floor(slot / 57) * BOARD.step,
        z: BOARD.z - 0.06 + (Math.floor(slot / 19) % 3) * 0.4,
        landedAt: this.gardenTime + Math.sqrt(Math.max(0, p.y - 0.815) / 3.5),
      });
    }
    if (direct.length) this.emit("pop", { bubbles: direct, reason });
    if (fallen.length) this.emit("fall", { bubbles: fallen });
    if (this.colorCount > previousColors)
      this.emit("color-unlock", { count: this.colorCount });
    return { direct, fallen };
  }
  updateGarden(dt) {
    if (!(dt > 0)) return;
    updateGardenPets(this, dt);
  }
  ensurePowers() {
    const active = [...this.grid.cells.values()].filter((b) => b.type === "power");
    const normals = [...this.grid.cells.values()].filter((b) => b.type === "normal");
    while (active.length < GARDEN.skillBubbles && normals.length) {
      const desiredX = [-2.25, 0, 2.25][active.length];
      normals.sort((a, b) => {
        const cost = (v) => {
          const p = this.grid.position(v.r, v.c);
          const spacing = active.some((q) => Math.abs(this.grid.position(q.r, q.c).x - p.x) < 0.8) ? 10 : 0;
          return Math.abs(p.x - desiredX) + Math.abs(v.r - (4 + active.length % 2)) * 0.65 + spacing;
        };
        return cost(a) - cost(b);
      });
      const b = normals.shift();
      const power = POWERS[this.powerCursor++ % POWERS.length];
      active.push(this.grid.put(b.r, b.c, { type: "power", power }));
    }
  }
  progress() {
    // Replenish gaps near the ceiling in place. No surprise downward jump and
    // no reset of rescued pets, ground food, inventory, score or miss counter.
    if ([...this.grid.cells.values()].filter((b) => b.type === "normal").length < 36) {
      let added = 0;
      for (let r = 0; r < 6; r++) for (let c = 0; c < this.grid.width(r); c++) {
        if (!this.grid.get(r, c)) {
          this.grid.put(r, c, { type: "normal", color: this.randomColor(r, c) });
          added++;
        }
      }
      if (added) { this.refills++; this.emit("refill", { count: added }); }
    }
    const animalPresent = [...this.grid.cells.values()].some((b) => b.type === "animal");
    if (!animalPresent && this.introduced < ANIMALS.length && this.cleared >= this.nextUnlock)
      this.addFormation();
    this.ensurePowers();
  }
  addFormation() {
    // Hang an earned pet from existing supports. Never shift the board or add
    // full rows during an introduction; only two missed matches insert a row.
    const supports = [...this.grid.cells.values()].filter((b) => b.type === "normal")
      .sort((a, b) => b.r - a.r || Math.abs(a.c - 9.5) - Math.abs(b.c - 9.5));
    const support = supports.find((b) => this.grid.neighbors(b.r, b.c)
      .some(([r, c]) => r > b.r && !this.grid.get(r, c)));
    if (!support) return;
    const [r, c] = this.grid.neighbors(support.r, support.c)
      .find(([rr, cc]) => rr > support.r && !this.grid.get(rr, cc));
    if (this.grid.position(r, c).y - BOARD.radius <= BOARD.danger) return;
    const kindIndex = (this.level - 1 + this.introduced) % ANIMALS.length;
    this.grid.put(r, c, {
      type: "animal", kind: ANIMALS[kindIndex], name: NAMES[kindIndex],
    });
    this.introduced++;
    this.nextUnlock = this.cleared + this.config.between;
    this.emit("formation");
  }
  fire(path, color = this.current) {
    if (this.selected === "fire") {
      if (this.status !== "playing" || this.inventory.fire <= 0) return false;
      const removed = this.fireTargets(path);
      if (!removed.length) return false;
      this.inventory.fire--;
      this.selected = null;
      this.shots++;
      this.settle(removed, "fire");
      this.emit("power", { power: "fire" });
      this.progress();
      this.current = this.chooseColor();
      this.next = this.chooseColor(this.current);
      this.revision++;
      return true;
    }
    if (this.status !== "playing" || !path.cell || this.grid.get(...path.cell))
      return false;
    const wild = this.selected === "wild";
    if (this.selected && !wild) return false;
    if (wild && this.inventory.wild <= 0) return false;
    if (!Number.isInteger(color) || color < 0 || color >= this.colorCount) return false;
    if (wild) {
      this.inventory.wild--;
      this.selected = null;
    }
    const b = this.grid.put(...path.cell, { type: "normal", color });
    this.shots++;
    const matched = this.grid.group(
      b.r,
      b.c,
      (n) => n.type === "normal" && n.color === color,
    );
    if (matched.length >= 3) this.settle(matched);
    else if (!wild) {
      this.misses++;
      this.pendingMisses++;
      if (this.pendingMisses === 2) {
        this.addRandomRow();
        this.pendingMisses = 0;
        this.rows++;
        this.emit("row");
      } else this.emit("miss");
    }
    this.progress();
    if (this.status === "playing" && this.grid.danger()) {
      this.status = "lost";
      this.emit("lose");
    }
    this.current = this.next;
    this.next = this.chooseColor(this.current);
    if (!this.usefulColors().includes(this.current))
      this.current = this.chooseColor();
    this.swapped = false;
    this.revision++;
    return true;
  }
  // Breadth-first spread from the first collision; never jump an empty cell.
  // This is shared by the aiming preview and the shot's resolution.
  fireTargets(path) {
    const hit = [...this.grid.cells.values()].find(b => b.id === path?.hit);
    if (!hit) return [];
    const found = new Set([hit.id]), queue = [hit];
    for (let i = 0; i < queue.length && queue.length < 5; i++) {
      for (const [r, c] of this.grid.neighbors(queue[i].r, queue[i].c)) {
        const b = this.grid.get(r, c);
        if (b && !found.has(b.id)) {
          found.add(b.id);
          queue.push(b);
          if (queue.length === 5) break;
        }
      }
    }
    return queue;
  }
  grantPower(power) {
    if (power === "bomb" && this.bombsFull()) return false;
    this.inventory[power]++;
    return true;
  }
  bombsFull() { return this.inventory.bomb >= BOMB_CAP; }
  select(power) {
    if (
      this.status !== "playing" ||
      !POWERS.includes(power) ||
      this.inventory[power] <= 0
    )
      return false;
    this.selected = this.selected === power ? null : power;
    this.revision++;
    return true;
  }
  cancel() {
    this.selected = null;
    this.revision++;
  }
  use(r, c) {
    const power = this.selected;
    if (
      this.status !== "playing" ||
      !power ||
      power === "fire" ||
      power === "wild" ||
      this.inventory[power] <= 0
    )
      return false;
    const target = this.grid.get(r, c);
    if (!target) return false;
    if (power === "rainbow" && target.type !== "normal") return false;
    this.inventory[power]--;
    this.selected = null;
    let removed = [];
    const all = [...this.grid.cells.values()];
    if (power === "shuffle") {
      // Preserve the multiset, then guarantee a pair on the exposed frontier.
      const normals = all.filter((b) => b.type === "normal"),
        colors = normals.map((b) => b.color);
      for (let i = colors.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [colors[i], colors[j]] = [colors[j], colors[i]];
      }
      normals.forEach((b, i) => (b.color = colors[i]));
      const edge = normals.find((b) =>
        this.grid.neighbors(b.r, b.c).some(([r, c]) => !this.grid.get(r, c)),
      );
      const near =
        edge &&
        this.grid
          .neighbors(edge.r, edge.c)
          .map(([r, c]) => this.grid.get(r, c))
          .find((b) => b?.type === "normal");
      if (near && edge.color !== near.color) {
        const donor = normals.find(
          (b) => b !== edge && b !== near && b.color === edge.color,
        );
        if (donor) [near.color, donor.color] = [donor.color, near.color];
      }
    } else {
      const p = this.grid.position(r, c);
      removed = all.filter((b) => {
        if (power === "rainbow")
          return b.type === "normal" && b.color === target.color;
        if (power === "lightning")
          return (
            Math.abs(this.grid.position(b.r, b.c).x - p.x) <
            BOARD.diameter * 0.55
          );
        const q = this.grid.position(b.r, b.c);
        return (
          Math.hypot(q.x - p.x, q.y - p.y) < (power === "bomb" ? 1.15 : 0.62)
        );
      });
      this.settle(removed, power);
    }
    this.emit("power", { power });
    this.progress();
    this.current = this.chooseColor();
    this.next = this.chooseColor(this.current);
    this.revision++;
    return true;
  }
  snapshot() {
    return {
      level: this.level,
      phase: this.grid.phase,
      randomState: this.random.state,
      serial: this.grid.serial,
      cells: [...this.grid.cells.values()].map((b) => [
        b.r,
        b.c,
        b.type === "normal"
          ? b.color
          : b.type === "animal"
            ? `a:${b.kind}:${b.name}`
            : `p:${b.power}`,
        b.id,
      ]),
      status: this.status,
      score: this.score,
      cleared: this.cleared,
      popped: this.popped,
      detached: this.detached,
      shots: this.shots,
      misses: this.misses,
      pendingMisses: this.pendingMisses,
      rows: this.rows,
      rescued: this.rescued.map((a) => ({ ...a })),
      ground: this.ground.map((f) => ({ ...f })),
      gardenTime: this.gardenTime,
      introduced: this.introduced,
      powerCursor: this.powerCursor,
      refills: this.refills,
      nextUnlock: this.nextUnlock,
      inventory: { ...this.inventory },
      current: this.current,
      next: this.next,
      stars: this.stars ?? 0,
      revision: this.revision,
    };
  }
  restore(s) {
    this.begin(s.level);
    for (const k of [
      "status",
      "score",
      "cleared",
      "popped",
      "detached",
      "shots",
      "misses",
      "pendingMisses",
      "rows",
      "rescued",
      "introduced",
      "nextUnlock",
      "inventory",
      "current",
      "next",
      "stars",
      "revision",
    ])
      this[k] = s[k];
    this.rescued = s.rescued.map((a) => ({ ...a }));
    this.inventory = { ...s.inventory };
    this.inventory.bomb = Math.min(BOMB_CAP, this.inventory.bomb);
    this.ground = (s.ground ?? []).map((f) => ({ ...f }));
    this.gardenTime = s.gardenTime ?? 0;
    this.powerCursor = s.powerCursor ?? 0;
    this.refills = s.refills ?? 0;
    this.pendingMisses = s.pendingMisses ?? 0;
    this.random.state = s.randomState ?? this.random.state;
    this.grid.cells.clear();
    this.grid.phase = s.phase;
    this.grid.serial = s.serial;
    for (const [r, c, type, id] of s.cells) {
      const data =
        typeof type === "number"
          ? { type: "normal", color: type }
          : type.startsWith("a:")
            ? {
                type: "animal",
                kind: type.split(":")[1],
                name: type.split(":")[2],
              }
            : { type: "power", power: type.slice(2) };
      this.grid.put(r, c, { ...data, id });
    }
    this.events = [];
    ensureColors(this.colorCount);
    return this;
  }
}
