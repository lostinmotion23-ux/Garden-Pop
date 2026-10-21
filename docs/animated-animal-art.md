# Animated textured animal meshes

User approval recorded on 2026-10-21: “approve the blobs.” In the context of the open `animal-art.html` review page, this approves the current rounded animal models shown there. This records visual approval only; it does not authorize publication or changes to the street display or account avatar.

The latest user reference supplies the target: soft kawaii baby animals, flowers, recognizable species, expressive faces and genuine mesh animation. The earlier concept image remains design context. This implementation uses original three-dimensional mesh geometry and UV/PBR materials; it does not paste either reference onto the animals.

The street family now includes bunny, fox, kitten, blue bird, deer, bear and a pink axolotl. Two decorative bubble animals remain. The game retains its eight existing progression identities, including the puppy; the former dreamling identity now uses the pink axolotl-style mesh. No progression, matching, shot, swap, miss-penalty or scoring rules were changed.

Each character has dimensional cheek/muzzle forms, paws/toes, ears or feathered wings, a tail, layered eye geometry, modeled flower accessories and independent Blink, Smile, Shock, Sad and Wiggle morph targets. Source: scripts/animal_mesh.py. The high-detail playable/review meshes and street meshes share their design and UV maps; street heads use a lighter topology appropriate to their viewing size.

The coat atlas contains directional fur, tabby patterning, feathers, fawn markings, pink velvet skin, inner ears, irises and glossy feature regions. Base-color and normal maps are 1024 pixels; roughness is 512. The pavilion shares a packed 512-pixel atlas with animals in LOD1 to keep its two-material budget. LOD1 and LOD2 are static as required.

Inside the game, actual miss and row-penalty events produce a sad face for 2.3 seconds; a loss holds sadness longer. Matches, rescues, feeding and victory produce smiles. A new animal formation produces surprise. Blinks are staggered per animal; ears, wings and tails move gently. Animations are purely visual and operate only on animals legitimately visible through the existing menus/rescue progression.

The city display uses four GLB animation clips: GardenIdle, GardenSmile, GardenShock and GardenSad. Idle contains staggered blinking and small movements. Tapping the display triggers surprise, entering triggers a smile, and leaving triggers brief sadness. These street reactions are independent from a player's private game session.

Regenerate playable meshes with `npm run animal:assets`; regenerate all street LODs with `npm run models`. `npm run build` copies readable game source and builds the two viewers plus the animal art review page. `npm run check:art` decodes the real GLB and checks maps, morphs, independent clones, UV/color integrity and protective-bubble bounds. `scripts/check-animal-browser.mjs` captures real mesh poses and verifies game loading. The full game browser suite tests sad reactions after actual missed shots along with its existing victory/loss and control regressions.

Actual rendered previews are saved under docs/previews/mesh-animals-*.png. Validation and live publication evidence are recorded separately; a generated asset or local screenshot alone does not prove publication.
