# Changelog

## 0.18.0 — 2026-10-20

- Add The Rainmaker’s Letters and The Observatory of Borrowed Stars: two
  four-chapter stories with eight original maps, recurring keepers, opening
  scenes, chapter endings, and final epilogues.
- Add postal deliveries with alternate crossings, a three-bank sluice circuit,
  a four-note seed orchard, a two-keeper rainseed rescue, echo/crate solutions,
  three-island waystone travel, a quiet/treasure stealth choice, and a linked
  counterweight-and-bell finale. Include verified clean clears and attainable
  speed targets on Trail and Nemesis.
- Put the new story covers first. Make all eight world snapshots available to
  custom book authors. Keep the three earlier books and their identities intact.
- Show original chapter endings on completion. Let players reread completed
  openings and endings from restored pages at any later camp.
- Keep short-phone headings and action rows visible; size the book board for
  its feedback and controls, with one page scroll when necessary.
- Add 32 level/alternate/format/puzzle tests and four full-book rule cases
  (374 total). Extend Chrome checks to all five books, alternate solutions,
  two complete touch stories, and six responsive layouts. Package 65 files.

## 0.17.0 — 2026-10-20

- Add Storybooks: three connected journeys of three, three, and six chapters
  through the existing Puzzle Lab worlds, with new interludes and endings.
- Choose an optional chapter promise: clean finish, tighter turn target,
  optional treasure, guide conversations, or a solution without specialist
  powers. Track progress in a readable ribbon, award honors and bonus points,
  and continue the story even when a promise is missed.
- Bind two to six world snapshots into a custom book. Write scenes, reorder
  chapters, remix a featured book, and share self-contained .storybook.json
  files. Bound imports to 1.6 MB and retain per-world validation and limits.
- Save chapter-boundary checkpoints, selected promises, chapter receipts, and
  full-book bests independently from all existing modes. Explain reload/retry
  behavior and failed storage. Protect populated drafts/checkpoints on replace.
- Add a focused reading screen, collapsible library, mobile challenge previews,
  and responsive book creator. Keep the title and existing Workshop navigation.
- Add 21 engine/format/checkpoint tests (338 total) and a sixteenth Chrome suite
  covering full books on both rules, missed honors, creator/file workflows,
  reloads, failed saves, six touch layouts, and isolated ordinary saves.
  Package 63 static files.

## 0.16.0 — 2026-10-20

- Add Puzzle Lab with six complete playable rooms: crate crossings, two-key
  detours, bell sequences, double/crate alternatives, dialogue/rescue deliveries,
  and linked ember wheels. Include verified clears and Trail/Nemesis bests.
- Offer a focused room browser, direct remixing, and reproducible design sparks
  pairing six creative goals with six twists. Originals remain independent.
- Add Remix tools to rotate or mirror an entire world, including every layer,
  object, and patrol route. Preserve channels and IDs, invalidate stale clears,
  and keep each operation undoable. Bound cursors after rectangular transforms.
- Add practice from the editor cursor with fresh goals and supplies. Label it
  unscored, preserve bests/clears on wins and restarts, and keep full Playtest
  verification separate. Report blocked starts inside the tools dialog.
- Add 19 engine/export/geometry tests (317 total) and a fifteenth browser suite
  for real room/alternate wins, transformed wins, practice isolation, history,
  tall/wide maps, and six touch layouts. Package 59 static files.

## 0.15.0 — 2026-10-20

- Open the game’s title screen at the bare website URL. Keep terrain creation
  available from its menu and explicit `#mapmaker` route. Remove the player UI’s
  source-code link and provide readable loading/retry guidance without commands.
- Add Training camp with two hands-on lessons. First Light Crossing uses real
  movement, conversation, a lever door, lantern restoration, and a keeper rescue.
- Add a guided creator practice table: paint a bridge, place goals and a keeper,
  write a story, check routes, complete a playtest, and export an adventure with
  a real creator-clear replay. Support hosted play links and an explicit handoff
  into the full Workshop with cancellation-safe draft replacement.
- Show one coaching objective and map target at a time. Keep instructions above
  the map on compact screens and put dialogue/Plan in readable paused dialogs.
- Isolate lesson runs, drafts, and memory from existing game/editor saves. Keep
  bounded lesson completion separately; report unavailable storage.
- Add eight engine/storage/proof tests (298 total), a fourteenth browser suite,
  and three public assets (57-file distribution).

## Website publishing — 2026-10-20

- Publish the complete browser game, terrain Mapmaker, and Adventure Workshop
  on GitHub Pages. Players open a link without cloning or installing anything.
- Deploy the tested static artifact after all five Tilewright CI jobs pass on
  `main`. Pull requests and other branches cannot publish the website.
- Put the public play link first in player documentation and explain portable
  adventure sharing, browser-local saves, and automatic website updates.
- Retain game version 0.14.0 and its 54-file distribution; gameplay and save
  formats are unchanged.

## 0.14.0 — 2026-10-20

- Bring terrain Mapmaker into the game’s forest-and-brass presentation with a
  focused canvas, compact palettes/world notes, and visible game navigation.
