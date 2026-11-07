# Tilewright development tools

Run the usual commands from the Tilewright folder:

```sh
npm start
npm run verify
```

| Location | Responsibility |
| --- | --- |
| [check.mjs](check.mjs) | Recursively checks syntax in source, tests, and tools. |
| [build.mjs](build.mjs) | Packages only the explicit public-file allowlist into `dist/`. |
| [browser/checks.mjs](browser/checks.mjs) | Entry point for all 30 optional live browser-check families. |
| [browser/pip-compatibility-checks.mjs](browser/pip-compatibility-checks.mjs) | Built-game cross-engine Pip checks and release metadata. |
| [browser/](browser/) | Feature-specific checks and shared UI/capture helpers. |
| [solvers/](solvers/) | Developer witness generators; produce ordinary input journals through the public rules. |

## Optional live checks

Install the locked development tools with `npm ci`. For the release checks:

```sh
npx playwright install --with-deps --only-shell chromium
npm run test:browser:smoke
npm run test:browser:recovery
```

The command builds the static package, starts a temporary loopback server, and
plays that exact package. It checks phone/desktop looks and recovery while frames
are suspended, both training lessons and a real creator export, journey-specific
wardrobe backups and fresh starts, quota failures, and the full Lanternfair book.
It closes the browser and server afterward. No separate server is needed.

The release catalogue retains all earlier cases and adds six Drumkeeper cases:
four-mission phone/desktop clears, individual/bulk timing/relay/card/power
composition with capture and exchange, part editing/protected imports, exact
recorded-beat checkpoints through reload/Undo/backup, and enlarged menus
with old/new replays. It has **258 distinct cases**, split **65/65/64/64**. All earlier
road, scale, tide, keyboard, controller, interruption, touch, fullscreen and
practice checks remain required. Ordinary cases reject every unexpected console,
script or failed-asset response.

Run the focused compatibility suite against a freshly built package:

```sh
npx playwright install --with-deps firefox webkit
npm run test:browser:pip -- chromium
npm run test:browser:pip -- firefox webkit
npm run test:browser:pip -- webkit --shard=1/3
npm run test:browser:pip -- webkit --shard=2/3
npm run test:browser:pip -- webkit --shard=3/3
```

The runner checks six Wayside Keeper cases, six Drumkeeper cases, six Weavekeeper cases, six Kilnkeeper
cases, six Mixing House cases, six retained Echo Post cases and two legacy
save/share cases (thirty-eight total),
records the built release metadata, closes the browser/server and removes its
owned temporary build. Firefox and WebKit each run in three required CI groups of
13, 13 and 12, retaining all thirty-eight cases per engine within the existing twenty-minute
job limit. Original action deadlines and full tracing remain enforced. Reports
record the group and use distinct filenames; all six jobs and the full release
suite must pass before publication. Reports are retained for seven days. Unsharded
local commands still run the complete compatibility suite.

The recovery command additionally interrupts a real startup module request,
checks the Retry flow with untouched saves, holds loading past the real 15-second
notice, and disconnects/reconnects a loaded game before exact Continue/Undo.
Run it with `-- chromium firefox webkit` after installing those engines to test
all three. CI requires these three recovery checks alongside preserved migration
in browser group 1. Expected network-failure console messages are checked only
inside this isolated runner; ordinary release cases still reject all errors.
Recovery failures keep screenshots, console JSON and a trace under
`playwright-report/startup-recovery/`.

