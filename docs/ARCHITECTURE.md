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
| `src/bootstrap.mjs` | Load the game with a visible startup/retry screen and player-facing error recovery. |
| `src/viewport.mjs` | Fit-to-workspace geometry and zoom-aware pointer hit testing. |
| `src/icons.mjs` | Original SVG toolbar and layer icons, independent of installed fonts. |
| `src/operations.mjs` | Immutable layer naming/duplication/ordering/removal and anchored map resize/crop counting. |
| `src/adventure.mjs` | Pure turn rules, collision, pickups, puzzles, patrol intent, scoring, exploration, and connected custom expeditions. |
| `src/adventure-levels.mjs` | Campaign assembly, twenty-four stable record identities, and the first six authored maps. |
| `src/adventure-horizon-levels.mjs` | Six authored coast/garden missions, including token circuits, changing doors, cart routes, and rescue finales. |
| `src/adventure-atlas-levels.mjs` | Nine authored archive, desert, and northern missions with constraint, treasure, courier, rescue, and finale goals. |
| `src/adventure-tools.mjs` | Specialist validation, dynamic cast/return costs and forecasts, reachable pulse area, and waystone checks/previews. |
| `src/adventure-guild.mjs` | Eight authored Guild jobs, commendation evaluation, and bounded kit/rule best storage. |
| `src/adventure-art.mjs` | Eight chapter palettes, original landscape card art, keeper portraits, and cached cosmetic map recoloring. No top-level DOM access or simulation state. |
| `src/adventure-sluice-levels.mjs` | Three authored sluice/shutter/rescue missions and their dialogue routes, trades, and epilogues. |
| `src/adventure-mechanisms.mjs` | Switch conditions, safe state changes, previews, trade availability, and definition validation. |
| `src/adventure-intel.mjs` | Read-only, nearby next-turn warnings derived from committed enemy plans and hazard timing. |
| `src/adventure-ui.mjs` | Mode lifecycle, campaign progression, keyboard/touch controls, HUD, hints, and results. |
| `src/adventure-front.mjs` | Title, illustrated mode chooser, guide pages, working options, and front-menu focus/navigation. |
| `src/adventure-journal.mjs` | Read-only chapter/specialist/badge totals and attainable replay suggestions derived from existing records. |
| `src/adventure-preferences.mjs` | Bounded, guarded volume/motion/reading preferences, separate from game and editor saves. |
| `src/training-model.mjs` | Independent practice worlds, real-rule coaching milestones, creator proof preparation, and bounded lesson completion storage. |
| `src/training-ui.mjs` | Training camp, native keyboard/touch lessons, guided creation/history/story forms, real playtests, portable sharing, and explicit Workshop handoff. |
| `src/workshop-lab.mjs` | Six authored puzzle-room worlds, immutable whole-world transforms, validated cursor-practice stages, and deterministic creative prompts. |
| `src/workshop-lab-clears.mjs` | Actual winning action journals for the Lab originals, verified and replayed through the shared engine. |
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

## Game entry, menus, and preferences

Entering Play opens the title screen without creating a run. `adventure-ui`
owns the title/library/board lifecycle; `adventure-front` owns title navigation,
the illustrated mode chooser, field-guide pages, and native options dialogs.
Browsing a mode does not advance gameplay or overwrite its checkpoint. A mission,
Guild job, expedition start/resume, or custom-map action explicitly creates or
restores a run. Input and animation are guarded while the title/library is open,
and options dialogs block gameplay shortcuts. Dialogs retain native keyboard
navigation; closing in-game options returns focus to their visible opener.

Returning to the title keeps the in-memory run and its turn/position. Continue
shows that run before updating pending conversations. A reload offers verified
saved-expedition recovery through the existing checkpoint loader. Unfinished
story/Guild runs are still session-only; their best results remain separate.
The editor is retained when changing modes, including its undo history.

`tilewright.preferences.v1` contains only bounded volume, system/reduced motion,
and standard/large reading settings. Unknown or malformed data falls back safely;
failed writes leave preferences usable for the visit and show a warning. Audio
is always opt-in for the current page. The volume setting scales synthesized
effects; reduced motion is shared by both renderer creation paths and honors
the device preference in System mode. Reading size changes trail feedback,
conversations, and forecasts. No game/save-format or expedition-rule revision
is required. Original title and mode artwork is drawn once with Canvas.

