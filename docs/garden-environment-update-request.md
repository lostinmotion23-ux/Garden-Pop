# BUBBLE CRITTER GARDEN — MAGICAL GARDEN ENVIRONMENT & GAMEPLAY UPDATE

## OVERALL GOAL

I want you to improve my existing Bubble Critter Garden game in Project 0.

The game is already working. **Do not rebuild it from scratch.** Inspect the existing code, models, materials, lighting, and gameplay systems before making changes.

I want the environment to look like a beautifully crafted miniature fantasy garden, similar to a high-quality cozy 3D game.

Think of a charming storybook cottage garden filled with soft grass, tiny flowers, recognizable trees, weathered stone walls, and adorable animals wandering around.

The world should feel warm, colorful, whimsical, and alive.

**IMPORTANT: I do not want the game to look like it was built from flat green planes, blurry background textures, or generic untextured 3D shapes.**

Everything should have visible depth, intentional shapes, cohesive materials, and natural-looking variation.

Complete all five improvements below as one coordinated update.

---

# 1. REPLACE THE FLAT GRASS WITH A LIVING 3D MEADOW

## Current problem

The grass currently looks like a flat green surface. It does not have enough visual depth or detail.

I want the ground to look like a soft, lush miniature meadow with short individual grass blades, little grass clumps, and adorable wildflowers growing naturally between them.

## Grass design

Create visible 3D grass geometry rather than relying entirely on a grass texture.

Use small clusters containing approximately 3–7 gently curved blades of grass.

The blades should be:

- Short and slightly rounded.
- Soft-looking rather than sharp or spiky.
- Slightly different heights and widths.
- Gently curved in different directions.
- Different but complementary shades of green.
- Properly lit and shaded to give them volume.

Use a palette of spring green, soft mint green, fresh leafy green, and occasional deeper green.

Avoid making the grass look like long, realistic lawn grass or stiff plastic spikes.

### Critical height requirement

**The maximum height of the grass must be approximately one-third of the diameter of a normal gameplay bubble.**

For example, if a gameplay bubble has a world-space diameter of 1 unit, the tallest grass should be approximately 0.33 units.

Measure this relative to the existing bubble geometry rather than guessing an arbitrary world-space height.

The grass must never obscure the falling bubbles or the rescued animals.

## Wildflowers

Mix small, adorable wildflowers naturally throughout the grass.

Include several varieties:

- Tiny white daisies with yellow centers.
- Soft pink five-petal blossoms.
- Little buttery-yellow flowers.
- Small lavender blossoms.
- Occasional pale-blue flowers.

The flowers should have actual 3D petals, stems, and small leaves.

Keep the shapes rounded, slightly chunky, and cute.

Most flowers should be approximately the same height as the grass, with occasional flowers slightly taller.

Keep flowers low enough that they do not hide gameplay objects.

Do not distribute flowers in perfectly even rows.

Instead, use small, irregular clusters with natural gaps.

Some areas should have mostly grass, while other areas contain a few flowers grouped together.

## Gentle wind animation

The meadow should move as though a soft breeze is passing through it.

- Grass should slowly sway left and right.
- Flowers should gently lean and return upright.
- Different clumps should sway at different times.
- Movement should be smooth and organic.
- The roots must remain anchored to the ground.
- Occasionally, a subtle wave of movement can pass across the meadow.

Use a combination of small rotation and bending, preferably through lightweight shader deformation or efficient procedural animation.

Avoid having every plant sway in perfect synchronization.

Avoid excessive or cartoonishly exaggerated bending.

The overall effect should be calm and relaxing.

## Technical requirements

Use instanced geometry or another efficient batching method where appropriate.

Reuse a small library of grass and flower meshes with randomized scale, rotation, and color variation.

Keep grass and flowers decorative, without expensive individual physics colliders.

Preserve the existing terrain boundaries and layout.

---

# 2. REDESIGN THE BACKGROUND FOREST WITH CLEARLY RECOGNIZABLE TREES

## Current problem

The existing skybox or distant background has blurry green shapes that vaguely resemble trees.

I want to be able to look into the distance and clearly recognize individual trees.

I do not want the forest to look like an indistinct green blur.

## Visual direction

Create a beautiful stylized 3D forest behind the playable garden.

The forest should resemble a magical woodland surrounding a miniature cottage garden.

Trees should have recognizable:

- Trunks.
- Branch structures.
- Leaf canopies.
- Different heights.
- Different silhouettes.
- Visible separation from neighboring trees.

## Tree design

Use several types of trees.

### Rounded storybook trees

Create trees with soft, rounded clusters of foliage.

Their canopies should resemble several overlapping leafy masses rather than one perfect sphere.

### Tall woodland trees

Include some taller trees with visible trunks and branching structures.

