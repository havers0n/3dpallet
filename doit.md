Task
Implement a micro-fix for PR2 scene framing.

Object
Fix scene framing so the camera and OrbitControls are centered on the pallet, not on world origin.

Required changes
- set OrbitControls target to the pallet center
- ensure the default camera framing clearly shows the full pallet on first load
- keep current interaction model unchanged
- do not expand scope beyond scene framing

Preferred implementation
Use pallet dimensions from store and center controls around:
[palletWidth / 2, palletHeight / 2, palletDepth / 2]
or a slightly higher Y target if that gives better readability.

Checks
- first load shows the pallet centered in view
- orbit rotates around pallet center, not world origin
- carton selection still works
- no regression in current PR2 behavior

Files expected to change
- src/features/packing-station/scene/packing-scene.tsx
- optionally a tiny scene helper if strictly necessary

Prohibitions
- no PR3 work
- no UI redesign
- no drag-and-drop
- no scene refactor