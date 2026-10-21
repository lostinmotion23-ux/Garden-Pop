"""Deterministic tangent-circle packing, shared by all exported garden views."""
import math

SMALL_RADIUS = .18
BIG_RADIUS = .45
DEPTH = 1.35
BOTTOM = 1.35
ROW_SPACING = math.sqrt(3)*SMALL_RADIUS
SPAN = ROW_SPACING*18
TOP = BOTTOM+SPAN
ANIMAL_SCALE = BIG_RADIUS/1.2
BUBBLES = [
    {'kind':'bunny','name':'Mochi','position':[0,4.75,DEPTH],'color':'#ffd4e4'},
]

def periodic_dy(a,b):
    return (a-b+SPAN/2)%SPAN-SPAN/2

def make_packing(limit=185):
    circles=[(*animal['position'][:2],BIG_RADIUS) for animal in BUBBLES]
    if len(circles)==1:
        # A first tangent small bubble lets pair-based packing grow around one
        # baby bubble, without adding any other large/animal bubbles.
        x,y,r=circles[0]
        circles.append((x,y+r+SMALL_RADIUS,SMALL_RADIUS))
    candidates={}

    def fits(x,y):
        if abs(x)>2.4-SMALL_RADIUS: return False
        return all(math.hypot(x-cx,periodic_dy(y,cy))>=r+SMALL_RADIUS-1e-7 for cx,cy,r in circles)

    def offer_pair(a,b):
        ax,ay,ar=a
        bx,by,br=b
        by=ay+periodic_dy(by,ay)
        dx,dy=bx-ax,by-ay
        distance=math.hypot(dx,dy)
        ra,rb=ar+SMALL_RADIUS,br+SMALL_RADIUS
        if distance<1e-8 or distance>ra+rb+1e-8 or distance<abs(ra-rb): return
        along=(ra*ra-rb*rb+distance*distance)/(2*distance)
        height=math.sqrt(max(0,ra*ra-along*along))
        mx,my=ax+dx*along/distance,ay+dy*along/distance
        for side in (-1,1):
            x=mx-side*dy*height/distance
            y=BOTTOM+(my+side*dx*height/distance-BOTTOM)%SPAN
            if fits(x,y): candidates[(round(x,7),round(y,7))]=(x,y)

    for i,a in enumerate(circles):
        for b in circles[:i]: offer_pair(a,b)
    while candidates and len(circles)<limit+len(BUBBLES):
        # Grow one dense connected cluster, rather than scattering loose bubbles.
        key=min(candidates,key=lambda k:k[0]*k[0]+periodic_dy(k[1],4.5)**2)
        x,y=candidates.pop(key)
        if not fits(x,y): continue
        new=(x,y,SMALL_RADIUS)
        circles.append(new)
        candidates={k:p for k,p in candidates.items() if math.hypot(p[0]-x,periodic_dy(p[1],y))>=2*SMALL_RADIUS-1e-7}
        for other in circles[:-1]: offer_pair(new,other)
    # A seam-only neighbour would look detached at the initial entry view. Keep
    # just the physically connected cluster containing the animals.
    connected=set(range(len(BUBBLES)))
    changed=True
    while changed:
        changed=False
        for index,(x,y,r) in enumerate(circles):
            if index in connected: continue
            if any(abs(math.hypot(x-circles[j][0],y-circles[j][1])-r-circles[j][2])<1e-6 for j in connected):
                connected.add(index)
                changed=True
    return [{'x':x,'y':y,'z':DEPTH,'radius':r} for i,(x,y,r) in enumerate(circles) if i>=len(BUBBLES) and i in connected]

SOLIDS = make_packing()

if __name__=='__main__':
    print(f'{len(SOLIDS)} small bubbles, radius {SMALL_RADIUS}; {len(BUBBLES)} animal bubble, radius {BIG_RADIUS}.')
