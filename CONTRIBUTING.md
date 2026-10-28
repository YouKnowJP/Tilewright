# Contributing

Bug reports and feature ideas are welcome through this repository's Issues.
Only the owner can edit the official repository. Public GitHub viewing/forking
rights do not grant commercial reuse of new protected work; read LICENSE,
LEGACY-MIT-LICENSE.txt, and docs/RIGHTS.md before proposing code or assets.
Discuss substantial changes with the owner first. Do not submit code/assets
you lack permission to license for the agreed use. Existing MIT and independent
third-party permissions remain effective; no assignment of player content is
implied by an issue or world export.

Keep game rules immutable and deterministic, preserve versioned save/world
formats and browser-only storage, and keep runtime dependencies/assets local.
Do not include credentials, private saves, node_modules, generated builds,
traces or OS files in commits.

From the repository root run `npm run verify`, `npm run check:public`,
`npm run check:repository`, and relevant browser checks. The required release
suite is `npm run test:browser:smoke`; see scripts/README.md. For UI changes,
check phone/tablet/desktop sizes, input methods, large text, dialog focus and
actual playable outcomes. Describe the problem, resulting behavior and checks.

Stage new files, run `node scripts/repository-files.mjs`, and include the
refreshed docs/FILE_INDEX.md. Record player-facing changes in CHANGELOG.md and
preserve the current license and all independent notices.

New original contributions intended for the current proprietary release must
have the owner's agreement on their licensing before acceptance. Preserve the
MIT notice on imported material and its derivatives; do not relabel unchanged
legacy files as exclusively proprietary. Public forks and attribution alone
do not grant commercial rights in separately protected new work.
