# BUBBLE CRITTER GARDEN — POLISH UPDATE

## PRIORITY SYSTEM

Improve the existing Project 0 Bubble Critter Garden game in two stages:

**STAGE 1 — MUST-HAVE POLISH:** Essential improvements to the game's appearance, usability, animations, and presentation. Complete and test these first.

**STAGE 2 — OPTIONAL EXTRAS:** Additional decorative animations, personality features, and visual enhancements. Only implement these after Stage 1 is finished, stable, and performing well.

Do not sacrifice performance or working gameplay for optional decorations.

## NON-NEGOTIABLE RULES

- Preserve the existing **20-bubble-wide hexagonal grid**.
- Preserve the six starting rows.
- Do not change bubble diameter, spacing, board dimensions, or gameplay proportions.
- Preserve existing bubble physics, matching, wall bouncing, and collision behavior.
- Preserve all five bubble colors.
- Preserve existing animals, their models, and rescue mechanics.
- Preserve existing power-up abilities and inventory functionality.
- Preserve the rule that animals produce a bomb after eating ten bubbles.
- Do not rebuild the game from scratch.
- Do not modify unrelated Project 0 systems or lots.
- Use textured, properly lit 3D models rather than flat placeholders or emoji.
- Reuse existing assets and architecture wherever possible.

Inspect the existing project before implementing anything.

---

# STAGE 1 — MUST-HAVE POLISH

These improvements are required.

## 1. Flower cannon redesign

Replace the visually unclear launcher with a polished 3D flower cannon.

Appearance:

- Six to eight rounded petals.
- Soft pink and lavender colors.
- Golden-yellow flower center.
- Curved green stem and rounded leaves.
- Subtle petal texture and natural material shading.
- Soft highlights and consistent garden lighting.
- Current bubble clearly visible inside the flower.

Animation:

- Flower head smoothly follows the aiming direction.
- Petals compress slightly when firing.
- Flower gently recoils after each shot.
- Petals return to their original positions.
- Subtle idle swaying when inactive.

The shooting animation must not delay or change actual projectile physics.

Preserve existing shooting and bubble-swapping controls.

## 2. Accurate, attractive aiming system

Improve the existing aiming visuals without changing trajectory calculations.

Required:

- Small, evenly spaced glowing aiming dots.
- Soft ivory or pale-yellow coloring.
- Approximately 65–80% opacity.
- Correct wall-bounce visualization.
- No leftover or duplicated trajectory lines.
- Smooth pointer tracking.
- A translucent ghost bubble showing the predicted landing location.

The ghost bubble must:

- Match the current bubble color.
- Have approximately 40% opacity.
- Snap visually to the existing hexagonal grid.
- Accurately predict the actual attachment location.

The aiming preview must never disagree with the real collision system.

Hide or deactivate aiming visuals when interacting with HUD controls.

## 3. Proper game HUD

Replace plain text counters with a cohesive storybook-style interface.

Use:

- Warm cream or parchment-colored panels.
- Rounded carved-wood borders.
- Small decorative leaves and flowers.
- Soft shadows.
- Readable dark-brown text.
- Consistent typography and spacing.

Create rescue progress cards for the existing animals.

Each card must show:

- Existing animal portrait or recognizable model preview.
- Animal name.
- Current rescue count.
- Required rescue count.
- A clearly visible progress bar.

When an animal is rescued, smoothly animate the progress bar and briefly highlight the portrait.

Also organize the existing level, score, pause, and sound controls wherever supported.

Do not invent new gameplay restrictions or counters.

The HUD must not overlap the bubble grid.

## 4. Organized power-up inventory

Redesign the existing inventory into a polished wooden shelf with individual slots.

Each slot needs:

- A recognizable 3D power-up icon.
- Quantity indicator.
- Hover feedback.
- Selected-state highlight.
- Disabled or empty state.
- Clear activation feedback.

Give existing abilities distinct appearances:

- Fire: glowing flame inside a bubble.
- Color clearing: rotating magical crystal.
- Color rearrangement: orbiting pastel spheres.
- Bomb: cute rounded bomb with glowing fuse.

Keep the existing power-up logic unchanged.

Power-ups must be granted and consumed exactly once per valid gameplay event.

Do not let inventory interaction accidentally fire the cannon.

## 5. Better bubble materials and lighting

Improve the appearance of the five existing bubble colors.

Required:

- Smooth spherical geometry.
- Soft glossy highlights.
- Gentle internal gradients.
- Subtle rim lighting.
- Slight translucent appearance.
- Consistent light direction.
- Clear color distinction.

Suggested colors, only if compatible with the current palette:

