# Amira · Garden Muse

Original, fully three-dimensional Project 0 account avatar: rounded face, hazel
irises on curved eye surfaces, layered chestnut hair, a daisy bow, cream knitted
sweater and tights, lavender linen pinafore, woven sage satchel, and leather boots.
The skin, yarn, linen, leather, hair fibres and irises use embedded PBR textures.

The avatar is separate from Bubble Critter Garden. Neither the published lot nor
the playable experience is part of the avatar package or publishing command.

## Deliverables

- `public/avatar/avatar.glb`: full-detail textured and skinned character.
- `public/avatar/avatar-lod1.glb`: lighter character with the same skeleton,
  material name, facial morphs, and animation names.
- `public/avatar/avatar.json`: official Project 0 motion, head tracking,
  idle/blink, reaction and emote configuration.
- `avatar.html`: standalone interactive model inspector, served with Vite.
- `docs/avatar-previews/`: screenshots of the actual exported meshes.

Metres, +Y up, +Z forward; feet at the origin. Height approximately 1.992 m,
rest width 1.078 m. One skinned mesh, one material, three embedded texture maps
and 22 bones in each model. The model has normalized weights with at most four
influences per vertex. PBR maps are 1024 px for the main model and 512 px for LOD1.

City movement clips: `idle`, `fly`, `fly_fast`, `ascend`, `descend`. Additional
clips: `joy`, `approval`, `sadness`, `indignation`, `blink`, `look_around`.
Facial morphs: `Blink`, `Smile`, `Sad`. City emote keys 1–4 play Joy, Approval,
Sadness and Indignation. Looking at lots and liking them trigger reactions.

## Rebuild and check

```sh
python scripts/create-avatar-textures.py
python scripts/build_avatar.py
node scripts/check-avatar.mjs
npm run dev -- --port 4177
node scripts/check-avatar-browser.mjs
python scripts/validate-avatar.py validate
```

Open `/avatar.html` on the Vite server to rotate the real GLB, change LOD, and
play individual clips. The browser check expects the server on port 4177.
The generated JSON reports record budget, inverse-bind, weight normalization,
pose bounds, animation-loop, runtime and visual-capture checks.

The secure environment supplies `P0_KEY`. No key is stored in the package.
`python scripts/validate-avatar.py publish` posts only the three avatar files to
`POST /api/agent/avatar`. Read-only `/me` and submission checks confirm the result.
Official requirements: https://project0.city/skill.md#4-avatar.

The character, textures and animations were authored specifically for this
account; there are no purchased models, copied characters or flat animal sprites.
