# Exterior review against the supplied game reference

The reference is the user's magical bubble-shooter interface: flowered wooden framing, lanterns, glossy colored bubbles, animal bubbles, rescued critters, and a garden foreground. It is design context; none of its pixels are used in the close or middle models.

| Reference feature | Rebuilt miniature exterior |
| --- | --- |
| Wooden garden arcade framing | Four rounded timber posts, two curved arches, depth braces, wood-grain PBR texture, raised 3D title lettering |
| Bubble board as main attraction | Dark lavender inset board, five pastel colors, touching 25/24-column staggered rows with a descending lower silhouette |
| Glossy magical bubbles | Actual 3D spheres, low roughness, subtle transparency, specular/environment response and small modeled highlights |
| Protective animal bubbles | Two decorative dimensional baby animals with transparent shells and modeled rims/highlights |
| Rescued critters at front | Seven textured mesh animals: bunny, orange fox, lavender kitten, blue bird, deer, bear and pink axolotl, with dimensional eyes, highlights, ears, noses, paws, tails/wings and UV fur texture |
| Flowered garden foreground | Layered rounded island, textured grass, stone path and rim, shrubs, clover, flowers, one flowering cherry tree and compact waterfall |
| Warm magical accents | Emissive warm lanterns, butterflies, independent blinking, mesh smiles/surprise/sad poses and gentle decorative bobbing and an exterior-only layered flower launcher |
| White-city contrast | Lavender board and warm wood frame keep the pastel scene readable; the required city box uses subtle mode with a pastel outline |

The exterior is a miniature attraction with real depth and a visible island silhouette. The full gameplay HUD, power-up signs and level interface remain inside the separate playable game. Exterior display animals are decorative; the game still requires rescue progression.

Street-facing capture: [front](previews/exterior-street-front.png). Additional view: [angle](previews/exterior-street-angle.png). These captures render the exported GLB in a street-style viewer, with a pale city ground/background and a faint lot outline. Publication verification is recorded separately in publication.json and exterior-verification.json.

LOD0 and LOD1 retain actual bubble/animal geometry. At very long distance, LOD2 reduces the attraction to its garden/pavilion silhouette and uses an original tiny atlas tile for board detail. The near model is not a picture or billboard recreation of the reference.
