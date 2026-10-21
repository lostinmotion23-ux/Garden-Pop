// Decorative exterior motion only; the playable game has separate rules.
const actors=[
  {
    "node": "Mochi",
    "position": [
      -3.9,
      1.58,
      3.0
    ],
    "amplitude": 0.016
  },
  {
    "node": "Clementine",
    "position": [
      -2.5999999999999996,
      1.58,
      3.0
    ],
    "amplitude": 0.016
  },
  {
    "node": "Clover",
    "position": [
      -1.2999999999999998,
      1.58,
      3.0
    ],
    "amplitude": 0.016
  },
  {
    "node": "Pip",
    "position": [
      4.440892098500626e-16,
      1.58,
      3.0
    ],
    "amplitude": 0.016
  },
  {
    "node": "Fern",
    "position": [
      1.3000000000000003,
      1.58,
      3.0
    ],
    "amplitude": 0.016
  },
  {
    "node": "Maple",
    "position": [
      2.6,
      1.58,
      3.0
    ],
    "amplitude": 0.016
  },
  {
    "node": "Petal",
    "position": [
      3.900000000000001,
      1.58,
      3.0
    ],
    "amplitude": 0.016
  },
  {
    "node": "BubbleMochi",
    "position": [
      -2.25,
      4.72,
      -1.06
    ],
    "amplitude": 0.045
  },
  {
    "node": "BubbleClover",
    "position": [
      2.28,
      4.72,
      -1.04
    ],
    "amplitude": 0.045
  },
  {
    "node": "Butterflies",
    "position": [
      0,
      0,
      0
    ],
    "amplitude": 0.075
  }
];
export default function build(b){
 b.play("GardenIdle",{loop:true,at:b.time%8});
 let until=0,active=null;
 const react=(clip)=>{b.stop("GardenIdle",{fade:.1});if(active)b.stop(active,{fade:.1});active=clip;b.play(clip,{loop:false,fade:.1});until=b.time+1.6;};
 b.on("tap",()=>react("GardenShock"));b.on("enter",()=>react("GardenSmile"));b.on("leave",()=>react("GardenSad"));
 b.loop((dt,time)=>{
  if(active&&time>=until){b.stop(active,{fade:.15});active=null;b.play("GardenIdle",{loop:true,fade:.15,at:time%8});}
  actors.forEach((a,i)=>{const p=a.position;b.node(a.node,{position:[p[0],p[1]+Math.sin(time*.9+i)*a.amplitude,p[2]]});});
 });
}
