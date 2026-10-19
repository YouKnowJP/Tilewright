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
| `src/adventure-levels.mjs` | Campaign assembly, eighteen stable record identities, and the first six authored maps. |
| `src/adventure-atlas-levels.mjs` | Nine authored archive, desert, and northern missions with constraint, treasure, courier, rescue, and finale goals. |
| `src/adventure-tools.mjs` | Specialist validation, power availability, reachable pulse area, and waystone checks/previews. |
| `src/adventure-guild.mjs` | Six authored Guild jobs, commendation evaluation, and bounded kit/rule best storage. |
| `src/adventure-art.mjs` | Six chapter palettes, original landscape card art, keeper portraits, and cached cosmetic map recoloring. No top-level DOM access or simulation state. |
| `src/adventure-sluice-levels.mjs` | Three authored sluice/shutter/rescue missions and their dialogue routes, trades, and epilogues. |
| `src/adventure-mechanisms.mjs` | Switch conditions, safe state changes, previews, trade availability, and definition validation. |
| `src/adventure-intel.mjs` | Read-only, nearby next-turn warnings derived from committed enemy plans and hazard timing. |
| `src/adventure-ui.mjs` | Mode lifecycle, campaign progression, keyboard/touch controls, HUD, hints, and results. |
| `src/adventure-render.mjs` | Cached map background, following camera, original sprites, fog, and discovered-map overview. |
| `src/adventure-records.mjs` | Bounded, validated personal bests stored independently of map saves. |
| `src/adventure-brain.mjs` | Bounded action/transition counts, decaying movement predictions, normalization, and isolated local learning persistence. |
| `src/adventure-tactics.mjs` | Line of sight, bounded pathfinding, committed pursuit/interception/search, decoys, and boss sweeps. |
| `src/adventure-sound.mjs` | Opt-in local Web Audio synthesis with released audio nodes. |
| `src/adventure-generator.mjs` | Seeded connected room graphs, prerequisites, region/mission variety, route previews, and daily rules. |
| `src/adventure-perks.mjs` | Validated run upgrades, effects, and oath definitions. |
| `src/adventure-journey.mjs` | Immutable leg/camp/retry lifecycle, isolated learning, score, bounded action journals, and verified checkpoint replay. |
| `src/adventure-logbook.mjs` | Achievement rules, cumulative totals, bounded bests and duplicate-credit tokens. |
| `src/adventure-expedition-ui.mjs` | Mode/seed/rules form, hub/logbook, camp choices, resume, backup files, and save warnings. |
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
are protected. Three lost hearts end a run. A win requires all lanterns, authored relay/rescue requirements, and arrival at
the beacon after hazard resolution. Damage, turn count, coins, and
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

## Adaptive opponents and interactive missions

A movement profile contains counts for nine movement/wait/dash actions and
first-order transitions. Only successful turn actions train it. Counts decay
at a total of 128 to make recent habits more influential; the observation
counter is capped. With at least three matching transitions (or eight global
samples) and a top frequency of at least 42%, a hunter projects the likely
next movement and routes toward that interception cell. This is a small,
deterministic statistical game system, not an external language model or a
claim to infer psychological intent.

Hunters need line of sight, audible dashes, an alarm, or a lead that expires
after five planning updates. Quiet fern cover hides a distant player. Their
path uses a bounded breadth-first search respecting land, gates, crates, and
occupied keeper cells. Decoys override nearby targets. Periodic recovery
creates escape windows. **The plan in the current state is executed on the
next turn**, before a replacement plan is computed from the resulting state.
The same committed cells drive the warning renderer. Boss sweeps stop at
obstacles and show all nearby threatened cells even if the boss itself is
outside the visible radius.

Relays advance a stage-authored sequence; a wrong note resets it and makes
an audible alarm for six turns. Completion opens signal gates and stuns
hunters. Hazard activity comes from turn modulo period, so waiting and dashing
have predictable effects. Shields protect activation and two following turns.
Supply caches are one-use; loadout counts are capped at three.

Conversation actions pause turn rules and accept one authored choice per
keeper. They do not train the movement learner. Choices grant a bounded item
and remain in the journal. Rescuing requires the lanterns and a return
interaction; a rescued keeper follows previous player cells without blocking
movement or taking damage. Dialogue remains closable across visibility changes.

