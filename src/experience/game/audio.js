export class GardenAudio {
  constructor(p0) {
    this.p0 = p0;
    this.music = true;
    this.sfx = true;
    this.active = false;
    this.cooldowns = new Map();this.breeze=null;this.decorativeTime=0;this.nextBird=18;
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
  play(name, time = 0, options = {}) {
    if (!this.active || !this.sfx || (this.cooldowns.get(name) ?? -1) > time)
      return;
    this.cooldowns.set(name, time + (options.cooldown??.12));
    this.p0.sound.play(this.p0.asset(`assets/${name}.wav`), {
      volume: options.volume ?? (name === "warning" ? 0.18 : 0.28),
      rate:options.rate??1,
    });
  }
  update(dt,playing){
    if(!this.active||!this.sfx||!playing)return;
    this.decorativeTime+=dt;
    if(this.breeze===null)this.breeze=this.p0.sound.play(this.p0.asset('assets/garden-breeze.wav'),{volume:.055,loop:true});
    if(this.decorativeTime>=this.nextBird){this.play('garden-chirp',this.decorativeTime,{volume:.09,cooldown:15});this.nextBird=this.decorativeTime+26;}
  }
  reset(){this.nextBird=this.decorativeTime+18;}
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
    if (!this.sfx){this.p0.sound.stopAll();this.breeze=null;}
  }
  dispose() {
    this.p0.music.stop();
    this.p0.sound.stopAll();
  }
}
