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

Flood fill uses an iterative queue with four-neighbor connectivity, so a full
64 × 64 map does not need recursive calls. The current maximum is 24,576 cells
across six layers. Full snapshot history and redraws are reasonable at this
bound; larger documents would need a different history/rendering strategy.

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

The development server serves only `PUBLIC_FILES` from the build module, rejects
non-read methods, and adds content-type, no-sniff, and CSP headers. Its CSP blocks
outgoing connections. Download links use temporary object URLs. Imported names
are rendered through text nodes, never HTML. The build output includes the MIT
license and release metadata; it excludes tests, examples, server code, and
project documentation. Public hosting is possible with any static HTTP host
but has not been deployed as part of this initial implementation.
