"""Second avatar: sculpted CC0 anatomical foundation, original clothing and hair.

Only public/avatar-revision is written. Existing city avatar/lot/game are not touched.
"""
import sys, json, math
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.local/avatar-python'))
import fast_simplification
import build_avatar as E

SOURCE=ROOT/'assets/avatar-authoring'
TAU=math.tau

def source_mesh():
    verts=[];faces=[];groups={};group=''
    for line in (SOURCE/'head-foundation.obj').read_text().splitlines():
        if line.startswith('v '):verts.append(list(map(float,line.split()[1:])))
        elif line.startswith('g '):group=line[2:]
        elif line.startswith('f '):
            f=[int(q.split('/')[0])-1 for q in line.split()[1:]]
            groups.setdefault(group,[]).extend(f)
            if group=='body':faces.append(f)
    verts=np.array(verts)
    for line in (SOURCE/'female-young.target').read_text().splitlines():
        if line and line[0].isdigit():
            a=line.split();verts[int(a[0])]+=np.array(list(map(float,a[1:])))
    return verts,faces,groups

SV,SF,SG=source_mesh()

def compact(v,faces):
    used=sorted(set(i for f in faces for i in f));lookup={n:i for i,n in enumerate(used)}
    tris=[]
    for f in faces:
        for j in range(1,len(f)-1):tris.append([lookup[f[0]],lookup[f[j]],lookup[f[j+1]]])
    return np.array(v)[used],np.array(tris),used

def simplify(v,f,n):
    if len(f)<=n:return v,f
    return fast_simplification.simplify(v,f,target_count=n,agg=5)

def smoothstep(a,b,x):
    t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)

def face_point(p):
    x,y,z=map(float,p)
    # Smaller, softer nose, slightly lifted cheeks and a tapered jaw.
    nose=math.exp(-((x/.20)**2+((y-6.52)/.21)**2))*max(0,min(1,(z-1.30)/.20))
    z-=.19*nose
    jaw=1-.065*math.exp(-((y-6.05)/.32)**2)
    x*=jaw
    mouth=math.exp(-((y-6.29)/.20)**4)*smoothstep(1.20,1.40,z)
    y+=.055*min(1,(abs(x)/.28)**2)*mouth
    x*=1-.12*mouth
    z-=.080*mouth
    y+=.055*math.exp(-((y-5.98)/.23)**2)*smoothstep(.5,1.25,z)
    x*=1+.035*math.exp(-((y-6.50)/.25)**2)
    # Gentle eye enlargement: retain real eyelids and an almond shaped aperture.
    for s in (-1,1):
        ex=s*.30
        w=math.exp(-(((x-ex)/.30)**2+((y-6.79)/.25)**2))*max(0,min(1,(z-.9)/.4))
        x+=(x-ex)*.28*w;y+=(y-6.79)*.30*w
    p=np.array((x*.225*1.06,(y-7.8643)*.20+1.995,(z-.53)*.19))
    # Round the lower face and add a gentle resting smile without losing anatomy.
    front=float(smoothstep(.09,.14,p[2]))
    cheek=math.exp(-((abs(p[0])-.100)/.050)**2-((p[1]-1.725)/.050)**2)*front
    p[2]+=.007*cheek
    mouth=math.exp(-((p[1]-1.665)/.028)**4)*math.exp(-(p[0]/.062)**6)*front
    p[1]+=(.007*min(1,(abs(p[0])/.041)**1.7)-.0015)*mouth
    p[1]+=.010*float(smoothstep(1.78,1.63,p[1]))*front
    return p

EY=.20*(6.795-7.8643)+1.995
EX=.30*.225*1.06