`adventure-journal` derives chapter totals, separate Trail/Nemesis stars, each
specialist's honors, and expedition badges from the existing validated in-memory
stores. It excludes custom/unknown identities and never writes, credits, or
migrates progress. This also keeps completed results visible if a write fails.
Suggestions respect story unlocks, favor unfinished work, and move to another
specialist after mastery. Opening one only prepares the library/chapter/kit/daily
form; it never starts or replaces a run. The journal has keyboard-operated tabs,
one page scroll, and a sticky navigation area. Returning to its main menu resets
the view while retaining the actual run and expedition session.

`game-theme.css` scopes the shared forest/brass palette, play navigation, dialog
frames, and journal layout to Play. The visible play bar replaces the editor mode
switcher in the same vertical space, preserving the fitted board. Main menu is
available from it and the pause/result overlay. The editor keeps its own palette
and history. Native dialogues/camps/forecasts keep their existing simulation rules.

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
with explicit chapter selection. In v0.8.1, only the selected chapter is
shown; the other five remain reachable through the chapter buttons.

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


## Focused gameplay navigation — v0.8.1

The library and live board are exclusive views. Returning from the library
reveals the same reducer state; browsing has no turns. Chapter selection is
view state, not progression, and all six chapter entries remain reachable.
Difficulty changes still restart the active mission with an explicit label;
the current library tab and selected chapter remain visible afterward.

The same quest, minimap, journal/kit, and help DOM nodes sit in a tabbed sidebar
above 1000 CSS pixels and move into a native modal dialog at narrower widths.
Resizing closes the dialog, preserves the selected panel, and resizes the
Canvas camera. Arrow/Home/End navigation follows the tab selection; Escape
returns focus to the notes button. The library, open notes dialog, and Menu
block gameplay shortcuts. Closing these views consumes no reducer action.

Flex layout budgets the remaining viewport height for the board. A minimum
620-pixel layout retains readable controls on short/landscape screens using
normal document scrolling. Reading panels have a single scroll region; the
board itself has no nested map scrollbar. Secondary controls use a native
details menu, and quick starts/custom-map actions use a library disclosure.
`layout-browser-checks.mjs` verifies scrolling, bounds, keyboard focus, chapter
selection, and responsive node relocation. `ui-driver.mjs` lets the retained
playthroughs reach controls with visible clicks instead of bypassing hidden UI.
The simulation, expedition rules 0.6.0, and save formats are unchanged.


## Coast and clockwork chapters — v0.9

Campaign IDs now span `trail-1` through `trail-24`; the eight chapter descriptors
keep three missions per chapter. Missions 19 and 22 are open chapter entries,
and their final missions replay Nemesis from zero-based indices 18 and 21.
The last mission returns keyboard focus to its visible chapter button.

The six maps use the existing public rules: switch/plate/key/signal gates,
ordered relays, carried relics, rescue companions, all-coin requirements,
no-dash restrictions, and adaptive hunters. No expedition rule or save-format
revision is required. All 18 prior definitions match SHA-256 fingerprints
captured from committed v0.8.1 source. All 48 campaign/rule record IDs are
protected while custom records share the remaining space in the 64-record cap.

Original Canvas motifs and palettes affect only the new `coast` and `clockwork`
backgrounds; objective and threat colors retain their meanings. The existing
compact library still shows one chapter at a time. `solve-horizon.mjs` uses
ordinary public actions, and independent tests replay 22 clean witnesses, all
choices, both difficulty settings, and the optional upper cart crossing. The
developer local-search key now includes crate positions. Browser tests verify
actual interaction controls, progression, layout, and save retention.

## Lantern doubles — v0.10

Only Echoist Guild runs add `echo` and `swaps` fields inside `guild`. Casting
stores the current cell and an end turn seven greater than the pre-action turn:
after activation, six further turns remain. The double holds a plate remotely
and overrides ordinary hunter pursuit within twelve Manhattan cells; a thrown
lure has higher priority. Existing committed enemy movement resolves unchanged.
After enemy movement, a reached or expired double is removed before planning
the next intent. Fixed patrols do not acquire the new lure behavior.

While a live double exists, the power action returns for one energy and consumes
it; otherwise casting costs two. Availability, button text, and forecasts share
these rules. Returning checks passability, crates, current enemies, and energy
before cloning state. Landing collection, reveal, companions, cargo delivery,
and committed threats use the normal turn pipeline. Returns do not increment
cast count or reset casting cooldown. No input can create multiple doubles.

Only the two new jobs opt their plate bridges into `safeClose`: an occupied
bridge cell stays open until the player, crate, companion, hunter, or patrol
clears it. Other cells close normally when their linked plate loses its weight.
Earlier story puzzles retain their prior semantics. The original 24 Guild best
identities remain valid within the expanded 48-ID whitelist and 16 KB read cap.
Story/generated runs gain no new state, and expedition rules remain 0.6.0.

