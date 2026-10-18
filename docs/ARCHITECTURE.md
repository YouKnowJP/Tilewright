# Architecture and map format

Tilewright is a static browser application. There is no backend, dependency
installation, build-time framework, database service, or remote API.

| File | Responsibility |
| --- | --- |
| `src/model.mjs` | Versioned document validation, immutable painting, iterative flood fill, line/rectangle geometry, bounded snapshot history. No DOM or storage access. |
| `src/sample.mjs` | Deterministic, fictional Willowbend map authored with the built-in palette. |
| `src/render.mjs` | Original pixel artwork and compositing into Canvas; optional grid/cursor overlays. |
| `src/storage.mjs` | Local-storage adapter; reject corrupt saves and report unavailable storage. |
| `src/app.mjs` | DOM, pointer/keyboard input, stroke previews, history commits, file handling, and downloads. |
| `src/bootstrap.mjs` | Load the editor and replace a blank canvas with useful startup/error guidance if imports fail. |
| `src/viewport.mjs` | Fit-to-workspace geometry and zoom-aware pointer hit testing. |
| `src/icons.mjs` | Original SVG toolbar and layer icons, independent of installed fonts. |
| `src/operations.mjs` | Immutable layer naming/duplication/ordering/removal and anchored map resize/crop counting. |
| `src/adventure.mjs` | Pure turn rules, collision, pickups, puzzles, patrol intent, scoring, exploration, and connected custom expeditions. |
| `src/adventure-levels.mjs` | Three original authored quest definitions and fictional maps. |
| `src/adventure-ui.mjs` | Mode lifecycle, campaign progression, keyboard/touch controls, HUD, hints, and results. |
| `src/adventure-render.mjs` | Cached map background, following camera, original sprites, fog, and discovered-map overview. |
| `src/adventure-records.mjs` | Bounded, validated personal bests stored independently of map saves. |
| `src/adventure-sound.mjs` | Opt-in local Web Audio synthesis. |
| `serve.mjs` | Loopback-only development HTTP server with a shared public-file allowlist. |
| `scripts/build.mjs` | Stage and package public assets; refuse to overwrite unrelated nonempty directories. |

## Editing and history

Documents contain row-major arrays of integer tile IDs. Painting copies only the
affected layer; unchanged layers retain their identities. A drag accumulates
interpolated cells and renders a preview against the original document. The
completed stroke creates one history entry. A canceled stroke leaves the
document and storage unchanged.

History stores up to 60 immutable document snapshots and a redo stack. New edits
clear redo. Renames, visibility changes, and new layers use the same commit path
as painting. New/imported/sample documents start fresh histories. The local save
contains only the current document; view controls and history are session state.

Layer operations preserve IDs except when creating a duplicate, which receives
a unique ID and its own cell array immediately in front of the source. The
model enforces 1–6 layers. The selected-layer settings are view state; a missing
selection after undo/deletion falls back to the nearest surviving layer.

Resizing creates new arrays for every layer, copies retained cells at the chosen
anchor offset, and fills new cells only in the backmost layer. Other new cells
are transparent. Original empty cells stay empty. Center offsets use
`floor((newSize - oldSize) / 2)`: odd growth adds the extra cell on the right or
bottom, while odd centered cropping removes the extra cell on the left or top.
The preview counts discarded nonzero cells across all layers, including hidden
ones. Preview/cancel do not edit storage or history; application is one history
commit. No document-format revision is needed.

Flood fill uses an iterative queue with four-neighbor connectivity, so a full
64 × 64 map does not need recursive calls. The current maximum is 24,576 cells
across six layers. Full snapshot history and redraws are reasonable at this
bound; larger documents would need a different history/rendering strategy.

## Viewport and rendering

The scroll container has bounded dimensions independent of the document's
intrinsic pixel size. Its content wrapper centers maps smaller than the view
and retains reachable padded edges for larger maps. Fit mode computes a scale
from the view's actual inner size and padding; a ResizeObserver reapplies it
when the layout changes. Fixed zoom preserves the map point at the center of
the view. New documents reset to Fit mode. Zoom never changes exported pixels.

Pan uses captured mouse/touch pointers to change scroll offsets without
editing tiles. Keyboard drawing reveals the active cell within the container;
canvas focus uses `preventScroll` to avoid moving the outer page. At Fit zoom,
wheel gestures can continue scrolling the page. Phone layouts give the canvas
the full workspace width, with palette and settings in separate rows.

