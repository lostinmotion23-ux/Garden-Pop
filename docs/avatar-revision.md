# Garden Muse revision

A separate, reviewable account-avatar package in `public/avatar-revision`.
The equipped avatar, lot and bubble game are kept intact during this revision.

The rebuilt character has a sculpted face based on CC0 anatomical topology,
fitted almond-shaped eyes, an asymmetrical bob with modeled strand volume,
an anatomical hand mesh, curved fabric straps, a collar, a fitted bib and skirt,
a waistband with a back bow, embroidered fabric, leather boots and a sewn satchel.
The actual head, clothing and hair silhouettes differ from the first avatar.

All views in `docs/avatar-revision-previews` are captures of the exported 3D GLB.
They are not generated illustrations or retouched presentation images.

## Rebuild

```sh
python -m pip install --target .local/avatar-python --no-deps fast-simplification==0.2.0
python scripts/create-avatar-textures.py --revision
python scripts/build_avatar_revision.py
node scripts/check-avatar.mjs --revision
npm run dev -- --port 4177
node scripts/check-avatar-browser.mjs --revision
python scripts/validate-avatar.py validate --package-dir public/avatar-revision
```

Open `/avatar.html?revision=1` for the separate interactive revision viewer.
Use the view buttons and animation selector to inspect both LODs and all clips.

The head and hand foundation is CC0; see `assets/avatar-authoring/README.md`.
No paid generation service or new account was used. All rigging, skin, textures,
hair, outfit, accessories and city animation integration remain editable sources.

The official validation result, budget statistics, rig test and browser test are
stored alongside this document. A downloadable review package contains only
`avatar.glb`, `avatar-lod1.glb` and `avatar.json`, suitable for the official API.
