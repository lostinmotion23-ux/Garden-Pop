"""Original Amira garden avatar. Explicit mesh surfaces, UVs, skin and glTF clips.

Authoring uses Project 0's coordinates directly: metres, +Y up, +Z forward.
No downloaded models, image billboards, hidden generators or game/lot mutations.
"""
import json
import math
import struct
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/avatar'
OUT.mkdir(parents=True, exist_ok=True)
TEXTURES = ROOT / '.local/avatar-textures'
TAU = math.tau

def unit(v):
    v = np.array(v, dtype=float)
    return v / max(1e-10, np.linalg.norm(v))

def bezier(points, count=12):
    a, b, c, d = map(np.array, points)
    return [tuple((1-t)**3*a + 3*(1-t)**2*t*b + 3*(1-t)*t*t*c + t**3*d)
            for t in np.linspace(0, 1, count)]

BONES = [
    ('Root', None, (0, 0, 0)), ('Hips', 'Root', (0, 1.0, 0)),
    ('Spine', 'Hips', (0, 1.14, 0)), ('Chest', 'Spine', (0, 1.32, 0)),
    ('Neck', 'Chest', (0, 1.43, 0)), ('Head', 'Neck', (0, 1.65, 0)),
    ('HairLeft', 'Head', (-.26, 1.69, 0)), ('HairRight', 'Head', (.26, 1.69, 0)),
    ('Skirt', 'Hips', (0, 1.00, 0)), ('Satchel', 'Hips', (.28, .93, .19)),
]
for side, s in [('Left', -1), ('Right', 1)]:
    BONES += [(f'UpperArm{side}', 'Chest', (s*.22, 1.33, 0)),
              (f'Forearm{side}', f'UpperArm{side}', (s*.38, 1.10, .02)),
              (f'Hand{side}', f'Forearm{side}', (s*.48, .87, .065)),
              (f'Thigh{side}', 'Hips', (s*.13, .76, 0)),
              (f'Shin{side}', f'Thigh{side}', (s*.13, .43, 0)),
              (f'Foot{side}', f'Shin{side}', (s*.13, .16, .015))]
BI = {n: i for i, (n, _, _) in enumerate(BONES)}
BP = {n: np.array(p) for n, _, p in BONES}

