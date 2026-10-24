# A trail for more people — v0.26

Play [Lantern Trails](https://youknowjp.github.io/Personal-Project/) in a browser. On the main menu, choose **Accessibility**. During a trail, choose **Options → Accessibility**. No account, installation, or developer tools are needed.

## Make the trail yours

- **Use clearer trail preset** sets large reading, high contrast, letter labels and numbered links, larger map tiles, reduced motion, 52-pixel controls, and one movement step per key press. It keeps the optional reading panel off so the board and controls have room. Plan always includes the text map.
- **Reading size** offers standard, large, and extra large. Large uses 16-pixel menu text and 18-pixel messages; extra large uses 20-pixel menu text and 22-pixel messages. Headings scale too. Browser zoom remains available.
- **High contrast** uses solid dark panels, light text and borders, clear path tiles, and hatched impassable tiles. Artwork remains available through Original woodland colors.
- **Map symbols** put letters on important objects. Y is your keeper, H is home, L a lantern, K a key, C a crate, P a plate, W a wheel, B a bell, G a closed gate, O an open crossing, T a travel stone, R a relic, and ? a keeper. A solid outline means a wheel is on or a plate is held; a dashed outline means off or empty. Enemy arrows and crossed sweep cells complement the text forecast.
- **Numbered links** connect mechanisms without color matching. Workshop channels always show amber 1, jade 2, violet 3, and blue 4. Playing with map symbols retains those numbers. Campaign mechanisms are numbered by their actual connected groups. Bell numbers show the melody order. Plan and the reading view also describe the objects and their states in words.
- **Map size** offers three camera distances. A closer view makes tiles and their labels larger; the camera follows the keeper. Quest & map keeps a discovered overview with a diamond for the player, H for home, and T for travel stones.
- **Nearby reading view** is available inside Plan and Quest & map. Optionally keep it beneath the board. It describes your position, four neighboring tiles, actionable crates and gates, known incoming threats, and up to ten nearest discovered landmarks. Landmark details fold away. Grid distances compare locations; walls may require longer routes. Reading never spends a turn or reveals undiscovered objects.

Controls also offers five movement styles, three keyboard layouts, one step per press or held movement, left/right pad placement, 44/52-pixel buttons, and an optional standard controller. Undo restores up to 60 recent actions. Sound is optional; essential instructions and dialogue appear as text. Reduced motion follows either the device or your explicit choice. Each journey saves its own preferences, which are included in exported backups. If browser saving is blocked, choices still work during the visit.

**Reset display choices** restores standard reading, contrast, artwork, map size, system motion, the optional reading panel, and comfortable buttons. It does not erase progress or change your movement style, keyboard layout, gamepad preference, audio volume, or learned hunter habits.

## The Welcome Lanterns

A new six-chapter book about restoring Ori’s welcome house. Choose **Accessibility → Find the peaceful storybook**, then Read this book. It is first in Workshop → Storybooks. Follow the story is selected by default; honors remain optional. Every map is also available separately through Player adventures → Show: Trailboard → Adventure mood: Peaceful.

| Chapter | What you do |
| --- | --- |
| A Light in the Window | Walk onto two lanterns, meet Ori, and return home. |
| The Spare Key | Collect a key and unlock a crossing that stays open. |
| A Bridge That Waits | Leave a crate on a counterweight plate and walk around it. |
| The Garden’s Three Notes | Ring Here, Together, Home; the order stays written in Quest. |
| Islands Belong Together | Use two numbered pairs of travel stones; walking or waiting restores travel energy. |
| A Home with Room for Everyone | Restore both windows, ring Welcome, invite Ori home, and carry the house heart to its beacon. |

There are no enemies or burning tiles on either rule set, no real-time deadlines, and no required dash or temporary specialist power. Wait, read a hint, or try another route. Coins and optional honors give reasons to revisit without blocking the ending. All six maps have replayable creator clears. Each can be remixed, saved, and shared using the existing world tools; the complete book can be exported and remixed too.

## Design references and limits

The implementation follows the principles of configurable text and redundant cues described in [Xbox guideline 101: Text display](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/101), [Xbox guideline 103: Additional channels](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/103), and [W3C: Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html). Text contrast checks use the [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

These are practical accessibility improvements, not a claim of WCAG conformance or universal access. The canvas board still needs visual navigation; there is no complete nonvisual play mode or text-to-speech narration. Browser/controller combinations and personal needs vary. Testing with players who use assistive technology remains valuable. Automated emulation checks layouts and input behavior, not a person’s experience of a disability.
