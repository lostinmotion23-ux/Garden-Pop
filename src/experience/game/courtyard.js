import * as T from 'three';
import { rng } from './rules.js';
import { GARDEN_THEME as theme } from './garden-theme.js';
import { buildMeadow } from './meadow.js';
import { buildWoodland } from './woodland.js';

// The distant grove wraps around the full dome, with no image seam or empty
// horizon. Near stonework and water remain real geometry for depth/parallax.
export function buildCourtyard(art, scene) {
  const root = new T.Group(); root.name = 'EnclosedCourtyard'; scene.add(root);
  const random = rng(203157), geometries = [], materials = [];
  const own = g => (geometries.push(g), g);
  const box = own(new T.BoxGeometry(1, 1, 1));
  const rock = own(new T.IcosahedronGeometry(1, 1));
  const stone = art.mat(theme.stone, 'stone', .9).clone();
  stone.vertexColors = true; materials.push(stone);
  const moss = art.mat(theme.moss, 'botanical-ground', .95);
  const bronze = art.mat('#97825a', 'wood', .65);
  const glow = new T.MeshStandardMaterial({ color: theme.lantern, emissive: theme.lantern, emissiveIntensity: 1.8, roughness: .45 });
  materials.push(glow);
  const put = (geo, mat, p, scale) => {
    if (mat === stone) {
      geo = own(geo.clone());
      const colors = [], tint = .78 + random() * .26;
      for (let i = 0; i < geo.attributes.position.count; i++) {
        const shade = tint * (.94 + random() * .08); colors.push(shade, shade, shade * .98);
      }
      geo.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    }
    const m = new T.Mesh(geo, mat); m.position.set(...p); m.scale.set(...scale); root.add(m); return m;
  };

  // Rounded, finished terrace; each course stays below the existing pet floor.
  const terrace = own(new T.CylinderGeometry(1, 1, 1, 64));
  put(terrace, stone, [0, .36, -.7], [6.2, .43, 4.2]);
  put(terrace, moss, [0, .58, -.7], [6.06, .025, 4.07]);
  for (let row = 0; row < 8; row++) for (let col = 0; col < 15; col++) {
    const x = (col - 7) * .78 + (row % 2) * .39, z = 2.6 - row * .78;
    if (x * x / 34 + (z + .7) ** 2 / 15 > .94) continue;
    if(Math.abs(x-Math.sin((-.1-z)/.38*.37)*.63)>.7 && random()>.08)continue;
    const tile = put(box, stone, [x, .615, z], [.74, .045, .73]);
    tile.rotation.y = (random() - .5) * .035;
  }

  const fieldstones=Array.from({length:5},(_,kind)=>{
    const g=own(new T.SphereGeometry(1,6,4)),p=g.attributes.position;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
      const bump=1+.09*Math.sin(x*6+kind)*Math.cos(y*7-z*5)+.04*Math.sin(z*13+kind);
      p.setXYZ(i,x*bump+.035*y*y,y*bump,z*bump);
    }
    g.computeVertexNormals();return g;
  });
  let wallStoneCount=0;const wallExtents=[];
  // Fieldstones with staggered joints, varied heights and small gap fillers.
  // Wall radii, openings and overall heights are preserved.
  for (const [radius, base, height] of [[10.8, .5, .75], [19, .4, 2.15]]) {
    const rows=Math.ceil((height+.2)/.36),step=(height+.2)/rows,bottom=base-.16;
    wallExtents.push({radius,base,height});
    const coreMat=art.mat('#706b5c','stone',.96),start=Math.asin(8/radius);
    const core=own(new T.CylinderGeometry(radius-.12,radius-.12,height+.06,96,1,true,start,Math.PI*2-start*2));
    // Dark recessed bedding closes tiny joints and suggests contact occlusion.
    const coreMesh=new T.Mesh(core,coreMat);coreMat.side=T.DoubleSide;
    coreMesh.position.set(0,bottom+(height+.06)/2,-3);root.add(coreMesh);
    for(let row=0;row<rows;row++){
      let a=-Math.PI+(row%2)*.039;
      while(a<Math.PI){
        const width=.48+random()*.79,angle=a+width/radius*.5;
        a+=width/radius*.94;
        const x=Math.sin(angle)*radius,z=-3+Math.cos(angle)*radius;
        if(z>-4&&Math.abs(x)<8)continue;
        const stoneHeight=step*(.86+random()*.64),yy=bottom+step*(row+.5)+Math.sin(angle*radius*2.1+row*1.7)*step*.28;
        const b=put(fieldstones[(wallStoneCount++)%5],stone,[x,yy,z],[width*.55,stoneHeight*.55,.28+random()*.12]);
        b.rotation.set((random()-.5)*.14,angle+(random()-.5)*.1,(random()-.5)*.12);
        if(random()<.3){
          const f=put(fieldstones[2],stone,[Math.sin(a)*radius,yy+step*.43,-3+Math.cos(a)*radius],[.18,.10,.25]);f.rotation.y=angle;wallStoneCount++;
        }
        if(random()<.13){
          const patch=put(rock,moss,[x-Math.sin(angle)*.22,yy+stoneHeight*.38,z-Math.cos(angle)*.22],[width*.24,.055,.18]);patch.rotation.y=angle;
          if(random()<.28)for(let sprout=0;sprout<3;sprout++){
            const stem=put(rock,moss,[x+(sprout-1)*.055,yy+stoneHeight*.45+.08,z+.23],[.026,.11,.022]);stem.rotation.z=(sprout-1)*.35;
            put(rock,glow,[x+(sprout-1)*.055,yy+stoneHeight*.45+.18,z+.23],[.025,.022,.025]);
          }
        }
      }
    }
  }
  scene.userData.fieldstoneWall={stones:wallStoneCount,shapeVariants:fieldstones.length,extents:wallExtents};

  const pond = theme.pond;
  // Irregular stone banks conceal the water edge and give the pool a basin.
  for (let i = 0; i < 52; i++) {
    const a = i / 52 * Math.PI * 2, s = .3 + random() * .28;
    const x = pond.x + Math.cos(a) * pond.width, z = pond.z + Math.sin(a) * pond.depth;
    const b = put(rock, stone, [x, .5 + random() * .12, z], [s * 1.6, s * .7, s]);
    b.rotation.set(random(), random() * 6, random());
    if (i % 2 === 0) put(rock, moss, [x, .64, z], [s * 1.3, .09, s * .8]);
  }
  const waterGeo = own(new T.CircleGeometry(1, 64)); waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new T.MeshStandardMaterial({ color: pond.color, roughness: .24, metalness: .35,
    normalMap: art.textures['botanical-ground-normal'], normalScale: new T.Vector2(.12, .12) });
  const time = { value: 0 }; materials.push(waterMat);
  waterMat.onBeforeCompile = shader => {
    shader.uniforms.gardenWaterTime = time;
    shader.fragmentShader = 'uniform float gardenWaterTime;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', `
      #include <normal_fragment_maps>
      normal = normalize(normal + vec3(sin(vViewPosition.x*12.0+gardenWaterTime*.8)*.055,
        cos(vViewPosition.z*10.0-gardenWaterTime*.55)*.035, 0.0));`);
  };
  waterMat.customProgramCacheKey = () => 'courtyard-water-v1';
  const water = put(waterGeo, waterMat, [pond.x, .46, pond.z], [pond.width, 1, pond.depth]); water.name = 'GardenPond';

  // A short waterfall at the right bank; scrolling bands need no extra pass.
  for (let i = 0; i < 7; i++) {
    put(rock, stone, [4.5 + (random() - .5) * 1.4, .6 + i * .17, -10.7 - random() * .4], [.7, .4, .5]);
  }
  const fallMat = new T.MeshStandardMaterial({color: '#9bbabd', roughness: .3, metalness: .12,
    transparent: true, opacity: .7, depthWrite: false}); materials.push(fallMat);
  fallMat.onBeforeCompile = shader => {
    shader.uniforms.gardenWaterTime = time;
    shader.vertexShader = 'varying vec2 fallUv;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nfallUv=uv;');
    shader.fragmentShader = 'uniform float gardenWaterTime; varying vec2 fallUv;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      float strands=.65+.35*sin(fallUv.x*83.0+sin(fallUv.y*13.0-gardenWaterTime*3.0));
      diffuseColor.rgb *= .85+.15*sin(fallUv.y*42.0+gardenWaterTime*5.0);
      diffuseColor.a *= strands*smoothstep(0.0,.16,fallUv.x)*smoothstep(1.0,.84,fallUv.x);`);
  };
  const fall = put(own(new T.PlaneGeometry(.68, 1.15)), fallMat, [4.5, 1.02, -10.25], [1, 1, 1]); fall.name = 'GardenWaterfall';

  // Lanterns use emissive panes; no additional real-time lights.
  for (const [x, z] of [[-7, -6], [7, -6], [-6, -12], [1.8, -12.8], [8.2, -13]]) {
    put(box, stone, [x, .95, z], [.42, .8, .42]);
    put(box, glow, [x, 1.62, z], [.28, .44, .28]);
    for (const y of [1.37, 1.88]) put(box, bronze, [x, y, z], [.48, .07, .48]);
    for (const dx of [-.17, .17]) for (const dz of [-.17, .17]) put(box, bronze, [x + dx, 1.62, z + dz], [.035, .49, .035]);
    const roof = put(rock, stone, [x, 2, z], [.37, .15, .37]); roof.rotation.y = Math.PI / 4;
  }
  art.merge(root);

  const meadow=buildMeadow(art,scene),woodland=buildWoodland(art,scene);
  const skyGeo = own(new T.SphereGeometry(80, 32, 16));
  const skyMat = new T.ShaderMaterial({ side: T.BackSide, depthWrite: false,
    uniforms: { horizon: {value:new T.Color(theme.sky.horizon)}, zenith:{value:new T.Color(theme.sky.zenith)},
      grove:{value:new T.Color(theme.sky.grove)}, rotation:{value:theme.sky.rotation} },
    vertexShader: `varying vec3 direction; void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `varying vec3 direction; uniform vec3 horizon,zenith,grove; uniform float rotation;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
      float detail(vec2 p){return noise(p)*.55+noise(p*2.03)*.28+noise(p*4.09)*.17;}
      void main(){
        vec3 d=normalize(direction); float a=atan(d.x,d.z)+rotation;
        vec2 wrap=vec2(sin(a),cos(a));
        float sunset=pow(max(0.0,dot(wrap,normalize(vec2(.05,-1.0)))),10.0);
        vec3 color=mix(zenith,horizon,sunset*(1.0-smoothstep(.2,.85,d.y))*.85);
        float cloud=detail(wrap*5.0+vec2(d.y*2.0,d.y*19.0));
        color+=vec3(.08,.06,.065)*smoothstep(.5,.8,cloud)*smoothstep(.3,.7,d.y);
        gl_FragColor=vec4(color,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` });
  materials.push(skyMat);
  const sky = new T.Mesh(skyGeo, skyMat); sky.name = 'DuskGroveSky'; scene.add(sky);
  scene.background = new T.Color(theme.fog.color);
  scene.fog = new T.Fog(theme.fog.color, theme.fog.near, theme.fog.far);
  return {sky, root,meadow,woodland, update(dt){time.value += dt;meadow.update(dt);woodland.update(dt);}, dispose(){
    meadow.dispose();woodland.dispose();
    root.removeFromParent(); sky.removeFromParent(); geometries.forEach(g=>g.dispose()); materials.forEach(m=>m.dispose());
  }};
}
