# Bubble Critter Garden — Stage 1 polish

Stage 1 improves the existing playable experience for lot 3157. The city exterior and account avatar are separate assets and were not republished. The active art direction is botanical: small cherry blossoms, textured timber and bark, parchment, brass, sage and softly lit glass.

Published and independently verified live as submission **9001**, version `14ae33f7a0f52ab1`. The exterior display version and equipped avatar URL are unchanged. Three newly served textures match their local SHA-256 digests. See [verification](game-stage1-verification.json).

## Preserved gameplay

`src/experience/game/rules.js` is byte-identical to the previous continuous-garden version. The board remains 20/19 staggered columns, six starting rows, radius 0.1875, diameter 0.375, the same five colors and collision/trajectory/matching calculations. Two misses add one row. Three skill bubbles replenish. Rescues continue the same garden; they do not end the run. Earned pets and persistent fallen food survive refills. Each pet awards one bomb per ten actual meals. All original textured animal meshes and expression morphs remain intact.

## Implemented

1. An eight-petal, textured 3D flower cannon, golden center, curved stem and leaves. Aim follows smoothly; recoil/compression returns in 280 ms. Projectile creation and speed are unchanged, and the current ball is unobstructed.
2. Ivory aiming dots at 72% opacity follow the original analytic trajectory, including wall bounces. The current-color 40%-opacity ghost occupies the exact predicted hex cell. HUD interaction hides the preview and cannot fire.
3. Readable cream parchment cards with carved wood borders. Existing animal models supply the portrait atlas. Each species card shows its existing one encounter, actual rescued count, name and animated progress/highlight. Phone and short-window layouts use a paged pet journal. No new game quotas were added.
4. Individual inventory slots with real 3D flame, rotating crystal, orbiting spheres, beveled star, round bomb/fuse, prism and lightning icons. Counts, hover, disabled states, selection and activation feedback follow authoritative game events.
5. Shared smooth glossy bubble geometry and PBR film, clearcoat, slight transparency and filtered environment reflections. No individual bubble lights or expensive refraction pass.
6. A pooled 410 ms pop effect: roughly 8% expansion, wobble, matching-color sparks, expanding fading ripple and a short cluster wave. The game updates immediately. Pools cap at 512 pop records and 1,536 particles and reset completely.
7. Existing animal morphs provide independent blinks, idle movement, walking/hopping, gentle turns, visible chewing, happy post-meal reactions and rescue landing celebrations. A smooth visual depth detour routes pets and their food behind the cannon; logical food positions and eating rules remain unchanged. Bomb production has a short wiggle/drop, preserving exactly-once rewards.
8. Three branching cherry trees with bark PBR maps, 3,444 curved 3D blossoms, 1,445 veined leaves, small blossom beds, path stones and natural grass color/normal/roughness maps. Distant blossoms use simpler geometry. One shader time uniform sways instanced flowers/leaves; vines move slightly. Two merged lantern bodies swing and glow gently. The private gradient sky excludes the city.
9. HUD layouts tested outside the projected board at 1920×1080, 1600×900 and 1366×768; phone journal and touch play are retained. The scene renderer adapts its pixel cost without reducing native-resolution HUD text.
10. Existing gentle launch/pop/power/eat sounds plus the collection chime. Audio starts on a gesture. Sound effects and music have independent working mute controls.

## Validation

- `npm run build`: passes.
- `npm run check:game`: passes. A 58-shot deterministic run rescues five pets through two refills without ending play. All power types, inventory consumption, two-miss rows, grid spacing, persistent food and individual ten-meal rewards pass.
- `npm run check:art`: nine existing UV/PBR species and five facial morphs pass.
- `node scripts/check-stage1-layout.mjs`: all three required desktop sizes pass with no panel/grid overlap or offscreen controls; phone journal and seven isolated 3D shelf icons pass.
- `node scripts/check-stage1-polish.mjs`: actual input swaps/fires; rapid clicks resolve one flight; inventory clicks never shoot; ghost error is zero. Two animals eat 24 distinct fallen bubbles, producing exactly two bombs with no duplicate consumption. Chewing, rescue celebration and cannon detour occur. Active ripple/particle shaders render without WebGL errors; expiry/reset restores all pooled records.
- `npm run check:game:browser`: real multi-pet rescue, continued play, actual misses through game over, retry, touch controls and short-window menus pass without missing assets.
- Audio unit check: no playback before gesture; all required effects and both mute controls pass.
- Official Project 0 devkit: real shots, desktop/phone, pause and reconnect pass without runtime errors.
- Project 0 validation accepts all 59 files, 9,838,113 served bytes, 149,922 readable source bytes and 236,865 bundle bytes, with no errors, warnings or findings. Hash: `14ae33f7a0f52ab1`.

The initial upload exceeded the environment proxy’s single-upload limit. The official parts API validated but its review failed to decode a source image (submission 9000). Unused legacy garden meshes and soil/leaf/velvet maps are now excluded from the published package and no longer loaded; their originals remain in the repository. The complete 7.1 MB ZIP validates as one upload. Texture-load errors also identify the exact asset for diagnostics. `scripts/project0.py --parts` remains available for larger packages.

## Performance and limits

The target remains 60 FPS on capable hardware. This environment only provides Chromium SwiftShader, so hardware 60 FPS is not measured. The official sandbox reported about 3 FPS on both desktop and phone in the final run, including warm-up stalls up to about 3.6 seconds. A separate 1920×1080 software sample averaged 823 ms per frame with scenery adapting to a 960×540 target. These are software-renderer measurements, not a claim of hardware smoothness. The adaptive renderer keeps HUD text sharp; blossoms/leaves/bubbles are instanced, static timber/branches and lantern bodies are merged, reflections are captured once, and effects are pooled. No bloom, plant physics, per-bubble lights or refraction passes were added.

No gameplay regression was found in the completed checks. Performance on an actual user's GPU remains to be measured. Stage 2 is not implemented.

## Optional extras — require approval

Recommended order, subject to performance checks after each addition:

1. Enhanced inventory collection/quantity animations.
2. Advanced flower cannon idle personality.
3. Decorative next-bubble vine, exposing only already-generated colors.
4. Species-specific animal personalities.
5. Animal social interactions.
6. Extended funny bomb-production sequence.
7. Larger-combo celebrations.
8. Environment reactions to large matches.
9. Additional quiet ambient audio.
10. Butterfly visitors.
11. Sparse fireflies.
12. Expanded distant scenery.

Wait for the user's approval before implementing any of these extras.
