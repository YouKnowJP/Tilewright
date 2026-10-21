# Play and share the website

**[Play Lantern Trails](https://youknowjp.github.io/Personal-Project/#play)**

Send that link to a player. They open it in their browser, read How to play if
they wish, and choose an adventure. No GitHub account, clone, Node.js, npm,
installation, or local server is needed. The bare website address and `#play` both open the game’s title screen.
Terrain Mapmaker is a menu choice or the explicit `#mapmaker` route.

The full game runs on the player's device. There is no login or game server.
An internet connection loads the website; offline installation is not provided.

## Player-made worlds

Open **Adventure Workshop**, create or remix a world, and finish **Playtest**
before sharing. **Share → Copy play link** embeds a small adventure in its URL.
A friend can open that link to preview and play the world. Larger adventures
use a downloaded `.trail.json` file or `LT1` code, which a friend imports through
**Adventure Workshop → Import & play**. There is no public gallery or upload
service.

Maps, shelves, progress, options, and expedition checkpoints stay in the current
browser on the current device. They do not sync between devices or transfer
automatically from a local development copy. Keep exported world/checkpoint
backups before clearing browser data or switching browsers.

## Maintainer: automatic publishing

The repository's [Tilewright CI workflow](../../.github/workflows/tilewright.yml)
runs syntax checks, Node tests, and the static build on Linux with Node 22, 24,
and 26, plus Windows and macOS with Node 24. The Linux/Node 24 job uploads only
`Tilewright/dist/` as the Pages artifact. Source tooling, tests, and unrelated
repository files are excluded by the build's public-asset allowlist.

After **all five jobs pass** on `main`, the deployment job publishes the tested
artifact to GitHub Pages. Pull requests and other branches run checks without
publishing. The website link stays the same after updates. A failed check leaves
the previously published game available. The workflow can also be run manually
on `main` from the Actions tab.

GitHub Pages is configured with **GitHub Actions** as its publishing source.
The deployment uses GitHub's temporary workflow identity; no deployment secret
or separate hosting account is required. Follow GitHub's
[custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
when changing the deployment configuration.

For another static host, run `npm --prefix Tilewright run build` and upload the
contents of `Tilewright/dist/`. Share the hosted URL with `#play` appended.
Keep the file tree intact and serve `.mjs` files as JavaScript over HTTPS.
These are maintainer steps; players only need the website link.

## Source and publishing access

The game interface links to play and learning screens, with no source-code
navigation. Only the owner's `YouKnowJP` account had repository write/admin
access when checked on October 20, 2026; no other collaborators were present.
Players do not receive repository access by opening the game or making worlds.
Only authorized changes to `main` can enter the publishing workflow.

The source repository remains public by the owner's choice. Anyone can read
that public source or make their own copy, but cannot push into this repository
or replace its website without write access. Browser HTML, CSS, and JavaScript
also have to download to run and can be inspected. Hiding a source link does
not make those files secret. See GitHub's
[personal repository permissions](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/permission-levels-for-a-personal-account-repository).