Nemesis converts introductory patrols to hunters and enables authored
reinforcements. It starts with fewer hearts/resources, expands detection,
reduces recovery/protection, expands ember phases, and uses 85% turn targets.
Bests use a `-nemesis` suffix; either rule set can unlock the next mission.
The second act's first contract is available without introductory progress.

`tilewright.tactics.v1` stores only normalized counts and the last action,
with a 12 KB read cap. Local learning is retained across retries/missions and
can be reset independently of bests and editor saves. Failed writes leave
learning available for the session. All normal and Nemesis second-act missions
have complete real-action fixtures; browser tests replay the dialogue and
movement through actual controls.

## Reversible mechanisms and conversation state

Authored switches have IDs and initial booleans; switch gates contain explicit
ID/value conditions. Hazard groups can name a switch that suppresses them.
The rule layer previews a proposed patch and refuses any closure under a player,
crate, companion, patrol, or hunter. A successful valve action changes state,
spends one turn, then resolves enemies/hazards. Rejected changes cost nothing.
The renderer uses distinct wheel orientations, crossing states, and the existing
ember warnings; the UI lists the actual opening/closing cell counts.

Coin trades track `spentCoins` independently of collected coin IDs. Cost,
resource caps, and useful remaining capacity are checked before consuming a
one-time choice. Free narrative choices remain available at full capacity.
Route choices can set validated switch states; the same occupancy guard applies.
Keeper-operated switches can be marked non-operable so an exclusive dialogue
route cannot be bypassed by manually turning its control.
Every spoken NPC is stored once in `talkedTo`, independently of accepting a choice.
The journal renders advice, responses, or a rescued companion’s final line.

The nearby-target selector retains a valid selection and exposes all adjacent
interactions. Keyboard E works while that selector is focused. Forecasts read
current plans and next-turn hazard phases without calling the turn reducer.
Leaving Play closes native game modals without deleting dialogue/camp state;
a queued close event cannot close a newly restored conversation.

## Seeded journeys and replay checkpoints

The generator builds a randomized spanning tree over 20 rooms (24 from leg
five), adds loops, and protects one far leaf from extra entrances. Key or
signal gates guard that leaf; their prerequisites are allocated outside it.
Room-center objectives and corner pickups remain reachable. A seeded PRNG
controls layout, region, relay order, cover, hazards, supplies, and hunter routes.
A route preview uses the same selection function as the generated stage.
Sheltered/perilous branches are recorded in the path. The last multi-leg stage
is a Watcher crossing. Maps are 27 × 22 or 32 × 22, using existing original tiles.

Courier cargo is either on a cell, carried, or delivered. Carrying raises noise;
dropping costs a turn and makes a nearby audible target, overridden by a decoy.
Retrieval is a normal interaction. Arrival at the delivery beacon transfers it
before checking all exit requirements. Oaths enforce no-dash/no-shield at the
rule layer, and required coins/delivery are real mission goals. Upgrades feed
validated effects into the existing rules without changing the map format.

Journeys advance through playing → camp → playing, then won, with lost/retry
recovery. Completed receipts cannot be retried or credited twice in the active
history. Camps restore health, carry supplies, grant one offered upgrade or
restock, and choose a generated route. A retry regenerates the same current leg
with its starting loadout, retaining previous receipts, upgrades, and newly
learned movement counts. Fresh journeys have their own fresh profile.

`tilewright.expedition.v1` keeps a version/rules envelope, normalized config,
current leg/path/kit, initial leg memory, earlier receipts, and at most 8,192
meaningful actions. It does not import arbitrary runtime maps or enemy objects.
Restore validates bounds, regenerates the stage, replays ordinary actions, and
compares a deterministic state fingerprint/status. Facing-only inputs, dialogue,
choices, and learning resets are journaled; transient messages/events are
excluded from the fingerprint. Import is capped at 220 KB. New saves use rules version 0.6.0. Genuine
0.5.0 envelopes replay with unchanged generated layouts; their fingerprint
comparison excludes the three newly defaulted state fields (`switches`,
`spentCoins`, `talkedTo`) before writing a 0.6.0 checkpoint. Six captured legacy
fixtures cover playing, dialogue, camp, loss, carried cargo, and completion.
Future simulation changes need migration or a deliberate rules revision. The fingerprint detects damaged/inconsistent backups, not malicious
score editing. Browser owners control their own local data.

