# Changelog

## 0.7.0 — 2026-10-18

- Double the campaign to eighteen missions with The Unwritten Sky, The Amber
  Road, and The Long Dawn: nine authored layouts and three new finales.
- Add walking-only courier/treasure runs, a shield-free bazaar, four-note locks,
  mirrored logic bridges, reversible archive routes, and optional convoy shortcuts.
- Replace the flat mission list with a six-chapter illustrated field atlas,
  direct chapter starts, mechanic tags, and per-rule-set chapter star totals.
- Add original Canvas landscape artwork, region terrain palettes, matching
  keeper portraits, discovered mechanism minimap pins, and optional field goals.
- Show mission constraints above the board; keep narrow-screen tactical controls
  visible when rule banners are present. Protect all 36 campaign best identities.
- Preserve editor maps, campaign bests, and expedition replay behavior. Package
  v0.7.0 retains expedition rules 0.6.0 and the 0.5 save migration.
- Expand to 158 Node tests, 28 new clean playthroughs / 2,795 turns, 78,000
  exploratory inputs across retained/new suites, and six browser suites.

## 0.6.0 — 2026-10-18

- Add a directly accessible third act: Rainmoss Sluice, Glasshouse Concord,
  and The Last Ferry, bringing the story to nine missions.
- Add reversible valves, multi-setting crossings, controllable ember fields,
  required final switch settings, and protection against closing occupied floors.
- Add dialogue route choices, optional coin trades, two-person rescue/courier
  objectives, branch-specific epilogues, and separate act Nemesis invitations.
- Add a free Plan/V forecast and selectable nearby interactions with keyboard E.
  Record all spoken keepers in the journal, including those without choices.
- Fix dialogue trapping the editor after URL navigation; close game modals when
  leaving Play while retaining conversation/camp progress.
- Prevent manually bypassing Luma’s exclusive route, block empty paid parcels, preserve all nine normal/Nemesis campaign bests
  during custom-record eviction, and prevent duplicate leg credit while a
  completed expedition’s finish token is retained.
- Preserve genuine 0.5.0 expedition backups through replay/fingerprint migration;
  save new checkpoints with 0.6.0 rules. Retain version-1 map files.
- Expand to 127 Node tests, 14 clean new-mission routes, 42,000 exploratory
  inputs across the retained and new suites, and five browser suites covering
  all new levels, branches, migration, navigation, and four touch-layout widths.
- Document the tested limits and design references; keep untested device and
  long-term enjoyment claims separate from automated verification.

## 0.5.0 — 2026-10-18

- Add seeded three-, six-, and nine-leg journeys, single contracts, and five-leg
  UTC daily trails across four regions and six objective families.
- Add singing-relic courier missions with carry noise, drop/retrieve counterplay,
  and delivery requirements; generate reachable key/signal prerequisites.
- Add camps with eight permanent run upgrades, restocking, resource carryover,
  sheltered/perilous route previews, and a final Watcher crossing.
- Add four oath choices, route/oath bonuses, twelve logbook badges, exploration
  totals, and personal bests separated by seed and rules.
- Add per-action checkpoints, strict replay-based JSON backups, camp/dialogue/
  lost-state resume, and current-leg retries that retain earlier wins and learning.
- Keep expedition learning separate from campaign habits, maps, and bests.
  Retain play/export when storage is blocked or full.
- Correct objective hints to locate missing keys, reduce the tablet board height
  so tactical controls stay visible, keep phone camp departure controls visible,
  and release synthesized audio nodes during long sessions.
- Add 28 Node regressions (91 total), 13 full-run fixtures covering 34 legs,
  2,304 generated-layout checks, all 256 upgrade combinations, a 30,000-input
  soak, and complete browser runs/options/recovery/mobile regressions.

## 0.4.0 — 2026-10-18

- Expand the campaign to six missions with a directly accessible hard second
  act: Briarwatch Rescue, Bellforge Heist, and The Watcher’s Crown.
- Add locally learned movement transitions, predictive interception, sight,
  sound, fading enemy awareness, fern cover, and readable committed hunter moves.
  Keep a bounded browser profile and a reset control separate from map/progress data.
- Add named keepers, dialogue choices with one-time loadout effects, a journal,
  rescue requirements, and companions that follow safely to the beacon.
- Add ordered bell relays, wrong-note alarms, signal gates, cycling ember fields,
  decoys, three-turn shields, and one-use replenishment supplies.
- Add a three-phase Watcher with premarked sweep attacks, contextual taunts,
  mission-specific endings, and an invitation to take on Nemesis after the finale.
- Add Nemesis rules with fewer starting resources, extra hunters, longer ember
  pulses, shorter protection windows, and independent turn targets and bests.
- Retain version-1 editor saves and existing campaign progress. Preserve all six
  missions' normal/Nemesis records when evicting old custom expedition bests.
- Add 18 regression tests (63 total), real-input hard-mission/Nemesis browser
  playthroughs, phone dialogue/tactical checks, screenshots, and mission ideas.

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