Their foliage should have a slightly more vertical silhouette.

### Small decorative trees

Add smaller saplings and bushier trees to break up the forest outline.

Vary trunk thickness, canopy size, and branch placement.

Do not simply duplicate one tree model at identical scales and regular intervals.

## Materials and colors

Use soft natural colors:

- Fresh spring green.
- Warm leafy green.
- Slightly darker forest green.
- Occasional yellow-green highlights.
- Warm brown and muted gray-brown bark.

Give trunks subtle bark texture.

Give foliage depth through overlapping geometry, lighting, and material variation.

Avoid using completely smooth green spheres as finished tree canopies.

## Forest depth

Build the background using distinct depth layers.

### Near-background trees

These should have the most recognizable detail.

Their trunks, branches, and foliage shapes should be clearly visible.

### Middle-distance trees

These should remain recognizable as individual trees but use simpler geometry.

### Far-distance trees

These can have softer silhouettes and less detail, but should still look like trees.

Use gentle atmospheric perspective to create distance.

**Do not use strong blur, thick fog, or an indistinct green texture to hide the background.**

If the existing skybox cannot support actual 3D trees, place lightweight tree geometry inside the scene in front of the skybox.

Keep the skybox for distant sky colors and atmosphere.

## Forest animation

Tree canopies and smaller branches should move very slightly in the breeze.

Use slow, gentle motion.

The distant forest should feel alive without constantly attracting attention.

## Gameplay visibility

Keep the trees behind the gameplay area.

Do not allow foliage or branches to cover the bubble grid, cannon, HUD, or animals.

The forest should create a beautiful backdrop rather than compete with the main game.

---

# 3. ADD PROPER COLLISION AND OBSTACLE AVOIDANCE TO RESCUED ANIMALS

## Current problem

The rescued animals can walk through one another.

This makes them feel like objects without physical presence.

I want each animal to occupy its own space and react naturally when another animal is in the way.

## Individual collision shapes

Every rescued animal must have an appropriately sized collision shape.

Use a lightweight capsule, circle, or rounded collision box that fits its body.

Collision shapes should:

- Follow the animal's position.
- Match its approximate body width.
- Ignore decorative tails, ears, or other protrusions where appropriate.
- Prevent bodies from overlapping.
- Remain consistent during idle and movement animations.

Do not use expensive per-triangle mesh collision for ordinary animal movement.

## Animal-to-animal collision

Animals must not pass through one another.

When two animals approach:

1. Detect the potential collision.
2. Slow or redirect their movement.
3. Allow one or both animals to steer around the obstruction.
4. Maintain a small natural separation.
5. Continue normal wandering once the path is clear.

The animals should not violently bounce away from each other.

Avoid jittering, sudden teleportation, and repeated direction changes.

## Natural obstacle avoidance

Animals should also avoid:

- The flower cannon.
- Solid garden decorations.
- Stone walls.
- The edges of the playable meadow.
- Other rescued animals.

Use lightweight steering and local avoidance rather than a heavy physics simulation.

If an animal cannot find a clear path, it should pause briefly, look around, and choose another direction.

## Spawning and crowded areas

When a new animal is rescued, choose an available landing or spawn location.

Do not spawn it inside an existing animal.

When the meadow becomes crowded, animals should:

- Reduce their wandering distance.
- Wait when necessary.
- Choose open areas.
- Avoid clustering inside one another.

## Eating behavior

Preserve the existing mechanic where animals eat falling bubbles.

Animals must still be able to reach bubbles while respecting collision boundaries.

If another animal blocks the path, the approaching animal should navigate around it.

Prevent multiple animals from claiming and consuming the same bubble.

Use a target reservation or equivalent system if needed.

## Bomb production

Preserve the existing rule that an animal produces a bomb after eating ten bubbles.

Collision changes must not interfere with eating counts, bomb rewards, or inventory collection.

## Performance

Use simple ground-plane collision calculations wherever practical.

Avoid running unnecessary collision checks against distant decorative objects.

Use the existing game update loop.

---

# 4. MAKE THE AIMING GUIDE PROGRESSIVELY DISAPPEAR AS SCORE INCREASES

## Current behavior

The game currently provides an aiming guide that shows where bubbles will travel.

I want this assistance to become less visible as the player's score increases.

This should make the game gradually more challenging without changing the actual shooting mechanics.

## Score-based aiming guide rules

### Score below 3,000

The aiming guide should appear normally.

Show:

- The dotted aiming trajectory.
- Predicted wall reflections.
- The landing preview, if currently implemented.

Use the normal guide opacity.

### Score from 3,000 to 4,999

The aiming guide should become noticeably fainter.

Reduce its opacity to approximately 25–35% of its normal appearance.

