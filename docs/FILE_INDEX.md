# Repository file index

Start with the [repository organization guide](README.md) or the
[project overview](../README.md). This index lists every tracked file and
staged addition that currently exists. Generated builds, browser
captures, dependencies, and operating-system metadata are excluded.

**362 files in 15 folders.** Stage new files before refreshing. Run
`node /path/to/Tilewright/scripts/repository-files.mjs`, or run
`node scripts/repository-files.mjs` from the repository root.

## Folders

| Folder | Files |
| --- | ---: |
| [Repository root](.././) | 35 |
| [.github/](../.github/) | 3 |
| [.github/ISSUE_TEMPLATE/](../.github/ISSUE_TEMPLATE/) | 2 |
| [.github/workflows/](../.github/workflows/) | 1 |
| [docs/](../docs/) | 32 |
| [docs/audits/](../docs/audits/) | 9 |
| [docs/screenshots/](../docs/screenshots/) | 73 |
| [examples/](../examples/) | 1 |
| [icons/](../icons/) | 3 |
| [scripts/](../scripts/) | 5 |
| [scripts/browser/](../scripts/browser/) | 35 |
| [scripts/solvers/](../scripts/solvers/) | 6 |
| [src/](../src/) | 90 |
| [tests/](../tests/) | 46 |
| [tests/fixtures/](../tests/fixtures/) | 21 |

<details>
<summary>Repository root — 35 files</summary>

- [.editorconfig](../.editorconfig)
- [.gitattributes](../.gitattributes)
- [.gitignore](../.gitignore)
- [.nvmrc](../.nvmrc)
- [CHANGELOG.md](../CHANGELOG.md)
- [CONTRIBUTING.md](../CONTRIBUTING.md)
- [LEGACY-MIT-LICENSE.txt](../LEGACY-MIT-LICENSE.txt)
- [LICENSE](../LICENSE)
- [PRIVACY.md](../PRIVACY.md)
- [README.md](../README.md)
- [ROADMAP.md](../ROADMAP.md)
- [SECURITY.md](../SECURITY.md)
- [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)
- [accessibility.css](../accessibility.css)
- [adventure.css](../adventure.css)
- [controls.css](../controls.css)
- [dropdowns.css](../dropdowns.css)
- [front.css](../front.css)
- [game-theme.css](../game-theme.css)
- [icon.svg](../icon.svg)
- [index.html](../index.html)
- [manifest.webmanifest](../manifest.webmanifest)
- [package-lock.json](../package-lock.json)
- [package.json](../package.json)
- [play.css](../play.css)
- [rights.html](../rights.html)
- [serve.mjs](../serve.mjs)
- [storybook.css](../storybook.css)
- [studio.css](../studio.css)
- [style.css](../style.css)
- [trailhouse.css](../trailhouse.css)
- [training.css](../training.css)
- [traveler.css](../traveler.css)
- [wonders.css](../wonders.css)
- [workshop.css](../workshop.css)

</details>

<details>
<summary>.github/ — 3 files</summary>

- [CODEOWNERS](../.github/CODEOWNERS)
- [dependabot.yml](../.github/dependabot.yml)
- [pull_request_template.md](../.github/pull_request_template.md)

</details>

<details>
<summary>.github/ISSUE_TEMPLATE/ — 2 files</summary>

- [bug_report.yml](../.github/ISSUE_TEMPLATE/bug_report.yml)
- [config.yml](../.github/ISSUE_TEMPLATE/config.yml)

</details>

<details>
<summary>.github/workflows/ — 1 files</summary>

- [pages.yml](../.github/workflows/pages.yml)

</details>

<details>
<summary>docs/ — 32 files</summary>

