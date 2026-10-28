# Assets, dependencies, and legacy permissions

The imported Tilewright game contains original JavaScript, HTML/CSS, SVG
branding, Canvas pixel tiles/sprites, fictional maps/dialogue, synthesized
sounds, and interface screenshots. The v0.30.1 baseline was distributed under
MIT with the copyright notice **Copyright (c) 2025 Thong Pham**. That exact text
is retained in [LEGACY-MIT-LICENSE.txt](LEGACY-MIT-LICENSE.txt); the migration
does not remove its permissions. See [rights](docs/RIGHTS.md).

New owned work from the standalone migration uses the [current license](LICENSE).
The owner is Jackson Pham / YouKnowJP. No external artwork, fonts, datasets,
downloaded audio, or third-party runtime packages are bundled. System font
names refer to fonts on the player's device.

Development browser checks use [Playwright](https://github.com/microsoft/playwright),
licensed Apache-2.0. Exact locked versions and integrity hashes are in
`package-lock.json`. Playwright, downloaded browsers, Node.js, test reports,
traces and development scripts are not included in the playable artifact.
GitHub Actions retain their own licenses.

Players' imported original designs and writing are not claimed by the owner.
Do not import material you lack permission to use or share.
