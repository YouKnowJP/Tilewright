# The Welcome Lanterns and accessibility — v0.26.0

Scope: six new peaceful maps and their storybook, broader reading/display choices, color-independent map cues, input with enlarged cameras, saved preferences, responsive creator pages, and result readability.

## Implementation

- The Welcome Lanterns adds six original chapters, with recurring Ori/Moss dialogue, optional treasures and honors, a permanent crate bridge, a written three-note melody, two numbered travel-stone pairs, and a final rescue/delivery. Its worlds also appear in Trailboard’s new Peaceful filter and can be remixed or shared using the existing world/book formats.
- Both rule sets have real, replayable, clean creator clears. All chapters finish using walking and ordinary interactions; none require a dash or expiring specialist power. Waiting does not create danger.
- An Accessibility page and direct main-menu entry provide a clearer-trail preset plus individual reading size, contrast, map symbols, camera distance, and optional nearby reading panel. Enlarged text applies to menus, HUD, dialogue, forecasts, and messages; settings retain the game-styled dropdowns.
- Mechanisms use matching numbers, bells show their order, players and home/travel points have distinct letters/shapes, and plates/wheels use different outline patterns for their states. Text surroundings describe adjacent cells, crate pushes, gates, known incoming threats, and discovered landmarks without advancing or revealing the map.
- Visual preferences also reach training, recorded route review, creator-clear replay, and world artwork. Existing journey/backup formats and recorded-run fingerprints remain compatible.

## Verification

- `npm run verify`: **583 tests passed**, syntax checked, static build produced **90 public assets plus release and manifest files**. Old saves, profiles, checkpoints, ordinary creator proofs, route reviews, and unrelated mode data remain covered.
- `scripts/accessibility-browser-checks.mjs`: every new setting value, four options pages, large/extra-large reading, reload persistence, no-turn planning, status-text contrast of at least 4.5:1 in high-contrast mode, enlarged-camera tap input and Undo, and real touch chapter clears. Chrome checks cover 320, 390, 768, and 1440 pixels. Firefox and WebKit checks cover additional phone/tablet layouts. Every Workshop page was also checked with extra-large text at phone, tablet, and desktop widths.
- The complete six-chapter book was played through real keyboard input in Chrome and touch input in WebKit, including all mechanisms, final rescue/cargo, and camp restoration after each page. Node tests also complete the entire book on Trail and Nemesis with portable checkpoints.
- Existing browser families rechecked: settings, dropdowns, layout, training, checkpoints, Storybooks, and Workshop. These include portrait/landscape, small phones, touch painting, Undo/Redo, creator proof export, damaged/blocked/full storage, completed story endings, optional honors, and independent imported adventures.
- Live in-app play: restored the first chapter’s two lanterns, read Ori’s dialogue, returned to the beacon, checked the result, and inspected the readable preset and controls. Screenshots: [options](../accessibility-options.png) and [final chapter result](../welcome-lanterns-ending.png).

## Issues caught and corrected

- WebKit could report a ResizeObserver delivery loop during display changes. Viewport resize writes are now scheduled in an animation frame; unchanged canvas dimensions no longer reset the drawing surface.
- Large result text and next-chapter buttons were trapped in a short overlay scroller. Pause/results now use a complete reading panel and ordinary page flow, with no clipped ending or hidden primary action.
- Extra-large Workshop headings/navigation overflowed a tablet-width screen. Heading tools wrap, navigation uses a compact grid, and long creator text wraps within its panels.
- Peaceful maps inherited generic hunter, alarm, cargo, and travel warnings even when no hunters existed. Messages now describe the actual situation; canvas descriptions match the calm travel feedback.
- The Storybook library-order assertion was updated for the new first book. A transient tablet input timeout and a desktop Workshop navigation timeout passed isolated reruns; no input workaround was added.

## Practical limits

Browser emulation cannot certify a real person’s accessibility experience. There is no complete screen-reader-only spatial play mode or built-in narration. These changes improve access for low vision, color vision differences, reading, motion, and input preferences, without claiming universal access or WCAG conformance. Test with players who use assistive technology before making a stronger claim.