This suite gates deployment in CI. Failures retain a screenshot, console/error
JSON, and Playwright trace in `playwright-report/release-smoke/<engine>/`; successful
reruns remove the matching stale failure files. CI keeps failure reports for seven
days. Reports are ignored by Git and excluded from the game. See the official
[Playwright CI guide](https://playwright.dev/docs/ci).

To repeat one case, for example:

```sh
npm run test:browser:smoke -- saved-looks-and-continue-390
```

Unknown case names fail instead of silently passing an empty suite. For all 30
extended browser families, keep the development server running and Google Chrome
available, then run `npm run test:browser`. Individual modules also export
functions for focused checks and Firefox/WebKit runs.

The browser suite lives in `scripts/browser/`; the npm command stays the same.
`ui-driver.mjs` shares real UI interactions, and `artifacts.mjs` puts optional
captures in the project's ignored `.playwright-mcp/` folder even when a harness
is launched from the repository root. Copy only reviewed evidence to
`docs/screenshots/`; routine checks never overwrite documentation images.

The route generators and `story-driver.mjs` live together in `scripts/solvers/`.
Saved route fixtures stay in `tests/fixtures/`. Source, fixtures, browser tools,
and generators remain separate, and the static build excludes all developer
tools. See the [documentation index](../docs/README.md) and
[repository organization guide](../docs/README.md).

The release suite also runs `cartographer-browser-checks.mjs`: full six-chapter
phone/desktop books, all four hint lessons, three vault tiers, creator card and
clue authoring/export/reload, 320-pixel extra-large/high-contrast play with quota
failure, and simulated standard-controller handoff/Undo isolation. New chapter
witnesses and version-2 portability/legacy checks live in `tests/cartographer.test.mjs`.


The release suite contains **188 scenarios**. `presentation-browser-checks.mjs`
adds eight viewport sizes, native/external fullscreen exit, rejected-request
fallback, launcher assets, safe areas, large controls, long message reading,
unchanged-action confirmation, searched/paged shelves, all eighteen new book
chapters, camp reloads, and both hard optional courier routes. The game’s CSP
continues to block runtime network connections; test-only asset inspections
use the Playwright request client. Node saga tests verify both rules, complete
portable proofs, checkpoint/Undo/review fidelity, and optional hard routes.

`library-clockwork-browser-checks.mjs` adds seven required scenarios: all three
Clockwork Post chapters at phone/desktop widths, helper programming/Undo/reload,
separate book bookmarks with exact latest-trail continuation, paged discovery,
keyboard and enlarged-text confirmations, protected map/draft replacement,
real creator card editing/export/reload and an attached playtest clear,
and recovery when an interrupted write leaves the active book older than its
bookmark. Node checks also cover creator transforms, shared version-3 worlds,
both rule sets, and bookmark backup/profile/storage boundaries.


The v0.30.1 full audit repeats all 30 extended families (483 result entries).
The release checks also verify short-landscape pack/menu bounds, enlarged grid
tracks, pause/result Tab cycling, and no-turn notes after actual wins. Current
UI helpers open the visible Quest or result-note action, use paged world search,
and return through Main menu where necessary. See the [audit](../docs/audits/2026-10-25-v0301-full-recheck.md).


`npm run test:browser:migration` serves the retained `legacy-mit-v0.30.1` tag and
current build under two paths on one origin. It verifies real saved-game
continuation, preferences/drafts, the rights page, and shared-world links.
The tag must be present; this check uses Git and tar, and runs in Linux CI.


`pip-orchestra-browser-checks.mjs` adds five required cases: all six new chapters
on phone/desktop, no-turn recipes/rehearsal with keyboard and enlarged layouts,
version-4 creator editing/export/reload/proofs, and exact continuation from a
captured v0.31 Pip checkpoint. Node tests cover both rule sets, occupied-floor
safety, bell recovery, rehearsal immutability, action histories and transforms.


`pip-atlas-browser-checks.mjs` adds six release scenarios: all four courier trials
on phone/desktop, eight-slot satchel save/share/import/Undo/reload, real creator
flag/rule authoring and proved export, enlarged layouts and quota faults, and
original v0.32 save continuation. Node tests check ordering, parking, rewrite
limits, dock behavior, assembly numbering, room rotation, profile isolation and
bounded data-only program files.


`pip-parcelworks-browser-checks.mjs` adds six required scenarios: all five chapters
with phone touch and desktop keyboard play, free program transforms/rehearsal
and satchel export, actual creator tube painting and proved export followed by
shared-link play, 320-pixel largest-text/high-contrast directory/dropdown/focus
checks across four layouts, and captured v0.33 continuation. Node tests verify
blocked exits, tube-only connectivity, assembly pairing, map/room transforms,
immutable forecasts, rewind/reviews and version-6 portability.


`pip-loom-browser-checks.mjs` adds six required cases: the six-chapter book on
phone and desktop, changing-program rehearsal and victory focus, stamp painting/
satchel borrowing/rotation/assembly reuse with proved export and shared play,
320-pixel enlarged engraving and corrupt-satchel recovery, and original v0.34
continuation. Node tests cover both difficulties and treasure clears, all 216
rehearsal drafts, compact v7 portability, prior export bytes, required stamps,
rewrite accounting, transforms, immutable state, Continue/Undo and reviews.


`pip-foundry-browser-checks.mjs` adds eight required cases for the Lantern Foundry:
full phone/desktop books, parcel inventory and powered routes, guarded dock resets,
mirrored puzzle previews and downloads, actual creator/shared play, enlarged UI
and original v0.37 save continuation.

CI runs the complete release catalogue in four parallel groups. The groups contain
65, 65, 64 and 64 of the current 258 cases; all four groups must pass before deployment. No scenario is
removed. Local `npm run test:browser:smoke` still runs everything. To run a group:

```sh
npm run test:browser:smoke -- --shard=1/4
npm run test:browser:smoke -- --shard=2/4
npm run test:browser:smoke -- --shard=3/4
npm run test:browser:smoke -- --shard=4/4
```

The partition is stable when case names are supplied for a focused retry. Reports
record their group. Invalid/duplicated shard options fail before starting a
browser, and an empty selection still fails. CI allows 35 minutes per group;
per-action timeouts remain 15 seconds. Preserved-baseline migration runs in the
first group and remains part of the deployment gate.

Ubuntu browser jobs use the HTTPS Ubuntu archive in place of the stalled Azure
mirror. Package acquisition has 30-second HTTP/HTTPS timeouts and two retries;
browser installation has an eight-minute step limit. Repository signatures and
the complete gameplay gate remain enforced.

[`ci-apt.mjs`](ci-apt.mjs) configures the ephemeral Ubuntu runner before browser
installation. It handles direct `.list`/`.sources` entries and the runner's
`apt-mirrors*.txt` files used by `mirror+file:` URLs. Normal unit tests use
temporary directories to verify the rewrite and bounded settings on every Node
platform; running tests never edits the host's APT configuration.

`pip-home-browser-checks.mjs` adds ten required v0.53 cases: direct phone/desktop
entry and every story card; three-stage hints with protected example cancellation;
all three real-engine practice rooms with guided/manual clears, Undo and save
isolation; exact legacy collection resume/reload/backups; recent ordinary drafts;
protected unreadable/quota saves; enlarged themed menus and sticky-header
navigation; creator/builder/import/classic-learning paths with separate journeys;
and Escape/focus/main-menu/legacy Workshop navigation. The full catalogue has
**198 distinct cases**, split **66/66/66** with all older coverage retained.


`pip-switchback-browser-checks.mjs` adds eight required checks for both complete
Switchback Station books, cargo questions and free rehearsal, dock reset/Undo,
real junction repaint and bank swaps, builder-note puzzle export/import and
shared play, malformed notes and storage failures, enlarged custom menus and
long notes, and original v0.38 checkpoint continuation. The complete release
v0.41 catalogue had 98 cases, partitioned into 49 per CI group.


`pip-glassworks-browser-checks.mjs` adds eight required cases: complete phone
and desktop Glassworks books, wrong-input/rehearsal and real return recipes,
reset/Undo, creator recipes and edited/transformed portable pieces, verified
shared play, quota/damaged-shelf metadata edits, large-text custom menus and
piece forms across four viewport shapes, and original v0.39 continuation.


`pip-gardens-browser-checks.mjs` adds eight required cases: clean phone/desktop
books, free flip rehearsal and reset/Undo, actual creator banks and blueprint
exchange with verified shared play, quota/damaged-shelf blueprint recovery,
enlarged themed bank/blueprint menus across four viewport shapes, independent
route memories and the original v0.40 continuation. Capture controls use the
explicit `ws-assembly-capture` disclosure so a second optional drawer cannot
make older capture checks ambiguous.


`pip-tinker-browser-checks.mjs` adds eleven required cases: all ten inventions
on phone/desktop, keyboard building/budgets/Undo, verified project/adventure
exchange and actual wins, postcard/feedback downloads, shared relay previews,
appearance/display persistence, enlarged themed menus across four viewport
shapes, damaged/quota storage recovery, interrupted event advancement, honest
community filtering and the original v0.41 checkpoint continuation. The release
catalogue contains 109 cases split exhaustively into groups of 55 and 54.


The v0.42.1 release adds three required regressions for canonical invention
names and Undo with retained clears; editing/removing placed prisms, recipes
and A/B memories with real test wins and exports; and enlarged, high-contrast
part controls across phone, landscape, tablet and desktop shapes. Themed
comboboxes honor inherited disabled fieldsets. The v0.42.1 112-case catalogue
is split into two exhaustive groups of 56. The eight pure parity tests in
`tests/pip-tinker-parity.test.mjs` compare every three-card program with the
main adventure rules, including both initial banks for the memory lesson.


`pip-duo-browser-checks.mjs` adds eight required v0.43 cases: all six missions at phone and desktop widths; real creator wins, saved shelves and project sharing; configured/captured/imported blueprints with atomic Undo; shared finale replay and proof validation; enlarged high-contrast menus across four viewport shapes; damaged/quota recovery with legacy save preservation; and terrain, starts, dialogue and part editing. The v0.43 **120-case** catalogue splits exhaustively into two groups of 60. New duo cases also run locally in Chromium, Firefox and WebKit.


`pip-night-mail-browser-checks.mjs` adds six required cases for all six harder stories at phone/desktop widths, repair clears and displays, editable locker/cargo rules and goals, reflected/repeated blueprints with confirmed revisions, version-3 sharing with old-project continuation, and enlarged themed controls/placement previews across four viewport shapes. The v0.44 **126-case** catalogue splits into two groups of **63**. Pure compatibility fixtures capture exact v0.43 codes, exports and final states; new tests exercise bounded lockers, conditional programs, atomic arrangements and revision isolation.


`pip-workshop-tools-browser-checks.mjs` adds six required cases: four Dawn repairs on phone/desktop, rehearsal event paging and frame inspection with Undo, whole-garden turns/resizing/area brushes with actual clears, palette/partner remixes with protected saves and sharing, and enlarged themed controls with test-mode locks. The v0.45 **132-case** catalogue splits exhaustively into two groups of **66**. Pure tests compare rehearsals against real wins in all sixteen duo chapters and exercise geometry, protected edits, no-op clears and arbitrary-cargo banks.

`pip-canopy-browser-checks.mjs` adds eight required v0.46 cases: four new stories at phone/desktop widths; independent blueprint connections with placement/Undo/save/reload; atomic number swaps and invalid-map recovery; valid-space cycling and a real corner-atelier clear; a two-handoff waiting-bell clear; enlarged themed connection menus and test-mode locks; exhausted-network recovery and an intentional one-ended locker join. The v0.46 catalogue contains 140 distinct cases, split into two exhaustive groups of 70.

`pip-collections-browser-checks.mjs` adds eight v0.47 cases: After Hours story repairs on phone/desktop; snapshot/reorder/metadata/capacity assembly; fresh/replay/next/completion navigation; custom-remix identity; damaged/oversized/forged imports; confirmed collection remix/starter and clipboard fallback; and enlarged themed menus with focus return. The required catalogue contains 148 distinct cases, split into two exhaustive groups of 74.


`pip-persistence-browser-checks.mjs` adds eight v0.48 cases: four Clocktower repairs at phone/desktop widths; autosaved assembly, duplicate chapters, independent copies and full-shelf saving; exact test resume/Undo, verified clears and confirmed restart; reorder/update identity; real journey/backup/reset/restore flows; corruption/quota/other-tab protection; and enlarged themed shelf menus, focus return and confirmed removal. The required catalogue now contains 156 distinct cases, split exhaustively into two groups of 78. `tests/pip-collection-storage.test.mjs` covers bounded persistence, proof validation, replay, remapping, copy isolation, storage failures, journey scopes and sharing isolation.


`pip-atlas-collections-browser-checks.mjs` adds eight v0.49 cases: four Star Atlas repairs at phone/desktop widths; source-copy/reverse/Undo/reload; all garden remix tools with real proof retention, draft fallback and protected turns; confirmed per-chapter map replacement and selective progress reset; six-map SVG/poster and PC1 sharing; enlarged themed menus across four viewport shapes; and starter/import/paused-test resume. The required catalogue contains 164 distinct cases, split exhaustively into groups of 55, 55 and 54. `tests/pip-collection-tools.test.mjs` checks necessary repairs, immutable remixes, changed courier-order proofs, source isolation, bounded snapshots and escaped progress-free posters.

Confirmed collection updates await the actual confirmation close event before inspecting saved state. The map-replacement regression deliberately delays that event and waits for the completed-save notice; it retains every progress assertion. This prevents a hosted check from reading the prior journal while a valid update is still pending.


`pip-lantern-browser-checks.mjs` adds eight v0.50 cases: all four switch missions on phone/desktop, creator edits/goals/shelf Undo, version-3 lantern blueprint placement/capture/import, atomic collection variants and one-chapter sharing, remembered-power resume/Undo/full-backup restoration, enlarged themed controls and variant capacity, and protected new-format imports with exact old exports. The required catalogue has 172 distinct cases, partitioned exhaustively as 58, 57 and 57. `tests/pip-lanterns.test.mjs` covers next-tick power, global toggles, bridge safety, signals, quiet finishes, version boundaries, mixed saves, variant/source isolation and a captured v0.49 compatibility fixture.


`pip-bellkeeper-browser-checks.mjs` adds eight v0.51 cases: four timed missions on phone/desktop, duration/goal editing with verified shelf saves, actual lantern/bell preview glyphs and configured blueprint exchange, selected chapter files/posters/public links and one-batch copy/Undo, exact countdown resume/Undo/full-backup rollback, enlarged curator/part menus and capacity across four viewport shapes, and starter/protected-format imports with exact v0.50 exports. The 180 distinct cases partition as 60/60/60. Local links remain disabled by the existing public-host guard; hosted runs test actual copied links. `tests/pip-bellkeeper.test.mjs` covers timing, power-source interactions, compatibility, mixed saves, source-progress isolation and curated exports.


`pip-sealkeeper-browser-checks.mjs` adds eight v0.52 cases: four passport missions at phone/desktop widths; real badge/cargo/direction editing with blocked-entry feedback and shelf saves; transformed seal blueprints with protected imports; bonus par editing, Undo, selection/PC2/poster sharing and independent copies; earned ribbons through slower retries, reload/Undo and full-backup rollback; enlarged themed menus and numeric validation; and the starter, protected edition prefixes and a captured v0.51 paused journal. The 188-case catalogue partitions as 63/63/62. `tests/pip-seals.test.mjs` and `tests/pip-collection-challenges.test.mjs` cover deterministic entry, geometry, exact compatibility, optional scoring and persistent/progress-free sharing.


`pip-mixing-house-browser-checks.mjs` adds six v0.59 cases. Both phone and
desktop finish all four stories and retain bests. A collection pauses at a
partly filled bowl, reloads, finishes its blend, undoes and restores a full
backup with exact state-key comparison. Creator cases combine ingredient-only
colour swaps with bank edits, verify independent numbered wiring and saved
sources, capture/share/reload pieces, reject invalid old/future recipes and
lock controls in tests. Largest high-contrast menus are measured at
320/390/768/844/1440 views; new projects and captured v0.58 exports replay.


`pip-kilnkeepers-browser-checks.mjs` adds six v0.60 cases: four complete mission
clears at phone/desktop widths, tick-17/18 window-heat continuation and exact
Undo/backup rollback, recipe copying/restoration with independent palette/cards/
power and preserved focus, creator/capture/import/shelf/reload isolation, invalid
old/future recipes, and largest high-contrast themed menus at five viewport
sizes. New/legacy projects replay and old exports retain exact bytes. The new
collection poster is decoded, and all new cases remain in the cross-engine gate.

## Weavekeepers and circuit composition — v0.61

`pip-weavekeepers-browser-checks.mjs` clears all four chapters on phone/desktop,
rebuilds a pre-lantern checkpoint through reload/Undo/backup, and exercises
individual/bulk relay edits, atomic power wiring, cards, capture and file exchange.
It checks truth tables, rejected port collisions, protected old/future imports,
320/390/768/844/1440 enlarged themed menus, read-only tests and literal v0.60 replay.
All six cases are required in the release catalogue and Firefox/WebKit gates.

## Drumkeepers and timing composition — v0.62

`pip-drumkeepers-browser-checks.mjs` clears the four delayed-power missions at
390/1440, restores a recorded tide beat through reload/Undo/backup, and exercises
individual/bulk clock/bell/drum timing, final-composition forecasts, atomic power
swaps, cards, capture and file exchange. It checks quiet-memory goals, protected
imports, 320/390/768/844/1440 enlarged menus, read-only tests and literal v0.61 replay.
All six cases are required in the release catalogue and Firefox/WebKit gates.
Unsupported import probes derive their next versions from the supported parts.


## Wayside Keepers and blueprint pacing — v0.63

`pip-restkeepers-browser-checks.mjs` clears all four pacing missions at 390/1440,
restores two held next cards through reload/Undo/full backup, and inspects the
same turn through the resting-event rehearsal filter. Creator checks exercise
individual/copy/raise/lower/stagger/reset timing, unchanged clock-only forecasts,
composed cards and power wiring, rotated capture, source isolation and file exchange.
They check brush editing and inspection, protected old/future/malformed imports,
320/390/768/844/1440 largest high-contrast menus, focus return, read-only controls
and literal v0.62 replay/export. All six cases remain required in the complete
release catalogue and both compatibility engines. Compatibility groups have
separate report filenames and metadata; their union must cover all 38 cases
exactly once per engine. Original action and job deadlines remain unchanged.
