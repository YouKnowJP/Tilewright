# Develop and deploy

**[Play Lantern Trails](https://youknowjp.github.io/Tilewright/)** · [Canonical source](https://github.com/YouKnowJP/Tilewright)

The game is published from the public `YouKnowJP/Tilewright` repository. Its
local clone is `/Users/youknowjp/Documents/Personal PR/Tilewright`, alongside
Mallside. Personal-Project is separate and no longer develops this game.

## Local development and build

Use Node.js 22+. Run from the standalone repository root:

```sh
npm ci --ignore-scripts
npm start
npm run verify
npm run check:public
npm run check:repository
```

Open http://127.0.0.1:4174/. The base game needs no runtime dependencies. The
ignored `dist/` directory is the complete playable artifact. Serve it over HTTP;
`file://` cannot load this ES-module game. Do not publish the repository root.

`npm run test:browser:smoke` builds and plays the package. Install its pinned
Chromium once with `npx playwright install --with-deps --only-shell chromium`.
The extended suites remain available; see [tooling](../scripts/README.md).

## Automatic Pages publishing

Set Settings → Pages → Source to **GitHub Actions**. Every push to `main` runs
`.github/workflows/pages.yml`: Node 22/24/26 on Linux, Node 24 on Windows/macOS,
plus built-game Chromium scenarios. The Linux/Node 24 job validates public
assets/notices and repository references, then uploads `dist/`. The deploy job
waits for every required check and publishes to https://youknowjp.github.io/Tilewright/.

Upload **`dist/` itself**, not its parent and not a nested `Tilewright/` folder;
Pages adds the project path. Keep asset links relative. Only the publish job
has `pages: write` and `id-token: write`; GitHub's short-lived token/OIDC handle
publication. No cross-repository key or hosting secret is required. Public
source is readable but only authorized collaborators can push official changes.

## Verify and roll back

Check Actions, open the public game, and read `release.json`: its sourceCommit
must match the successful main commit and repository must be this repository.
Verify the play/training/creator flow and inspect the rights links. The artifact
checker rejects unexpected files, development folders, missing notices, and
incorrect metadata. Browser tests verify actual play and relative asset loading.

Revert a bad change on main to publish a checked rollback. Do not change save
keys or the public origin casually. The old/new GitHub Pages paths share an
origin, so existing progress remains available in that browser. A different
origin/browser/device needs a backup. The old private repository currently has
no configured Pages site; no old-address redirect is promised.

## Permissions and licensing

The owner is the only editing collaborator at migration; CODEOWNERS routes
reviews to @YouKnowJP. Public GitHub visibility permits viewing/forking under
GitHub's terms. The [current license](../LICENSE) restricts new protected work;
the [prior MIT grant](../LEGACY-MIT-LICENSE.txt) remains effective. See
[migration](MIGRATION.md), [rights](RIGHTS.md), and [privacy](../PRIVACY.md).