- Add Build adventure to copy current terrain into an independent Workshop
  draft. Preserve the original map, history, campaign records, and checkpoints.
- Refine the Workshop with a scenic creator’s camp, sticky navigation, eight
  quick brushes, clickable goal counts, and a Design/Playtest/Share action bar.
- Fold world/toolkit, story, and challenge settings into smaller sections.
  Show structural readiness and creator-clear status separately, with direct
  playtest/share actions and illustrated creation/sharing previews.
- Add a three-chapter illustrated Creator’s guide available from both editors,
  a player guide, current screenshots, and corrected authoring documentation.
- Preserve native keyboard focus after compact palette selection, validate fields
  within closed details, keep copied layers editable, wrap long player text,
  and remove unnecessary replacement confirmation for an untouched first draft.
- Add a thirteenth browser suite for seven-size creator navigation, panels,
  guide/input isolation, terrain copying, quick brushes/history, story editing,
  readiness, and saved-data preservation. Retain 290 Node tests; package 54 files.

## 0.13.0 — 2026-10-19

- Add Adventure Workshop to the title, mode preview, and game Menu: a searchable
  player shelf, draft designer, previews, remixing, and explicit return paths.
- Author three adventures: The Brassleaf Post, The Borrowed Moon, and Hearthlight
  Express. Each has dialogue, linked puzzles, specialist tools, and real winning
  routes on Trail and Nemesis. Alternate routes use supplies/levers, waystones,
  and a lantern double on a pressure bridge.
- Create 8–64-cell worlds, copy current terrain, or start from twenty seeded
  region/mission recipes. Paint 24 object types, terrain/fill/rectangles, and
  puzzle stamps. Edit keeper dialogue/rewards, four linked channels, bell order,
  patrol/hunter routes, sight, cover/hazards, rescues, and relic quests.
- Add eight palettes, specialist/rule choices, story/opening/ending/hints,
  30-step Undo/Redo, draft autosave, fitted zoom, panning, and keyboard painting.
  On small screens, details move to a separate dialog.
- Share versioned adventure files and checksummed LT1 codes. Hosted copies can
  share smaller preview links. Importing previews a world without changing an
  open draft or terrain map. No public gallery or upload service is claimed.
- Record actual creator playtests, replay attached proofs before verification,
  and offer a solution viewer with step, skip, speed, pause, and restart.
- Separate player bests/drafts/shelf and per-run learning from existing saves.
  Bound imports and decoded terrain; report failed saving/clipboard access;
  retain session data without silently evicting worlds.
- Add 26 Node checks (290 total), a twelfth browser suite, a Workshop guide,
  and nine public assets (51-file static build).

## 0.12.0 — 2026-10-19

- Unify the game board, HUD, buttons, notes, dialogue, forecasts, camp choices,
  pause, and results under the same forest-and-brass visual theme.
- Keep Main menu visible during play and add it to pause/results. Provide shared
  journal, field-guide, and options navigation in the adventure library. Preserve
  exact Continue, dialog focus, map history, and the fitted play layout.
- Add an Adventure Journal with chapter mastery, both rule sets' stars, specialist
  dispatches/honors, twelve earned/unearned badges, and real progress totals.
- Suggest unfinished stories, specialist goals, and the daily trail. Preview
  destinations without auto-starting a mission or replacing a checkpoint.
- Align mode actions, add illustrated chapter banners, and keep journal navigation
  visible while browsing. Remove remaining badge checklist symbols.
- Add four read-only progress/recommendation tests (264 total), a native-input
  journal browser suite, and two public assets (42-file static build).

## 0.11.0 — 2026-10-19

- Open Play on a full title screen with original moonlit forest artwork. No run
  is created until a player selects a mission. Preview Story, Guild, Expeditions,
  and Mapmaker before entering their selection screens.
- Add a three-page field guide explaining goals, controls, enemy turns, and
  specialist tools. Restyle adventure selection, menus, and options to match the game.
- Add working sound on/off, volume, system/reduced motion, and standard/large
  reading settings. Store bounded preferences separately; audio remains opt-in.
- Add return-to-title and exact in-memory Continue, plus explicit saved-expedition
  recovery after reload. Retain editor undo, records, checkpoints, and turn rules.
- Add preference validation/failure tests and volume checks (260 Node tests).
  Expand the static build to 40 files and add title/menu browser coverage at seven
  viewport sizes. Retained browser routes now enter through visible game menus.

## 0.10.2 — 2026-10-19

- Replace alert-style message panels with a dark, gold-framed game text box and
  16px monospace lettering. Remove status icons and headings; keep readable
  contrast, persistent text, and the existing position beneath the map.
- Use in-world messages for travel, rest, and blocked keepers. Carried relics
  and audible footsteps retain their distinct warnings.
- Remove checkmarks, empty circles, and cross/medallion markers from quest notes,
  side goals, and Guild commendations. Express progress with words and counts.
- Update browser checks to verify actual completion and earned state instead
  of matching decorative symbols. Preserve game rules and saved progress.

## 0.10.1 — 2026-10-19