The renderer draws a transparency checkerboard only in editor mode. PNG
export uses the same tile compositor without editor overlays or background.
Rectangle previews draw their actual tile content before a single final commit.

## Adventure simulation and rendering

`createRun` validates and snapshots a map and its authored entities. `stepRun`
returns a new state for each action without mutating prior states or the editor.
A valid walk/wait advances each patrol once and restores energy. Dash performs
up to two movement/pickup/push steps for two energy, then advances patrols once.
Blocked actions do not spend a turn. Patrols ping-pong over adjacent route cells;
`enemyIntent` drives both the simulation and the next-step markers.

Keys are consumed once to open a permanent gate. A linked bridge opens while
all its plates hold crates or the player. Enemy contact during the player's
path or after patrol movement costs at most one heart; two subsequent actions
are protected. Three lost hearts end a run. A win requires all lanterns and
arrival at the beacon after hazard resolution. Damage, turn count, coins, and
remaining hearts determine the result. No real-time clock affects game rules.

Custom adventures derive collision from visible layers in compositing order.
A breadth-first search selects the largest connected walkable component. A
farthest-point spread picks three lanterns and a far beacon, all reachable.
The shortest of six lantern visit orders plus 20% determines the turn target.
A hash of the validated map identifies its local record. No entities or
annotations are written back to version-1 editor documents.

The adventure renderer caches the static map once, then draws a bounded camera
window and dynamic entities. Exploring reveals nearby cells; previously visited
terrain remains dimly visible. Player interpolation, lantern bobbing, and
collection particles are disabled for reduced-motion preferences. Animation
runs only while play is active and stops on paused/hidden pages or settled
results. The board resizes independently of page height; focusing or moving the
explorer does not scroll the document. An explicit mode/stage selection brings
the board into view. A separate direction pad and canvas swipes support touch.

Campaign route fixtures exercise ordinary moves through every authored puzzle,
finishing in 54, 50, and 73 turns without damage. Browser checks replay these
same moves through actual keyboard input, including intermediate wait turns.

## JSON version 1

```json
{
  "format": "tilewright",
  "version": 1,
  "name": "Small example",
  "width": 2,
  "height": 2,
  "layers": [
    {
      "id": "ground",
      "name": "Ground",
      "visible": true,
      "tiles": [1, 3, 1, 4]
    }
  ]
}
```

Layers are stored **back to front**; the UI lists them in reverse order. Each
tile index is `y * width + x`, with a zero-based top-left origin. Tile 0 is
transparent; tiles 1–12 are the palette entries exported by `TILES` in
`src/model.mjs`. Tile artwork is fixed at 24 × 24 pixels. Hidden layers remain
in JSON but are excluded from PNG compositing. The sample is also available as
[an importable JSON file](../examples/willowbend.json).

Imports are limited to 1,000,000 UTF-8 bytes, dimensions 1–64, 1–6 layers,
unique simple layer IDs, printable map/layer names, boolean visibility, exact
array lengths, and known integer tile IDs. Unknown fields are discarded; source
arrays and prototypes are not retained. All maximum-sized documents produced
by the serializer fit under the import cap. Invalid imports do not replace
the current map. Future format versions are rejected until explicitly supported.

## Storage and distribution

`tilewright.document.v1` holds a single validated JSON document in localStorage.
Reads and writes are guarded, including access to the storage property itself.
Corrupt saved data is left untouched until the user makes another committed
change. Failed writes leave editing available and request a JSON export.

`tilewright.adventures.v1` independently stores up to 64 normalized best
results, prioritizing campaign unlocks when old custom records are evicted.
Only stars, score, and turn counts are retained. Failed writes preserve session
progress. These local results are editable by the browser owner and have no
competitive integrity guarantee. Sound starts only after an explicit user action.

The development server serves only `PUBLIC_FILES` from the build module, rejects
non-read methods, and adds content-type, no-sniff, and CSP headers. Its CSP blocks
outgoing connections. Download links use temporary object URLs. Imported names
are rendered through text nodes, never HTML. The build output includes the MIT
license and release metadata; it excludes tests, examples, server code, and
project documentation. Public hosting is possible with any static HTTP host
but has not been deployed as part of this initial implementation.
