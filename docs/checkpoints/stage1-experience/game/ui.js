import * as T from "three";
import {drawGardenHud,drawRescueJournal} from "./hud.js";
import { POWERS, POWER_NAMES, BOARD } from "./rules.js";
const INK = "#503b28",
  DARK = "#503b28";
const SHORT = ["Fire", "Color", "Mix", "Star", "Bomb", "Wild", "Bolt"];
const TIPS = [
  "Tap the row to clear.",
  "Tap a color to clear it.",
  "Tap the board to shuffle.",
  "Tap a small blast target.",
  "Tap a big blast target.",
  "Choose a color, then shoot.",
  "Tap the column to clear.",
];
const HELP = [
  "Match 3 or more touching bubbles of one color.",
  "Mouse: aim, then left-click. Touch: drag and release.",
  "Bounce shots off the sides. Right-click or tap Swap to exchange current and next colors.",
  "Every TWO missed matches add one full row. The first miss stays on the counter until the second.",
  "Bubbles attached to the ceiling must stay above the pink danger line.",
  "Clear bubbles to reveal one trapped critter. Drop its supports to rescue it.",
  "Three glowing skill bubbles stay on the board. Drop them to collect; select a skill, then tap its target.",
  "Unpopped fallen bubbles stay on the ground. Pets walk over and eat them; every 10 makes a Big Bomb.",
  "One continuous garden: rescuing a pet never ends the game. R restarts; P pauses. Esc leaves.",
];
export class GardenUI {
  constructor(p0, skillAtlas = null, portraitAtlas = null) {
    this.skillAtlas = skillAtlas;
    if (skillAtlas) {
      const upright = new OffscreenCanvas(1024, 512), ink = upright.getContext("2d");
      ink.translate(0, 512); ink.scale(1, -1); ink.drawImage(skillAtlas, 0, 0);
      this.skillAtlas = upright;
    }
    this.portraitAtlas = portraitAtlas;
    if (portraitAtlas) {
      const upright = new OffscreenCanvas(1024,512), ink=upright.getContext("2d");
      ink.translate(0,512);ink.scale(1,-1);ink.drawImage(portraitAtlas,0,0);this.portraitAtlas=upright;
    }
    this.rescueStarts=new Map();this.powerFeedback=new Map();this.journalPage=0;
    this.iconSlots=[];this.use3dIcons=false;
    this.p0 = p0;
    this.canvas = new OffscreenCanvas(1, 1);
    this.ctx = this.canvas.getContext("2d");
    this.texture = new T.CanvasTexture(this.canvas);
    this.texture.colorSpace = T.SRGBColorSpace;
    this.texture.minFilter = T.LinearFilter;
    this.texture.magFilter = T.LinearFilter;
    this.texture.generateMipmaps = false;
    this.material = new T.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    });
    this.mesh = new T.Mesh(new T.PlaneGeometry(1, 1), this.material);
    this.mesh.position.z = -0.5;
    this.mesh.renderOrder = 100;
    p0.camera.add(this.mesh);
    p0.scene.add(p0.camera);
    this.buttons = [];
    this.regions = [];
    this.hover = null;
    this.last = "";
    this.notice = "";
    this.noticeUntil = 0;
    this.helpPage = 0;
  }
  hit(x, y) {
    return [...this.buttons]
      .reverse()
      .find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
  }
  blocksAim(x, y) {
    return Boolean(this.hit(x,y) || this.regions.some(r => x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h));
  }
  toast(text, time) {
    this.notice = text;
    this.noticeUntil = time + 4;
    this.last = "";
  }
  panel(x, y, w, h) {
    this.regions.push({x,y,w,h});
    const c=this.ctx;c.save();c.shadowColor="#33251d55";c.shadowBlur=9;c.shadowOffsetY=4;
    c.beginPath();c.roundRect(x,y,w,h,12);
    const wood=c.createLinearGradient(x,y,x+w,y+h);wood.addColorStop(0,"#946d45");wood.addColorStop(1,"#543b2c");
    c.fillStyle=wood;c.fill();c.shadowBlur=0;c.shadowOffsetY=0;c.strokeStyle="#3d2d23";c.lineWidth=1.5;c.stroke();
    c.save();c.clip();c.strokeStyle="#e1bb7950";c.lineWidth=.65;
    for(let i=0;i<h/4;i++){c.beginPath();for(let j=0;j<=w;j+=12){const yy=y+i*4+Math.sin(j*.018+i)*1.1;if(j)c.lineTo(x+j,yy);else c.moveTo(x,yy);}c.stroke();}c.restore();
    const paper=c.createLinearGradient(0,y,0,y+h);paper.addColorStop(0,"#fff6e3");paper.addColorStop(1,"#ead9b9");
    c.fillStyle=paper;c.beginPath();c.roundRect(x+7,y+7,w-14,h-14,6);c.fill();
    c.strokeStyle="#c1a578";c.lineWidth=1;c.stroke();
    for(const xx of [x+4,x+w-4]){c.fillStyle="#c8a15e";c.beginPath();c.arc(xx,y+12,1.6,0,Math.PI*2);c.fill();}
    c.strokeStyle="#8c9d6b";c.lineWidth=1.2;c.beginPath();c.moveTo(x+w-27,y+16);c.quadraticCurveTo(x+w-19,y+20,x+w-14,y+28);c.stroke();
    for(let i=0;i<3;i++){c.fillStyle=i%2?"#b4bf91":"#98a575";c.beginPath();c.ellipse(x+w-25+i*4,y+17+i*4,4,1.6,.5,0,Math.PI*2);c.fill();}
    c.restore();
  }
  markRescue(kind,time){this.rescueStarts.set(kind,time);this.last="";}
  flashPower(kind,time){this.powerFeedback.set(kind,time+.55);this.last="";}
  resetPresentation(){this.notice="";this.noticeUntil=0;this.rescueStarts.clear();this.powerFeedback.clear();this.journalPage=0;this.last="";}
  font(size, weight = 700) {
    this.ctx.font = `${weight} ${Math.max(16, size)}px "Trebuchet MS", sans-serif`;
  }
  text(value, x, y, size = 20, color = INK, align = "left", weight = 700) {
    this.font(size, weight);
    const c = this.ctx;
    c.fillStyle = color;
    c.textAlign = align;
    c.textBaseline = "middle";
    c.fillText(String(value), x, y);
  }
  lines(value, width, size = 18) {
    this.font(size);
    const words = String(value).split(/\s+/),
      lines = [];
    let line = "";
    for (const word of words) {
      const next = line ? line + " " + word : word;
      if (line && this.ctx.measureText(next).width > width) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
    return lines;
  }
  paragraph(
    value,
    x,
    y,
    width,
    size = 18,
    color = INK,
    align = "left",
    lineHeight = size * 1.3,
  ) {
    const lines = this.lines(value, width, size);
    for (const line of lines) {
      this.text(line, x, y, size, color, align);
      y += lineHeight;
    }
    return y;
  }
  button(id, label, x, y, w, h, opts = {}) {
    this.buttons.push({ id, x, y, w, h, disabled: opts.disabled });
    const c = this.ctx;
    c.fillStyle = opts.selected
      ? "#d5be88"
      : opts.disabled
        ? "#ddd6c7"
        : this.hover === id
          ? "#d8dac4"
          : opts.secondary
            ? "#b9c3ac"
            : "#c9d1b5";
    c.beginPath();
    c.roundRect(x, y, w, h, 6);
    c.fill();
    c.lineWidth = opts.selected ? 3 : 1.3;
    c.strokeStyle = opts.flash ? "#cc9f4c" : opts.selected ? "#a9803f" : "#a58e65";
    c.stroke();
    const iconSize = opts.icon !== undefined && this.skillAtlas ? Math.min(opts.iconSize ?? 42, h - 10) : 0;
    if (iconSize) this.iconSlots.push({kind:POWERS[opts.icon],x:x+7+iconSize/2,y:y+h/2,size:iconSize,disabled:opts.disabled});
    if (iconSize && !this.use3dIcons) {
      c.save(); c.globalAlpha = opts.disabled ? 0.65 : 1;
      c.drawImage(this.skillAtlas, (opts.icon % 4) * 256,
        Math.floor(opts.icon / 4) * 256, 256, 256,
        x + 7, y + (h - iconSize) / 2, iconSize, iconSize);
      c.restore();
    }
    const labelX = x + w / 2 + (iconSize ? iconSize/2-3 : 0);
    const size = opts.font ?? 20,
      lines = this.lines(label, w - 16 - (iconSize ? 30 : 0), size),
      color = opts.disabled ? "#817562" : DARK;
    if (lines.length === 1)
      this.text(lines[0], labelX, y + h / 2, size, color, "center");
    else if (h >= size * 2.25) {
      this.text(
        lines[0],
        labelX,
        y + h / 2 - size * 0.55,
        size,
        color,
        "center",
      );
      this.text(
        lines.slice(1).join(" "),
        labelX,
        y + h / 2 + size * 0.55,
        size,
        color,
        "center",
      );
    } else this.text(label, labelX, y + h / 2, 16, color, "center");
  }
  draw(game, state, time) {
    const w = this.p0.width,
      h = this.p0.height,
      phone = w / h < 1.1,
      pixelScale = Math.min(Math.max(this.p0.pixelRatio || 1, 1), 2);
    this.time=time;
    const animated=[...this.rescueStarts.values()].some(t=>time-t<.8)||[...this.powerFeedback.values()].some(t=>t>time);
    const signature = JSON.stringify([
      w,
      h,
      pixelScale,
      game.revision,
      game.status,
      state.menu,
      state.audio.music,
      state.audio.sfx,
      state.selectedColor,
      this.hover,
      this.helpPage,
      this.journalPage,
      animated ? Math.floor(time*30) : 0,
      Math.floor(time * 0.8),
      this.noticeUntil > time ? this.notice : "",
      this.p0.table,
    ]);
    if (signature === this.last) return;
    this.last = signature;
    const cw = Math.round(w * pixelScale),
      ch = Math.round(h * pixelScale);
    if (this.canvas.width !== cw || this.canvas.height !== ch) {
      this.texture.dispose();
      this.canvas.width = cw;
      this.canvas.height = ch;
    }
    const c = this.ctx;
    c.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
    c.clearRect(0, 0, w, h);
    this.buttons = [];
    this.regions = [];
    this.iconSlots=[];
    this.phone = phone;
    const height = Math.tan(T.MathUtils.degToRad(this.p0.camera.fov / 2));
    this.mesh.scale.set((height * w) / h, height, 1);
    drawGardenHud(this,game,state,time,w,h,phone);
    // Place only a small label beside the next bubble; the shooting ball stays clear.
    if (!state.menu) {
      const p = this.p0.camera.position
        .clone()
        .set(0.67, BOARD.launcher - 0.2, BOARD.z)
        .project(this.p0.camera);
      this.text(
        "Next",
        ((p.x + 1) * w) / 2 + 24,
        ((1 - p.y) * h) / 2,
        16,
        DARK,
      );
    }
    if (this.notice && this.noticeUntil>time && !state.menu &&
      (phone ? h>=740 : !this.hudLayout.compact)) {
      const width=phone?Math.min(w-28,530):this.hudLayout.pw;
      const lines=this.lines(this.notice,width-22,16),hh=Math.min(3,lines.length)*20+12;
      const xx=phone?w/2-width/2:14,yy=phone?184:Math.min(h-hh-8,this.hudLayout.leftBottom+10);
      this.regions.push({x:xx,y:yy,w:width,h:hh});c.fillStyle="#fff6e9f2";
      c.beginPath();c.roundRect(xx,yy,width,hh,8);c.fill();
      lines.slice(0,3).forEach((line,i)=>this.text(line,xx+width/2,yy+16+i*20,16,DARK,"center"));
    }
    if (state.menu) this.modal(game, state, w, h);
    this.texture.needsUpdate = true;
  }
  modal(game, state, w, h) {
    this.buttons = [];
    this.regions = [];
    const c = this.ctx;
    c.fillStyle = "#44334e70";
    c.fillRect(0, 0, w, h);
    const menu = state.menu,
      mw = Math.min(w - 24, 620),
      mh = Math.min(
        h - 24,
        menu === "help"
          ? 690
          : menu === "main"
            ? 510
            : menu === "leaderboard"
              ? 570
              : 470,
      ),
      x = (w - mw) / 2,
      y = (h - mh) / 2,
      short = mh < 400;
    this.panel(x, y, mw, mh);
    const titles = {
      main: "Bubble Critter Garden",
      pause: "A little garden break",
      settings: "Garden sounds",
      journal: "Rescue journal",
      help: "How to play",
      leaderboard: "Weekly leaderboard",
      lost: "The garden is full!",
    };
    const titleSize = mw < 400 ? 24 : 28;
    this.text(
      titles[menu],
      w / 2,
      y + (short ? 30 : 40),
      titleSize,
      "#785b27",
      "center",
    );
    let line = y + (short ? 59 : 86);
    const bh = short ? 35 : 46,
      gap = short ? 9 : 12;
    const button = (id, label, secondary = false) => {
      this.button(id, label, x + 20, line, mw - 40, bh, {
        font: short ? 18 : 20,
        secondary,
      });
      line += bh + gap;
    };
    if (menu === "journal") {drawRescueJournal(this,game,this.time,x,y,mw,mh);return;}
    if (menu === "main") {
      if (!short) {
        this.paragraph(
          "Match pastels. Free critters. Grow joy.",
          w / 2,
          line,
          mw - 36,
          18,
          INK,
          "center",
          23,
        );
        line += 52;
      }
      button("play", "Play Garden");
      button("continue", "Continue Garden", true);
      button("help", "How to Play", true);
      button("settings", "Settings", true);
      button("leaderboard", "Weekly Leaderboard", true);
      if (!short)
        this.text(
          "One little friend at a time",
          w / 2,
          y + mh - 22,
          18,
          INK,
          "center",
        );
    }
    if (menu === "pause") {
      button("resume", "Resume");
      button("retry", "Restart Garden", true);
      button("settings", "Settings", true);
      button("main", "Main Menu", true);
      button("exit", "Exit Experience", true);
    }
    if (menu === "settings") {
      line =
        this.paragraph(
          "Separate controls for music and sound effects.",
          w / 2,
          line,
          mw - 40,
          18,
          INK,
          "center",
          24,
        ) + 20;
      button("music", `Music: ${state.audio.music ? "ON" : "OFF"}`);
      button("sfx", `Sound effects: ${state.audio.sfx ? "ON" : "OFF"}`);
      line += 10;
      button("back", "Back", true);
    }
    if (menu === "help") {
      const font = 18,
        lh = 25,
        capacity = Math.max(3, Math.floor((mh - (short ? 135 : 165)) / lh)),
        pages = [[]];
      let used = 0;
      for (const paragraph of HELP) {
        const lines = this.lines(paragraph, mw - 44, font);
        if (used && used + lines.length + 1 > capacity) {
          pages.push([]);
          used = 0;
        }
        pages.at(-1).push(...lines, "");
        used += lines.length + 1;
      }
      this.helpPage = Math.max(0, Math.min(this.helpPage, pages.length - 1));
      for (const text of pages[this.helpPage]) {
        this.text(text, x + 22, line, font, INK);
        line += lh;
      }
      const by = y + mh - 50,
        bw = (mw - 56) / 3;
      this.button("back", "Back", x + 16, by, bw, 36, {
        font: 18,
        secondary: true,
      });
      this.button("help-prev", "Previous", x + 28 + bw, by, bw, 36, {
        font: 16,
        disabled: this.helpPage === 0,
      });
      this.button("help-next", "Next", x + 40 + bw * 2, by, bw, 36, {
        font: 18,
        disabled: this.helpPage === pages.length - 1,
      });
      this.text(
        `${this.helpPage + 1}/${pages.length}`,
        w / 2,
        y + mh - 67,
        16,
        INK,
        "center",
      );
    }
    if (menu === "leaderboard") {
      const rows = this.p0.table || [];
      if (!rows.length)
        this.paragraph(
          "The garden is waiting for its first scores. Sign in to keep your weekly best.",
          w / 2,
          line,
          mw - 40,
          20,
          INK,
          "center",
          28,
        );
      else
        for (const [i, row] of rows
          .slice(0, Math.min(8, Math.floor((mh - 150) / 34)))
          .entries()) {
          this.text(
            `${i + 1}. ${String(row.name).slice(0, mw < 400 ? 14 : 24)}${row.you ? " (you)" : ""}`,
            x + 22,
            line,
            18,
            INK,
          );
          this.text(row.score, x + mw - 22, line, 18, "#785b27", "right");
          line += 34;
        }
      line = y + mh - 60;
      button("back", "Back", true);
    }
    if (menu === "lost") {
      this.text(
        `${game.score.toLocaleString()} garden points`,
        w / 2,
        line,
        22,
        INK,
        "center",
      );
      line += short ? 30 : 37;
      this.text(
        `${game.rescued.length} critters safe`,
        w / 2,
        line,
        20,
        INK,
        "center",
      );
      line += short ? 34 : 43;
      button("retry", "New Garden");
      button("main", "Main Menu", true);
    }
  }
  dispose() {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.texture.dispose();
  }
}
