# Tilewright roadmap

The current editor, 24 story missions, eight Guild jobs, and replayable expedition game are usable. These are **unfinished** feature
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

## Available in v0.6.0

- Three more authored missions with reversible sluice/shutter puzzles, controllable
  embers, route-changing dialogue, coin trades, and a two-keeper courier finale.
- Free next-turn forecasts, selectable interactions, complete conversation journals,
  and branch-specific endings.
- Modal navigation fixes, protected occupied crossings, stock-aware trades,
  old-save migration, and retained nine-mission bests.
- Fourteen clean new-mission routes, 127 tests, and full new-act browser play at
  four touch-layout widths. See [mission design](docs/MISSIONS.md) and
  [design references](docs/DESIGN_NOTES.md).

This completed game milestone is excluded from the remaining estimates above.

## Available in v0.5.0

- Seeded three/six/nine-leg journeys, single contracts, and five-leg UTC daily trails.
- Four regions, six mission families, relic carry/drop/delivery, and final Watchers.
- Eight camp upgrades, restocking, route branches, four oath choices, and bonuses.
- Twelve badges, expedition bests, checkpoints/backups, and current-leg recovery.
- Complete winning fixtures, reachability/soak checks, and browser options/recovery coverage.

See the [expedition guide](docs/EXPEDITIONS.md). This completed milestone is
excluded from the remaining estimates above.

## Available in v0.4.0

- Three harder second-act missions with dialogue choices, a journal, relay
  sequences/alarms, rescue goals, and safely following companions.
- Adaptive hunters that learn observed movement patterns locally, with
  committed next-step markers, cover, decoys, shields, and replenishment supplies.
- A three-phase Watcher with marked sweeps, cycling embers, and distinct endings.
- Nemesis rules and independent bests, retained campaign saves, and an explicit
  learning reset that preserves maps and progress.
- [Mission guide and further mission concepts](docs/MISSIONS.md), with
  concrete interaction and fairness criteria. These ideas are unfinished and
  are not included in the completed features or the estimates above.

## Adventure Workshop completed — v0.13

- Three authored player adventures with dialogue, rescues, relics, specialist
  puzzles, and multiple recorded solutions.
- Blank/terrain-copy creation and twenty seeded recipes; 24 editable objects,
  linked channels, routes, story details, stamps, undo/redo, and playtests.
- A searchable 32-world shelf with previews, remixing, isolated bests and draft
  autosave, responsive properties, and explicit Main menu navigation.
- Portable adventure files/codes and hosted preview links; creator clear
  verification and solution replay. See [the Workshop guide](docs/WORKSHOP.md).
- Future possibilities: campaign bundles, creator challenges, custom local
  tilesets, and an opt-in hosted gallery with moderation and durable storage.
  Those services are not included in the current local sharing release.

## Game presentation and journal completed — v0.12

- A shared game theme for board/HUD, all reading panels, dialogue, camp, pause,
  and results, with aligned mode actions and illustrated chapter banners.
- Visible Main menu during play and consistent library/journal/guide/options
  navigation, retaining the open run and editor history.
- A read-only Adventure Journal with chapter mastery, specialist honors,
  expedition badges, and attainable replay suggestions that open previews.
- Sticky journal navigation, keyboard tabs, safe failure paths, and real-progress
  browser verification alongside retained playthrough checks.

These completed features are excluded from remaining editor estimates.

## Game front end completed — v0.11

- A title screen and illustrated mode previews before a mission starts.
- A short field guide for new players and a shared game-themed options dialog.
- Functional volume, opt-in sound, reduced motion, and larger reading settings,
  with guarded preferences separate from game saves.
- Exact Continue for an open trail, explicit saved-expedition recovery, and
  preserved editor/map/history behavior when moving between modes.
- A new title/menu browser suite and retained mode/playthrough checks.

These completed menus are excluded from the remaining editor estimates.

## Lantern doubles completed — v0.10

- Echoist's cast/return tool holds plates, lures hunters, and creates a timed
  return route. Costs, lifetime, landing threats, and capture are visible.
- Two new authored Guild jobs with dialogue choices, plate/crate alternatives,
  a locked lighthouse, rain control, rescue, and a carried memory lens.
- All eight jobs support three specialists and both rules: 48 independent bests
  and up to 144 commendations, retaining the original records.
- 68 complete public-action witnesses, a 48,000-input Guild soak, unchanged
  expedition rules, and expanded keyboard/touch/browser checks.

These completed additions are excluded from the remaining editor estimates.
The listening duel, keeper promises, travelling storm, and voluntary quiet-heist
concepts in [feature ideas](docs/IDEAS.md) remain unimplemented proposals.

## New horizons completed — v0.9

- Six authored coast and clockwork missions: 24 story missions across eight chapters.
- New original landscape art, terrain palettes, keepers, choice endings, and two finales.
- A three-island treasure regatta, changing tide routes, cart-held hedge doors,
  a walking midnight market, convoy rescues, and an optional cart crossing.
- Both chapter entries open immediately; separate Trail/Nemesis bests are retained.
- 22 clean route witnesses, a 24,000-input soak, unchanged prior mission hashes,
  and a ninth browser suite. See [the chapter guide](docs/HORIZONS.md).

These completed levels are excluded from the remaining editor estimates.

## Guild expansion completed — v0.8

- Six authored dispatches, two active specialist tools, and paired waystone travel.
- Optional commendations, job previews, energy/cooldown and landing forecasts,
  and 24 independent kit/rule best categories.
- Complete public-action witnesses for every job/kit/rule combination, a new
  24,000-input soak, genuine pre-Guild save checks, and a seventh browser suite.
- [Primary developer research](docs/RESEARCH.md) and [Guild rules](docs/GUILD.md).

These completed additions are excluded from the remaining editor estimates.
Specialists in seeded journeys, new enemy archetypes, and voluntary visible
security escalation remain proposals pending player feedback.

## Atlas expansion completed — v0.7

- Eighteen authored missions across six illustrated chapters, each with an open entry.
- Violet archive, amber dune, and snow/aurora terrain palettes; keeper portraits.
- Nine new layouts, walking-only and shield-free missions, full-treasure circuits,
  route-reversal deliveries, four-note locks, and three larger rescue finales.
- Optional current-run exploration goals, mechanic tags, chapter stars, and
  discovered mechanism minimap pins.
- 28 clean ordinary-action witnesses, a 36,000-input atlas soak, and a sixth
  browser suite completing all nine new missions at four touch-layout widths.

This completed expansion is excluded from the remaining editor estimates.

## Earlier game features retained

- Three introductory Lantern Trails quests, stars, and local bests.
- Lantern exploration, fog, a following camera, a discovered map, and scout hints.
- Predictable patrols, health/healing, energy-based dash, and protected recovery.
- Keys/gates, crate-and-pressure-plate puzzles, linked bridges, and treasures.
- Custom expeditions from visible editor maps, with reachable objectives and
  route-based turn targets, independent of editor saves and undo.
- Pause/retry, keyboard/touch/swipe controls, reduced-motion rendering, and
  opt-in synthesized sound.

The remaining estimates above exclude this completed game milestone.

## Editor features retained

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

Keep this a small creative tool and fictional puzzle game with local files and
user-owned artwork. No AI
model work, inference infrastructure, offensive security tooling, account
services, or processing of other people's personal or regulated records is
planned. Future library and tileset work must preserve explicit backup/export
paths and existing maps.