The 68 Guild witness routes cover every job/kit/rule combination and 20 alternate
routes or dialogue choices. Their 5,336 turns use the public reducer, including
actual double-held crossings and returns. Boundary tests cover expiration,
capture, rejected returns, landing hazards, companions, cargo, previous-state
immutability, and complete old/new record retention. The expanded Guild soak
uses 48,000 inputs; the retained/new total across game suites is 150,000.

## Player-authored adventures and portable sharing — v0.13

`workshop-model.mjs` normalizes a bounded version-1 adventure blueprint into the
existing pure game engine. It supports 24 object kinds, four shared channels,
keeper dialogue/choices, three specialist kits, ordered bells, optional/required
puzzle goals, and authored opening/ending/hints. Maps retain the existing
1–64-cell / six-layer schema. Blank Studio worlds start at 8×8 or larger;
terrain imports retain their original dimensions. Object IDs, text, routes,
coordinates, quantities, and action journals are checked before engine creation.
Unknown fields are discarded. Names are single-line; narrative text can contain
paragraphs. No arbitrary scripts, external assets, or network calls are loaded.

Structural checks combine game validation with an optimistic flood through open
gates and adjacency checks for interactions. Waystones allow disconnected areas.
This deliberately does not claim to solve crate, sequence, or return-path puzzles.
`workshop-worlds.mjs` provides three authored examples, terrain conversion, and
four-region/five-mission seeded templates using the existing generator. A bounded
512-seed search finds the requested recipe before generating the one map.

`workshop-designer.mjs` owns an independent 30-entry immutable history, pointer
stroke transactions, rectangle/fill/line painting, route selection, properties,
and keyboard cursor. Pointer cancellation reverts the uncommitted stroke. World
notes move into a dialog at ≤1000px; the actual controls are retained rather than
duplicated. Thumbnail drawing bounds each canvas to 360×240; the full designer
canvas is at most 1536×1536. Stamps replace a bounded footprint and clear upper
terrain layers there, so copied maps do not leave invisible blockers above them.

`workshop-ui.mjs` coordinates shelf/search, draft replacement, previews, playtests,
file/code sharing, imports, and a deterministic solution viewer. It inserts player
strings through `textContent` or form values. Async proof verification yields
every 40 actions, with a cancellation token preventing delayed dialogs after
leaving. Replay stores one current run, not thousands of snapshots, and stops its
timer on close/navigation. It never calls live gameplay/save/audio handlers.

A content identity hashes normalized world data excluding the clear journal.
World edits therefore get separate bests, and adding a proof does not erase a
best. The dual 32-bit hash is a local identifier, not cryptographic authentication.
Workshop runs begin with fresh memory and do not write campaign habits. Tagged
player runs are routed before `run.guild`, since specialist functionality is
reused without making these worlds official Guild dispatches. Creator trials
record actual accepted inputs (including free dialogue/facing changes), up to
2,000 actions. A win attaches the journal to the matching draft/saved version.
Edits remove the old proof; undo can restore the old world and its matching proof.

`verifyAdventureProof` independently creates a fresh run and replays the bounded
journal to an actual win, rejecting post-finish actions and unfinished routes.
Imported/persisted attached clears must pass this check before the UI calls them
verified. The included routes are ordinary-action witnesses, also checked by
Node and native browser playthroughs on both rules. Replays prove one route on
one rule set; author names and solvability claims are not trusted certificates.
Future changes to engine rules may invalidate old clears, which are rechecked.

`workshop-sharing.mjs` stores terrain as bounded run-length pairs. Parsing checks
400 KB, dimensions, layer count, and expansion bounds before decoding. Portable
codes use `LT1.<checksum>.<base64url UTF-8 JSON>` with a 300,000-character cap.
The checksum detects damaged text, not tampering/authorship. Public HTTP(S) links
carry smaller codes (≤12,000 characters) in `#adventure=` and open a preview,
never a run or automatic shelf write. Local/private origins and larger payloads
use files/codes. This release provides no gallery, accounts, backend, uploads,
remote map discovery, or live multiplayer.

`workshop-library.mjs` isolates `tilewright.workshop.v1` (32 entries, 4M-character
shelf), `tilewright.workshop.draft.v1`, and `tilewright.workshop.bests.v1` (64
rule/content-specific records). Malformed entries are isolated. A full shelf
requires explicit removal rather than silent eviction. Failed writes return
session data and truthful export guidance. Existing story, Guild, terrain,
preferences, and expedition formats/checkpoint rules are unchanged.

## Shared creator presentation and navigation — v0.14