class Sculpt:
    def __init__(self, lod=0):
        self.lod = lod
        self.v, self.uv, self.faces, self.weights, self.tags = [], [], [], [], []
    def seg(self, n, minimum=5):
        return max(minimum if not self.lod else min(minimum, 3), round(n * (.28 if self.lod else .75)))
    def vertex(self, p, uv, tile, bone, tag=''):
        self.v.append(tuple(p))
        self.uv.append(((tile % 4 + .025 + .95 * uv[0]) / 4,
                        (tile // 4 + .025 + .95 * uv[1]) / 4))
        self.weights.append({bone: 1} if isinstance(bone, str) else bone.copy())
        self.tags.append(tag)
        return len(self.v)-1
    def surface(self, nu, nv, fn, tile, bone, tag='', closed=False):
        start = len(self.v)
        for j in range(nv+1):
            for i in range(nu+1):
                u, v = i/nu, j/nv
                p = fn(u, v)
                self.vertex(p, (u, v), tile, bone(p) if callable(bone) else bone, tag)
        for j in range(nv):
            for i in range(nu):
                a = start + j*(nu+1)+i
                self.faces += [(a, a+1, a+nu+1), (a+1, a+nu+2, a+nu+1)]
    def ell(self, p, size, tile, bone, tag='', seg=16, rings=10, deform=None):
        def fn(u, v):
            a, t = u*TAU, v*math.pi
            q = np.array((math.sin(t)*math.cos(a), math.cos(t), math.sin(t)*math.sin(a)))
            if deform:
                q = np.array(deform(q))
            return np.array(p) + q*np.array(size)
        self.surface(self.seg(seg), self.seg(rings, 4), fn, tile, bone, tag)
    def tube(self, pts, radii, tile, bone, tag='', sides=10, oval=1):
        pts = [np.array(p) for p in pts]
        sides = self.seg(sides)
        radii = radii if isinstance(radii, (tuple, list, np.ndarray)) else [radii]*len(pts)
        start = len(self.v)
        for i, p in enumerate(pts):
            t = unit(pts[min(i+1, len(pts)-1)] - pts[max(0, i-1)])
            a = np.cross(t, (0, 0, 1))
            if np.linalg.norm(a) < .1:
                a = np.cross(t, (0, 1, 0))
            a = unit(a)
            b = unit(np.cross(t, a))
            for j in range(sides+1):
                angle = j*TAU/sides
                q = p + radii[i]*(a*math.cos(angle) + b*math.sin(angle)*oval)
                self.vertex(q, (j/sides, i/(len(pts)-1)), tile, bone(q) if callable(bone) else bone, tag)
        for i in range(len(pts)-1):
            for j in range(sides):
                a = start+i*(sides+1)+j
                self.faces += [(a, a+1, a+sides+1), (a+1, a+sides+2, a+sides+1)]
        # Close both ends so hands, hair strands, seams and boots have no holes.
        for i, p in [(0, pts[0]), (len(pts)-1, pts[-1])]:
            center = self.vertex(p, (.5, i/(len(pts)-1)), tile, bone(p) if callable(bone) else bone, tag)
            for j in range(sides):
                a = start+i*(sides+1)+j
                self.faces.append((center, a+1, a) if i == 0 else (center, a, a+1))
    def profile(self, rows, tile, bone, seg=32, folds=0):
        start = len(self.v)
        n = self.seg(seg)
        for j, (y, rx, rz) in enumerate(rows):
            for i in range(n+1):
                a = i*TAU/n
                f = 1 + folds*math.cos(a*12)*(1-j/(len(rows)-1))
                p = (rx*math.sin(a)*f, y, rz*math.cos(a)*f)
                self.vertex(p, (i/n, j/(len(rows)-1)), tile, bone(p) if callable(bone) else bone)
        for j in range(len(rows)-1):
            for i in range(n):
                a = start+j*(n+1)+i
                self.faces += [(a, a+1, a+n+1), (a+1, a+n+2, a+n+1)]
    def facez(self, x, y):
        qy=(y-1.655)/.305
        sx=1-.10*max(0,-qy)+.025*math.exp(-((qy+.25)/.28)**2)
        return .237*math.sqrt(max(.035, 1-(x/(.282*sx))**2-qy**2))
    def build(self):
        # Soft jaw, fuller cheeks, real neck and a connected swept knit torso.
        self.ell((0, 1.655, 0), (.282, .305, .237), 0, 'Head', seg=40, rings=28,
                 deform=lambda q: (q[0]*(1-.10*max(0, -q[1])+.025*math.exp(-((q[1]+.25)/.28)**2)), q[1], q[2]))
        self.ell((0, 1.424, 0), (.074, .12, .072), 0, {'Neck': .7, 'Chest': .3})
        torso = lambda p: {'Hips': max(0, min(1, (1.23-p[1])/.22)),
                           'Chest': 1-max(0, min(1, (1.23-p[1])/.22))}
        self.profile([(.96,.195,.127),(1.00,.205,.142),(1.12,.215,.146),
                      (1.24,.221,.145),(1.32,.227,.131),(1.37,.18,.113),
                      (1.41,.083,.075)], 2, torso)
        # Ribbed collar, hem, and a tiny daisy necklace.
        for y, rx, rz, tile in [(1.411,.085,.078,10),(.98,.205,.143,10)]:
            pts = [(math.sin(a)*rx, y, math.cos(a)*rz) for a in np.linspace(0, TAU, 49)]
            self.tube(pts, .017, tile, 'Chest' if y > 1.3 else 'Hips', sides=8)
        # Pinafore bodice and two straps over the shoulders, with round gold buttons.
        self.profile([(1.005,.211,.153),(1.15,.218,.158),(1.25,.195,.157)], 3, torso)
        for s in (-1, 1):
            pts = bezier([(s*.15,1.04,.164),(s*.17,1.51,.18),(s*.17,1.51,-.18),(s*.15,1.03,-.151)], self.seg(20,10))
            self.tube(pts, .026, 3, 'Chest', oval=.48, sides=8)
            self.ell((s*.151,1.253,.181),(.018,.018,.007),11,'Chest',seg=10,rings=6)
        self.profile([(.61,.331,.223),(.625,.335,.225),(.70,.31,.213),(.82,.278,.19),
                      (.94,.235,.165),(1.025,.207,.15)], 3, 'Skirt', seg=48, folds=.045)
        # Stitched hem is dimensional; the reverse of the dress is fully modeled.
        hem = [(math.sin(a)*.332*(1+.045*math.cos(a*12)), .618,
                math.cos(a)*.224*(1+.045*math.cos(a*12))) for a in np.linspace(0,TAU,73)]
        self.tube(hem,.009,10,'Skirt',sides=6)
        belt=[(math.sin(a)*.218,1.016,math.cos(a)*.161) for a in np.linspace(0,TAU,49)]
        self.tube(belt,.012,10,'Hips',sides=8)
        for side, s in [('Left',-1),('Right',1)]:
            arm, fore, hand = f'UpperArm{side}', f'Forearm{side}', f'Hand{side}'
            def armweights(p, arm=arm, fore=fore):
                t = max(0,min(1,(1.15-p[1])/.12))
                return {arm:1-t,fore:t}
            pts = bezier([(s*.215,1.325,0),(s*.33,1.28,0),(s*.40,1.06,.025),(s*.475,.899,.06)],self.seg(18,10))
            radii = [.073+.022*math.sin(i*math.pi/(len(pts)-1))-.020*(i/(len(pts)-1)) for i in range(len(pts))]
            self.tube(pts,radii,2,armweights,sides=16,oval=1.04)
            self.tube([(s*.465,.933,.053),(s*.48,.889,.062)], [.063,.059],10,fore,sides=16)
            self.ell((s*.489,.843,.070),(.050,.065,.033),0,hand,seg=14,rings=10)
            for f in range(4):
                xx=s*(.461+f*.018)
                pts=bezier([(xx,.831,.079),(xx+s*.004,.798,.088),(xx+s*.003,.773,.098),(xx-s*.001,.780,.109)],self.seg(7,4))
                self.tube(pts,[.011,.012,.010,.008] if len(pts)==4 else np.linspace(.012,.007,len(pts)),0,hand,sides=7)
            self.tube(bezier([(s*.459,.859,.082),(s*.429,.851,.094),(s*.431,.813,.107),(s*.446,.815,.111)],self.seg(7,4)),.014,0,hand,sides=8)
            # Tights, formed knees and ankles. Smooth weights across the knee.
            thigh, shin, foot = f'Thigh{side}',f'Shin{side}',f'Foot{side}'
            def legweights(p, thigh=thigh, shin=shin):
                t=max(0,min(1,(.49-p[1])/.12))
                return {thigh:1-t,shin:t}
            self.tube([(s*.13,.74,0),(s*.13,.62,.0),(s*.13,.49,.005),
                       (s*.13,.43,.009),(s*.13,.33,.005),(s*.13,.17,.01)],
                      [.088,.081,.066,.065,.059,.047],14,legweights,sides=16,oval=.94)
            self.ell((s*.13,.036,.075),(.106,.028,.181),13,foot,seg=24,rings=10)
            bootrows=[(.050,.103,.174,.075),(.075,.105,.178,.075),(.115,.103,.170,.072),
                      (.145,.095,.145,.051),(.175,.080,.106,.022),(.205,.069,.079,.003),
                      (.244,.068,.073,.006),(.255,.069,.073,.006)]
            def boot(u,v,s=s):
                y,rx,rz,zc=bootrows[round(v*(len(bootrows)-1))]
                return s*.13+rx*math.sin(u*TAU),y,zc+rz*math.cos(u*TAU)
            self.surface(self.seg(28),len(bootrows)-1,boot,4,foot)
            self.tube([(s*.13,.244,.006),(s*.13,.261,.006)],[.074,.072],10,foot,sides=20)
            for yy,zz in [(.175,.127),(.205,.086),(.233,.083)]:
                self.tube([(s*.13-.035,yy,zz-.01),(s*.13,yy+.008,zz),(s*.13+.035,yy,zz-.01)],.0045,10,foot,sides=5)
            # Ears have an outer helix and a softly recessed inner bowl.
            self.ell((s*.270,1.632,.003),(.050,.079,.046),0,'Head',seg=14,rings=10)
            self.ell((s*.291,1.636,.033),(.021,.044,.019),8,'Head',seg=10,rings=7)
            self.ell((s*.287,1.58,.024),(.013,.020,.012),11,'Head',seg=9,rings=6)
        # Large fitted eye caps: the whites/irises sit on curved 3D surfaces.
        for s in (-1,1):
            ex, ey=s*.114,1.676
            def eye(u,v,ex=ex,ey=ey):
                x,y=ex+(u-.5)*.150,ey+(.5-v)*.170
                r=((u-.5)*2)**2+((v-.5)*2)**2
                return x,y,self.facez(x,y)+.011+.026*max(0,1-r)
            # Elliptical polar caps have proper iris UVs and no rectangular edges.
            start=len(self.v);nr=self.seg(6,3);ns=self.seg(28,14)
            for j in range(nr+1):
                r=j/nr
                for i in range(ns+1):
                    a=i*TAU/ns;u=.5+.5*r*math.cos(a);v=.5+.5*r*math.sin(a)
                    self.vertex(eye(u,v),(u,v),7,'Head',f'eye{s}')
            for j in range(nr):
                for i in range(ns):
                    a=start+j*(ns+1)+i
                    self.faces += [(a,a+1,a+ns+1),(a+1,a+ns+2,a+ns+1)]
            # Upper eyeliner, lower lid and three individual lashes at each corner.
            for upper in (True,False):
                pts=[]
                for a in np.linspace(0,math.pi,self.seg(15,8)):
                    x=ex+math.cos(a)*.075;y=ey+math.sin(a)*(.085 if upper else -.080)
                    pts.append((x,y,self.facez(x,y)+.014))
                self.tube(pts,.006 if upper else .0028,6 if upper else 12,'Head',f'eye{s}',sides=6)
            for i in range(3 if not self.lod else 2):
                x=ex+s*(.060-i*.010);y=ey+.047+i*.012
                self.tube([(x,y,self.facez(x,y)+.018),(x+s*.018,y+.025,self.facez(x,y)+.024)],.0045,6,'Head',f'eye{s}',sides=5)
            brow=[]
            for t in np.linspace(0,1,self.seg(14,7)):
                x=ex+(t-.5)*.135;y=1.799+.012*math.sin(t*math.pi)
                brow.append((x,y,self.facez(x,y)+.014))
            self.tube(brow,.0045,1,'Head',f'brow{s}',sides=7)
            # Blush patches conform to the cheeks instead of floating stickers.
            def cheek(u,v,s=s):
                x=s*.177+(u-.5)*.10;y=1.570+(v-.5)*.057
                return x,y,self.facez(x,y)+.004
            self.surface(self.seg(10,5),self.seg(6,3),cheek,8,'Head')
        self.ell((0,1.589,.239),(.023,.024,.023),0,'Head',seg=16,rings=12)
        self.ell((0,1.584,.256),(.025,.013,.013),8,'Head',seg=12,rings=7)
        mouth=[]
        for t in np.linspace(-1,1,self.seg(21,11)):
            x=t*.054;y=1.520+.025*t*t
            mouth.append((x,y,self.facez(x,y)+.009))
        self.tube(mouth,.005,12,'Head','mouth',sides=7)
        self.tube([(-.022,1.509,.213),(0,1.505,.216),(.022,1.509,.213)],.005,9,'Head','lip',sides=7)
        # Hair cap: front hairline, sides, and lowered nape are separate in profile.
        def cap(u,v):
            a=u*TAU;front=(math.cos(a)+1)*.5
            end=2.25-1.24*front**2
            t=.005+(end-.005)*v
            return (.295*math.sin(t)*math.sin(a),1.665+.327*math.cos(t),
                    .259*math.sin(t)*math.cos(a)-.012)
        self.surface(self.seg(64,24),self.seg(16,8),lambda u,v:cap(1-u,v),1,'Head')
        # Flowing locks are closed oval sweeps with tapered ends and real depth.
        for i in range(17):
            a=.91+(TAU-1.82)*i/16
            x,z=.265*math.sin(a),.222*math.cos(a)-.016
            pts=[];count=self.seg(15,8)
            for j,t in enumerate(np.linspace(0,1,count)):
                xx=x*(.68+.45*t)+.026*math.sin(t*TAU*1.1+i*.8)*t
                yy=1.90-(.65+.07*math.cos(i*1.7))*t
                zz=z*(.67+.55*t)+.024*math.sin(t*TAU+i*.7)*t
                pts.append((xx,yy,zz))
            radii=[.054*(.58+.66*math.sin(t*math.pi))*(1-.82*t**5) for t in np.linspace(0,1,count)]
            bone='Head' if abs(x)<.15 else ('HairLeft' if x<0 else 'HairRight')
            self.tube(pts,radii,1 if i%3 else 15,bone,sides=10,oval=.71)
        # Side-swept bangs have individually shaped curved strands.
        for i in range(7):
            t=i/6
            pts=bezier([(-.075+t*.028,1.969-t*.012,.086),(.04+t*.065,1.965,.245),
                        (.19+t*.045,1.87,.25),(.24+t*.025,1.754-t*.035,.168)],self.seg(14,8))
            pts=[(x,y,self.facez(x,y)+.025+.008*math.sin(j*math.pi/(len(pts)-1)))
                 for j,(x,y,_) in enumerate(pts)]
            radii=[.030*(.4+.6*math.sin(a*math.pi))*(1-.9*a**6) for a in np.linspace(0,1,len(pts))]
            self.tube(pts,radii,1 if i%2 else 15,'Head',sides=9,oval=.60)
        for s in (-1,1):
            for i in range(3):
                pts=bezier([(s*(.22+i*.016),1.84-i*.025,.16),
                            (s*(.29+i*.01),1.68,.22),(s*(.27+i*.026),1.46,.19),
                            (s*(.31+i*.018),1.29+i*.03,.055)],self.seg(16,8))
                self.tube(pts,[.036*(1-.92*t**4) for t in np.linspace(0,1,len(pts))],
                          1 if i%2 else 15,'HairLeft' if s<0 else 'HairRight',sides=10,oval=.70)
        # A real bow and daisy clip, with loops visible from both sides.
        for s in (-1,1):
            self.ell((-.254+s*.041,1.824,.159),(.052,.033,.023),9,'Head',seg=14,rings=8,
                     deform=lambda q,s=s:(q[0],q[1]+s*q[0]*.25,q[2]))
        self.ell((-.254,1.824,.185),(.019,.022,.016),9,'Head',seg=10,rings=6)
        for j in range(5):
            a=j*TAU/5
            self.ell((-.254+math.cos(a)*.024,1.824+math.sin(a)*.024,.202),(.017,.015,.009),14,'Head',seg=9,rings=6)
        self.ell((-.254,1.824,.212),(.011,.011,.008),11,'Head',seg=9,rings=6)
        # Crossbody woven satchel, flap, piping, buckle and adjustable strap.
        strap=bezier([(-.175,1.373,.092),(-.095,1.19,.185),(.18,1.12,.188),(.30,.965,.19)],self.seg(24,12))
        self.tube(strap,.014,4,torso,sides=7,oval=.48)
        backstrap=bezier([(-.175,1.373,.092),(-.18,1.40,-.13),(.34,1.08,-.18),(.31,.94,.14)],self.seg(24,12))
        self.tube(backstrap,.014,4,torso,sides=7,oval=.48)
        self.ell((.277,.921,.183),(.127,.115,.061),5,'Satchel',seg=24,rings=14,
                 deform=lambda q:(math.copysign(abs(q[0])**.65,q[0]),math.copysign(abs(q[1])**.65,q[1]),q[2]))
        self.ell((.277,.960,.231),(.120,.064,.022),5,'Satchel',seg=20,rings=10)
        self.tube([(.270,.969,.251),(.270,.911,.251)],.012,4,'Satchel',sides=7)
        self.ell((.277,.924,.263),(.020,.018,.006),11,'Satchel',seg=10,rings=6)
        # Embroidered flower on the bag's front.
        for j in range(5):
            a=j*TAU/5
            self.ell((.220+math.cos(a)*.013,.936+math.sin(a)*.013,.247),(.009,.008,.004),14,'Satchel',seg=7,rings=5)
        self.ell((.220,.936,.254),(.006,.006,.003),11,'Satchel',seg=7,rings=5)
        return self

class GLB:
    def __init__(self):
        self.binary=bytearray()
        self.doc={'asset':{'version':'2.0','generator':'Garden Pop original mesh authoring'},
                  'scene':0,'scenes':[{'nodes':[0]}],'nodes':[],
                  'bufferViews':[],'accessors':[],'meshes':[],'skins':[],
                  'materials':[],'textures':[],'images':[],
                  'samplers':[{'magFilter':9729,'minFilter':9987,'wrapS':33071,'wrapT':33071}]}
    def blob(self,data,target=None):
        self.binary += b'\0' * (-len(self.binary)%4)
        view={'buffer':0,'byteOffset':len(self.binary),'byteLength':len(data)}
        if target: view['target']=target
        self.binary.extend(data)
        self.doc['bufferViews'].append(view)
        return len(self.doc['bufferViews'])-1
    def accessor(self,data,kind,component=5126,target=None,bounds=False):
        dtype={5126:'<f4',5123:'<u2',5121:'u1',5125:'<u4'}[component]
        a=np.array(data,dtype=dtype)
        n={'bufferView':self.blob(a.tobytes(),target),'componentType':component,
           'count':len(a),'type':kind}
        if bounds:
            n['min']=a.min(axis=0).tolist();n['max']=a.max(axis=0).tolist()
        self.doc['accessors'].append(n)
        return len(self.doc['accessors'])-1
    def save(self,path):
        self.doc['buffers']=[{'byteLength':len(self.binary)}]
        data=json.dumps(self.doc,separators=(',',':')).encode()
        data+=b' '*(-len(data)%4)
        self.binary+=b'\0'*(-len(self.binary)%4)
        path.write_bytes(struct.pack('<III',0x46546C67,2,28+len(data)+len(self.binary))+
                         struct.pack('<II',len(data),0x4E4F534A)+data+
                         struct.pack('<II',len(self.binary),0x004E4942)+self.binary)

def quat(x=0,y=0,z=0):
    # XYZ Euler quaternion, local axes are the same Y-up axes as the mesh.
    cx,sx=math.cos(x/2),math.sin(x/2)
    cy,sy=math.cos(y/2),math.sin(y/2)
    cz,sz=math.cos(z/2),math.sin(z/2)
    return (sx*cy*cz+cx*sy*sz,cx*sy*cz-sx*cy*sz,cx*cy*sz+sx*sy*cz,cx*cy*cz-sx*sy*sz)

def add_clips(g):
    g.doc['animations']=[]
    specs=[('idle',4),('fly',1.6),('fly_fast',.9),('ascend',1.6),('descend',1.6),
           ('joy',2.2),('approval',2.4),('sadness',2.8),('indignation',2.4),
           ('blink',.26),('look_around',3.6)]
    for name,duration in specs:
        times=np.linspace(0,duration,33 if name!='blink' else 7)
        clip={'name':name,'samplers':[],'channels':[]}
        tacc=g.accessor(times,'SCALAR',bounds=True)
        def channel(node,path,values,kind):
            si=len(clip['samplers'])
            clip['samplers'].append({'input':tacc,'output':g.accessor(values,kind),'interpolation':'LINEAR'})
            clip['channels'].append({'sampler':si,'target':{'node':node,'path':path}})
        if name!='blink':
            for n,_,_ in BONES:
                vals=[]
                for t in times:
                    phase=t/duration*TAU;wave=math.sin(phase)
                    envelope=math.sin(math.pi*t/duration)**2
                    x=y=z=0
                    if n=='Spine':x=.009*wave
                    if n=='Chest':z=.008*math.sin(phase+.6)
                    if n=='Head':y=.022*wave;z=.014*math.sin(phase+.6)
                    if n.startswith('Hair'):z=(1 if n.endswith('Right') else -1)*.035*wave
                    if n=='Satchel':z=.018*wave
                    if n=='Skirt':x=.009*wave
                    s=1 if n.endswith('Right') else -1
                    if name in ('fly','fly_fast','ascend','descend'):
                        speed=1.6 if name=='fly_fast' else 1
                        if n=='Spine':x=.13*speed
                        if n.startswith('UpperArm'):z=s*(.42+.05*wave);x=-.14
                        if n.startswith('Forearm'):x=-.16+.05*wave
                        if n.startswith('Thigh'):x=.12*speed+s*.05*wave
                        if n.startswith('Shin'):x=.18*speed+.06*wave
                        if n.startswith('Foot'):x=-.12
                        if n.startswith('Hair'):x=.1*speed+.045*wave
                        if n=='Skirt':x=.045*speed
                        if n=='Head':x=-.08*speed
                        if name=='ascend' and n=='Spine':x=-.09
                        if name=='descend' and n=='Spine':x=.29
                    if name=='joy':
                        if n.startswith('UpperArm'):z=s*1.75*envelope
                        if n.startswith('Forearm'):z=s*.30*envelope
                        if n=='Head':z=.12*wave*envelope
                        if n.startswith('Shin'):x=.25*envelope
                    if name=='approval':
                        if n=='UpperArmRight':z=1.85*envelope;x=-.15*envelope
                        if n=='ForearmRight':z=(.28+.26*math.sin(phase*3))*envelope
                        if n=='HandRight':z=.12*math.sin(phase*4)*envelope
                        if n=='Head':x=.11*math.sin(phase*2)*envelope
                    if name=='sadness':
                        if n=='Spine':x=.10*envelope
                        if n=='Head':x=.24*envelope
                        if n.startswith('UpperArm'):z=-s*.10*envelope
                        if n.startswith('Hair'):x=.08*envelope
                    if name=='indignation':
                        if n.startswith('UpperArm'):z=s*.20*envelope
                        if n.startswith('Forearm'):x=-1.0*envelope;z=-s*.16*envelope
                        if n=='Head':y=.12*math.sin(phase*2)*envelope
                        if n=='ThighRight':x=-.18*math.sin(phase*2)*envelope
                        if n=='ShinRight':x=.18*envelope
                    if name=='look_around' and n=='Head':y=.32*math.sin(phase)*envelope
                    vals.append(quat(x,y,z))
                channel(1+BI[n],'rotation',vals,'VEC4')
            lifts=[]
            for t in times:
                phase=t/duration*TAU
                lift=.010*math.sin(phase)
                if name=='joy':lift+=.12*math.sin(math.pi*t/duration)**2
                lifts.append((0,lift,0))
            channel(1+BI['Root'],'translation',lifts,'VEC3')
        morph=[]
        for t in times:
            p=t/duration;envelope=math.sin(math.pi*p)**2
            blink=math.sin(math.pi*p)**2 if name=='blink' else 0
            smile=envelope if name in ('joy','approval') else 0
            sad=envelope if name=='sadness' else 0
            morph.extend((blink,smile,sad))
        channel(len(BONES)+1,'weights',morph,'SCALAR')
        g.doc['animations'].append(clip)

def export(lod):
    s=Sculpt(lod).build();g=GLB();d=g.doc
    d['nodes']=[{'name':'Amira Garden Muse','children':[1,len(BONES)+1]}]
    for i,(name,parent,p) in enumerate(BONES):
        pos=np.array(p)-(BP[parent] if parent else np.zeros(3))
        node={'name':name,'translation':pos.tolist()}
        children=[1+j for j,(_,pa,_) in enumerate(BONES) if pa==name]
        if children:node['children']=children
        d['nodes'].append(node)
    d['nodes'].append({'name':'Amira Textured Character','mesh':0,'skin':0,'weights':[0,0,0]})
    for name in ('base','normal','orm'):
        path=TEXTURES/f'{name}{"-lod1" if lod else ""}.png'
        d['images'].append({'name':f'Garden {name}','mimeType':'image/png','bufferView':g.blob(path.read_bytes())})
        d['textures'].append({'source':len(d['images'])-1,'sampler':0})
    d['materials']=[{'name':'Garden Atelier','pbrMetallicRoughness':{
        'baseColorFactor':[1,1,1,1],'baseColorTexture':{'index':0},
        'roughnessFactor':1,'metallicFactor':1,'metallicRoughnessTexture':{'index':2}},
        'normalTexture':{'index':1,'scale':.65},'occlusionTexture':{'index':2,'strength':.2},
        'doubleSided':False}]
    v=np.array(s.v);faces=np.array(s.faces,dtype=int)
    # Standard outward normals, welded at UV seams by exact position.
    normals=np.zeros_like(v)
    for a,b,c in faces:
        cross=np.cross(v[b]-v[a],v[c]-v[a])
        normals[a]+=cross;normals[b]+=cross;normals[c]+=cross
    weld={}
    for i,p in enumerate(v):
        k=tuple(np.round(p,7));weld[k]=weld.get(k,np.zeros(3))+normals[i]
    for i,p in enumerate(v):normals[i]=unit(weld[tuple(np.round(p,7))])
    joints=[];weights=[]
    for w in s.weights:
        items=[(BI[n],a) for n,a in w.items() if a>1e-8];items.sort(key=lambda q:-q[1]);items=items[:4]
        total=sum(a for _,a in items)
        joints.append([i for i,_ in items]+[0]*(4-len(items)))
        weights.append([a/total for _,a in items]+[0]*(4-len(items)))
    attrs={'POSITION':g.accessor(v,'VEC3',target=34962,bounds=True),
           'NORMAL':g.accessor(normals,'VEC3',target=34962),
           'TEXCOORD_0':g.accessor(s.uv,'VEC2',target=34962),
           'JOINTS_0':g.accessor(joints,'VEC4',5121,target=34962),
           'WEIGHTS_0':g.accessor(weights,'VEC4',target=34962)}
    if hasattr(s,'colors'):
        attrs['COLOR_0']=g.accessor(s.colors,'VEC4',target=34962)
    targets=[]
    for pose in ('Blink','Smile','Sad'):
        delta=np.zeros_like(v)
        for i,(p,tag) in enumerate(zip(v,s.tags)):
            x,y,z=p
            if hasattr(s,'morph'):
                delta[i]=s.morph(p,tag,pose)
                continue
            if pose=='Blink' and tag.startswith('eye'):
                # Fold eye surface into the fitted upper lid, behind skin.
                ny=1.676+(y-1.676)*.035
                delta[i]=[0,ny-y,s.facez(x,ny)+.007-z]
            if pose=='Smile' and tag in ('mouth','lip'):
                delta[i]=[x*.06,.009*(abs(x)/.054),.001]
            if pose=='Sad':
                if tag=='mouth':delta[i]=[0,.012-.040*(abs(x)/.054)**2,0]
                if tag=='lip':delta[i]=[0,.009,0]
                if tag.startswith('brow'):delta[i]=[0,.04*(1-min(1,abs(x)/.19)),0]
        targets.append({'POSITION':g.accessor(delta,'VEC3',target=34962,bounds=True)})
    d['meshes']=[{'name':'Amira handcrafted mesh','primitives':[{'attributes':attrs,
        'indices':g.accessor(faces.reshape(-1),'SCALAR',5123 if len(v)<65536 else 5125,target=34963),
        'material':0,'targets':targets}],'weights':[0,0,0],'extras':{'targetNames':['Blink','Smile','Sad']}}]
    matrices=[]
    for _,_,p in BONES:
        m=np.eye(4);m[:3,3]=-np.array(p);matrices.append(m.T.reshape(-1))
    d['skins']=[{'name':'Garden Humanoid Rig','joints':list(range(1,len(BONES)+1)),
                 'skeleton':1,'inverseBindMatrices':g.accessor(matrices,'MAT4')}]
    add_clips(g)
    path=OUT/('avatar-lod1.glb' if lod else 'avatar.glb');g.save(path)
    info={'triangles':len(faces),'vertices':len(v),'drawCalls':1,'materials':1,'textures':3,
          'textureSize':512 if lod else 1024,'bones':len(BONES),'skinnedMeshes':1,
          'bounds':{'min':v.min(0).tolist(),'max':v.max(0).tolist()},
          'clips':[a['name'] for a in d['animations']],'bytes':path.stat().st_size}
    assert info['triangles'] <= (5000 if lod else 20000), info
    assert info['bounds']['max'][1] <= 3 and info['bounds']['min'][1] >= -.001
    print(path.name,json.dumps(info))
    return info

if __name__=='__main__':
    stats={name:export(lod) for lod,name in [(0,'lod0'),(1,'lod1')]}
    (ROOT/'docs/avatar-model-stats.json').write_text(json.dumps(stats,indent=2)+'\n')
config={
    'name':'Amira · Garden Muse',
    'materials':{'*':{'lighting':'standard'}},
    'motion':{'bank':.22,'pitch':.18,'bob':.035,'bobSpeed':1.5,'squash':.06},
    'trail':'none',
    'idle':[{'clip':'blink','every':[2.5,5.0],'overlay':True},
            {'clip':'look_around','after':12}],
    'emotes':[{'name':'Joy','clip':'joy','duration':2.2},
              {'name':'Approval','clip':'approval','duration':2.4},
              {'name':'Sadness','clip':'sadness','duration':2.8},
              {'name':'Indignation','clip':'indignation','duration':2.4}],
    'reactions':{'pick':'approval','like':'Joy'},
    'lookAt':{'node':'Head','limit':32},
}
if __name__=='__main__':
    (OUT/'avatar.json').write_text(json.dumps(config,indent=2)+'\n')
