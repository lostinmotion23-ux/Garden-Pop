> The latest user request is implemented in [Continuous garden revision](game-continuous-garden.md): one ongoing garden, 20/19 columns, three skill bubbles and no rescue victory/level advancement. It supersedes conflicting requirements below.

# BUBBLE CRITTER GARDEN — COMPLETE GAME DEVELOPMENT INSTRUCTIONS

You are developing **Bubble Critter Garden**, a beautiful, fully playable, 3D bubble-shooter game inside my existing Project 0 lot. You have already been working on my lot and know its number, API requirements, publishing process, and technical restrictions.

**Create the actual game and its complete interface from the beginning, not just a decorative 3D environment or visual demonstration.** Use the attached reference image as the primary visual inspiration. Implement, test, refine, and publish a complete playable version.

## 1. Art direction and visual quality

Create a magical pastel fantasy garden with extremely cute, rounded, expressive little animals. Use pastel pink, lavender, mint, baby blue, peach, and buttery yellow; warm lighting; rounded beveled shapes; dimensional flowers, leaves, vines, wood, stone, and lanterns; soft shadows; reflections; magical particles; and expressive animation.

**Use real textured 3D graphics, not flat images or cardboard cutouts.** Use PBR materials, UV maps, and texture maps where appropriate. Wood needs grain and roughness, stone needs texture, leaves need variation, flowers need layered petals, animals need sculpted faces and bodies, bubbles need transparent glossy highlights, and the launcher needs dimensional flower geometry. Avoid untextured placeholder primitives. Optimize for Project 0 budgets.

Create a 3D garden pavilion with a large wooden-framed board, flowering vines, hanging lanterns, waterfalls, grass, rounded stone pathways, and a garden at the bottom for rescued animals. Keep the gameplay camera mostly straight-on for accurate aiming; allow subtle movement without obscuring the board.

## 2. Game interface

Follow the attached image as a visual reference, but adjust for a wider board.

- **Left panel:** Bubble Critter Garden title, level, score, rescued/remaining animals, star progress, pause, and audio settings. Use attractive textured, dimensional wooden signs.
- **Center:** Large bubble board, aiming guide, launcher, danger line, falling-bubble area, and rescued-animal garden. This is the main focus.
- **Right panel:** Collected power-ups with dimensional icons, names, counts, selected states, and tooltips.
- **Responsive:** Desktop mouse and mobile touch controls. Reposition/collapse panels on small screens rather than shrinking everything until unreadable.

## 3. Hexagonal bubble grid

**Mandatory: use a staggered hexagonal grid, not a square grid.** Alternate horizontal offsets of half a bubble diameter. Implement consistent logical grid coordinates and correct neighbors, flood-fill matching, ceiling connectivity, snapping, falling, and new-row insertion.

The board is approximately **25 bubbles wide**, alternating **25 and 24 positions** per row as appropriate. **Every level starts with exactly six complete rows of ordinary colored bubbles hanging from the top.** The five colors are pastel pink, lavender purple, baby blue, soft yellow, and mint green. Make each bubble glossy, rounded, subtly translucent, and easy to distinguish. Leave open aiming space below the initial rows.

**No trapped baby animals are in the initial six rows or immediately available to rescue.** Initial layouts must offer useful matches and be fair and solvable.

## 4. Aiming and shooting

Players aim by mouse or touch-drag. Show a dotted predictive trajectory including wall bounces and expected impact/snapping position. The flower-shaped launcher at bottom center displays the current bubble and next bubble. Optionally allow one current/next swap per shot. Avoid giving colors with no useful matches unless intentionally required by a mechanic.

On firing, animate the bubble along the aim vector, bounce off walls, collide with a bubble or ceiling, snap to the nearest valid hex cell, evaluate matching groups, pop valid matches, drop unsupported bubbles, update the board, and load the next shot. Use reliable physics/grid calculations rather than visual approximations.

**Three or more touching bubbles of the same color, counting the fired bubble, pop as one connected group.** Two do not. Use flood fill. Add satisfying popping animations, sparkle bursts, and sounds.

## 5. Failed shots, new rows, and game over

**Every regular shot that fails to pop at least three same-color bubbles adds exactly ONE new full row at the top immediately after the shot resolves.** Do not wait for multiple misses.

After a failed shot: snap the shot, verify no qualifying pop, insert a new row of approximately 25/24 bubbles, push all attached rows downward by one hex-row spacing while preserving parity and adjacency, animate the slide, play a warning sound, and check the danger line. Successful matching shots do not add a row.

