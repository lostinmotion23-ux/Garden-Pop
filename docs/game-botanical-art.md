# Botanical garden art revision

The later [Stage 1 polish report](game-stage1-polish.md) supersedes the emblem and HUD details below: the shelf now uses animated 3D power models and the HUD uses parchment rescue cards. This document records the preceding botanical art pass.

The current requested direction is natural garden scenery rather than kawaii decoration. Keep the approved bubble dimensions and continuous garden rules. The city exterior and account avatar are separate packages and are not part of this revision.

The playable frame now uses grain-textured timber posts, a layered curved arch, braces, brass collars and framed glass lanterns. Smaller curved blossoms and veined foliage replace the oversized rounded vine flowers. The interface uses timber, ivory, brass and sage colors instead of pastel pink controls and a multicolor title.

Three actual 3D cherry trees stand behind a lightly tinted board backing. They have curved, tapering trunks, roots, branching limbs, bark color/normal/roughness maps, and irregular crowns. The garden contains 3,444 instanced blossoms made of curved petal geometry and 1,445 thin veined leaf instances, with flower beds, rocks and a stone path. The private sky still excludes the outside city. Ambient effects are gently drifting cherry petals; the old floating water and glitter are removed.

Seven original illustrated skill emblems now follow the curved front surface of each 3D skill bubble and appear beside the desktop inventory names. The symbols are flame, rainbow, crossed arrows, star, bomb with fuse, faceted prism, and lightning. The prism uses a darker green shell for contrast. All skills retain their original behavior. The atlas is a transparent 1024 × 512 PNG and does not replace scenery or character geometry.

The renderer, light sources and shared reflective materials remain genuinely three-dimensional. Review images with `-quality` in their names are still renders of the exact production scene at native quality. Interactive rendering still adapts to slower devices; the phone captures use the normal play loop.

Validation: real pointer shots continue after an earned rescue; three skills remain present; swap, touch and pause work; all seven skill meshes render; no runtime errors or missing assets. A restart notification regression discovered during visual review is fixed. The renderer-independent rules file is byte-for-byte unchanged from the prior live continuous garden.
