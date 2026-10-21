"""Original PBR atlas: yarn loops, woven linen, hair fibres, leather and hazel irises."""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
import sys

ROOT = Path(__file__).resolve().parents[1]
REVISION = '--revision' in sys.argv
OUT = ROOT / ('.local/avatar-revision-textures' if REVISION else '.local/avatar-textures')
OUT.mkdir(parents=True, exist_ok=True)
N = 256
y, x = np.mgrid[0:N, 0:N].astype(float)
u, v = x / N, y / N
rng = np.random.default_rng(31571248)
palette = ['#f1c2a4', '#71432e', '#f5e8cf', '#af95c2', '#805244', '#89a18a',
           '#49302c', '#f9f5e9', '#f1c2a4', '#d58fa8', '#e9d6b5', '#d3a45d',
           '#95574f', '#514340', '#f7eede', '#945b3e']
if REVISION:
    palette = ['#efbea4','#51362d','#e9dfcc','#a38bb3','#754e3f','#8ca28b',
               '#503b33','#fbf7ee','#efbea4','#cc9daa','#e8ddc8','#c49b58',
               '#985d58','#4f453d','#eee4d3','#664336']
base = np.zeros((1024, 1024, 3), dtype=np.uint8)
normal = np.full((1024, 1024, 3), (128, 128, 255), dtype=np.uint8)
orm = np.full((1024, 1024, 3), (255, 180, 0), dtype=np.uint8)
for i, color in enumerate(palette):
    rgb = np.array([int(color[j:j+2], 16) for j in (1, 3, 5)], float)
    grain = rng.normal(0, .5, (N, N))
    h = np.zeros((N, N))
    shade = np.ones((N, N))
    rough, metallic = .55, 0
    if i in (1, 15):
        # Narrow longitudinal fibres over broader warm/cool ribbons.
        fibres = np.sin(u * np.pi * 142 + .65 * np.sin(v * 13 + u * 17))
        shade = .94 + .075 * fibres + .06 * np.sin(u * 32 + np.sin(v * 5))
        h = fibres * 1.3 + np.sin(u * 55) * .8
        rough = .36
        if REVISION:
            shade=.98+.018*fibres+.025*np.sin(u*32+np.sin(v*5))
            h*=.34
            rough=.51
    elif i in (2, 10, 14):
        # Interlocking V-shaped knit loops, including shadowed stitch valleys.
        xx = ((u * 16 + .5) % 1) - .5
        yy = (v * 21) % 1
        loop = np.exp(-((np.abs(xx) - (.08 + yy * .33)) / .095) ** 2)
        fibre = np.sin((xx * 24 + yy * 36) * np.pi) * .15
        h = loop * (1 + fibre) * 2.7
        shade = .9 + .13 * loop + grain * .002
        rough = .86
        if REVISION:
            shade=.985+.025*loop+grain*.0008
            h*=.36
    elif i in (3, 5, 9):
        weave = np.sin(x * np.pi / 2) * np.sin(y * np.pi / 2)
        h = weave * .65
        shade = .97 + .025 * weave + grain * .004
        if REVISION:
            shade=.99+grain*.0010
            h*=.35
        if i == 3 and not REVISION:
            plaid = (np.cos(u * np.pi * 8) > .93) | (np.cos(v * np.pi * 8) > .95)
            shade += plaid * .06
        rough = .8
    elif i in (4, 13):
        shade = .97 + grain * .01 + np.sin(u * 19 + v * 11) * .025
        h = rng.normal(0, .45, (N, N))
        rough = .72
    elif i == 7:
        # Full eye UV tile: ivory sclera, radial green/honey iris and dark pupil.
        xx, yy = (u - .5) * 2, (v - .5) * 2
        r = np.sqrt(xx * xx + yy * yy)
        angle = np.arctan2(yy, xx)
        iris = r < (.96 if REVISION else .70)
        radial = .5 + .22 * np.sin(angle * 61 + r * 40) + .14 * np.sin(angle * 117 - r * 22)
        irgb = np.stack([76 + radial * 65 + (r < .40) * 37,
                         91 + radial * 50, 49 + radial * 30], axis=-1)
        darkrim = np.clip(((.96 if REVISION else .70) - r) / .07, 0, 1)
        irgb *= (.36 + .64 * darkrim[:, :, None])
        tile = np.broadcast_to(rgb, (N, N, 3)).copy()
        tile[iris] = irgb[iris]
        tile[r < (.40 if REVISION else .285)] = [35, 28, 28]
        tile[(xx + .22) ** 2 + (yy + .25) ** 2 < .085 ** 2] = [255, 253, 243]
        tile[(xx - .23) ** 2 + (yy - .19) ** 2 < .04 ** 2] = [245, 231, 211]
        rough = .18
    elif i == 8:
        tint = np.exp(-((u - .5) ** 2 / .08 + (v - .5) ** 2 / .10)) * np.sin(u*np.pi)**2 * np.sin(v*np.pi)**2
        tile = np.broadcast_to(rgb, (N, N, 3)).copy()
        tile += tint[:, :, None] * np.array([0, -40, -19])
        h = grain * .06
    elif i == 11:
        rough, metallic = .3, .72
        shade = .97 + .02 * np.sin(u * 35)
    else:
        shade += grain * .0015
    if i not in (7, 8):
        tile = rgb[None, None, :] * shade[:, :, None]
    dy, dx = np.gradient(h)
    n = np.stack([-dx * .23, dy * .23, np.ones_like(h)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    a, b = (i // 4) * N, (i % 4) * N
    base[a:a+N, b:b+N] = np.clip(tile, 0, 255).astype('uint8')
    normal[a:a+N, b:b+N] = np.clip((n * .5 + .5) * 255, 0, 255).astype('uint8')
    orm[a:a+N, b:b+N, 1] = int(rough * 255)
    orm[a:a+N, b:b+N, 2] = int(metallic * 255)
if REVISION:
    cloth=Image.fromarray(base);paint=ImageDraw.Draw(cloth)
    for yy in [10,49]:paint.line([(772,yy),(1019,yy)],fill='#d9c3ca',width=1)
    for cx in range(788,1010,36):
        cy=29
        paint.line([(cx,cy+5),(cx+8,cy+15)],fill='#87967c',width=1)
        paint.ellipse((cx+4,cy+7,cx+10,cy+11),fill='#87967c')
        for a in np.linspace(0,np.pi*2,5,endpoint=False):
            xx=cx+np.cos(a)*5;yy=cy+np.sin(a)*5
            paint.ellipse((xx-3,yy-3,xx+3,yy+3),fill='#eee0d0')
        paint.ellipse((cx-2,cy-2,cx+2,cy+2),fill='#cfaa66')
    base=np.asarray(cloth)
for name, data in [('base', base), ('normal', normal), ('orm', orm)]:
    Image.fromarray(data).save(OUT / f'{name}.png', optimize=True)
    Image.fromarray(data).resize((512, 512), Image.Resampling.LANCZOS).save(OUT / f'{name}-lod1.png', optimize=True)
print('Created original 1024px/512px skin, hair, knit, linen, suede and iris PBR atlases.')
