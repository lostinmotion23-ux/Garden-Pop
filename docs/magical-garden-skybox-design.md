# Enclosed magical garden — proposed environment direction

[Concept illustration](previews/magical-garden-skybox-concept.png)

This is a design illustration, not a screenshot of an implemented or published environment. The illustration proposes scenery and lighting; the actual existing animal meshes, grid proportions and gameplay will be preserved.

Replace the sparse lawn and pale horizon with a private 360-degree enchanted botanical courtyard. A seamless skybox establishes warm dusk light, soft clouds, distant hills and a flowering grove. Actual 3D terrain, trees, stonework, plants and water provide the foreground and middle distance. Keep the board and launcher as actual 3D game objects; do not use the concept image as a flat substitute for the scene.

## Composition

- Foreground: a finished rounded stone terrace, visible flower cannon, low grass between paving stones, restrained mossy rocks, small ferns and flowers around the edges. Pets keep their walking and feeding space.
- Middle distance: a shallow reflective pond beyond the play area, low curved stone walls, a short waterfall at one side and a winding path. No water or planting crosses the launch lane.
- Frame: textured curved timber and brass, smaller flowering vines, warm hanging lanterns. Blossom crowns sit in the upper outer corners instead of blocking the bubbles.
- Distance: layered tree silhouettes, flowering cherry grove, atmospheric hills and a dusk sky surrounding the full scene. No city, white void, open lawn edge or visible skybox seams.
- Behind the bubbles: quieter, darker teal-green foliage and haze. Keep bright flowers, water reflections and fireflies away from the board for contrast.
- UI: preserve readable parchment panels and the existing responsive layout. The concept's illustrated portraits are not replacement animal assets.

## Lighting and performance

Use a single consistent dusk key light, a soft sky fill, the existing filtered reflection environment and restrained amber lanterns. Put most distant detail into a low-cost skybox; use real mesh geometry where parallax, interaction or near detail matters. Use an inexpensive water surface with a scrolling normal map, no real-time reflection or refraction pass. Continue shared materials, merged static meshes, instanced foliage, capped visitors and pooled effects.

## Scene controls

Expose a small garden theme configuration for sky colors/skybox orientation, fog and distance layers, light color/intensity, pond and flower-bed placement, lantern warmth and visitor density. That gives the environment a coherent art direction without touching game rules.

The same layout can support a brighter daylight variant if preferred. Background publication is held while the user reviews the design direction.
