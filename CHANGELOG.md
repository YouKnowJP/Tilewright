# Changelog

## 0.3.0 — 2026-10-18

- Add Lantern Trails: three original, progressively unlocked adventures with
  lantern objectives, exploration fog, a following camera, and a discovered map.
- Add predictable wardens and next-move markers, three hearts, healing pickups,
  two-turn damage protection, energy-based dash, and deliberate wait turns.
- Add brass keys/gates, pushable crates, pressure plates, and linked river bridges.
- Add optional treasures, turn targets, scoring, three-star results, local bests,
  pause/resume, restart, contextual scout hints, and opt-in synthesized sound.
- Turn the current editor map into a reachable custom expedition without
  changing the document, autosave, or undo history. Keep version-1 map files.
- Add keyboard, touch direction-pad, and swipe controls; keep the board bounded
  and bring gameplay into view with a sticky Create/Play switch.
- Add 17 rule/persistence tests (45 total) and browser campaign-completion,
  touch, responsive-layout, save-isolation, and storage-failure checks.

## 0.2.0 — 2026-10-18

- Add layer naming, independent duplication, forward/backward ordering, and
  deletion with confirmation. Preserve the six-layer limit and a minimum of
  one layer, with all structural changes available in undo/redo.
- Add map resizing with nine placement anchors, a live result preview, a count
  of cropped occupied cells including hidden layers, and configurable fill for
  new back-layer cells. Keep new cells in other layers transparent.
- Make resizing one undo step, preserve version-1 save compatibility, and fit
  resized maps to the workspace automatically.
- Keep the canvas height independent of expanded layer settings and add
  phone/desktop browser coverage for structural editing and resize dialogs.
- Add nine operation tests (28 total), update screenshots and documentation,
  and separate completed roadmap work from prioritized future ideas.

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