The player should still be able to see the trajectory if looking carefully, but it should no longer be strongly visible.

Keep wall-bounce predictions and landing previews equally subdued.

### Score of 5,000 or higher

**Completely hide the dotted aiming trajectory and landing preview.**

At this stage, the player should have to judge the shot direction themselves.

Only a small directional pointer attached to the flower cannon should remain visible.

## Flower cannon directional pointer

Create a cute, subtle aiming pointer that visually belongs to the flower cannon.

I suggest a small, softly glowing leaf-shaped or petal-shaped pointer near the front of the flower head.

Requirements:

- Always points in the exact direction the bubble will launch.
- Rotates smoothly with the flower cannon.
- Remains visible after the aiming guide disappears.
- Small enough not to obstruct the current bubble.
- Clearly distinguishable from decorative petals.
- Does not extend far into the playfield.
- Uses soft cream, golden-yellow, or another contrasting garden-friendly color.

The pointer should be visible at all score levels so the player becomes familiar with it before the aiming guide disappears.

## Transitions

At 3,000 points, smoothly fade the guide to its reduced opacity.

At 5,000 points, smoothly fade it out completely.

Suggested fade duration: approximately 300–500 milliseconds.

Do not abruptly remove the guide in the middle of a shot.

If a shot is currently in progress, apply the updated guide appearance to the next aiming state.

## Important gameplay rules

- Use the existing score value as the source of truth.
- Do not create a separate score counter.
- Do not change projectile speed.
- Do not change shooting accuracy.
- Do not change wall reflection calculations.
- Do not change bubble snapping or matching rules.
- Do not change the 20-column hexagonal grid.

If the score decreases or the game resets, the guide should update correctly for the new score.

The system must also work if a single scoring event crosses both thresholds.

---

# 5. REPLACE THE STRAIGHT BRICK WALL WITH AN IRREGULAR RUSTIC STONE WALL

## Current problem

The garden wall currently looks like neatly stacked bricks with straight rows.

I want it to resemble an old, charming stone wall surrounding a magical cottage garden.

The stones should look naturally arranged rather than manufactured.

## Stone wall appearance

Replace the uniform brick pattern with irregularly sized, individually shaped stones.

Use a mixture of:

- Large rounded stones.
- Medium uneven stones.
- Smaller filler stones.
- Occasional flatter stones.
- A few naturally angular stones with softened edges.

The stones should fit together like a rustic fieldstone wall.

Avoid repeated rectangular bricks.

Avoid perfectly straight horizontal courses.

Avoid a uniform grid pattern.

## Stone shapes and arrangement

Each stone should have a slightly different shape.

Some should be:

- Wider than they are tall.
- Taller and narrower.
- Rounded and chunky.
- Slightly flattened.
- Uneven along the edges.

Arrange them in an organic interlocking pattern.

Use small stones to fill gaps between larger stones.

Do not create large unnatural empty holes.

Stagger joints so vertical gaps do not continue through multiple rows.

## Surface materials

Give the stones subtle surface texture and natural color variation.

Suggested palette:

- Warm gray.
- Soft beige.
- Muted taupe.
- Light weathered brown.
- Occasional mossy gray-green.

Avoid overly dark or highly saturated stone colors.

Each stone should have slight roughness variation.

Use soft shading and ambient occlusion to emphasize the gaps.

## Actual 3D depth

The wall must not look like a flat brick texture applied to a rectangular box.

Individual stones should have visible depth.

Some stones should protrude slightly farther than others.

Use bevels, irregular silhouettes, and natural surface variation.

The wall should cast gentle shadows that emphasize the separate stones.

Optimize geometry by reusing a small collection of varied stone meshes.

## Uneven wall silhouette

The top edge should be slightly irregular.

Some stones can sit a little higher than others.

Do not make the top wildly jagged or structurally implausible.

The wall should still look stable and intentionally built.

## Moss and tiny plants

Add subtle natural details:

- Small patches of moss between stones.
- Tiny flowers growing from occasional cracks.
- A few little trailing plants.
- Small green sprouts near the base.

Use these details sparingly.

The stones should remain the main visual feature.

## Preserve the existing wall placement

Keep the wall in its current location.

Preserve its approximate overall height, length, and gameplay boundaries.

Do not move the wall into the shooting area.

If the wall currently provides collision boundaries, preserve those boundaries.

Do not let decorative protruding stones interfere with animal movement or gameplay.

---

# 6. MAKE ALL FIVE IMPROVEMENTS VISUALLY COHESIVE

The grass, flowers, trees, stone wall, and animals should all look like they belong in the same miniature 3D world.

Use consistent:

- Lighting direction.
- Shadow softness.
- Material roughness.
- Color saturation.
- Geometry detail.
- Scale relationships.
- Animation speed.
- Storybook art style.

