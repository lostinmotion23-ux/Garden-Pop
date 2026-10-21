"""Original tileable PBR surfaces for the playable garden (not the street lot)."""
from pathlib import Path
from PIL import Image
import numpy as np
out=Path(__file__).resolve().parents[1]/'public/experience/assets'
n=512;y,x=np.mgrid[:n,:n]/n;tau=np.pi*2
rng=np.random.default_rng(3157)
noise=rng.normal(0,1,(n,n))
def save(name,base,height,rough):
    h=(height-height.min())/max(1e-6,np.ptp(height))
    rgb=np.clip(np.asarray(base)[None,None,:]+height[:,:,None],0,255).astype('uint8')
    Image.fromarray(rgb).save(out/f'{name}.png')
    dx=(np.roll(h,-1,1)-np.roll(h,1,1))*3
    dy=(np.roll(h,-1,0)-np.roll(h,1,0))*3
    normal=np.stack([-dx,-dy,np.ones_like(h)],-1)
    normal/=np.linalg.norm(normal,axis=-1,keepdims=True)
    Image.fromarray(np.uint8(np.clip(normal*.5+.5,0,1)*255)).save(out/f'{name}-normal.png')
    Image.fromarray(np.uint8(np.clip(rough+(h-.5)*45,30,245))).convert('RGB').save(out/f'{name}-rough.png')
wood=np.sin(tau*(y*19+np.sin(tau*x)*.55+np.sin(tau*x*3)*.17))*10
wood+=np.sin(tau*(y*71+np.sin(tau*x)*.9))*3+noise*.7
save('wood',(194,146,99),wood,150)
stone=(np.sin(tau*x*7)*np.sin(tau*y*6)*3+np.sin(tau*(x*37+y*19))*1.5+noise*1.7)
save('stone',(206,196,183),stone,191)
fabric=np.sin(tau*x*125)*np.sin(tau*y*126)*2+noise*.45
save('fur',(250,244,235),fabric,209)
leaf=np.cos(tau*x)*4+np.sin(tau*(x*3+y*9))*3+noise*.5
save('leaf',(159,191,117),leaf,145)
grass=np.sin(tau*(x*71+y*12))*4+np.sin(tau*(x*13-y*57))*3+noise*1.5
save('soil',(170,193,131),grass,205)
velvet=np.sin(tau*x*91)*np.cos(tau*y*89)*1.2+noise*.5
save('velvet',(82,103,130),velvet,211)
# A faint pearl film varies reflection over the surface; it never flattens the sphere's shading.
film=np.empty((n,n,3))
for c in range(3):film[:,:,c]=247+6*np.sin(tau*(x*2+y+ c/3))
Image.fromarray(np.uint8(np.clip(film,0,255))).save(out/'bubble-film.png')
# Soft 3D contact footprints, rendered behind the spheres and under walking pets.
a=np.clip(1-np.sqrt(((x-.5)*2)**2+((y-.5)*2)**2),0,1)**1.7
rgba=np.zeros((n,n,4),dtype='uint8');rgba[:,:,:3]=(21,29,52);rgba[:,:,3]=np.uint8(a*115)
Image.fromarray(rgba).save(out/'contact-shadow.png')
print('Created six original 512px color/normal/roughness surfaces, pearl-film texture and soft contact texture.')