- Move gameplay feedback directly between the map and controls. Use persistent
  16px semibold text, strong contrast, a visible marker, and clear labels for
  blocked paths, unavailable actions, damage, and completed objectives.
- Keep complete feedback readable without fading or clipping. Use a short
  opening reminder; the full mission description remains in Quest.
- Increase dialogue and forecast text to 16px and improve contrast in result
  panels. Explain how to interact when a keeper blocks the path.
- Extend the seven-size browser layout check with real blocked movement,
  contrast/visibility checks, dialogue, repeat attempts, and successful pickups.
  Preserve turn rules, saves, and the single-screen play layout.

## 0.10.0 — 2026-10-19

- Add Echoist, a third Guild specialist: cast a six-turn lantern double to hold
  pressure plates and lure hunters, then return for one energy. Capture, lifetime,
  cooldown, landing dangers, blocked returns, and costs are explicit.
- Add The Glasshouse Double and The Borrowed Horizon with plate/crate/waystone
  alternatives, keeper loadout choices, a locked lighthouse, rain control, Neri's
  rescue, ordered bells, and memory-lens delivery. All three kits work on both rules.
- Put the two new jobs first and select Echoist for the next job by default.
  Keep the existing single tool button; it changes from Double to Return with a
  countdown. Add original double sprites, minimap markers, and opt-in sound.
- Keep occupied cells of the new pressure bridges open until clear. Returning
  grants no immunity, and a hunter reaching the double extinguishes it.
- Expand Guild bests from 24 to 48 categories / 144 commendations while retaining
  all original records. Preserve story saves and expedition rules 0.6.0.
- Add 34 tests (258 total), 68 complete Guild witness routes including every
  dialogue branch, a 48,000-input Guild soak, and expanded real-input browser
  playthroughs. Reject recorded movements that spend no turn.
- Document four further gameplay prototypes separately from delivered features.

## 0.9.0 — 2026-10-19

- Add six authored story missions across The Tideglass Coast and The Clockwork
  Orchard, bringing the campaign to 24 missions in eight chapters.
- Add changing causeways, a three-island token circuit, a lighthouse convoy,
  two-cart hedge doors, a walking midnight market, and a living-clock finale.
- Add original coast/garden Canvas artwork, terrain palettes, new keepers,
  alternate dialogue loadouts/endings, and two chapter-specific Nemesis replays.
- Keep the compact one-chapter library and tabbed notes, protect all 48
  campaign/rule bests within the existing record limit, and preserve old saves.
- Add 22 clean three-star witnesses covering every new choice on both rules,
  24,000 exploratory inputs, and committed hashes for all 18 previous missions.
- Include crate positions in the developer route-search state key; confirm the
  optional cart witness actually opens and crosses its northern door.
- Add a ninth browser suite for complete new-mission runs, touch layouts,
  unlocks, result reloads, record/editor retention, and final return focus.

## 0.8.1 — 2026-10-19

- Separate active play from the adventure library. Browse one three-mission
  chapter at a time, with a direct return to the unchanged current run.
- Group quest progress, minimap, kit/journal, and controls into four accessible
  tabs. Use a compact sidebar on desktop and a separate notes panel on phones.
- Fit the board and compact controls to normal portrait/desktop viewports; keep
  a bounded document scroll on short screens. Move secondary actions into Menu
  and library shortcuts into a disclosure.
- Block turn shortcuts while browsing or reading mobile notes, retain focus and
  tab selection across resize, and show custom-map/export notices in the library.
- Add a focused layout browser suite and adapt all seven retained suites to
  navigate visible menus, chapters, and notes through the public controls.
- Fix menu focus transitions so Pause and Restart activate before the menu
  closes. Recheck keyboard/touch actions, complete mission runs, and checkpoints.
- Keep simulation rules, authored levels, and save formats unchanged.

## 0.8.0 — 2026-10-19

- Add the Wayfarers’ Guild: six original dispatch maps, open job selection,
  specialist previews, and 24 independent job/kit/rule best categories.
- Add Bellrunner’s bounded resonance pulse and Mistweaver’s perception veil,
  with energy costs, six-turn reuse intervals, visible state, and keyboard B.
- Add paired waystone travel, destination/next-turn warnings, one-energy turn
  costs, occupied/blocked landing guards, cargo delivery, and discovered-map pins.
- Add three optional commendations per job, completion-only records, separate
  kit/rule bests, and truthful session-only results when browser storage fails.
- Preserve all existing story and generated expedition behavior; retain rules
  0.6.0 checkpoint fingerprints and 0.5 migration. Capture six genuine pre-Guild
  0.6 backups from the committed v0.7 simulation for independent restoration.
- Add 41 tests (199 total), 24 clean Guild routes / 1,832 turns, 56 jumps,
  25 tool activations, eight clean alternate key/one-jump routes, and a
  24,000-input Guild soak (102,000 retained/new inputs).
- Add a seventh browser suite for complete Guild runs, touch layouts, controls,
  progress reload, modal/pause isolation, restart, original saves, and storage failures.
- Record primary developer research and distinguish tested behavior from future
  ideas, human enjoyment, and kit-balance claims.

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