If **any attached bubble** reaches/crosses the bottom danger line, end the game. Falling bubbles and rescued animals do not count. Show a cute Game Over screen with final score, level, animals rescued, Retry, and Main Menu.

## 6. Animals and rescue progression

Create real textured 3D creatures: fluffy white bunny with pink ears, orange fox, kitten, round blue bird, tiny deer, sleepy bear, puppy, and pastel fantasy creature. Sculpt dimensional bodies, paws, ears, tails, faces, eyes, and noses. Use expressive idle breathing, blinks, wiggles, and little motions. **Do not use flat animal sprites pasted onto spheres.**

Animals are **earned by clearing the puzzle**. Never put them in the initial six rows. After meaningful progress (based on actual bubbles cleared or sections completed, **not merely shots fired**), introduce new solvable formations containing trapped animals surrounded by several layers of regular bubbles. Early rescues require work; later rescues require more strategy. Missing deliberately must not advance unlocks. Do not introduce formations that unfairly cause an immediate game over.

Trapped animals float inside larger transparent glossy protective bubbles with depth, reflections, and sparkles. A rescue occurs when the protective bubble loses its ceiling support or is freed by a valid power-up. Animate its gentle descent, magical pop, safe landing, celebration, score award, and rescue-counter update. Prevent duplicate rescues.

## 7. Rescued animal behavior and bombs

Rescued animals remain in the 3D garden at the bottom. They wander, hop, blink, wag, sit, nap, celebrate, and occasionally interact. When unsupported ordinary bubbles fall, rescued animals automatically approach and eat them with cute animations and sparkles.

**Track eaten bubbles separately for each animal. Every ten detached/fallen bubbles eaten by an individual animal produces one cartoon bomb in the inventory.** Use a funny wiggle, little poof, and sparkle animation. Preserve remainder counts. Normally popped bubbles do not count as eaten. The bomb is a usable power-up.

## 8. Power-up bubbles and inventory

Special bubbles appear in later formations and are **collected when released**, not automatically activated. Animate them falling into the inventory. Give each a distinct textured 3D icon, quantity, selection feedback, targeting preview, and cancellation behavior.

- **Fire Row:** Orange flame bubble; select a horizontal row to burn away.
- **Rainbow Clear:** Swirling rainbow bubble; choose a color to clear all ordinary bubbles of that color.
- **Shuffle:** Lavender rotating-arrows bubble; rearrange ordinary bubble colors in place without moving animals or making the board unsolvable.
- **Star Bomb:** Golden star bubble; clear a small radius.
- **Big Bomb:** Dark-purple bomb with gold star; clear a larger radius, primarily earned from animal feeding.
- **Wild Bubble:** Pearlescent color-changing shot that can match any chosen color.
- **Lightning:** Blue bubble with yellow bolt; clear a vertical column.

After effects, recompute ceiling support, drop detached bubbles, and rescue freed animals. Power-up actions must not trigger the ordinary missed-shot row penalty. Prevent double activation and negative inventory.

## 9. Levels and difficulty

Build **at least ten complete playable levels**, all beginning with six ordinary rows and no immediately accessible animals.

- Levels 1–2: Basic matching, bouncing, falling, and first earned rescues.
- Levels 3–4: More animals, first special bubbles, strategic aiming.
- Levels 5–6: Complicated layouts and color distributions.
- Levels 7–8: Layered rescue formations and careful power-up planning.
- Levels 9–10: Combined mechanics, several rescues, and a satisfying final challenge.

Use authored layouts or deterministic seeds to make levels reproducible. Test for solvability and fair shot colors. All required animals must be rescued to win; clearing the initial six rows alone is not victory.

## 10. Scoring, stars, and victory

Suggested starting values: 10 points per popped bubble, 20 per detached bubble, 250 per animal rescue, 100 per chain reaction, plus an efficiency-based level completion bonus. Tune after playtesting.

Award one to three stars based on efficiency, misses, and safety, with all required animals rescued for level completion. Once the final rescue and animations finish, pause shooting and show a celebration with animals, score, stars, Next Level, and Replay. Integrate Project 0's supported weekly score leaderboard.

## 11. Animation, particles, and audio

Animate glossy bubble idle motion, launching, bouncing, snapping, squash/stretch, popping, falling, and chain reactions. Animate animal breathing, blinking, ear twitches, tails, hopping, eating, bomb production, and celebrations. Add swaying foliage, petals, gentle waterfalls, lantern glow, and restrained sparkles. Use pooling and particle limits for performance.

