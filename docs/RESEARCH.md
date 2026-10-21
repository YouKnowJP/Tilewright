# Research behind Guild jobs — v0.8

These are primary developer sources read for this expansion. The design choices
below are Tilewright’s own interpretation, not claims of endorsement or proof
that a feature is enjoyable. No referenced artwork, level layouts, characters,
or source code is included in the project.

| Developer source | Relevant observation | Tilewright design decision |
| --- | --- | --- |
| [Klei: What is Invisible, Inc.](https://support.klei.com/hc/en-us/articles/360029880011-What-is-Invisible-Inc) | Builds combine agents, equipment, and programs to change strategy between runs. | Two specialists change active decisions and starting supplies. Their bests remain separate so both give players a reason to return. |
| [Matthew Davis: Into the Breach design postmortem, GDC 2019](https://media.gdcvault.com/gdc2019/presentations/Into%20the%20Breach%20Postmortem%20Final.pdf), slides 7, 13, 19–21, 29–30, 46 | Readability and deterministic threats shape the design; manipulating threats can be interesting, and difficulty can become unsolvable. | Pulse interrupts a bounded set of hunters. Veil preserves committed plans. Teleports preview their costs and landing threats. Every kit/rule combination has a clean winning witness. |
| [James Lantz, Klei technical designer: Invisible, Inc. alarm systems](https://www.gamedeveloper.com/design/game-design-deep-dive-alarm-systems-in-klei-s-i-invisible-inc-i-) | Unclear escalation and unpredictable consequences undermined planning; readable warnings helped communicate decisions. | Tool cooldowns and portal costs are explicit. Forecasts remain free. Optional commendations show the tradeoff before starting a job and never create a hidden exit lock. |
| [Anthony Giovannetti: Slay the Spire—Metrics Driven Design and Balance, GDC 2019](https://media.gdcvault.com/gdc2019/presentations/Giovannetti_Anthony_SlayTheSpire.pdf), slides 6, 9–15, 20 | Different options should have uses, balance needs iteration and feedback, and metrics alone do not settle design questions. | Ship two bounded tools, preserve separate results, test complete runs, and seek actual player feedback before claiming the kits are balanced or the game has lasting appeal. |

## What was implemented

Six original Guild maps combine the new tools with linked waystones, existing
relay locks, rescue convoys, singing cargo, optional treasure, and hunters.
The Guild board previews each job’s three commendations. Both specialists work
on Trail and Nemesis, producing 24 distinct result categories. Reading, dialogue,
and the Plan forecast leave the turn clock and cooldowns alone.

Pulse and Veil have different limits. Pulse interrupts nearby reachable hunters
but leaves distant threats, contact, and embers dangerous. Veil denies new
ordinary perception but keeps old leads and current plans; cargo and alarms
expose the player. Both spend two energy and have a six-turn reuse interval.
A one-energy waystone jump can therefore compete with a tool or a dash. Route
choices can include walking, waiting safely, using cover, taking a key door, or
returning for treasure and another commendation.

## What still needs player feedback

The automated checks verify specified behavior and executable routes. They do
not establish human enjoyment, fair difficulty for every player, or equal kit
strength. Useful next observations are which tool players pick, whether portal
warnings are understood, where they stop exploring, and which commendations
feel like a new decision rather than repetition. This release adds no telemetry.

Potential follow-ups are specialist tools in seeded journeys, visible voluntary
security escalation, distinct portal-guard archetypes, and authored bargains
that trade an immediate resource for a later route. Those are proposals, not
features shipped in v0.8. Journey tools would require deliberate checkpoint
versioning and new long-run compatibility tests.


## Device input references — 2026-10-21

- [W3C Pointer Events](https://www.w3.org/TR/pointerevents/) defines capture,
  cancellation, and declarative touch-action behavior. The shared map adapter
  cancels interrupted/multiple pointers and requires capture at release. This
  also handles an early release before capture became active, when a loss event
  is not emitted. Gesture maps allow browser pinch zoom; pad/keyboard maps also
  permit vertical page panning.
- [W3C Gamepad](https://www.w3.org/TR/gamepad/) defines browser discovery,
  standard mappings, and secure-context access. The implementation supports
  standard mappings only, treats held states as snapshots, requires a fresh
  press, and exposes a useful unavailable/unsupported message.
- [Playwright browser coverage](https://playwright.dev/docs/browsers) explains
  Chromium, Firefox, and WebKit testing. The WebKit build is not the branded
  Safari app, and emulated mobile layouts do not replace testing on hardware.
  QA records the actual engine versions, device sizes, and simulated controller
  coverage rather than claiming every browser or device has been tested.