`studio.css` extends the existing game materials to terrain Mapmaker and refines
the Workshop without changing collision, reducers, learning, map formats, or
checkpoint rules. Both creation canvases use bounded workspace heights and Fit.
Advanced reading stays in scrollable notes. Long player text wraps within its
container; short/landscape screens retain bounded page scroll rather than
hiding actions below a fixed viewport.

`mapmaker-shell.mjs` moves the existing palette and inspector into native dialogs
at ≤1100px. Desktop uses the same original controls in the side panels, preserving
IDs, handlers, values, and history. Native close events restore focus; choosing a
tile returns focus to the canvas after the dialog closes. Resizing or leaving
Mapmaker closes its drawers. The core editor still owns all painting, structural
editing, saving, and exports. Its navigation can open the game title or the
Workshop; Build adventure preselects the existing terrain-copy creation option
rather than overwriting a draft or silently starting a run.

`creator-guide.mjs` owns a three-chapter illustrated modal. It reuses original
atlas art and presents a first trail, linked puzzles, and playtest/sharing steps.
Guide navigation only changes guide state. It inserts fixed text through DOM
nodes, uses no storage or gameplay handlers, and returns focus to its opener.
Existing gameplay guide/preferences remain separate. Their reading-size setting
also scales the creator guide's body text.

Workshop additions reuse its existing history and validation. Eight quick brushes
call the same selection path as the full palette; objective counts also select
goal brushes. Details disclosures group infrequently edited fields. Invalid
fields open their disclosure and relevant panel before native validity feedback.
Readiness separates structural checks from an attached creator journal, which
still requires engine replay before being called verified. A fresh untouched
canvas is distinguished from a saved draft and needs no replacement confirmation.
Public assets add one stylesheet and two browser modules; the package has 54
files, including its build marker and release note. Browser checks navigate the
visible creator panels before manipulating controls and retain native clicks,
keyboard actions, imports, downloads, and ordinary-action game playthroughs.


## Storybooks — v0.17

`storybook-model.mjs` normalizes two-to-six-chapter bundles, reuses adventure
RLE encoding/validation, and enforces a 1.6 MB UTF-8 import/export bound. A book
key includes text, ordering, and world keys; proof journals do not change world
identity. Author drafts may contain fewer than two chapters until ready to play.
Snapshots clone worlds rather than mutating the shelf or World studio draft.

An immutable session advances from interlude to playing to the next camp or
completion. Engine wins must match the current book, world, chapter, promise,
and rule set before producing a receipt; repeated/stale wins cannot advance it.
Promises evaluate actual turn, damage, treasure, dialogue, and specialist-use
state. Missing one affects only the optional honor and 150-point bonus. No
new restrictions or combat powers can make the ordinary objective unsolvable.

`tilewright.storybooks.v1` owns the book draft, active boundary checkpoint,
chapter receipts, and up to 32 full-book bests. Its bounded restore checks phase,
chapter count, receipt metadata, challenge eligibility, and rules. Damaged
sections are isolated. A reload restarts the open chapter; no per-turn journal
or cross-chapter supplies/memory is claimed. Portable files exclude progress.
`storybook-ui.mjs` inserts player text with DOM textContent/value and handles
native downloads, imports, replacement confirmation, and truthful save failure.
`storybook-worlds.mjs` frames existing Lab worlds with original stories and
attainable authored turn targets. The ordinary game engine still runs each map.
The public package adds three modules and one stylesheet (63 total files).


## Original story chapters — v0.18

`storybook-adventures.mjs` authors eight distinct 16×12 to 22×16 world layouts
through the existing adventure schema. `story-adventure-clears.mjs` supplies
ordinary-action clean routes and pars attained on both rules; it introduces no
new save schema, hidden gameplay state, or alternate turn engine. Existing
mechanisms provide dialogue choices, channels, timed doubles, cargo, waystones,
rescue, cover, and adaptive pursuit. The stealth chapter has a quiet fern route
and a separately tested guarded-treasure route.

`storybook-worlds.mjs` appends two four-chapter books without changing the older
books or their keys. The library shows original-story covers first while
retaining stable IDs. The book creator also receives all eight original worlds
as independent sources. Completion exposes each original map’s authored ending;
restored-page disclosures retain its opening and ending using text nodes.
Public assets add two data modules; the static build contains 65 files.

Book gameplay uses a compact chapter subtitle and goal ribbon. On short screens,
redundant region metadata is hidden; the book board's minimum height accounts
for fixed controls, feedback, and the map's minimum size. It grows the ordinary
page instead of clipping controls into a hidden internal scroll. Non-book modes
clear that minimum-height override. Native phone checks verify the complete
control row fits inside the board, including the five-action rescue finale.
