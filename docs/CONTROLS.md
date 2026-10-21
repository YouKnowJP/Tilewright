# Play on your device

Open [Lantern Trails](https://youknowjp.github.io/Personal-Project/) on a phone,
tablet, laptop, or desktop. Choose **Options → Controls** before playing, or
use **Controls** below the map during an adventure. Training has its own
**Choose controls** button. Changes apply immediately without restarting or
spending a turn, and stay in this browser. Browser data is separate on each
device; use the appropriate world, Storybook, expedition, or Trailhouse backup
to move content and progress. A browser link does not synchronize saves.

## Choose a movement style

| Style | How it works |
| --- | --- |
| Pad + swipe | Flexible default. Tap the directional buttons or swipe the map. |
| Direction pad | Move with the buttons; the map stays available for page scrolling. |
| Swipe the map | Swipe in a clear cardinal direction. Each gesture takes one step. |
| Tap to step | Tap above, below, left, or right of your keeper. Each tap takes one step; dragging and tapping the keeper do nothing. |
| Keyboard focus | Hide the movement pad while keeping action buttons available. |

Keyboard input remains available with every style. Select **arrows + WASD**,
**arrows + IJKL**, or **arrows only**. Arrows always work. Movement keys take
one step per press by default; enable **Repeat while held** for faster walking.
Movement keys do not control the game while typing, choosing an option,
reading a dialog, or browsing menus.

Put the pad on the **left or right** and choose **Comfortable (44 px)** or
**Large (52 px)** movement/action targets. The layout adjusts to portrait,
landscape, tablet split views, and browser resizing without restarting the run.
Small or short screens may use one page scroll to preserve readable text and
reachable controls. Pinch zoom remains available; use the page outside a
swipe/tap map to scroll. Cancelled gestures and multiple fingers do not move
the keeper. Touch holds do not repeat turns.

**Dash** arms your next direction for a two-cell move; choose it again to cancel.
It still needs two energy and obeys mission restrictions. **Wait** takes one
turn and recharges energy. Nearby actions, shields, decoys, cargo, and
specialist powers keep visible buttons in every movement style.

## Keyboard actions

| Key | Action |
| --- | --- |
| Selected movement keys | One step |
| Shift + direction | Dash |
| Space | Wait |
| E | Use the selected nearby action |
| Q / C | Decoy / shield |
| B / X | Specialist power / drop cargo |
| V / H | Plan / scout hint |
| P or Escape | Pause/resume on the board |
| R | Restart the current attempt |

Training uses your selected movement keys and style. When building in the
training lesson, movement keys move the paint cursor and Space paints.
Interrupted creator clicks are cancelled rather than painted.
Creator tools outside training retain their own displayed editing shortcuts.

## Optional controllers

Pair a controller using your device settings, then open **Options → Controls
→ Play with a controller** and turn it on. Press a controller button so the
browser can discover it. A status message explains readiness, unsupported
mappings, or unavailable browser access. The game accepts standard-mapped
controllers; touch and keyboard remain available at all times.

| Standard control | Action |
| --- | --- |
| D-pad / left stick | One step; navigate menu controls |
| Bottom face button (A / Cross) | Interact; select the focused menu option |
| Right face button (B / Circle) | Wait; back in menus/dialogs |
| Left face button (X / Square) | Specialist power |
| Top face button (Y / Triangle) | Arm/cancel dash |
| Left / right shoulder | Decoy / shield |
| View / Select | Plan |
| Menu / Start | Pause; in training, return to the lesson chooser |
| Left-stick press | Drop cargo |

Holding a controller button or stick does not repeat turns. Release and press
again for the next action. On connecting, refocusing, or returning from a hidden
tab, held controls are ignored until a fresh press. A Back press that closes
a menu does not also spend a wait turn. In menus use up/down to change focus;
left/right adjust a focused select or volume slider. Bottom face chooses it. Pause and result
panels support the same menu navigation.

The HTTPS play link and localhost preview can use the browser’s Gamepad API.
Controller availability and standard mappings depend on the browser, operating
system, and hardware. Controller tests use a simulated standard device; real
hardware testing remains useful. Browser coverage is recorded in [QA](QA.md).
