# Ideas for a more complete Tilewright

These priorities come from inspecting the current editor's gaps and reviewing
the official [Tiled layer workflows](https://doc.mapeditor.org/en/stable/manual/layers/)
and [LDtk editor overview](https://ldtk.io/docs/general/editor-components/).
They are proposals for this small tool, not claims that Tilewright already
supports those editors' formats or all their capabilities. The
[roadmap](../ROADMAP.md) tracks selected work and remaining estimates.

## Delivered through v0.14.0

**Finish structural editing.** A map no longer needs to be recreated to change
its dimensions. Users can anchor retained content, preview cropped occupied
cells, choose fill for new cells, and undo the resize. Layers can be renamed,
duplicated, reordered, and deleted with confirmation and undo. This closes a
specific gap in the existing workflow without changing the saved map format.

**Give the worlds a reason to explore.** Lantern Trails now has twenty-four real
missions with keys, patrols, dash energy, health, crate-and-plate bridge puzzles,
fog, hints, treasures, stars, and progression. The harder second act adds local adaptive interception,
dialogue choices, rescue/following, ordered relays, alarms, timed embers, and
Nemesis rules. Custom expeditions generate reachable objectives on editor maps. An adventure overview is delivered; an
editor minimap navigator remains a separate future tool.

**Make the journey feel like distinct places.** Eight illustrated atlas chapters
now provide region artwork, mechanic tags, chapter stars, and open chapter
entries. Violet stone, warm dunes, blue snow, a sea-glass coast, and brassleaf
gardens distinguish their maps.
Keeper portraits, discovered mechanism pins, optional field goals, and visible
mission constraints support longer runs. Walking-only treasure circuits, a
shield-free bazaar, four-note locks, and convoy finales vary the decisions. See
the [atlas guide](ATLAS.md).

**Change the player’s tools.** Eight Guild jobs support Bellrunner’s pulse,
Mistweaver’s veil, and Echoist’s lantern double, paired waystones, three optional
commendations per job, and 48 independent kit/rule records. The double creates
a second position to hold a plate, lure a hunter, and return to before it fades.
Glasshouse and Borrowed Horizon combine this choice with lasting crate routes,
keeper bargains, a locked lighthouse, rescue, and a carried lens. See
[Guild rules](GUILD.md) and [research and future prototypes](RESEARCH.md).

**Give each return a different route.** Seeded expeditions now connect three,
six, or nine legs through camp upgrades and route choices. Four regions, six
mission families, noisy courier relics, optional oaths, daily trails, checkpoint
backups, and twelve badges are playable. See the [expedition guide](EXPEDITIONS.md).

Further gameplay proposals in [mission design and counterplay](MISSIONS.md)
include richer branching passwords, moving-water puzzles beyond the delivered
sluices, evacuation consequences, and resource-priced recovery points. These remain distinct from delivered
courier missions, generated contracts, camps, and free current-leg retries.

**Make decisions readable and reversible.** The sluice saga adds route-changing
valves, cooled ember lanes, an optional trader, and two-keeper delivery. A free
forecast explains nearby threats; a selector resolves competing interactions.
All conversations can be reread in the journal. Occupied floors cannot close,
and full parcels cannot waste coins. These refinements are delivered; richer
multi-mission relationships and moving-water terrain remain future ideas.

**Let players author adventures.** The Workshop now paints 24 object types,
linked puzzles, dialogue, patrols, rescues, and relic quests. It provides three
featured adventures, twenty seeded recipes, 32-world local shelves, real creator
clears, replays, and file/code sharing. The creator’s camp unifies both editors,
adds quick brushes and objective shortcuts, and explains the workflow through
an illustrated in-game guide. See [the Workshop guide](WORKSHOP.md).

## Next gameplay concepts to prototype

These ideas are not implemented. Each needs a small authored test before adding
more interface, content, or persistent progression.

| Concept | New decision | First playable slice and checks |
| --- | --- | --- |
| The Listening Duel | Change the habits a rival has learned, then exploit its visible prediction. | A two-room rivalry with explicit "expects east" intent, a misleading route, and a clean non-deception route. Never infer a player's thoughts or personality. |
| The Keeper's Promise | Choose which route help a rescued keeper offers on the next mission. | Two linked maps, one reversible camp choice, and a preview of the changed route. Test both outcomes and checkpoint restoration; no hidden permanent punishment. |
| The Travelling Storm | Route around a weather front instead of only waiting for a fixed ember cycle. | One map with a three-turn forecast and sheltered lanes. Verify every launch phase has an executable safe route and that the forecast matches the reducer. |
| The Quiet Heist | Voluntarily raise visible security for extra treasure, then choose when to leave. | A small optional vault with announced reinforcements and a guaranteed normal exit. Keep the clean baseline route and alternate bests; test every escalation step. |

## Highest-value editor next steps

| Idea | Problem it solves | A useful first version | Completion evidence |
| --- | --- | --- | --- |
| Reusable selections and stamps | Painting the same cabin garden or tree cluster repeatedly is slow. | Select a rectangle on one layer; copy/cut/paste with a placement preview; rotate or flip it; commit one undo step. Extend to multiple layers after the base behavior works. | Test map boundaries, transparent cells, canceled placement, transformations, and undo/redo. |
| Local map library and recovery | There is one autosave slot, so switching projects requires manual exports. | Keep named maps locally; duplicate/open/delete them; retain a previous recovery copy; export portable backups. | Simulate write failure, storage quota, migration from the current autosave, and restoration without data loss. |
| Custom tilesets | The original twelve tiles limit the worlds people can make. | Import an owned PNG atlas with bounded dimensions and tile size; preview the palette; make map and tileset portable together. | Verify corrupt/oversized images, missing artwork, persistence, image export, and explicit format migration. |
| Minimap navigator | A large map at 200% zoom is hard to navigate using only scrollbars. | Show the whole map with a viewport rectangle; click or keyboard-navigate to another region. | Keep the viewport indicator correct after zoom, resize, window changes, and hidden-layer updates. |
| Export adapter | JSON is portable, but game projects must currently interpret Tilewright's own format. | Pick one documented target format and export a small, complete map with its tileset reference. | Import the result into the actual target tool, compare every cell/layer, and keep golden export fixtures. |

## Smaller refinements after those foundations

- **Layer locks:** prevent painting and erasing on a locked layer while leaving
  it visible. Version the field deliberately, preserve older maps, and make
  lock status obvious in keyboard and touch workflows.
- **Brush footprints:** add small square/round brushes and an outline rectangle;
  make previews match the final operation and retain one undo step per stroke.
- **Terrain connections:** use explicit neighbor-based tile rules to connect
  water banks, paths, or fences. Keep rules deterministic and inspectable.
- **Adventure authoring expansion:** the delivered Workshop already includes
  goals, puzzle links, patrol routes, story editing, checks, and portable exports.
  Storybooks now deliver portable campaign bundles. Future branching books
  and custom local tilesets should preserve existing adventures and keep
  structural checks distinct from a completed playtest.
- **More campaign variety:** add authored optional paths, crate-reset checkpoints,
  alternative patrol patterns, and additional quest layouts. Verify that each
  teaches a distinct decision rather than increasing map size alone.
- **Offline installation:** add an installable static app with explicit update
  and recovery behavior. Existing maps must remain available after an update.
- **Practical accessibility:** test actual screen readers and physical touch
  devices; improve readable tile descriptions, shortcut customization, and
  discoverability of panning/zoom without relying on hover tooltips.

## How to prioritize

Start with selections/stamps for frequent drawing work, or the local library
for users juggling several maps. Custom tilesets should precede broad export
support so an exported game world can carry usable artwork. The minimap is a
small independent navigation improvement once actual larger-map use justifies
it. Keep confirmation, undo, import validation, local backups, and responsive
rendering as acceptance criteria for every new workflow.
