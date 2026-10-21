# Garden fairy: source-model production handoff

Status: source asset required. No fairy model has been created or published.
The user's supplied fairy image is the visual authority. The existing Garden
Muse avatar is not a suitable visual starting point for this character.

## Required external modeling step

Have a character artist create a reference-matched high-resolution sculpt and
textured master in Blender, ZBrush or an equivalent character-modeling tool.
An image-to-3D service such as Meshy or Tripo can supply a draft, but the draft
must receive character-artist cleanup before it is treated as the final asset.
Generation alone is not evidence that the reference-quality requirement is met.

The provided image supplies the front/three-quarter design. Back and side
surfaces are not visible in it: produce corresponding turnaround views and
resolve those unseen surfaces consistently before committing to the final sculpt.
Do not substitute a generic fairy, alter the visible design, or use a painted
character card as geometry. The checkerboard is the reference's background;
it must not become part of any material or exported scene.

Required deliverable: an editable `.blend` (preferred) or equivalent source,
plus a textured `.glb` export and its source texture maps. The creator must
provide the rights needed to modify, optimize and publish the character.

## Visual design to preserve

- An explicitly adult, petite garden fairy with the reference's stylized chibi
  proportions, rounded facial anatomy, green eyes, pink cheeks, tiny freckles,
  pointed ears, delicate nose and mischievous smile.
- Dusty rose hair in a large, loose bun. Model the hair masses and layered locks,
  face-framing strands, flowers and leaves with convincing volume from all sides.
- The reference's dimensional leaf outfit: individually shaped, veined, curled
  leaves over cream fabric/lace, daisies, overlapping vines and strapped sandals.
  Preserve the visible silhouette, layering, colors and coverage in the image.
- Four attached organic wings with pastel iridescent membranes, curved edges,
  gold vein structures and restrained sparkle. Give membranes thickness/curvature
  appropriate to close views and handle front/back surfaces deliberately.
- A relaxed upright pose, arms slightly away from the body, natural feet, all
  wings and the complete body visible. No floor, scenery, pedestal or background.

## Master asset and surface requirements

Keep a detailed master separate from the delivery LODs. Sculpt and texture the
face, eyelids, lips, ears, hands and toes; correct anatomy and expression by
inspection, not only automated geometry checks. Include facial morphs that retain
the likeness through blinks, smiles, surprise and sadness.

Retain editable skin, hair, eyes, leaves, vines, flowers, lace and wing materials.
Supply base-color, normal, roughness and ambient-occlusion maps, plus alpha masks
and any wing iridescence/transmission masks. Preserve the original high-resolution
maps for the master; bake the city models from that source.

Bake diffuse textures without the reference's lighting, checkerboard, cast
shadows or sparkle highlights. Use actual layered leaves and hair forms for
silhouette depth; normals and color maps carry smaller surface details.

## Confirmed Project 0 delivery limits

Inspected the official skill and the account's live `/api/agent/me` budget on
21 October 2026, Europe/Stockholm. See https://project0.city/skill.md#4-avatar.

| Requirement | Main avatar | Distance avatar |
| --- | --- | --- |
| File | `avatar.glb` | `avatar-lod1.glb` |
| Triangles | 20,000 maximum | 5,000 maximum |
| Draw calls/materials | 6 maximum each | 3 maximum each |
| Textures | 6 maximum, at most 1024 px each | 3 maximum, at most 512 px each |
| Optimized file size | 3 MiB maximum | 1.5 MB per documentation |
| Coordinate system | Metres, +Y up, +Z forward, origin at feet | Same |
| Bounds | At most 3 m tall and 2.5 m wide | Same character and proportions |

The main avatar also has a 4,194,304-texel budget (including the validator's mip
accounting), at most 3 skinned meshes, 75 bones, and 24 clips. The high-resolution
master need not satisfy these limits; the baked city exports must.

The game uses Three.js/glTF animation. Required clips are `idle` and `fly`.
Recommended city clips: `fly_fast`, `ascend`, `descend`. Walking can be prepared
as an additional clip for future experience use, but the city automatically
selects the documented flight clips, not `walk`.

Use the same skeleton, material names and clip names in both LODs. Include a
wing rig with a stable attachment to the upper back, appropriate hair movement,
normalized skin weights and facial morphs. Keep the wings, leaves and accessories
attached through all movement/emote poses. Export in-place animation loops.

`avatar.json` may configure head tracking, idle gestures and four emotes.
PBR materials, transparency and custom GLSL surface/vertex hooks are documented.
Full offline-render skin scattering and wing transmission parity are not
guaranteed by those options; prototype them in the actual city renderer.

The 1024px/20k city limits require a baked game asset. Preserve the master rather
than promising that every microscopic detail in the reference can survive those
limits unchanged at every zoom level.

## Quality review and integration sequence

1. Review front, back, side and three-quarter renders of the actual textured
   source mesh against the reference. Check face, eyes, bun volume, proportions,
   leaf layering, wings and material response individually. Identify any design
   deviations rather than calling an illustration or draft a finished avatar.
2. Complete sculpt, facial expression, hand, hair, leaf and wing corrections.
3. Retopologize, UV, bake and rig; produce both city LODs and all animation clips.
4. Test face, hair, alpha edges, wings, attachments and material response under
   Project 0 lighting, including close-up, phone and distance views.
5. Validate using `POST /api/agent/avatar/validate`; correct all findings.
6. Once the reference-quality gate is satisfied, publish through the official
   avatar endpoint and independently verify the submission and equipped model.
   Do not modify or publish the Bubble Critter Garden lot or playable experience.

## Current environment capability finding

Blender is installed. No connected tool creates 3D assets from images, no
Meshy/Tripo/fal service credential is configured, and no local 3D-generation
runtime or GPU runtime is available. The available image-generation tool produces
2D images, not a riggable GLB. The remaining blocker is producing the approved
reference-quality source mesh, not the Project 0 upload or animation API.

No paid service has been called. Any future paid generation requires its own
account access and an approved provider/job cost before execution.
