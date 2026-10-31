# Tilewright / Lantern Trails

[![Tilewright CI](https://github.com/YouKnowJP/Tilewright/actions/workflows/pages.yml/badge.svg)](https://github.com/YouKnowJP/Tilewright/actions/workflows/pages.yml)

**[Play Lantern Trails](https://youknowjp.github.io/Tilewright/)** · [Report a bug](https://github.com/YouKnowJP/Tilewright/issues) · [Documentation](docs/README.md)

Make a little world, then go on an adventure. Tilewright combines an original
turn-based puzzle game with a terrain editor and Adventure Workshop. Players
need only the website link: no account, installation, GitHub clone, or terminal.

**Free to play. New protected work is not licensed for commercial copies.**
Paid downloads, ad-supported copies, subscription rehosting and asset resale
need the owner's written permission. Links to the official game, fan videos
(including creator revenue), and noncommercial world sharing are welcome.
**The game through v0.30.1 remains MIT licensed, including commercial reuse;**
these restrictions apply only to new protected material. Read the
[permissions guide](docs/RIGHTS.md) and [full license](LICENSE).

## Play, explore, and create

- 24 campaign missions, eight Guild jobs, daily trails and branching expeditions.
- Sixteen featured Storybooks, including 65 unique original book levels, plus Puzzle Lab journeys.
- 45 featured worlds, twelve Lab rooms, village commissions, and optional challenges.
- Create puzzles, write dialogue, rotate rooms, coordinate two travelers, and share adventure files, codes, links, or Storybooks.
- Character customization, separate save journeys, Undo, exact Continue, training lessons, and portable backups.
- Phone/tablet/desktop layouts, pad/swipe/tap/keyboard/controller choices, fullscreen with expanded fallback, large text, high contrast, and color-independent map cues.

Choose **Choose your adventure → Storybooks → Pip and the Midnight Parcelworks** for five new courier-tube adventures. Connect separated rooms, plan a return melody and deliver a seven-stop night-mail route with scarce rewrites. Creators can paint paired tubes and flags, remix the levels, rotate/mirror/reverse draft programs, and share playable files, codes, links or Storybooks. The earlier Pip books and eight-slot program satchel remain available. Every book keeps chapter/branch bookmarks; the latest active trail also keeps exact in-chapter Continue.

Start with **Training camp**. See the [player guide](docs/PLAYER_GUIDE.md),
[complete game guide](docs/GAME_GUIDE.md), and [controls](docs/CONTROLS.md).

## Repository and local project

**Canonical repository:** [https://github.com/YouKnowJP/Tilewright](https://github.com/YouKnowJP/Tilewright)

**Local folder:** `/Users/youknowjp/Documents/Personal PR/Tilewright`

Tilewright is now a standalone sibling of Mallside. Its game history and the
new repository's initial commit are retained. Source is publicly readable;
only the owner's account has repository editing access at migration. Public
GitHub visibility permits viewing/forking under GitHub's terms; it is not a
technical copy barrier. See [migration provenance](docs/MIGRATION.md).

## Play and save

Progress stays in this browser. The old `/Personal-Project/` address and new
`/Tilewright/` address use the same `youknowjp.github.io` origin, and the game
keeps its existing `tilewright.*` save keys. Existing saves can therefore be
read at the new address in the same browser. Download a backup before clearing
data or moving to another browser/device/origin. World play links and the Home
Screen launcher now use the new location. No migration uploads player saves.

## Local development

Requires Node.js 22+. From this repository's root:

```sh
git clone https://github.com/YouKnowJP/Tilewright.git
cd Tilewright
npm ci --ignore-scripts
npm start
```

Open http://127.0.0.1:4174/. Serving the development game itself needs no runtime
packages; the locked development tools support browser testing. `file://` does
not support the module setup.

```sh
npm run verify
npm run check:public
npm run check:repository
npm run test:browser:smoke
```

Install the test browser once with
`npx playwright install --with-deps --only-shell chromium`. See [test tooling](scripts/README.md).

## Publishing

Push to `main` to run the Node/OS matrix and built-game Chromium checks, then
publish the tested `dist/` directly through this repository's GitHub Pages
workflow. No second hosting repository or deployment key is needed. Failed
checks prevent publishing. See [deployment](docs/HOSTING.md).

| Path | Contents |
| --- | --- |
| `src/`, `index.html`, `*.css`, `icons/` | Editable game and editor source/assets |
| `tests/` | Deterministic rules, saving, packaging, and route regression tests |
| `scripts/` | Build, artifact validation, browser checks, and route tools |
| `docs/` | Player/developer guides, migration, research, and reviewed QA |
| `.github/` | CI/Pages, ownership routing, and issue templates |
| `dist/` | Generated playable site; ignored by Git |

## Rights and permissions

**New owned material: copyright © 2026 Jackson Pham (YouKnowJP).** The
[proprietary license](LICENSE) permits free personal play and private evaluation,
and reserves commercial redistribution, monetized rehosting, and commercial
reuse of new protected material without separate written permission.

**Important legacy exception:** Tilewright through v0.30.1 was already released
under MIT, including its game code and original assets. That earlier grant
allows commercial reuse subject to its notice requirements. Changing the
repository or license cannot withdraw valid permissions already granted.
Unchanged MIT material retains those rights; this is not an exclusively
proprietary import. The exact baseline is preserved as `legacy-mit-v0.30.1`
and its [MIT notice](LEGACY-MIT-LICENSE.txt) remains in source and builds.

See [rights and provenance](docs/RIGHTS.md), [asset/dependency notices](THIRD_PARTY_NOTICES.md),
and [privacy](PRIVACY.md). New work is not offered under an open-source license.
Players retain rights in their own original map designs and writing; the
limited permission to share playable worlds is described in the license.
Free official play also includes classrooms, libraries and community groups.
Credit alone does not grant commercial rights to new protected material.
