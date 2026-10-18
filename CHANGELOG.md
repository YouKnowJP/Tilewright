# Changelog

## 0.1.1 — 2026-10-18

- Fit the entire map on initial load, replacement, and workspace resize; add
  25% and 50% zoom options.
- Bound the scrollable workspace so zooming cannot expand the page. Keep page
  wheel scrolling available when the map fits; preserve the view center on zoom.
- Add mouse/touch drag-to-pan and keyboard panning. Keep a keyboard drawing
  cursor visible, and prevent canvas focus from jumping the page.
- Give small screens the full canvas width, reflow palette/settings, and retain
  save warnings. Prevent mobile text fields from triggering browser zoom.
- Replace font-dependent toolbar and layer symbols with original SVG icons.
- Show a loading/error state when editor assets fail to initialize, render a
  transparency checkerboard, and show the actual tile during rectangle previews.
- Add viewport geometry tests and a reusable optional browser regression suite.

## 0.1.0 — 2026-10-18

Initial implementation; this entry does not imply a published GitHub release.

- Add a local tile map editor with twelve original terrain/object tiles and
  the fictional Willowbend example.
- Add brush, eraser, flood fill, rectangle, eyedropper, and layer controls.
- Add local autosave, 60-step undo/redo, validated JSON import/export, and PNG
  downloads of visible layers.
- Add keyboard drawing and shortcuts, touch painting, zoom, grid controls,
  and a responsive workspace.
- Add model/storage/server/build tests, static packaging, CI, and project docs.