class Hero(E.Sculpt):
    def __init__(self,lod=0):
        super().__init__(lod);self.colors=[]
    def seg(self,n,minimum=5):
        return max(3 if self.lod else minimum,round(n*(.28 if self.lod else .74)))
    def vertex(self,p,uv,tile,bone,tag=''):
        i=super().vertex(p,uv,tile,bone,tag);self.colors.append((1,1,1,1));return i
    def imported(self,v,f,tile,bone,tagfn=None,colorfn=None):
        start=len(self.v)
        for p in v:
            tag=tagfn(p) if tagfn else ''
            self.vertex(p,(.5,.5),tile,bone,tag)
            if colorfn:self.colors[-1]=colorfn(p)
        self.faces.extend(tuple(start+int(i) for i in face) for face in f)
    def head(self):
        faces=[f for f in SF if all(SV[i,1]>5.2 for i in f)]
        v,f,_=compact(SV,faces)
        v,f=simplify(v,f,1400 if self.lod else 5000)
        v=np.array([face_point(p) for p in v])
        def tag(p):
            x,y,z=p
            if z>.11 and abs(abs(x)-EX)<.065 and abs(y-EY)<.055:return 'lid'
            if z>.11 and abs(x)<.065 and 1.64<y<1.70:return 'face-mouth'
            if z>.10 and abs(abs(x)-EX)<.05 and EY+.03<y<EY+.07:return 'face-brow'
            return ''
        def color(p):
            x,y,z=p
            blush=math.exp(-((abs(x)-.107)/.037)**2-((y-1.735)/.025)**2)*smoothstep(.09,.15,z)
            # Vertex paint is linear, applied over the skin atlas, with no sticker patches.
            c=np.array((1.,1.,1.))
            c*=np.array((1.,1-.15*blush,1-.10*blush))
            lip=math.exp(-(x/.043)**6-((y-1.675)/.013)**6)*smoothstep(.105,.13,z)
            c*=np.array((1.,1-.36*lip,1-.25*lip))
            return tuple(c)+(1,)
        self.imported(v,f,0,'Head',tag,color)
        self.head_triangles=v[f]
        # A clean neck hidden inside the blouse collar.
        self.ell((0,1.527,-.027),(.062,.095,.055),0,{'Head':.4,'Neck':.6},seg=20,rings=12)
        for s in (-1,1):
            # Fitted almond whites; iris is a separate curved, glossy lens.
            ex=s*EX
            start=len(self.v)
            self.ell((ex,EY,.113),(.043,.035,.034),7,'Head',f'eye{s}',seg=24,rings=14)
            for i in range(start,len(self.v)):self.uv[i]=((3+.025)/4,(1+.025)/4)
            ns=12 if self.lod else 24;nr=2 if self.lod else 4
            # Iris cap, with a dark limbal ring and subdued catchlights in the map.
            start=len(self.v);rad=.0195
            for j in range(nr+1):
                r=j/nr
                for i in range(ns+1):
                    a=i*TAU/ns;xx=r*math.cos(a);yy=r*math.sin(a)
                    self.vertex((ex+xx*rad,EY+yy*rad,.148-.005*r*r),(.5+xx*.5,.5-yy*.5),7,'Head',f'eye{s}')
            for j in range(nr):
                for i in range(ns):
                    a=start+j*(ns+1)+i
                    self.faces.extend([(a,a+ns+1,a+1),(a+1,a+ns+1,a+ns+2)])
            # Upper lids and lashes are restrained and taper at the outer corner.
            pts=[]
            for t in np.linspace(0,math.pi,16 if not self.lod else 7):
                xx=math.cos(t)*.043;yy=EY+math.sin(t)*.021+xx*s*.05
                pts.append((ex+xx,yy,self.surface_z(ex+xx,yy)+.0011))
            self.tube(pts,[.0007+.0012*math.sin(i*math.pi/(len(pts)-1)) for i in range(len(pts))],6,'Head',f'eye{s}',sides=6)
            for i in range(2):
                xx=ex+s*(.032-i*.006);yy=EY+.012+i*.004;zz=self.surface_z(xx,yy)+.0015
                self.tube([(xx,yy,zz),(xx+s*.006,yy+.004,zz+.001)],.0007,6,'Head',f'eye{s}',sides=5)
            brow=[]
            for t in np.linspace(0,1,14 if not self.lod else 6):
                xx=(t-.5)*.076;yy=EY+.047+.010*math.sin(t*math.pi)
                brow.append((ex+xx,yy,self.surface_z(ex+xx,yy)+.0012))
            self.tube(brow,[.0008+.0017*math.sin(i*math.pi/(len(brow)-1)) for i in range(len(brow))],1,'Head','brow',sides=6)
        seam=[]
        for t in np.linspace(-1,1,6 if self.lod else 12):
            x=t*.039;y=1.674+.007*t*t
            seam.append((x,y,self.surface_z(x,y)+.0006))
        self.tube(seam,.00065,12,'Head','face-mouth',sides=5)
        return self
    def surface_z(self,x,y):
        tri=self.head_triangles;a,b,c=tri[:,0],tri[:,1],tri[:,2]
        den=(b[:,1]-c[:,1])*(a[:,0]-c[:,0])+(c[:,0]-b[:,0])*(a[:,1]-c[:,1])
        den=np.where(abs(den)<1e-10,np.nan,den)
        u=((b[:,1]-c[:,1])*(x-c[:,0])+(c[:,0]-b[:,0])*(y-c[:,1]))/den
        w=((c[:,1]-a[:,1])*(x-c[:,0])+(a[:,0]-c[:,0])*(y-c[:,1]))/den
        t=1-u-w;mask=(u>=0)&(w>=0)&(t>=0)
        z=u*a[:,2]+w*b[:,2]+t*c[:,2]
        return float(z[mask].max()) if mask.any() else .13
    def hands(self):
        for side,s in [('Left',-1),('Right',1)]:
            # Use actual hand anatomy, not separate spherical palms and tube fingers.
            sign=1 if s>0 else -1
            faces=[f for f in SF if all(SV[i,0]*sign>4.30 for i in f)]
            v,f,_=compact(SV,faces)
            v,f=simplify(v,f,120 if self.lod else 570)
            wrist=np.array((sign*4.30,1.65,1.67))
            forward=E.unit(np.array((sign*.40,-.92,.85)))
            right=E.unit(np.cross(forward,(0,0,1)));normal=E.unit(np.cross(right,forward))
            out=[]
            for p in v:
                q=p-wrist
                xx=np.dot(q,right);yy=np.dot(q,forward);zz=np.dot(q,normal)
                out.append((s*.407+xx*.085,1.008-yy*.085,.025-zz*.085))
            self.imported(np.array(out),f,0,f'Hand{side}')
    def garment(self):
        torso=lambda p:{'Hips':float(1-smoothstep(1.11,1.37,p[1])),
                        'Chest':float(smoothstep(1.11,1.37,p[1]))}
        # Sculpted blouse, with a fitted waist, shoulder slope and shaped neckline.
        bodyrows=[(1.10,.160,.106),(1.16,.167,.113),(1.28,.182,.120),
                      (1.39,.207,.116),(1.45,.196,.097),(1.49,.126,.078),
                      (1.52,.066,.062)]
        self.profile(bodyrows,2,torso,seg=40)
        # A single fitted dress shell makes the bodice and skirt one piece.
        rows=[(.66,.296,.182),(.675,.297,.183),(.73,.279,.175),(.83,.252,.162),
              (.94,.216,.145),(1.05,.182,.125),(1.12,.175,.122),(1.14,.173,.120)]
        self.profile(rows,3,lambda p:'Skirt' if p[1]<1.12 else torso(p),seg=56,folds=.065)
        for side in (-1,1):
            def bib(u,v,side=side):
                y=1.14+v*.215;x=(u-.5)*(.280+v*.030)*side
                rx=float(np.interp(y,[r[0] for r in bodyrows],[r[1] for r in bodyrows]))
                rz=float(np.interp(y,[r[0] for r in bodyrows],[r[2] for r in bodyrows]))
                return x,y,side*(rz*math.sqrt(max(.05,1-(x/rx)**2))+.006)
            self.surface(self.seg(26),7 if not self.lod else 3,bib,3,torso)
        # Broad fabric straps over the shoulders: modeled ribbons rather than ropes.
        for s in (-1,1):
            pts=E.bezier([(s*.125,1.20,.13),(s*.144,1.60,.12),
                          (s*.14,1.60,-.12),(s*.13,1.18,-.13)],18 if not self.lod else 8)
            start=len(self.v)
            self.tube(pts,.022,3,'Chest',sides=8,oval=.24)
            for i in range(start,len(self.v)):
                u,v=self.uv[i];local=(v*4-.025)/.95
                self.uv[i]=(u,(.025+.95*(.3+.4*local))/4)
            self.ell((s*.126,1.354,.137),(.010,.010,.004),11,'Chest',seg=10,rings=6)
        # A tailored waistband and a small bow at the back hide the dress join.
        self.profile([(1.095,.180,.127),(1.103,.181,.128),(1.13,.178,.126),
                      (1.144,.177,.125)],9,'Hips',seg=40)
        for s in (-1,1):
            self.ell((s*.031,1.114,-.131),(.038,.020,.010),9,'Hips',seg=12,rings=6,
                     deform=lambda q,s=s:(q[0],q[1]+s*q[0]*.25,q[2]))
        self.ell((0,1.114,-.143),(.013,.017,.009),9,'Hips',seg=10,rings=6)
        # Peter Pan collar panels, curved around the neck and rounded at the tips.
        for s in (-1,1):
            self.ell((s*.049,1.494,.068),(.047,.034,.014),10,'Chest',seg=16,rings=10,
                     deform=lambda q,s=s:(q[0],q[1]-.28*s*q[0],q[2]))
        # Small, inset pocket follows the curved front surface, with a stitched edge.
        self.ell((.0,1.242,.130),(.062,.042,.009),3,'Chest',seg=16,rings=8)
        for side,s in [('Left',-1),('Right',1)]:
            arm,fore=f'UpperArm{side}',f'Forearm{side}'
            def aw(p,arm=arm,fore=fore):
                t=float(smoothstep(1.29,1.15,p[1]));return {arm:1-t,fore:t}
            pts=E.bezier([(s*.196,1.435,0),(s*.30,1.40,-.008),
                          (s*.353,1.15,.005),(s*.405,1.038,.024)],17 if not self.lod else 8)
            rr=[.063+.020*math.sin(t*math.pi)-.019*t for t in np.linspace(0,1,len(pts))]
            self.tube(pts,rr,2,aw,sides=16)
            self.tube([(s*.397,1.074,.020),(s*.408,1.024,.024)], [.049,.046],10,fore,sides=16)
            self.tube([(s*.13,.74,-.015),(s*.13,.68,-.010),(s*.13,.56,.0),
                       (s*.13,.49,.005),(s*.13,.36,.003),(s*.13,.17,.01)],
                      [.073,.071,.061,.057,.050,.041],14,
                      lambda p,side=side:{f'Thigh{side}':float(smoothstep(.45,.60,p[1])),
                                           f'Shin{side}':float(1-smoothstep(.45,.60,p[1]))},sides=16)
            # Rounded, fitted ankle boots with a distinct sole and leather panels.
            self.ell((s*.13,.028,.049),(.087,.021,.145),13,f'Foot{side}',seg=24,rings=10)
            rows=[(.041,.083,.139,.048),(.065,.085,.14,.048),(.098,.082,.132,.044),
                  (.131,.074,.112,.026),(.165,.061,.081,.008),(.201,.056,.064,.002),
                  (.225,.057,.063,.002)]
            def boot(u,v,s=s):
                y,rx,rz,zc=rows[round(v*(len(rows)-1))]
                return (s*.13+rx*math.sin(u*TAU),y,zc+rz*math.cos(u*TAU))
            self.surface(self.seg(28),len(rows)-1,boot,4,f'Foot{side}')
            self.tube([(s*.13,.216,.002),(s*.13,.229,.002)],[.060,.060],4,f'Foot{side}',sides=18)
            for y,z in [(.155,.097),(.183,.075),(.208,.066)]:
                self.tube([(s*.13-.025,y,z-.008),(s*.13,y+.006,z),(s*.13+.025,y,z-.008)],.0025,10,f'Foot{side}',sides=5)
    def hair(self):
        nu=20 if self.lod else 48;nv=8 if self.lod else 18
        def shell(u,v,inside=False):
            a=u*TAU
            front=float(smoothstep(.15,.55,math.cos(a)))
            front_y=1.870+.038*math.sin(a)-.015*math.cos(a*2)
            bottom=1.475+(front_y-1.475)*front+.012*math.sin(a*9+.5)*(1-front)
            y=2.035-(2.035-bottom)*v
            if y>1.78:
                f=math.sqrt(max(.0005,1-((y-1.78)/.255)**2))
                rx=.225*f;rz=.226*f
            else:
                t=(1.78-y)/.32
                rx=.224+.013*math.sin(t*math.pi)-.005*t
                rz=.223-.018*t
            strand=(.0035*math.cos(a*19+.22*math.sin(v*8))+.0020*math.cos(a*37))*v**.5
            strand+=.008*math.cos(a*8+.6*math.sin(v*6))*v*v
            x=(rx+strand)*math.sin(a)+.012*math.sin(v*7+a)*v*v
            z=(rz+strand)*math.cos(a)-.008
            # Slight outward curl at the rounded ends, with no separate dangling sticks.
            curl=smoothstep(.76,1,v)*.015*math.sin(a*5+.7)
            x+=curl*math.sin(a);z+=curl*math.cos(a)
            if inside:x*=.955;z*=.955;y+=.005
            return np.array((x,y,z))
        start=len(self.v)
        for inner in (False,True):
            for j in range(nv+1):
                for i in range(nu+1):
                    u=i/nu;v=j/nv;p=shell(u,v,inner)
                    w=float(smoothstep(1.82,1.55,p[1]))*.78
                    bone='HairLeft' if p[0]<0 else 'HairRight'
                    self.vertex(p,(u,v),1,{'Head':1-w,bone:w})
        size=(nu+1)*(nv+1)
        for inner in (0,1):
            for j in range(nv):
                for i in range(nu):
                    a=start+inner*size+j*(nu+1)+i
                    fs=[(a,a+nu+1,a+1),(a+1,a+nu+1,a+nu+2)]
                    self.faces.extend(tuple(reversed(f)) if inner else f for f in fs)
        for i in range(nu):
            a=start+nv*(nu+1)+i;b=a+size
            self.faces.extend([(a,a+1,b),(a+1,b+1,b)])
        # Sculpted side-swept fringe, a broad beveled lock fitted to the crown.
        for lane in range(4):
            t=lane/3
            pts=E.bezier([(-.055+t*.013,2.024-t*.005,.021),
                          (.075,2.003,.105),(.160+t*.009,1.930,.153),
                          (.185+t*.008,1.795-t*.012,.107)],16 if not self.lod else 7)
            rr=[.025*(.20+.80*math.sin(q*math.pi))*(1-.90*q**6) for q in np.linspace(0,1,len(pts))]
            self.tube(pts,rr,1,'Head',sides=10,oval=.40)
        # A dainty flower clip with actual layered petals, set into the hair.
        for j in range(5):
            a=j*TAU/5
            self.ell((-.189+math.cos(a)*.018,1.871+math.sin(a)*.018,.101),
                     (.014,.012,.006),9,'Head',seg=10,rings=6)
        self.ell((-.189,1.871,.110),(.009,.009,.006),11,'Head',seg=10,rings=6)
    def accessory(self):
        # Slim, sewn cross-body strap and a structured purse with real piping.
        torso=lambda p:{'Chest':float(smoothstep(1.13,1.40,p[1])),
                        'Hips':float(1-smoothstep(1.13,1.40,p[1]))}
        pts=E.bezier([(-.15,1.473,.075),(-.080,1.31,.161),(.20,1.12,.162),(.264,1.007,.158)],20 if not self.lod else 8)
        self.tube(pts,.008,4,torso,sides=7,oval=.37)
        pts=E.bezier([(-.15,1.473,.075),(-.16,1.51,-.13),(.27,1.18,-.13),(.267,.985,.15)],20 if not self.lod else 8)
        self.tube(pts,.008,4,torso,sides=7,oval=.37)
        self.ell((.254,.996,.159),(.095,.080,.041),5,'Satchel',seg=24,rings=14,
                 deform=lambda q:(math.copysign(abs(q[0])**.60,q[0]),math.copysign(abs(q[1])**.70,q[1]),q[2]))
        self.ell((.254,1.022,.197),(.091,.043,.012),5,'Satchel',seg=22,rings=10)
        self.ell((.254,1.004,.212),(.009,.009,.004),11,'Satchel',seg=10,rings=6)
        for j in range(5):
            a=j*TAU/5
            self.ell((.210+math.cos(a)*.009,1.027+math.sin(a)*.009,.205),(.006,.005,.002),14,'Satchel',seg=7,rings=5)
        self.ell((.210,1.027,.209),(.004,.004,.002),11,'Satchel',seg=7,rings=5)
    def morph(self,p,tag,pose):
        x,y,z=p;d=np.zeros(3)
        if pose=='Blink':
            if tag.startswith('eye'):
                d[1]=(EY-y)*.97;d[2]=.148-z
            if tag=='lid':
                w=math.exp(-((abs(x)-EX)/.045)**4-((y-EY)/.042)**4)
                d[1]=(EY-y)*.90*w;d[2]=.005*w
        if pose=='Smile' and tag=='face-mouth':
            d[0]=x*.08;d[1]=.008*min(1,abs(x)/.04);d[2]=.002
        if pose=='Sad':
            if tag=='face-mouth':d[1]=.003-.010*min(1,abs(x)/.04)
            if tag=='brow':d[1]=.008*(1-min(1,abs(x)/.12))
        return d
    def build(self):
        self.head();self.garment();self.hands();self.hair();self.accessory()
        return self

