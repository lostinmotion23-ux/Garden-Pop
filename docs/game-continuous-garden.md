# Continuous garden revision

This revision implements the latest user request and supersedes earlier ten-level/victory requirements for the playable interface. It does not change the city exterior or equipped avatar.

- One continuous garden. Rescuing a pet never calls `win`, ends shooting, opens a victory modal, or advances/resets a level. Up to eight different earned pets stay in this garden, walking, eating and producing bombs. Only the ceiling-supported board reaching the danger line ends a run; Restart explicitly starts a new garden.
- Twenty columns, with nineteen positions in staggered alternate rows. Diameter is 0.375 m instead of 0.3 m, a 25% increase while keeping the same board footprint. Matching, aiming, snap positions, side bounces and two-miss row penalties all use these dimensions.
- Three skill bubbles are present from the start and replenished after collection/use. Seven kinds rotate through the board. They have distinct, saturated glossy shells, luminous gold rims and dimensional symbols. Clear their supports to collect them into inventory, then select a skill and its target.
- When fewer than 36 normal bubbles remain, empty cells near the ceiling bloom into new bubbles in place. This does not push existing cells down or reset pets, ground food, inventory, score or the saved miss. Actual clears still earn one trapped pet at a time, with no multi-row pet introduction.
- Detached unpopped bubbles stay on the ground until pets eat them; directly popped bubbles never become food. Ten actual meals per individual pet produce a usable Big Bomb. Remainders stay with that pet. Pausing freezes the garden.
- Real PBR pearl-film textures, clearcoat and iridescence use a captured, filtered environment for reflections. Original wood, stone, leaf, fur, grass and velvet surfaces have color, roughness and normal maps. An HDR render target preserves highlights before tone mapping, warm lanterns emit light, and instanced contact shadows give spheres and walking pets depth. Native-resolution interface text stays sharp while scenery adapts on slower devices.
- Weekly scores are reported during the ongoing run and at game over; rescues do not award a platform victory. Continue keeps the current run within the visit; sessions still do not persist across visits.

The street display remains a separate 25-column miniature attraction; this gameplay revision publishes only the experience package.

Published and independently verified live on lot #3157: version `23769b71cc914f68`, submission `8959`. Platform validation returned no errors or warnings; official desktop and phone sandbox checks passed. The simulation continued through 58 ordinary shots, 5 rescues and 2 refills without ending play.
