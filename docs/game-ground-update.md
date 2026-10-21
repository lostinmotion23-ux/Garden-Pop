# Persistent fallen bubbles and predictable row movement

The early multi-row jump came from `Game.addFormation()`: each earned pet inserted four or five complete rows, independently of missed shots. Earned pets now hang from existing supports without shifting existing cells. Two missed ordinary matches still insert exactly one row.

Only ordinary bubbles detached from their supports become food. Directly matched or power-popped bubbles burst and never count as meals. Detached bubbles fall, bounce, and remain on the floor for the current level until a rescued pet eats them, including bubbles dropped before the first rescue.

Pets land, walk toward available food, and eat one bubble at a time. Food reservations prevent two pets from claiming the same bubble. Every ten actual meals by one pet produce a Big Bomb, with a small drop/bounce animation behind the pet before it flies into inventory. Leftover meal counts remain specific to each pet. Pause freezes the garden; pets continue eating behind the completed-level menu. Retry and next level start a fresh garden, as before.

Validation includes all ten levels completed with ordinary shots, stationary existing grid cells during a pet introduction, two-miss row penalties, food retained without rescued pets, no credit for popped bubbles, independent deterministic snapshots, multiple pets sharing food without duplicate meals, and browser checks of visible resting bubbles, real feeding, bombs, pause, desktop and touch input.

Only the playable experience package is published for this revision. The city exterior and equipped avatar remain unchanged.

Published and independently verified live on lot #3157: version `3820a7775dec8b32`, submission `8947`. Official validation returned no errors or warnings. Both desktop and phone passed the official sandbox test.