- Pink: #F4A8CA
- Purple: #B5A3E8
- Blue: #93D7F0
- Yellow: #F5D88D
- Green: #A8DDBB

Avoid opaque plastic-looking bubbles.

Avoid expensive dynamic lighting for every individual bubble.

Preserve bubble sizes, collision centers, and grid positions.

## 6. Satisfying bubble popping

Every popped bubble should have a short, polished animation.

Sequence:

1. Expand approximately 8%.
2. Briefly wobble.
3. Burst into color-matched sparkles.
4. Produce a subtle circular ripple.
5. Fade particles away.

Target duration: approximately 250–450 ms.

For large matches, create a quick ripple through the cluster.

Use lightweight pooled particles.

Gameplay state changes must not wait for the visual animation to finish.

## 7. Essential animal animations

The existing rescued animals must no longer appear completely static.

Each animal needs:

- A gentle idle animation.
- Basic walking or hopping.
- Occasional head movement.
- A visible eating animation.
- A happy reaction after eating.
- A celebration when rescued.

Use existing models and animations wherever possible.

Create lightweight procedural movement where needed.

Animals must remain inside their designated area and avoid the cannon.

### Eating behavior

When a fallen bubble is available:

1. An eligible animal notices it.
2. The animal approaches it.
3. The animal performs an eating animation.
4. The bubble is consumed according to existing rules.
5. The animal reacts happily.

Prevent multiple animals from consuming the same bubble.

### Bomb production

After ten consumed bubbles, preserve the existing bomb reward.

Add a short, playful animation showing the animal producing the bomb.

Grant exactly one bomb per valid reward event.

## 8. Essential garden animation

Make the existing environment feel alive without overcrowding it.

Required:

- Gentle flower swaying.
- Slight vine movement.
- Soft lantern glow.
- Subtle lantern swinging.
- Better grass and ground textures.
- Consistent environmental lighting.

Use lightweight procedural animation.

Do not add expensive physics to decorative plants.

## 9. Layout and responsive presentation

Keep the current 20-column board exactly as it is.

Improve the visual environment surrounding the board.

Required:

- Eliminate the plain gray empty-background appearance.
- Extend the existing garden theme into unused screen areas.
- Keep the flower cannon clearly visible.
- Keep animals and inventory separate from the shooting area.
- Maintain readable UI at common desktop resolutions.
- Preserve accurate aiming after resizing.

Test at 1920×1080, 1600×900, and 1366×768.

Do not resize the board to accommodate decorations.

## 10. Essential audio feedback

If audio is supported, include:

- Soft bubble popping sounds.
- Gentle cannon launch sound.
- Power-up activation sound.
- Bubble collection chime.
- Cute animal eating sound.
- Functional mute control.

Respect browser autoplay restrictions.

Keep sounds gentle and unobtrusive.

---

# STAGE 2 — OPTIONAL EXTRAS

These features are desirable but not required for the initial polish update.

Only implement them after all Stage 1 requirements are complete and tested.

## 1. Advanced flower cannon personality

- Petals slowly open and close while idle.
- Flower tilts curiously toward nearby animals.
- Leaves wiggle during shooting.
- Flower reacts to large bubble combinations.
- Small glowing pollen particles appear occasionally.

Keep these effects subtle.

## 2. Decorative next-bubble vine

If the existing queue supports it, display up to three upcoming bubbles on a curved vine beside the cannon.

Use small 3D bubbles resting in leaf-shaped cradles.

Animate the preview bubbles advancing after each shot.

Do not change the random bubble sequence or reveal future colors that have not been generated.

## 3. Advanced combo celebrations

Add floating messages for large combinations:

- Lovely!
- Amazing!
- Bloomtastic!
- SUPER POP!

Animate text with gentle scaling, upward movement, and fading.

Add small decorative sparkles.

Do not alter scoring unless supported by existing game mechanics.

## 4. Unique animal personalities

Give each existing animal distinctive behavior.

**Mochi**

- Energetic hopping.
- Nose wiggles.
- Playful excitement.
- Happy bouncing.

**Clementine**

- Gentle wandering.
- Curious head tilts.
- Flower sniffing.
- Shy reactions.

**Clover**

- Playful movement.
- Excited spins.
- Curious exploration.
- Mischievous reactions.

Adapt these behaviors to the actual animal species and model capabilities.

Do not rebuild existing animal rigs.

## 5. Animal social interactions

Occasionally allow rescued animals to:

- Approach each other.
- Face one another.
- Nuzzle or sniff.
- Perform a synchronized happy bounce.
- Watch another animal eat.
- Briefly interact with the flower cannon.

Use independent timing so the animals do not behave identically.

Prevent excessive overlap.

## 6. Funny bomb-production animation