Avoid having realistic trees next to cartoon grass, or flat stones next to highly detailed 3D flowers.

Aim for a polished, softly stylized appearance.

The garden should feel handcrafted, welcoming, and magical.

---

# 7. PERFORMANCE AND IMPLEMENTATION

This game runs in a browser, so performance matters.

Use efficient rendering techniques.

Recommended approaches:

- Instanced meshes for repeated grass and flowers.
- Shared materials where practical.
- Reusable tree meshes with controlled variations.
- Low-to-moderate polygon stone meshes.
- Lightweight wind shaders.
- Simple animal collision shapes.
- Efficient spatial lookup for nearby animals.
- One shared animation loop.
- Proper cleanup of temporary objects.

Do not add thousands of independent animation callbacks.

Do not use expensive full-scene physics for decorative grass or trees.

Target smooth 60 FPS on capable desktop hardware.

Prioritize stable gameplay over visual effects.

---

# 8. CRITICAL GAMEPLAY PRESERVATION

The following must remain unchanged:

- **20 bubbles wide**, not 25.
- Six starting bubble rows.
- Existing hexagonal grid spacing.
- Existing bubble size.
- Current board proportions.
- Current flower cannon firing mechanics.
- Existing collision and snapping rules.
- Existing bubble colors.
- Existing special bubbles and power-ups.
- Existing animal rescue logic.
- Existing eating mechanics.
- One bomb per ten eaten bubbles.
- Existing score calculation.
- Existing level progression.

Do not alter gameplay simply to accommodate the new environment.

The visual improvements must adapt to the current game.

---

# 9. REQUIRED TESTING

After implementation, verify all of the following.

## Environment

- Grass has visible 3D volume.
- Grass stays at or below one-third of a bubble's diameter.
- Flowers remain miniature and do not obscure bubbles.
- Grass and flowers sway gently.
- Trees are clearly recognizable.
- Forest depth is visible without excessive blur.
- The stone wall uses irregular shapes and sizes.
- The stone wall does not resemble neatly stacked bricks.
- Environmental objects do not obstruct the gameplay area.

## Animals

- Animals cannot walk through one another.
- Animals avoid the cannon and solid obstacles.
- Animals do not jitter when approaching each other.
- Animals can navigate crowded areas.
- Animals can still reach and eat fallen bubbles.
- No bubble is consumed twice.
- Bomb rewards still work correctly.

## Aiming guide

- Below 3,000 points: normal guide.
- From 3,000 to 4,999: faint guide.
- At 5,000 and above: no trajectory or ghost landing preview.
- Flower cannon pointer remains visible.
- Pointer direction matches actual shooting direction.
- Guide returns correctly after game reset.
- Wall-bounce physics remain unchanged.

## General gameplay

- Grid remains exactly 20 bubbles wide.
- Six starting rows remain.
- Bubble sizes and spacing remain unchanged.
- Shooting and swapping still work.
- Matching and popping still work.
- Power-ups still work.
- Animals are rescued correctly.
- Levels still complete correctly.
- No significant frame-rate degradation.

---

# 10. IMPLEMENTATION INSTRUCTIONS

I want all five changes completed as **one coordinated update**, not five unrelated visual experiments.

However, implement them in a safe internal sequence:

1. Inspect the existing game and identify the relevant systems.
2. Record current board dimensions, gameplay rules, and baseline behavior.
3. Build and integrate the new short 3D grass and wildflowers.
4. Improve the distant forest and tree models.
5. Replace the uniform brick wall with irregular 3D stones.
6. Add animal collision and avoidance behavior.
7. Implement score-based aiming guide visibility.
8. Check that all elements share a consistent visual style.
9. Optimize rendering and movement.
10. Test all five changes and the existing gameplay together.

**Do not stop after writing a plan. Implement the improvements in the actual existing game code.**

If an existing system differs from what these instructions assume, adapt the implementation to that system while preserving its working behavior.

When finished, tell me:

- What you changed.
- Which files you modified.
- How you implemented the grass and flowers.
- How the forest trees are rendered.
- How the stone wall geometry was built.
- How animal collision and avoidance work.
- How the aiming guide responds to score.
- What tests you completed.
- Whether any features remain incomplete.

## FINAL VISUAL TARGET

I want Bubble Critter Garden to feel like a tiny enchanted garden that you could almost reach into and touch.

The grass should look soft and fluffy. The flowers should gently dance in the breeze. The trees should be recognizable and beautiful. The old stone wall should feel naturally weathered and handcrafted. The animals should move around one another as real little creatures would.

The whole environment should be adorable, cohesive, and alive.

**Please implement this entire update while preserving my existing game and its 20-bubble-wide grid.**