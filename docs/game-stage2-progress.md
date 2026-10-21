# Stage 2 — local progress, not published

The user authorized Stage 2, then requested a new skybox/background design. The [enclosed magical garden concept](magical-garden-skybox-design.md) is available for review. Publication is held while the environment direction is reviewed; the existing live game is Stage 1, submission 9001 / version 14ae33f7a0f52ab1.

Local changes include real 3D inventory collection flights aimed at actual responsive slots, animated quantity badges, cannon idle breathing/curiosity/leaf movement/combo response/pollen, a single known next-bubble vine, bounded combo celebration overlay, species-specific pet poses, brief social reactions, staggered depth lanes, extended bomb production, instanced 3D butterflies/fireflies, large-match garden reactions, a few merged distant hills/mushrooms, and original gentle nature/bird/combo cues. The game only exposes one generated next color, so the vine shows one bubble; no future colors are generated or revealed.

All logical rules remain byte-identical to Stage 1. Personality/social/bomb animations alter meshes only. Counts remain authoritative and immediate. World bomb production hands off to a single UI flight rather than duplicating flying bombs.

Performance safeguards: at most 16 inventory flights, reusable flight records/models, one reusable small combo texture instead of per-frame full-HUD redraws for combos, shared foliage/scenery geometry/material batches, no additional lights or postprocessing, three butterflies/eight fireflies reduced to one/three on slow frames. Existing pet models/morphs are reused. Ambient audio obeys the existing gesture and SFX mute control. The live game's hardware performance is not measured.

Local validation:

- Build passes.
- Rules regression passes, including 58 shots, five rescues, two refills and all seven powers.
- Layout test passes at 1920×1080, 1600×900, 1366×768 and phone journal.
- `npm run check:game:stage2` passes: presentation updates leave the game snapshot unchanged; the flower does not obstruct the current ball; three powers create exactly three inventory flights, with no duplicate grants; flights expire and reuse their pool across 30 cycles; combo overlays expire; two pets eat 24 distinct food bubbles and produce two bombs; bomb/social poses occur; normal/reduced visitor caps are correct; reset clears temporary effects; no browser/WebGL errors.

A background concept illustration has been generated. It is not used as a flat replacement for the game scene and has not been published. The full courtyard/pond/skybox background in that illustration is proposed work, distinct from the local Stage 2 implementation above. Official final devkit, API validation and publication are pending the environment decision and implementation.