# Skeleton matches the new body proportions; names remain compatible with city clips.
positions={
 'Hips':(0,1.12,0),'Spine':(0,1.27,0),'Chest':(0,1.43,0),
 'Neck':(0,1.52,-.025),'Head':(0,1.78,-.015),
 'HairLeft':(-.18,1.81,-.02),'HairRight':(.18,1.81,-.02),
 'Skirt':(0,1.12,0),'Satchel':(.254,.996,.159),
}
for side,s in [('Left',-1),('Right',1)]:
    positions.update({f'UpperArm{side}':(s*.196,1.435,0),f'Forearm{side}':(s*.333,1.225,.005),
                      f'Hand{side}':(s*.408,1.023,.024),f'Thigh{side}':(s*.13,1.00,-.01),
                      f'Shin{side}':(s*.13,.53,0),f'Foot{side}':(s*.13,.17,.01)})
E.BONES=[(n,p,positions.get(n,v)) for n,p,v in E.BONES]
E.BP={n:np.array(v) for n,_,v in E.BONES}
E.Sculpt=Hero
E.OUT=ROOT/'public/avatar-revision';E.OUT.mkdir(exist_ok=True)
E.TEXTURES=ROOT/'.local/avatar-revision-textures'
stats={f'lod{lod}':E.export(lod) for lod in [0,1]}
(ROOT/'docs/avatar-revision-model-stats.json').write_text(json.dumps(stats,indent=2)+'\n')
config=E.config.copy();config['name']='Amira · Garden Muse II'
(E.OUT/'avatar.json').write_text(json.dumps(config,indent=2)+'\n')
