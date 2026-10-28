# Screen and saga verification — October 25, 2026

Release: Tilewright / Lantern Trails 0.30.0.

## Scope

Compact viewport-filling play; on-demand Tools/Quest; native and expanded
screen modes; Home Screen assets; paged/searchable libraries; eighteen new
worlds in three books. Existing action handlers, saved journeys, checkpoints,
and v1/v2 portable world formats remain in use.

## Deterministic checks

**778 Node tests pass**, with syntax checks and the 114-file static build.
The Node suite checks immutable complete clean routes through all eighteen
new worlds on Trail and Nemesis, full goals and three stars, exported creator
proofs, halfway checkpoints, Undo, and complete route reviews. Additional hard
witnesses finish the optional guarded garden and all three vaults without
damage on both rules. Catalog tests check chapter order and genuinely peaceful
cooperative maps. Screen-controller tests cover immediate gesture requests,
standard/prefixed methods, unsupported/refused policies, overlap guards,
external Escape, cancelled requests, late events, failed exit, and cleanup.

## Live browser checks

The built-release suite contains 23 scenarios. Alongside all prior release
checks, it runs full six-chapter weather, courier, and cooperative books,
reloads between camps, tests both optional hard routes, verifies long message
reading and unchanged interaction confirmation, and exercises new library
search, filters, pagination, and keyboard focus.

Responsive checks cover 320×568, 390×844, 430×932, 768×1024, 1024×768,
1440×900, 844×390, and 568×320. They check document width/height, available
board space, safe-area spacing, right-side large controls, extra-large text,
high contrast, and checkpoint stability. Fullscreen checks request the real
API, read actual native state where supported, open settings/Quest, exit
externally, return through the main menu, and exercise a rejected request.
The launcher’s manifest and all icon URLs are served and inspected.

The 23 release scenarios pass in Chromium 156.0.8078.4, Firefox 156.0, and
WebKit 26.6. One Firefox phone tap timed out in the full run; its isolated repeat
passed. Earlier failed assumptions and layout cases were corrected and rerun.
The final focus/fullscreen/editor changes also pass focused Chromium checks.
Additional Chromium families pass: dropdowns 12, controls 19, accessibility 5,
settings 4, and interface 11. The interface checks include three clean
three-star Nemesis campaign wins. Curated board, phone, landscape, and library
screenshots were reviewed and saved with the [player guide](../SCREEN_AND_SAGAS.md).

The publishing check compares all 112 public assets against the built package,
then repeats the ten new presentation/content scenarios on the public URL.
CI independently runs syntax, Node tests on five OS/Node combinations, and
all 23 Chromium release scenarios before Pages can deploy.

## Issues found and corrected

- Peaceful/festival book shortcuts could inherit a conflicting search or filter.
  They now reveal the requested book and open its shelf fold; the regression
  repeats both shortcuts after an empty search in all three engines.
- Confirming the currently selected nearby action did not emit a value change,
  leaving Tools over Interact. Dropdowns now emit a separate confirmation event;
  cancellation and unchanged setting semantics remain intact.
- Old result-screen accessibility rules overrode compact layout sizing, growing
  phone and landscape pages. Results now have a bounded fixed reading panel
  with internal scrolling and a preserved viewport-sized play area.
- Replacing world cards lost keyboard focus after paging. Focus now moves to
  the first new world before the shelf scrolls into view.
- Closing Controls could attempt to focus a hidden Tools child because some
  browsers still report its layout rectangle. Focus now returns to the visible
  Tools summary while preserving a newer deliberate focus choice.
- Extra-large reading rules displaced the small-phone menu. The reading header
  now keeps a full title row and a correctly anchored action row.
- Fullscreen shortcuts and the visible exit now distinguish gameplay from the
  terrain editor, preserving its Fill shortcut.
- Repeated play updates scheduled redundant canvas resizes. Viewport changes
  use the existing ResizeObserver; message measurements coalesce per frame.

Two test assumptions were corrected: initial story text is intentionally in
Quest, and four books qualify for the peaceful filter. Manifest inspection
uses the test request client so the game can retain its strict runtime CSP.

## Limits

Browser engines and emulated viewports do not substitute for every physical
phone, branded Safari release, browser extension, or operating system. Native
fullscreen depends on browser/device policy; expanded view and Home Screen
instructions remain available when it is unavailable. Safe-area and controller
inputs include simulations. Home Screen launch requires a network connection;
there is no service worker or offline-play promise. Successful checks establish
the tested behaviors, not an absolute guarantee that no bug can exist.
