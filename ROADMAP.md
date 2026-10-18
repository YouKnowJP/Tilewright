# Tilewright roadmap

The current editor is a usable starting point. These are **unfinished** feature
proposals with planning estimates, not completed work or hours already spent.
The owner should prioritize the work they actually intend to undertake before
using this plan in a program submission.

| Priority | Work ahead | Estimate | Acceptance criteria |
| --- | --- | --- | --- |
| 1 | Selection and reusable stamps | 6–8 h | Select a rectangular region across chosen layers; copy, cut, paste, move, and rotate it; preview placement; make each operation undoable; handle boundaries and transparent cells with focused tests. |
| 2 | Custom tilesets | 6–9 h | Import a bounded, user-owned PNG atlas; choose tile size; store portable tileset metadata; render and export consistently; reject oversized or corrupt images; document artwork licensing responsibilities. |
| 3 | Local project library and recovery | 5–7 h | Keep multiple named maps in IndexedDB; duplicate, rename, and delete them; provide backup/export and recovery after failed writes or version upgrades; test storage unavailability and migration. |
| 4 | Accessibility and input refinement | 3–5 h | Test screen readers and actual touch devices; improve keyboard layer navigation and tile descriptions; add configurable shortcuts; validate the existing pan/fit controls with assistive technology and real devices. |
| 5 | Interoperable export and release | 3–4 h | Implement one documented game-tool interchange format; verify a round trip with that tool; add export fixtures, a tagged release procedure, and a user guide based on actual use. |
| | **Total remaining** | **23–33 h** | Ship observable behavior, targeted tests, updated docs, and honest release notes. |

The previous map-resizing/layer-management milestone is complete in v0.2.0;
it is excluded from remaining estimates. See [feature ideas](docs/IDEAS.md)
for the rationale and additional options, which are not commitments or worked hours.

## Available in v0.2.0

- Twelve original tiles and a fictional sample map.
- Brush with interpolated strokes, eraser, bounded flood fill, rectangle,
  and selected-layer eyedropper.
- Up to six ordered layers with visibility controls and layer addition.
- Layer rename, duplication, reordering, and confirmed deletion, all undoable.
- Anchored map resizing, live crop preview, configurable new-cell fill, and undo.
- Sixty-step session undo/redo, including names and layer changes.
- Local autosave with failure reporting; versioned, bounded JSON import/export.
- PNG export, grid toggle, zoom, keyboard drawing, and responsive workspace.
- Automatic Fit map, mouse/touch panning, visible keyboard cursor navigation,
  and consistent SVG tool icons.
- Dependency-free local server and static build; focused automated checks.

## Boundaries

Keep this a small creative tool with local files and user-owned artwork. No AI
model work, inference infrastructure, offensive security tooling, account
services, or processing of other people's personal or regulated records is
planned. Future library and tileset work must preserve explicit backup/export
paths and existing maps.
