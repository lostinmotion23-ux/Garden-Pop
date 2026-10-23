# First difficulty pass — 2026-10-23

## Bubble visibility check and fix

The visibility audit reproduced an actual omission: a board plus persistent fallen food totaling 2,314 normal bubbles rendered only 2,048 because `GardenView.update` silently stopped at a fixed instance limit. The bubble, glint and contact-shadow batches now grow geometrically to cover the live board/food/pets. Replaced instance buffers are disposed while shared geometry and materials are retained. Ordinary play retains the existing initial allocations.

`npm run check:game:visibility` reproduced the failure before the fix and passes afterward on desktop and phone layouts. It checks all 2,314 live instances, compares actual rendered pixels at the centers of 40 different colors and current/next/fire balls, and checks finite colors/transforms through 80 updates and repeated row insertions. All color and launcher samples changed all 25 sampled pixels when their meshes were shown. No browser errors were reported. Detailed results are generated at ignored `.local/bubble-visibility-check.json`. This is local verification, not a hardware performance measurement or Project 0 deployment.

## Score-based color progression

The latest instruction supersedes the initial five-color limit: begin with five colors, then add one for every 10,000 total points (6 at 10,000; 7 at 20,000; 8 at 30,000; continuing without a cap). The next named additions are Coral, Teal, Orange, Indigo, Pearl and Berry; further colors are generated deterministically. Unlocks apply to fresh rows/refills, with no repainting of existing bubbles. The normal queue still chooses colors present on the board. Wild can select every unlocked color using its More button. Unlocks show a toast, and the regular HUD displays the active count. Restart restores five colors; snapshots derive the count from score.

Rendering and pop effects extend their cached palettes as colors unlock. `npm run check:game:colors` covers exact milestone boundaries, generation, reset, snapshot compatibility and actual desktop/phone selection, matching, rendering and effects for new colors. The desktop rescue cards now also use the reduced roster length instead of assuming eight entries.

## Animal roster update

The user subsequently requested removing Twinkle (dreamling), Maple (bear) and Biscuit (puppy). They are removed from the shared progression/journal roster. The five remaining animals are Mochi (bunny), Clementine (fox), Clover (kitten), Pip (bird) and Fern (deer), in that order. Existing model assets are retained. Restart a running local game to begin with the revised roster.

The user approved aimed fire limited to five bubbles and a three-Big-Bomb inventory cap. This explicitly supersedes earlier instructions to preserve these particular rules. Five colors, the continuous 20-column board, other skills, animal models and navigation remain as before. No Project 0 publication was requested or performed.

Fire Ball replaces Fire Row. Select Fire, then aim and launch using the normal shot controls and analytic wall-bounce trajectory. The first collision seeds a deterministic breadth-first spread through touching occupied cells, up to five total. It cannot jump a gap. Orange rings show precisely which cells will burn; the fire guide remains visible at high scores. Disconnected bubbles fall using the existing food, collection and rescue rules, so a shot may drop more than five while burning at most five. An aim with no collision does not spend fire inventory.

All normal Big Bomb grants share the three-bomb cap, including skill-bubble collection and pet production. Pets continue eating at full storage; their bomb meal counters pause and resume once there is room. Meals eaten while full do not bank extra bombs. Partial counters earned before storage became full are preserved. Loading an older snapshot clamps surplus bombs to three.

Canonical changes: `src/experience/game/rules.js`, `pet-navigation.js`, `view.js`, `ui.js`, and `src/experience/main.js`. Build synchronizes these into `public/experience/`.

Validation:

- `npm run check:game`: continuous replay plus first-hit fire, connected spread, consumption, gap isolation, wall-bounce support shot (5 burned / 26 dropped), capped collection, full-storage feeding, resumed production and legacy snapshot clamping.
- `npm run check:game:fire`: actual desktop mouse and mobile touch selection/launch, matching preview and removal, consumption, and high-score fire preview. Passed.
- `npm run check:game:browser`: real-input continuous rescues, swap, pause, losing/retry and phone touch; passed with no browser errors or failed assets.
- `npm run build`: readable package synchronization and production build. Passed.

On this Windows machine use `npm.cmd` if PowerShell blocks `npm.ps1`. Playwright Chromium is absent; browser checks used installed Chrome by setting `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to `C:\Program Files\Google\Chrome\Application\chrome.exe`.
