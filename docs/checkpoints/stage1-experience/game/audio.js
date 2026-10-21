export class GardenAudio {
  constructor(p0) {
    this.p0 = p0;
    this.music = true;
    this.sfx = true;
    this.active = false;
    this.cooldowns = new Map();
  }
  unlock() {
    if (this.active) return;
    this.active = true;
    if (this.music)
      this.p0.music.play(this.p0.asset("assets/garden-music.mp3"), {
        volume: 0.16,
        loop: true,
      });
  }
  play(name, time = 0) {
    if (!this.active || !this.sfx || (this.cooldowns.get(name) ?? -1) > time)
      return;
    this.cooldowns.set(name, time + 0.12);
    this.p0.sound.play(this.p0.asset(`assets/${name}.wav`), {
      volume: name === "warning" ? 0.18 : 0.28,
    });
  }
  toggleMusic() {
    this.music = !this.music;
    if (!this.music) this.p0.music.stop();
    else if (this.active)
      this.p0.music.play(this.p0.asset("assets/garden-music.mp3"), {
        volume: 0.16,
        loop: true,
      });
  }
  toggleSFX() {
    this.sfx = !this.sfx;
    if (!this.sfx) this.p0.sound.stopAll();
  }
  dispose() {
    this.p0.music.stop();
    this.p0.sound.stopAll();
  }
}
