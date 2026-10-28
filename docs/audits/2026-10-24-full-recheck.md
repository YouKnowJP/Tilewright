# Complete game recheck — Tilewright 0.26.1 and Switchback 0.2.3

## Scope and outcome

Reviewed gameplay, player-facing information, settings, dropdowns, keyboard/touch controls, responsive layouts, creators, saved data, and release packaging. The audit uses disposable browser contexts and a separate origin for manual play, so tests do not erase or replace a player's existing journey.

All 28 existing Tilewright browser families passed in Chrome. A new route-review family also passes, bringing the browser runner to 29 families. Eight shared interface families passed in Firefox and WebKit. Targeted checks repeated the final Plan header, review correction, and Switchback landscape/fullscreen behavior after their fixes.

## Corrections

- **Plan navigation:** the bottom-sticky Back button could cover extra-large surroundings text. Back now lives in the top header, stays reachable while scrolling, and each opening starts at the latest forecast. Reading still spends no turn.
- **Route reviews:** damage on a winning action was hidden behind the completion event, allowing a misleading clean-route hint. Both events now appear. The first hit and final completion remain in long reviews even after the 60-moment display limit.
- **Accurate information:** replaced Storybooks' stale reload/restart message with the actual Continue behavior; corrected the original-level count to 19; clarified that Unwarded disables shield charges while specialist wards still work.
- **Switchback pace:** Daily now displays its actual Standard pace and restores the player's preferred pace when leaving Daily. A ready page left overnight now starts the current UTC date seed; an existing attempt retains its starting date.
- **Switchback menus:** Pace uses the same HTML combobox/listbox interaction as Tilewright, with Switchback colors and a compact width. No OS picker opens. Disabled states, keyboard typeahead, cancellation, touch choices, and focus remain synchronized with the source control.
- **Switchback layout:** removed the desktop gap between a height-limited board and its settings. Landscape phones place the board beside the HUD and controls, keeping the playable area in view. Fullscreen retains a usable minimum board width, and small controls have 44-pixel targets.
- **Switchback input/status:** finishing focuses the next/retry action; unavailable storage is reported at startup; width changes pause a running game and cancel an unfinished swipe, so rotating cannot silently steer or advance the run.

## Verification

- **Tilewright:** 585 Node tests pass, plus syntax and static-build checks. The build contains 90 public assets and two release/manifest files.
- **Switchback:** 42 Node tests pass, plus syntax and static-build checks. Its build contains 11 public assets and two release/manifest files.
- **Tilewright Chrome UI families (14):** profiles, saved-data management, dropdowns, interface/controller navigation, controls, front menu, journal, game layout, terrain editor, settings, checkpoints, training, creator shell, and accessibility.
- **Tilewright Chrome gameplay families (14):** ordinary adventures, contracts, expeditions, sluices, atlas chapters, Guild, horizon chapters, mastery, Trailhouse, Storybooks, Puzzle Lab, Workshop, expansion, and expansion details. Guild alone includes 75 scenarios; existing chapters, optional routes, stories, and specialist kits are played through their actual controls.
- **Additional review family:** an actual damaging finish, both timeline moments, accurate guidance, and start/finish scrubbing at 320, 390, 768, and 1440 pixels; repeat checks in Firefox and WebKit at phone/tablet widths.
- **Cross-engine Tilewright UI:** front menu, interface, controls, dropdowns, profiles, saved data, training, and Workshop passed in Firefox and WebKit. These include dialogs, real wins, creator tools, dropdown placement, multi-tab save coordination, and failed-storage recovery.
- **Switchback Chrome:** all six campaign stages completed through real keyboard inputs at Cruise, Standard, and Rush: 18 stage/pace combinations, with two real lesson pauses, Gold scores, unlock persistence, five-run history bounds, and reset cancellation/acceptance.
- **Switchback layouts:** 320×568, 390×844, 768×1024, 1024×768, 1440×900, and 844×390. Menus and overlay bounds are checked; the running landscape board and controls must fit the view. Firefox/WebKit repeat phone, tablet, and landscape scenarios.
- **Switchback live behavior:** all arcade modes actually run; phase switching and Classic restrictions work; Pause freezes movement; resume reaches a real loss; records append once; New run unlocks settings. Blocked, quota-limited, and corrupt storage still allow real lesson clears. Fullscreen works or reports unavailability. A native Chromium touch-swipe sequence completes the lesson after rotation without losing its state.
- **Manual in-app play:** Switchback's live lesson completed in 11 moves for Gold. Lantern Trails' live chapter restored both lights, retained turn 12 across reload/Continue, opened and closed Plan at extra-large text, and finished in 25 turns. Dropdowns, readable dialogue/forecasts, and return navigation were inspected on screen.

The Switchback harness controls the browser clock while sending real keyboard, button, and touch input to the shipped animation loop. Fixtures and automation are test-only and excluded from the public package. This makes timing repeatable without shipping an automated player.

## Visual evidence

- [Plan at extra-large reading on a phone](../screenshots/plan-layout-check.png)
- [Route-review regression](../screenshots/review-damage-check.png)
- [Switchback landscape play](https://github.com/YouKnowJP/Personal-Project/blob/c1c7534e4641e0385293af004d1c5c7346e0a920/Switchback/docs/screenshots/recheck-landscape.png)
- [Switchback phone result and menus](https://github.com/YouKnowJP/Personal-Project/blob/c1c7534e4641e0385293af004d1c5c7346e0a920/Switchback/docs/screenshots/recheck-phone.png)

Browser emulation and engine checks do not certify every physical device, assistive technology, or future browser release. Actual phone/tablet hardware and full screen-reader play remain separate testing needs. No remaining failures were found in the scenarios listed above; this is not a claim that every possible bug has been ruled out.
