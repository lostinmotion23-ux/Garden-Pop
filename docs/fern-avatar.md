# Fern · Woodland Fox

Account-avatar package: `public/avatar-fern`. Uses the fox mesh shown in the
approved example, including its textures, flower, cream muzzle and tail. The
preview's two curved leaves and raised veins form the scarf. The close-up mesh
attributes are checked directly against the original preview body.

Both GLBs contain three materials/draws: textured fur, the two scarf leaves, and
their veins. The distance model keeps the same character and facial targets,
with a coarser body, 512px textures, and simplified small scarf veins.

The avatar uses morph targets and object animation for its rounded floating
body. A humanoid skeleton is not required. Clips: `idle`, `fly`, `fly_fast`,
`ascend`, `descend`, `joy`, `approval`, `sadness`, `surprise`, `blink`.
The face supports Blink, Smile, Shock, Sad and Wiggle (ears/tail).

Keys 1–4 play Joy, Approval, Sadness and Surprise. Idle extras blink naturally;
flight blends with the city's motion. The model is Y-up in metres, facing +Z,
with the origin at the feet. No background, lights or floor are in the package.

Rebuild and inspect, with Vite running on port 4178:

```sh
XDG_CONFIG_HOME=/workspace/.cache/config blender --background --factory-startup --threads 2 --python scripts/build-fern-distance-source.py
node scripts/export-fern-avatar.mjs
node scripts/check-fern-avatar.mjs
node scripts/check-fern-browser.mjs
python scripts/validate-avatar.py validate --package-dir public/avatar-fern
```

The model inspector is `/avatar.html?fern=1`. Publishing posts only the three
files in this package via `scripts/validate-avatar.py`; the lot and playable
experience are not published or modified by this work.
