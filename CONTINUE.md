# Continue here — Bubble Critter Garden

Saved checkpoint: **2026-10-21**. Repository: `lostinmotion23-ux/Garden-Pop`. Project 0 lot: **3157**.

## Where the full project is saved

The GitHub save for this step contains **the three requested images and continuation notes only**. The full code/assets are saved in the downloadable **Garden-Pop-local-checkpoint.zip** provided in the chat. Extract that ZIP and open its project folder in VS Code to continue development. If this file is being read from a preview-only GitHub clone, obtain/extract the full checkpoint before attempting to run or edit the game. Do not assume source files are present in that preview-only clone.

The initial full local Git checkpoint is `84ed340`. A full-workspace push was rejected by automatic approval review because it extended beyond the requested three-image upload and repository visibility could not be verified. The GitHub upload was narrowed accordingly; no game credentials are included in either save.

## Latest user instruction

> Just save this step. I am gonna pick up locally on visual code. Make sure you note what you were doing so the AI knows where to continue from when I say continue, upload those 3 images to the github so it can show them to me there when I say continue.

**Pause implementation/publication at this checkpoint.** The next AI should first display the three saved images from [the preview gallery](docs/preview-gallery.md), explain their status, then resume the work described below when the user says “continue.” No Project 0 deployment was requested as part of this save.

## The three images to show first

1. [Magical garden skybox concept](docs/previews/magical-garden-skybox-concept.png) — generated art-direction illustration. **Proposed, not implemented or live.** It suggests a lush enclosed courtyard at warm dusk, layered cherry groves, a quiet dark teal backdrop behind the bubbles, a pond/waterfall, stone terraces, mossy paths and warm lanterns. Its illustrated animals are not replacements for the existing models.
2. [Actual desktop game preview](docs/previews/stage1-garden-desktop.png) — native-quality render of the implemented Stage 1 game, before Stage 2. This shows the current sparse background the user dislikes.
3. [Actual phone game preview](docs/previews/stage1-garden-phone.png) — corresponding Stage 1 mobile render.

The images are ordinary repository PNGs. Use Markdown image links, VS Code's image viewer, or the GitHub gallery. Do not invent an interactive visualization or substitute the concept image for the actual game scene.

## What the user wants next

The user approved starting Stage 2, then steered the task:

> I don't like the current background of the game. Can we put it in a skybox where we will be able to control more of the surrounding area. I still want it a magic garden. Can you give me a design that would make it look more complete.

We generated the concept and wrote [the environment design](docs/magical-garden-skybox-design.md). An optional question offered warm dusk, brighter daylight, or revising the concept. The user answered by pausing to save, **not by selecting a lighting variant**. Warm dusk is the recommendation, not a confirmed final choice. Show the images and use the next user message to settle any remaining art preference before a major rebuild.

The actual game currently has a private gradient sky dome and procedural cherry trees, but **the complete 360° courtyard/pond/skybox from the concept has not been built**. The user specifically dislikes the sparse lawn/pale horizon. Plan a coherent controlled environment, with distant skybox scenery and real 3D foreground/midground for depth. Preserve a quiet backdrop behind the board and clear shooting/pet spaces. The concept is a target for composition/material/lighting direction, not a promise that the current procedural renderer already matches its detail.

## Live versus saved state

- **Live game:** Stage 1, submission **9001**, version **`14ae33f7a0f52ab1`**, independently verified live.
- **Live exterior:** submission **8719**, version **`0f2d008c227885da-4dec2914a81eaf1e`**. Unchanged.
- **Equipped avatar:** Fern fox, submission **8943**, URL `https://files.project0.city/avatars/1248/35c63b1cea62fc80/avatar.glb`. Unchanged.
- **Working source in this repository:** unpublished Stage 2, built and tested locally. This save does **not** publish it to Project 0.
- [Publication record](docs/publication.json) and [Stage 1 verification](docs/game-stage1-verification.json) describe the confirmed live state.
- [Stage 1 source checkpoint](docs/checkpoints/stage1-experience/) preserves the pre-Stage 2 source and manifest for comparison; it is not used by the build. Street/animal assets remain under `public/`.

## Stage 2 work already saved locally

Read [Stage 2 progress](docs/game-stage2-progress.md) and [the original Stage 1/2 request](docs/game-stage1-polish-request.md).

- `power-shelf.js`: bounded reusable real 3D collection flights targeting responsive inventory slots; selected/activation feedback. `ui.js`/`hud.js`: actual quantities in animated badges.
- `cannon.js`: idle petal breathing, slight curiosity toward nearby pets, firing leaf motion, combo reaction, curved single-next-bubble vine. `view.js`: gentle next-color advance and occasional pooled pollen. The queue exposes only the one color already generated by the game.
- `pet-life.js`: species-specific procedural poses and occasional neighbor interactions, passing depth lanes, longer playful bomb-production poses. Uses existing animal meshes/morphs; does not alter the rules, paths, meal reservations or rewards.
- `celebrations.js`: a reusable small overlay texture for Lovely/Amazing/Bloomtastic/SUPER POP, outside the grid. No new scoring logic.
- `visitors.js`/`ambience.js`: three instanced 3D butterflies, eight fireflies, small large-match reactions; slow-frame mode reduces them to one butterfly and three fireflies, plus fewer drifting petals.
- `botanical.js`: large-match plant/lantern reactions and a few merged hills/mushrooms. These are modest additions to the old background, **not the proposed courtyard rebuild**.
- `audio.js`, `scripts/create-stage2-assets.py`: original small butterfly wing texture, breeze loop, quiet bird/pet/combo cues; gesture unlock and SFX mute remain in force.
- `main.js`: event-driven integration, reset/cleanup, local test controller exposes `process`, `pavilion`, `ambience`, `celebrations`. These do not become production globals.
- World bomb production hands off to one overlay flight so a reward is not represented by two simultaneous flying bombs.