Include appropriately licensed or created sounds for shooting, popping, large matches, falling, rescues, animal chirps, power-ups, row warnings, victory, and game over. Include gentle cheerful fantasy music, separate music/SFX mute controls, and comply with browser audio activation restrictions.

## 12. Multiplayer

Support cooperative Project 0 sessions if feasible, without sacrificing working single-player. All players should see the same grid, level, rescued animals, and inventory. Use Project 0 room state/messages with an authoritative host or deterministic state protocol; synchronize new joiners and handle disconnects/host changes. Serialize or safely arbitrate simultaneous shots to avoid corrupting the board. Never duplicate rescues, scores, or rewards.

## 13. Menus and controls

- **Main Menu:** Play, Continue, How to Play, Settings, Leaderboard; animated animals behind it.
- **How to Play:** Explain match-three, wall bounces, disconnected falls, one new row per unsuccessful regular shot, danger line, earned animal rescues, collectible power-ups, and bombs after ten eaten fallen bubbles.
- **Pause:** Resume, Restart Level, Settings, Main Menu, Exit Experience.
- **Game Over:** Score, level, rescued animals, Retry, Main Menu.
- **Victory:** Celebrating animals, level complete, stars, score, Next Level, Replay.

Desktop: mouse aiming and left-click to fire, click power-ups. Mobile: touch-drag aiming, release to fire, touch-friendly inventory and menus. Show clear control hints.

## 14. Technical structure and performance

Use the supported Project 0 experience API and its allowed Three.js version. Read the official guides and inspect the existing project before modifying it. Organize into clear modules such as `main.js`, `GameManager.js`, `BubbleGrid.js`, `BubbleShooter.js`, `CollisionSystem.js`, `MatchSystem.js`, `RowManager.js`, `AnimalManager.js`, `AnimalAI.js`, `PowerUpManager.js`, `LevelManager.js`, `ScoreManager.js`, `UIManager.js`, `AudioManager.js`, `MultiplayerManager.js`, and `AssetManager.js` (adapt filenames to actual needs).

Stay within sandbox and model budgets; do not use unsupported browser APIs, libraries, or external requests. Optimize with shared geometry, instancing where suitable, texture atlases, object pooling, efficient flood fill/collision, restrained effects, and appropriate texture sizes. Preserve high-quality textured animal models and foreground artwork.

## 15. Required tests

**Grid and shooting:** Verify hex parity and neighbors, 25/24-wide six-row starts, accurate wall bounces and snapping, matches of 3+ pop, matches of 2 do not, unsupported groups fall, successful shots add no row, failed shots add exactly one row, repeated row additions preserve grid integrity, and only attached bubbles trigger the danger line.

**Animals:** Verify no starting animal is accessible, progress is earned through clearing, introduced formations are solvable, rescues happen once, animations and wandering work, only fallen bubbles count as food, and each animal produces exactly one bomb per ten eaten.

**Power-ups:** Verify each can be collected, targeted, canceled, and activated, quantities update, effects and subsequent falls/rescues work, and no missed-shot penalty is triggered by power-up use.

**Levels and UI:** Test all ten levels, victory/retry/menu transitions, score/stars, responsive desktop and touch aiming, readable UI, audio toggles, and multiplayer sync where implemented.

**Performance:** Test large pops, particle bursts, animal animation, memory usage, and mobile frame rate. Fix persistent runtime errors.

## 16. Visual polish and publication

Compare the **running game** with the attached image. The image is a **design reference, not a flat background to paste into the game**. Ensure the animals are expressive and dimensional, wood has visible texture, flowers have real petals, bubbles are glossy, and the interface remains readable around the 25-wide board. Improve anything that looks like a placeholder.

Inspect existing work first and preserve useful assets. Build the gameplay, create/refine textured models and interface, add animations and audio, test and fix mechanics, validate the experience and any changed 3D build files, publish to the existing lot, and verify players can enter and play. Do not claim testing or publication unless confirmed. If an API call fails, diagnose it; if an asset is unavailable, make a suitable replacement. If work spans multiple sessions, preserve progress rather than restarting with a simplified demo.

**Top priorities:** Beautiful genuine textured 3D art; 25-column staggered hexagonal grid; exactly six starting rows; no initially accessible animals; animals earned through real progress; one new row after every failed regular matching shot; reliable danger-line game over; fully playable polished experience.