`tilewright.logbook.v1` normalizes up to 32 bests and 12 badges, with cumulative
counters and at most 512 recent credit tokens. Ordinary repeated camp/finish
resume is idempotent. A retained finish token covers older individual leg
tokens, including an imported earlier camp from the same completed run. Importing a completed backup older than the retained token
window can credit it again. Data is bounded rather than a permanent event log.
Logbook reads are capped at 96 KB. All storage access is guarded. Failed writes
retain in-session play and expose a backup export warning. The editor map,
campaign records, and campaign movement profile use independent storage keys.

The 13 expedition fixtures complete 34 legs through public actions only;
`solve-expeditions.mjs` is an optional developer witness generator using the
real rules for candidate actions. It never changes runtime health, positions,
objectives, or inventory to produce a win. Search limits are not a completeness
proof. The fixtures are replayed independently by the Node suite; browser tests
also complete long journeys through real keyboard, dialogue, and camp forms.

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

## Field atlas and visual regions — v0.7

The campaign has six groups of three stable identities. New chapters start at
10, 13, and 16; each chapter entry is open, and subsequent wins unlock its next
mission on either rule set. Record eviction protects all 36 Trail/Nemesis
identities within the existing 64-record limit. The atlas uses ordinary buttons
and document scrolling, without a nested scroll trap or hidden chapter tab.

Chapter art and portraits use original Canvas primitives. Cached map recoloring
changes terrain pixels, with subtle traversable ground markings that avoid
objective cells. Dynamic entities, threat markers, collision, and map files keep
their meanings. Snow and archive stone have distinct palettes. Reduced motion
disables card transitions along with existing game animation. Portrait colors
match each keeper’s in-world coat. Mission constraints appear as a persistent
rule banner; a smaller narrow-screen board leaves tactical buttons reachable.
Optional field goals derive from current coins, conversations, and damage. They
do not add save data or change scoring. Discovered bells/wheels have minimap pins.

The expansion uses existing validated turn mechanics, restrictions, and goals.
Simulation behavior and expedition generation do not change: package v0.7.0
continues to write expedition **rules 0.6.0**, with the retained 0.5 migration.
`story-driver.mjs` and `solve-atlas.mjs` generate witnesses using the public
reducer; an optional clean-path search rejects damaging candidates rather than
editing health. All 28 captured routes are independently replayed in tests.

## Guild simulation — v0.8

Guild definitions add paired waystones and an internal `guild` descriptor. Only
these runs add runtime `guild` state: kit, ready turn, uses, jumps, and veil end.
Only hunters hit by Pulse gain `dazedUntil`. Existing story/generated runs keep
their old runtime shapes and deterministic behavior; expedition rules stay
0.6.0. Six checkpoint fixtures produced with the committed pre-Guild simulation
verify playing/dialogue/camp/lost/cargo/finish restoration without fingerprint
rewrites. The retained six 0.5 migration fixtures also pass.

A valid power costs two energy and one turn. Pulse uses a four-step passable
flood to interrupt nearby hunters’ committed movement/sweeps for activation and
the next turn. It does not negate contact/fire. Veil blocks new ordinary sight
and hearing while active, retaining recent leads/current plans; cargo/alarm
exposes the player. Rejected/cooling powers do not advance time or consume energy.

A waystone’s partner is a unique reciprocal ID. Validation bounds every marker
and rejects overlap with other interactions, obstructed terrain, and malformed
pairs. Travel checks destination passability, crates, current hunter occupancy,
and energy before cloning state. Successful travel collects/reveals the landing,
advances companion following and the turn once, spends one energy, then resolves
committed enemies/hazards. Cargo delivery and normal win checks still apply.
Forecasts inspect the destination without changing fog or any turn state.

`tilewright.guild.v1` stores up to 24 whitelisted job/kit/rule bests with a 16 KB
read cap. Only finished runs are credited; more commendations outrank score,
then fewer turns. Repeated results replace a best rather than incrementing a
farmable total. Failed writes preserve session results and display a warning.
Guild jobs have no checkpoint/import in this version. The Guild board is a
third ordinary library view; editor/campaign/expedition state stays separate.

`solve-guild.mjs` uses the public reducer for local crossing planning, including
charging, avoiding danger, tools, and jumps. It never changes health or runtime
puzzle flags to obtain a win. Captured routes are independently replayed by the
Node suite and by real browser controls. Search bounds are not a completeness
proof for every possible player history.