Enhance the basic bomb reward animation.

Suggested sequence:

1. Animal pauses.
2. Belly expands slightly.
3. Animal looks surprised.
4. Animal makes a tiny hop.
5. Sparkling bomb appears behind it.
6. Animal looks relieved or happy.
7. Bomb enters inventory.

This must remain a purely visual enhancement.

Do not change the ten-bubble requirement.

## 7. Butterfly visitors

Add two or three lightweight 3D butterflies.

They may:

- Fly around the garden edges.
- Hover near flowers.
- Land on leaves.
- Flutter away.

Use soft pastel wing colors.

Keep them away from the central bubble grid and aiming trajectory.

## 8. Magical fireflies

Add a few tiny glowing fireflies.

They should:

- Drift slowly.
- Pulse softly.
- Appear at varying depths.
- Fade in and out.
- Remain mostly around the garden edges.

Avoid excessive particle counts.

## 9. Environmental reactions

When a large cluster pops:

- Nearby flowers briefly wiggle.
- A few petals float upward.
- Lanterns sway gently.
- Rescued animals look excited.

These effects should trigger only during significant gameplay events.

## 10. Expanded garden scenery

If performance and available space permit, enhance the surrounding environment with:

- Distant rounded hills.
- Stylized foliage.
- Tiny mushrooms.
- Decorative stones.
- Small flower clusters.
- Soft sky gradients.
- Subtle depth and background layering.

Do not clutter the board or change its proportions.

## 11. Enhanced inventory animations

When a special bubble is collected:

- Show a glowing miniature icon moving toward the inventory.
- Briefly illuminate its destination slot.
- Animate the quantity update.

When used:

- Show a short magical activation effect.
- Briefly enlarge the selected icon.
- Fade the highlight after consumption.

All visual effects must follow authoritative gameplay state.

## 12. Extra audio and ambient atmosphere

If suitable assets and performance budget are available:

- Gentle garden ambience.
- Soft bird chirping.
- Occasional butterfly or magical sounds.
- Rising musical flourish for large combos.
- Unique animal reaction sounds.
- Light environmental audio variations.

Avoid repetitive or intrusive sound effects.

---

# IMPLEMENTATION AND TESTING RULES

## Complete Stage 1 first

Implement Stage 1 in this order:

1. Flower cannon.
2. Aiming guide and ghost bubble.
3. HUD.
4. Power-up inventory.
5. Bubble materials and lighting.
6. Bubble pop animations.
7. Basic animal animations.
8. Essential garden animation.
9. Layout and responsiveness.
10. Audio feedback.

Test each system after implementation.

Do not start Stage 2 while Stage 1 has unresolved gameplay regressions.

## Stage 1 acceptance criteria

Before declaring Stage 1 complete, verify:

- The hexagonal board is still 20 bubbles wide.
- The starting formation still has six rows.
- Bubble diameter and spacing are unchanged.
- Shooting and swapping still work.
- Wall reflections remain accurate.
- Ghost bubble landing predictions are correct.
- Bubble matching and clearing work.
- Disconnected bubbles fall correctly.
- Special bubbles still function.
- Power-up inventory counts are accurate.
- Animals are rescued correctly.
- Animals eat falling bubbles without duplicate consumption.
- Ten eaten bubbles still produce one bomb.
- Level completion and reset work.
- Animations do not obstruct gameplay.
- The game remains responsive.
- No temporary particle objects accumulate indefinitely.

Test rapid clicking, resizing, simultaneous falling bubbles, reset during animations, and power-up activation.

## Performance requirements

Target smooth 60 FPS on capable desktop hardware.

Use:

- Shared geometry and materials.
- Object pooling.
- Lightweight procedural animation.
- Minimal dynamic lighting.
- Existing render loops.
- Proper cleanup of temporary effects.

Gameplay responsiveness takes priority over visual decoration.

## Optional extras approval gate

After Stage 1 is complete:

1. Report which improvements were implemented.
2. Report any remaining issues.
3. Provide test results.
4. Identify performance concerns.
5. List the optional extras in recommended implementation order.

**Do not automatically implement Stage 2. Wait for my approval before adding optional extras.**

## Final objective

Bubble Critter Garden should feel like a professionally polished, cozy 3D game.

The game must be adorable, colorful, responsive, cohesive, and satisfying to play.

Preserve the existing detailed 3D models and textured art style.

Avoid flat placeholders, emoji as final assets, generic untextured primitives, excessive particles, and inconsistent lighting.

**The existing 20-bubble-wide board is the correct size. Do not change it.**

Begin by inspecting the existing project, then implement all Stage 1 improvements directly. Do not stop at planning unless a genuine blocker prevents implementation.