## Rules and boundaries to preserve

`src/experience/game/rules.js` is byte-identical to live Stage 1. Do not alter it for scenery or personality work.

- 20/19 staggered touching columns, six initial rows, radius **0.1875**, diameter **0.375**, existing five colors and trajectory/matching/bounce calculations.
- One continuous garden; rescue never ends the run. Two missed matches add one row.
- Three skill bubbles initially and replenishing. Same seven abilities and exact inventory consumption.
- Existing 3D animals are earned through progression; at most one trapped pet at a time.
- Detached unpopped normals persist as food. Popped bubbles are not food. Each pet earns exactly one bomb per ten actual meals; no duplicate consumption.
- Existing pet models, textures and facial morphs are preserved. Natural botanical art direction, no return to kawaii placeholder scenery.
- No unrelated lot, exterior or avatar changes.

## Local setup and entry points

```sh
npm ci
npm run dev
```

Open Vite's `game.html` URL for the playable game. The root page previews the separate city exterior. `src/experience/` is canonical; `public/experience/` is synchronized by `npm run build`. Edit the manifest/assets directly under `public/experience/`, not `dist/`.

Node 24 was used. Python asset generation needs Pillow/numpy; existing music tooling uses FFmpeg. Blender 4.3 is needed only for model rebuilding, not ordinary game/background source edits. Browser scripts currently point to `/usr/bin/chromium`; adjust that path for local Windows/macOS or use installed Playwright Chromium. This portability change has not been made yet.

## Tests completed at this checkpoint

- `npm run build` — passes.
- `npm run check:game` — passes: 58 shots, five rescues, two refills, all seven powers, continuous game, spacing, food/rewards. Generates the ignored `.local/game-continuous-replay.json`; run it before replay-driven browser/capture scripts on a fresh clone.
- `npm run check:game:layout` — passes at 1920×1080, 1600×900, 1366×768, plus phone journal. Resize waits for actual layout; software rendering can be slow.
- `npm run check:game:stage2` — passes with no browser/WebGL errors. Presentation updates do not mutate game snapshots; current ball is unobstructed; three collected powers produce three flights without duplicate grants; flight pool stays bounded across 30 cycles; combos expire; two pets eat 24 bubbles and produce two bombs; bomb/social poses occur; visitor caps and reset work.

**Still pending for Stage 2 / the new environment:** actual Stage 2 desktop/phone captures, final real-input regression after any scenery changes, official Project 0 devkit on the final package, API validation and publication. Stage 1's official devkit passed, but do not treat that as Stage 2 approval.

Performance: this cloud only had SwiftShader software rendering. Stage 1's final official test ran around 3 FPS with startup stalls; hardware 60 FPS is unverified. Keep Stage 2 lightweight, use capped/reused effects, and profile on the user's real GPU. Do not claim measured hardware smoothness. Avoid extra lights, reflection/refraction passes, unbounded particles or foliage physics.

Useful commands after setup:

```sh
npm run build
npm run check:game
npm run check:game:layout
npm run check:game:stage2
npm run check:game:polish
npm run check:game:browser
npm run check:devkit
```

Run GPU browser checks sequentially and avoid editing source while a Vite/Playwright test is running (HMR resets the game). There is no need to rerun every historical exterior/avatar test for a game-only background edit.

## Publication notes for a later authorized deployment

The user asked to save now, so **do not deploy during this handoff**. When later instructed to publish, read `docs/project0-skill.md` / `docs/project0-games.md`, validate the exact readable `public/experience/` package and publish only that package.

`scripts/project0.py` expects `P0_KEY` in a local environment variable. **The key is intentionally not in GitHub.** Supply it privately on the local machine. Never echo it or place it in browser code.

The client excludes unused legacy `garden.glb` and old leaf/soil/velvet map sets from the upload while retaining originals in the repo. This keeps the Stage 1 ZIP around 7.1 MB. A larger monolithic ZIP hit the cloud proxy's limit. An earlier parts upload validated but failed the review image decoder (submission 9000); the smaller complete ZIP then passed as 9001. Prefer a complete ZIP if it fits. A 202 is pending: poll the returned submission instead of republishing blindly. Confirm a live submission and matching `/me` version, plus unchanged exterior/avatar, before reporting success.

The cloud's proxy CA approval and secret bindings do not automatically transfer to a local machine. Retain normal TLS verification. The last attempt to clear the temporary building indicator failed because this environment's network proxy became unavailable; that status expires automatically and does not alter the live game.
