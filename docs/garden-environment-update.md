# Coordinated magical garden update — 2026-10-21

Implemented locally from the [full user brief](garden-environment-update-request.md).
Warm dusk remains the selected lighting direction. This update is saved to
GitHub for local development. It has not been published to Project 0.

## Meadow and miniature flowers

`meadow.js` builds three closed, curved grass-clump meshes containing 3, 5 and
7 blades. Instancing supplies 3,525 irregularly placed clumps with spring,
mint, leafy and deeper green vertex colors. Five flower meshes provide white
daisies, pink blossoms, yellow flowers, lavender and pale-blue blooms; 427
plants have actual stems, leaves and rounded petals. Paving and launcher
footprints remain open. Older border plants were scaled down to match.

The grass height limit is derived from `BOARD.diameter / 3`: **0.125 units**
for the unchanged **0.375-unit bubbles**. Browser measurement of transformed
mesh vertices finds a maximum of **0.12301**. Flowers measure at most 0.11915.
One shared shader clock bends the tops in staggered phases while roots stay
fixed. Matte diffuse lighting keeps the dense vegetation inexpensive and
consistent with the scene's lights. Sustained slow frames gradually halve
decorative density; recovery uses a ten-second delay to avoid rapid switching.

## Recognizable woodland

`woodland.js` supplies **38 actual trees** in near, middle and far depth layers:
rounded broadleaf trees, tall woodland trees and smaller saplings. Textured
trunks and branch forks are merged; irregular overlapping crowns and leaf
edges are instanced. Heights, crown proportions, branch placement and green
tones vary. Near trees have more edge leaves. Branch tips and crowns sway
gently. The dome now draws only sky and clouds; the former green noise forest
was removed. Atmospheric perspective starts at 35 units and stays light.

## Rustic fieldstone walls

`courtyard.js` keeps the existing wall radii (10.8 and 19), heights, length and
front openings. Five deformed, softly shaded stone meshes supply **1,357**
stones and fillers, with varied widths, heights, rotations, protrusion and
warm neutral tints. Joints are staggered, course heights wander, and the top
edge varies modestly. Recessed dark bedding closes gaps and emphasizes contact;
sparse moss, sprouts and tiny crack flowers provide accents. No extra lights
or shadow passes were added.

## Collision-aware pets and feeding

`pet-navigation.js` gives each species a conservative body circle (radius
0.20–0.29), ignoring ears and tails. Rescues select a free ground landing
position. Velocity smoothing, a nearby-animal spatial hash, persistent passing
directions and conservative final clearance checks prevent overlap. A small
cached route search finds a path when direct steering is blocked. Crowded
pets choose shorter wander goals, pause briefly and seek open locations.

The navigator checks the cannon, next-bubble stem, nearby solid back-border
rocks, other bodies and the existing meadow edges. Distant walls lie outside
the walking region and need no per-frame collision work. Food uses identical
coordinates in simulation and rendering. Destinations inside the cannon's
footprint are moved to a reachable edge. Both food IDs and feeding approach
space are reserved, preventing duplicate meals and crowded feeding deadlocks.
Every ten actual meals still produces one bomb for that pet.

`rules.js` changes only rescue placement and the garden movement/eating update;
shooting, matching, scoring, powers, grid generation and progression functions
are unchanged. `view.js` and `pet-life.js` now respect authoritative ground
coordinates instead of adding visual passing lanes or lateral pose offsets.
Animal meshes, textures and facial morphs are unchanged.

## Score-based aiming assistance

`aim-guide.js`, `view.js` and `cannon.js` use the existing score:

| Score | Trajectory, reflections and landing ghost |
| --- | --- |
| Below 3,000 | Normal opacity |
| 3,000–4,999 | 30% of normal opacity |
| 5,000+ | Hidden |

Transitions use a smooth 0.4-second fade. Changes during a flying shot wait
until the next aiming state. Direct jumps across both thresholds, score
decreases and reset work. A small cream/gold, softly emissive 3D leaf pointer
stays at the cannon's front at every score. Its orientation matches the actual
analytic launch direction; decorative idle motion does not turn the pointer.

## Validation

Implementation files: `src/experience/game/meadow.js`, `garden-plants.js`,
`woodland.js`, `courtyard.js`, `garden-theme.js`, `pet-navigation.js`,
`aim-guide.js`, `botanical.js`, `rules.js`, `view.js`, `cannon.js`, `pet-life.js`,
and `src/experience/main.js`. The build mirrors these to `public/experience/`.
Validation/capture changes are in `scripts/check-garden-update.mjs`,
`check-garden-update-browser.mjs`, `render-stage2-previews.mjs` and `package.json`.
The earlier Windows browser portability changes and local launcher are retained.

- `npm run build`: production build and readable public-source synchronization.
- `npm run check:game`: 58 shots, five rescues, two refills, all seven powers,
  individual meal/reward rules and deterministic snapshots.
- `npm run check:game:update`: fixed board dimensions; unchanged grid, trajectory,
  firing, powers and progression functions; eight-pet crowding through 80 unique
  meals and eight bombs; opposite-direction passing around the cannon; no body,
  obstacle or boundary overlaps; speed bounds; deterministic snapshot/restore.
  Browser checks cover actual plant heights, forest/wall structure, every aim
  threshold, pointer direction, reset and zero WebGL/asset errors.
- `npm run check:game:stage2`: 24 meals/two bombs, bounded collection flights,
  unobstructed current ball, presentation-only updates, poses, visitor caps/reset.
- `npm run check:game:layout`: 1920×1080, 1600×900, 1366×768 and phone journal.
- `npm run check:game:browser`: real shots, multiple continuing rescues,
  swapping, pause, misses through game over, retry, phone touch, and zero browser
  errors or failed asset requests.

The game remains one continuous garden with 20/19 staggered columns, six
starting rows and the same scoring/progression. There are no level-completion
screens to test. Exterior and avatar files are untouched.

## Performance limitation

Only **SwiftShader software rendering** is available to this test browser,
even with default Chromium GPU settings. The final comparison at 1366×768,
with both scenes adaptively rendering scenery at 820×461, measured about
147 ms/frame for saved Stage 2 versus 251 ms/frame for this richer update.
These are short software samples and include scheduling variance. They do
show a material software-rendering cost; **60 FPS and absence of degradation
on a capable native GPU are not verified**.

Full-detail geometry was reduced from about 1.28 million to 852,000 triangles
before adaptive meadow thinning (about 675,000 in reduced mode). Plants use
diffuse lighting, instancing and shared wind uniforms. Stonework and trunks
are merged, visitors remain capped, and no additional reflection, refraction,
shadow or full-scene physics passes were introduced. Native GPU profiling is
the remaining performance validation, not a completed guarantee.

## Local preview and captures

Start with `.\scripts\dev-local.cmd`, then open
`http://127.0.0.1:5173/game.html`. Node and Playwright are installed in ignored
`.local` directories; see [Windows setup](local-courtyard-progress.md).

Final captures were rendered and visually inspected at 1920×1080 and 390×844,
with zero browser/WebGL errors. Run `npm run render:game:update` after `npm run check:game` to regenerate
the actual [desktop](previews/garden-update-desktop.png) and
[phone](previews/garden-update-phone.png) captures. These are game renders,
not the earlier concept illustration. Official Project 0 validation and
publication are outside this local update and have not been performed.
