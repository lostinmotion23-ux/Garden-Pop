# Current design changes

The user's latest notes supersede the original design document where they differ:

- Use larger, sharper text across the interface, including help and power-ups. Render the interface at the display's pixel density; adapt only the 3D scenery resolution on slow devices.
- Show the shooting bubble by itself. Remove the flower/basket launcher geometry that covered it.
- Right-click swaps the current and next colors in both directions. The touch Swap button and X shortcut also work; swapping back is allowed.
- Randomize colors across starting boards, earned rescue formations and inserted rows. Keep generated patches small and maintain useful shot colors.
- Add one row after **two** unsuccessful ordinary matches. The first miss remains on the visible counter until a second miss; successful matches and powers do not spend that counter. Total misses still affect the end-of-level rating.

All earlier requirements still apply unless superseded: staggered 25/24 hex columns, exactly six ordinary starting rows, earned rescues with one trapped baby at a time, ceiling connectivity, feeding, seven power-ups, ten levels, and the enclosed private garden.