- [ACCESSIBILITY.md](../docs/ACCESSIBILITY.md)
- [ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- [ATLAS.md](../docs/ATLAS.md)
- [CONTINUE.md](../docs/CONTINUE.md)
- [CONTROLS.md](../docs/CONTROLS.md)
- [DESIGN_NOTES.md](../docs/DESIGN_NOTES.md)
- [EXPEDITIONS.md](../docs/EXPEDITIONS.md)
- [FILE_INDEX.md](../docs/FILE_INDEX.md)
- [GAME_GUIDE.md](../docs/GAME_GUIDE.md)
- [GUILD.md](../docs/GUILD.md)
- [HORIZONS.md](../docs/HORIZONS.md)
- [HOSTING.md](../docs/HOSTING.md)
- [IDEAS.md](../docs/IDEAS.md)
- [KEEPERS-PROMISE.md](../docs/KEEPERS-PROMISE.md)
- [LOST_CARTOGRAPHER.md](../docs/LOST_CARTOGRAPHER.md)
- [MIGRATION.md](../docs/MIGRATION.md)
- [MISSIONS.md](../docs/MISSIONS.md)
- [NEW_STORIES.md](../docs/NEW_STORIES.md)
- [PLAYER_GUIDE.md](../docs/PLAYER_GUIDE.md)
- [PUZZLE_LAB.md](../docs/PUZZLE_LAB.md)
- [QA.md](../docs/QA.md)
- [README.md](../docs/README.md)
- [RESEARCH.md](../docs/RESEARCH.md)
- [RIGHTS.md](../docs/RIGHTS.md)
- [SAVED_DATA.md](../docs/SAVED_DATA.md)
- [SCREEN_AND_SAGAS.md](../docs/SCREEN_AND_SAGAS.md)
- [STORYBOOKS.md](../docs/STORYBOOKS.md)
- [SUBMISSION.md](../docs/SUBMISSION.md)
- [TRAILHOUSE.md](../docs/TRAILHOUSE.md)
- [TRAINING.md](../docs/TRAINING.md)
- [TRAVELER.md](../docs/TRAVELER.md)
- [WORKSHOP.md](../docs/WORKSHOP.md)

</details>

<details>
<summary>docs/audits/ — 9 files</summary>

- [2026-10-23-accessibility.md](../docs/audits/2026-10-23-accessibility.md)
- [2026-10-23-keepers-promise.md](../docs/audits/2026-10-23-keepers-promise.md)
- [2026-10-23.md](../docs/audits/2026-10-23.md)
- [2026-10-24-cartographer.md](../docs/audits/2026-10-24-cartographer.md)
- [2026-10-24-full-recheck.md](../docs/audits/2026-10-24-full-recheck.md)
- [2026-10-24-release-hardening.md](../docs/audits/2026-10-24-release-hardening.md)
- [2026-10-24-traveler-lanternfair.md](../docs/audits/2026-10-24-traveler-lanternfair.md)
- [2026-10-25-screen-and-sagas.md](../docs/audits/2026-10-25-screen-and-sagas.md)
- [2026-10-25-v0301-full-recheck.md](../docs/audits/2026-10-25-v0301-full-recheck.md)

</details>

<details>
<summary>docs/screenshots/ — 73 files</summary>

- [accessibility-options.png](../docs/screenshots/accessibility-options.png)
- [adventure-journal.png](../docs/screenshots/adventure-journal.png)
- [adventure-mobile.png](../docs/screenshots/adventure-mobile.png)
- [adventure-modes.png](../docs/screenshots/adventure-modes.png)
- [adventure.png](../docs/screenshots/adventure.png)
- [afterhours-lab.png](../docs/screenshots/afterhours-lab.png)
- [atlas-chapters.png](../docs/screenshots/atlas-chapters.png)
- [aurora-finale.png](../docs/screenshots/aurora-finale.png)
- [aurora-mobile.png](../docs/screenshots/aurora-mobile.png)
- [cartographer-cooperation.png](../docs/screenshots/cartographer-cooperation.png)
- [cartographer-practice-phone.png](../docs/screenshots/cartographer-practice-phone.png)
- [cartographer-room-phone.png](../docs/screenshots/cartographer-room-phone.png)
- [cartographer-story-cards-phone.png](../docs/screenshots/cartographer-story-cards-phone.png)
- [clockwork-desktop.png](../docs/screenshots/clockwork-desktop.png)
- [clockwork-mobile.png](../docs/screenshots/clockwork-mobile.png)
- [compact-play-landscape.png](../docs/screenshots/compact-play-landscape.png)
- [compact-play-phone.png](../docs/screenshots/compact-play-phone.png)
- [creator-camp.png](../docs/screenshots/creator-camp.png)
- [creator-guide.png](../docs/screenshots/creator-guide.png)
- [creator-mapmaker-1440.png](../docs/screenshots/creator-mapmaker-1440.png)
- [creator-mapmaker-390.png](../docs/screenshots/creator-mapmaker-390.png)
- [creator-studio-1440.png](../docs/screenshots/creator-studio-1440.png)
- [creator-studio-390.png](../docs/screenshots/creator-studio-390.png)
- [dialogue-mobile.png](../docs/screenshots/dialogue-mobile.png)
- [echo-bridge-desktop.png](../docs/screenshots/echo-bridge-desktop.png)
- [echo-bridge-mobile.png](../docs/screenshots/echo-bridge-mobile.png)
- [expedition-camp-mobile.png](../docs/screenshots/expedition-camp-mobile.png)
- [expedition-hub.png](../docs/screenshots/expedition-hub.png)
- [expedition.png](../docs/screenshots/expedition.png)
- [feedback-desktop.png](../docs/screenshots/feedback-desktop.png)
- [feedback-mobile.png](../docs/screenshots/feedback-mobile.png)
- [focused-play-desktop.png](../docs/screenshots/focused-play-desktop.png)
- [focused-play-mobile.png](../docs/screenshots/focused-play-mobile.png)
- [fullscreen-rain-post.png](../docs/screenshots/fullscreen-rain-post.png)
- [game-camp.png](../docs/screenshots/game-camp.png)
- [game-options.png](../docs/screenshots/game-options.png)
- [gameplay-desktop.png](../docs/screenshots/gameplay-desktop.png)
- [gameplay-mobile.png](../docs/screenshots/gameplay-mobile.png)
- [guild-board.png](../docs/screenshots/guild-board.png)
- [guild-mobile.png](../docs/screenshots/guild-mobile.png)
- [guild-tools-desktop.png](../docs/screenshots/guild-tools-desktop.png)
- [horizon-chapters.png](../docs/screenshots/horizon-chapters.png)
- [keepers-promise-choice.png](../docs/screenshots/keepers-promise-choice.png)
- [landscape-large-text-v0301.png](../docs/screenshots/landscape-large-text-v0301.png)
- [landscape-pack-v0301.png](../docs/screenshots/landscape-pack-v0301.png)
- [lanternfair-parade.png](../docs/screenshots/lanternfair-parade.png)
- [lighthouse-desktop.png](../docs/screenshots/lighthouse-desktop.png)
- [new-story-finale-phone.png](../docs/screenshots/new-story-finale-phone.png)
- [new-story-library.png](../docs/screenshots/new-story-library.png)
- [plan-layout-check.png](../docs/screenshots/plan-layout-check.png)
- [puzzle-lab.png](../docs/screenshots/puzzle-lab.png)
- [remix-tools.png](../docs/screenshots/remix-tools.png)
- [resize-preview.png](../docs/screenshots/resize-preview.png)
- [review-damage-check.png](../docs/screenshots/review-damage-check.png)
- [saved-looks.png](../docs/screenshots/saved-looks.png)
- [sluice-finale.png](../docs/screenshots/sluice-finale.png)
- [sluice-mobile.png](../docs/screenshots/sluice-mobile.png)
- [storybook-camp.png](../docs/screenshots/storybook-camp.png)
- [storybook-game-phone.png](../docs/screenshots/storybook-game-phone.png)
- [three-new-storybooks.png](../docs/screenshots/three-new-storybooks.png)
- [tilewright-mobile.png](../docs/screenshots/tilewright-mobile.png)
- [tilewright.png](../docs/screenshots/tilewright.png)
- [title-desktop.png](../docs/screenshots/title-desktop.png)
- [title-mobile.png](../docs/screenshots/title-mobile.png)
- [training-camp.png](../docs/screenshots/training-camp.png)
- [training-dialogue.png](../docs/screenshots/training-dialogue.png)
- [traveler-tent-desktop.png](../docs/screenshots/traveler-tent-desktop.png)
- [watcher-mobile.png](../docs/screenshots/watcher-mobile.png)
- [watcher.png](../docs/screenshots/watcher.png)
- [welcome-lanterns-ending.png](../docs/screenshots/welcome-lanterns-ending.png)
- [workshop-designer.png](../docs/screenshots/workshop-designer.png)
- [workshop-mobile.png](../docs/screenshots/workshop-mobile.png)
- [workshop-shelf.png](../docs/screenshots/workshop-shelf.png)

</details>

<details>
<summary>examples/ — 1 files</summary>

- [willowbend.json](../examples/willowbend.json)

</details>

<details>
<summary>icons/ — 3 files</summary>

- [apple-touch-icon.png](../icons/apple-touch-icon.png)
- [icon-192.png](../icons/icon-192.png)
- [icon-512.png](../icons/icon-512.png)

</details>

<details>
<summary>scripts/ — 5 files</summary>

- [README.md](../scripts/README.md)
- [build.mjs](../scripts/build.mjs)
- [check-public.mjs](../scripts/check-public.mjs)
- [check.mjs](../scripts/check.mjs)
- [repository-files.mjs](../scripts/repository-files.mjs)

</details>

<details>
<summary>scripts/browser/ — 35 files</summary>

- [accessibility-browser-checks.mjs](../scripts/browser/accessibility-browser-checks.mjs)
- [adventure-browser-checks.mjs](../scripts/browser/adventure-browser-checks.mjs)
- [artifacts.mjs](../scripts/browser/artifacts.mjs)
- [atlas-browser-checks.mjs](../scripts/browser/atlas-browser-checks.mjs)
- [cartographer-browser-checks.mjs](../scripts/browser/cartographer-browser-checks.mjs)
- [checkpoint-browser-checks.mjs](../scripts/browser/checkpoint-browser-checks.mjs)
- [checks.mjs](../scripts/browser/checks.mjs)
- [contract-browser-checks.mjs](../scripts/browser/contract-browser-checks.mjs)
- [controls-browser-checks.mjs](../scripts/browser/controls-browser-checks.mjs)
- [creator-browser-checks.mjs](../scripts/browser/creator-browser-checks.mjs)
- [dropdown-browser-checks.mjs](../scripts/browser/dropdown-browser-checks.mjs)
- [expansion-browser-checks.mjs](../scripts/browser/expansion-browser-checks.mjs)
- [expedition-browser-checks.mjs](../scripts/browser/expedition-browser-checks.mjs)
- [front-browser-checks.mjs](../scripts/browser/front-browser-checks.mjs)
- [guild-browser-checks.mjs](../scripts/browser/guild-browser-checks.mjs)
- [horizon-browser-checks.mjs](../scripts/browser/horizon-browser-checks.mjs)
- [interface-browser-checks.mjs](../scripts/browser/interface-browser-checks.mjs)
- [journal-browser-checks.mjs](../scripts/browser/journal-browser-checks.mjs)
- [lab-browser-checks.mjs](../scripts/browser/lab-browser-checks.mjs)
- [layout-browser-checks.mjs](../scripts/browser/layout-browser-checks.mjs)
- [mastery-browser-checks.mjs](../scripts/browser/mastery-browser-checks.mjs)
- [migration-browser-checks.mjs](../scripts/browser/migration-browser-checks.mjs)
- [presentation-browser-checks.mjs](../scripts/browser/presentation-browser-checks.mjs)
- [release-smoke.mjs](../scripts/browser/release-smoke.mjs)
- [review-browser-checks.mjs](../scripts/browser/review-browser-checks.mjs)
- [save-data-browser-checks.mjs](../scripts/browser/save-data-browser-checks.mjs)
- [save-profiles-browser-checks.mjs](../scripts/browser/save-profiles-browser-checks.mjs)
- [settings-browser-checks.mjs](../scripts/browser/settings-browser-checks.mjs)
- [sluice-browser-checks.mjs](../scripts/browser/sluice-browser-checks.mjs)
- [storybook-browser-checks.mjs](../scripts/browser/storybook-browser-checks.mjs)
- [trailhouse-browser-checks.mjs](../scripts/browser/trailhouse-browser-checks.mjs)
- [training-browser-checks.mjs](../scripts/browser/training-browser-checks.mjs)
- [traveler-browser-checks.mjs](../scripts/browser/traveler-browser-checks.mjs)
- [ui-driver.mjs](../scripts/browser/ui-driver.mjs)
- [workshop-browser-checks.mjs](../scripts/browser/workshop-browser-checks.mjs)

</details>

<details>
<summary>scripts/solvers/ — 6 files</summary>

- [solve-atlas.mjs](../scripts/solvers/solve-atlas.mjs)
- [solve-expeditions.mjs](../scripts/solvers/solve-expeditions.mjs)
- [solve-guild.mjs](../scripts/solvers/solve-guild.mjs)
- [solve-horizon.mjs](../scripts/solvers/solve-horizon.mjs)
- [solve-sluices.mjs](../scripts/solvers/solve-sluices.mjs)
- [story-driver.mjs](../scripts/solvers/story-driver.mjs)

</details>

<details>
<summary>src/ — 90 files</summary>

- [adventure-accessibility.mjs](../src/adventure-accessibility.mjs)
- [adventure-art.mjs](../src/adventure-art.mjs)
- [adventure-atlas-levels.mjs](../src/adventure-atlas-levels.mjs)
- [adventure-brain.mjs](../src/adventure-brain.mjs)
- [adventure-clues-ui.mjs](../src/adventure-clues-ui.mjs)
- [adventure-controls.mjs](../src/adventure-controls.mjs)
- [adventure-expedition-ui.mjs](../src/adventure-expedition-ui.mjs)
- [adventure-front.mjs](../src/adventure-front.mjs)
- [adventure-generator.mjs](../src/adventure-generator.mjs)
- [adventure-guild.mjs](../src/adventure-guild.mjs)
- [adventure-horizon-levels.mjs](../src/adventure-horizon-levels.mjs)
- [adventure-input.mjs](../src/adventure-input.mjs)
- [adventure-intel.mjs](../src/adventure-intel.mjs)
- [adventure-journal.mjs](../src/adventure-journal.mjs)
- [adventure-journey.mjs](../src/adventure-journey.mjs)
- [adventure-levels.mjs](../src/adventure-levels.mjs)
- [adventure-logbook.mjs](../src/adventure-logbook.mjs)
- [adventure-mechanisms.mjs](../src/adventure-mechanisms.mjs)
- [adventure-perks.mjs](../src/adventure-perks.mjs)
- [adventure-preferences.mjs](../src/adventure-preferences.mjs)
- [adventure-records.mjs](../src/adventure-records.mjs)
- [adventure-render.mjs](../src/adventure-render.mjs)
- [adventure-resume.mjs](../src/adventure-resume.mjs)
- [adventure-review-ui.mjs](../src/adventure-review-ui.mjs)
- [adventure-reviews.mjs](../src/adventure-reviews.mjs)
- [adventure-rewind.mjs](../src/adventure-rewind.mjs)
- [adventure-sluice-levels.mjs](../src/adventure-sluice-levels.mjs)
- [adventure-sound.mjs](../src/adventure-sound.mjs)
- [adventure-tactics.mjs](../src/adventure-tactics.mjs)
- [adventure-tools.mjs](../src/adventure-tools.mjs)
- [adventure-ui.mjs](../src/adventure-ui.mjs)
- [adventure-wonders.mjs](../src/adventure-wonders.mjs)
- [adventure.mjs](../src/adventure.mjs)
- [app.mjs](../src/app.mjs)
- [bootstrap.mjs](../src/bootstrap.mjs)
- [browser-yield.mjs](../src/browser-yield.mjs)
- [cartographer-clears.mjs](../src/cartographer-clears.mjs)
- [cartographer-worlds.mjs](../src/cartographer-worlds.mjs)
- [creator-guide.mjs](../src/creator-guide.mjs)
- [game-dropdowns.mjs](../src/game-dropdowns.mjs)
- [icons.mjs](../src/icons.mjs)
- [mapmaker-shell.mjs](../src/mapmaker-shell.mjs)
- [model.mjs](../src/model.mjs)
- [operations.mjs](../src/operations.mjs)
- [play-layout.mjs](../src/play-layout.mjs)
- [player-text.mjs](../src/player-text.mjs)
- [render.mjs](../src/render.mjs)
- [saga-clears.mjs](../src/saga-clears.mjs)
- [saga-worlds.mjs](../src/saga-worlds.mjs)
- [sample.mjs](../src/sample.mjs)
- [save-data-ui.mjs](../src/save-data-ui.mjs)
- [save-data.mjs](../src/save-data.mjs)
- [save-profiles.mjs](../src/save-profiles.mjs)
- [screen-mode.mjs](../src/screen-mode.mjs)
- [storage.mjs](../src/storage.mjs)
- [story-adventure-clears.mjs](../src/story-adventure-clears.mjs)
- [storybook-adventures.mjs](../src/storybook-adventures.mjs)
- [storybook-lanternfair.mjs](../src/storybook-lanternfair.mjs)
- [storybook-model.mjs](../src/storybook-model.mjs)
- [storybook-promise.mjs](../src/storybook-promise.mjs)
- [storybook-ui.mjs](../src/storybook-ui.mjs)
- [storybook-welcome.mjs](../src/storybook-welcome.mjs)
- [storybook-worlds.mjs](../src/storybook-worlds.mjs)
- [trail-memories.mjs](../src/trail-memories.mjs)
- [trailhouse-art.mjs](../src/trailhouse-art.mjs)
- [trailhouse-content.mjs](../src/trailhouse-content.mjs)
- [trailhouse-model.mjs](../src/trailhouse-model.mjs)
- [trailhouse-ui.mjs](../src/trailhouse-ui.mjs)
- [training-checkpoint.mjs](../src/training-checkpoint.mjs)
- [training-model.mjs](../src/training-model.mjs)
- [training-ui.mjs](../src/training-ui.mjs)
- [traveler-art.mjs](../src/traveler-art.mjs)
- [traveler-ui.mjs](../src/traveler-ui.mjs)
- [traveler-wardrobe.mjs](../src/traveler-wardrobe.mjs)
- [viewport.mjs](../src/viewport.mjs)
- [workshop-afterhours.mjs](../src/workshop-afterhours.mjs)
- [workshop-art.mjs](../src/workshop-art.mjs)
- [workshop-assemblies.mjs](../src/workshop-assemblies.mjs)
- [workshop-clears.mjs](../src/workshop-clears.mjs)
- [workshop-designer.mjs](../src/workshop-designer.mjs)
- [workshop-lab-clears.mjs](../src/workshop-lab-clears.mjs)
- [workshop-lab.mjs](../src/workshop-lab.mjs)
- [workshop-library.mjs](../src/workshop-library.mjs)
- [workshop-mastery.mjs](../src/workshop-mastery.mjs)
- [workshop-model.mjs](../src/workshop-model.mjs)
- [workshop-sharing.mjs](../src/workshop-sharing.mjs)
- [workshop-trailboard.mjs](../src/workshop-trailboard.mjs)
- [workshop-ui.mjs](../src/workshop-ui.mjs)
- [workshop-wonders-ui.mjs](../src/workshop-wonders-ui.mjs)
- [workshop-worlds.mjs](../src/workshop-worlds.mjs)

</details>

<details>
<summary>tests/ — 46 files</summary>

- [accessibility.test.mjs](../tests/accessibility.test.mjs)
- [adventure-controls.test.mjs](../tests/adventure-controls.test.mjs)
- [adventure-input.test.mjs](../tests/adventure-input.test.mjs)
- [adventure-journal.test.mjs](../tests/adventure-journal.test.mjs)
- [adventure-mechanisms.test.mjs](../tests/adventure-mechanisms.test.mjs)
- [adventure-preferences.test.mjs](../tests/adventure-preferences.test.mjs)
- [adventure-records.test.mjs](../tests/adventure-records.test.mjs)
- [adventure-reviews.test.mjs](../tests/adventure-reviews.test.mjs)
- [adventure-rewind.test.mjs](../tests/adventure-rewind.test.mjs)
- [adventure-sound.test.mjs](../tests/adventure-sound.test.mjs)
- [adventure-tactics.test.mjs](../tests/adventure-tactics.test.mjs)
- [adventure.test.mjs](../tests/adventure.test.mjs)
- [atlas-runs.test.mjs](../tests/atlas-runs.test.mjs)
- [browser-yield.test.mjs](../tests/browser-yield.test.mjs)
- [cartographer.test.mjs](../tests/cartographer.test.mjs)
- [echo.test.mjs](../tests/echo.test.mjs)
- [expansion-mechanics.test.mjs](../tests/expansion-mechanics.test.mjs)
- [expedition-runs.test.mjs](../tests/expedition-runs.test.mjs)
- [expeditions.test.mjs](../tests/expeditions.test.mjs)
- [guild.test.mjs](../tests/guild.test.mjs)
- [horizon-runs.test.mjs](../tests/horizon-runs.test.mjs)
- [model.test.mjs](../tests/model.test.mjs)
- [notices.test.mjs](../tests/notices.test.mjs)
- [operations.test.mjs](../tests/operations.test.mjs)
- [packaging.test.mjs](../tests/packaging.test.mjs)
- [promise.test.mjs](../tests/promise.test.mjs)
- [replay-invariants.test.mjs](../tests/replay-invariants.test.mjs)
- [sagas.test.mjs](../tests/sagas.test.mjs)
- [save-data.test.mjs](../tests/save-data.test.mjs)
- [save-profiles.test.mjs](../tests/save-profiles.test.mjs)
- [screen-mode.test.mjs](../tests/screen-mode.test.mjs)
- [sluice-runs.test.mjs](../tests/sluice-runs.test.mjs)
- [storage.test.mjs](../tests/storage.test.mjs)
- [story-adventures.test.mjs](../tests/story-adventures.test.mjs)
- [storybook.test.mjs](../tests/storybook.test.mjs)
- [trailboard-memories.test.mjs](../tests/trailboard-memories.test.mjs)
- [trailhouse.test.mjs](../tests/trailhouse.test.mjs)
- [training-checkpoint.test.mjs](../tests/training-checkpoint.test.mjs)
- [training.test.mjs](../tests/training.test.mjs)
- [traveler-wardrobe.test.mjs](../tests/traveler-wardrobe.test.mjs)
- [traveler.test.mjs](../tests/traveler.test.mjs)
- [viewport.test.mjs](../tests/viewport.test.mjs)
- [workshop-assemblies.test.mjs](../tests/workshop-assemblies.test.mjs)
- [workshop-lab.test.mjs](../tests/workshop-lab.test.mjs)
- [workshop-mastery.test.mjs](../tests/workshop-mastery.test.mjs)
- [workshop.test.mjs](../tests/workshop.test.mjs)

</details>

<details>
<summary>tests/fixtures/ — 21 files</summary>

- [adventure-routes.json](../tests/fixtures/adventure-routes.json)
- [atlas-routes.json](../tests/fixtures/atlas-routes.json)
- [clue-routes.json](../tests/fixtures/clue-routes.json)
- [contract-routes.json](../tests/fixtures/contract-routes.json)
- [expedition-routes.json](../tests/fixtures/expedition-routes.json)
- [foundry-alternate.json](../tests/fixtures/foundry-alternate.json)
- [guild-alternate-routes.json](../tests/fixtures/guild-alternate-routes.json)
- [guild-routes.json](../tests/fixtures/guild-routes.json)
- [horizon-routes.json](../tests/fixtures/horizon-routes.json)
- [legacy-checkpoints-0.28.json](../tests/fixtures/legacy-checkpoints-0.28.json)
- [legacy-checkpoints.json](../tests/fixtures/legacy-checkpoints.json)
- [nemesis-routes.json](../tests/fixtures/nemesis-routes.json)
- [pre-guild-checkpoints.json](../tests/fixtures/pre-guild-checkpoints.json)
- [pre-horizon-campaign.json](../tests/fixtures/pre-horizon-campaign.json)
- [saga-alternates.json](../tests/fixtures/saga-alternates.json)
- [sluice-routes.json](../tests/fixtures/sluice-routes.json)
- [story-alternatives.mjs](../tests/fixtures/story-alternatives.mjs)
- [training-routes.json](../tests/fixtures/training-routes.json)
- [vault-nemesis.json](../tests/fixtures/vault-nemesis.json)
- [vault-trail.json](../tests/fixtures/vault-trail.json)
- [workshop-alternates.json](../tests/fixtures/workshop-alternates.json)

</details>
