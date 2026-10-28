# Standalone repository migration — 28 October 2026

Canonical repository: https://github.com/YouKnowJP/Tilewright. Local clone:
`/Users/youknowjp/Documents/Personal PR/Tilewright`, next to Mallside.

## Provenance and history

- Source: Personal-Project `Tilewright/`, at `c1c7534e4641e0385293af004d1c5c7346e0a920` (v0.30.1).
- `git subtree split --prefix=Tilewright` extracted the game history with root
  paths as `a9a90e068940ac778cf02184860888d64f1a1ccd`. Paths and commit IDs change through extraction;
  original author information, dates, and game commit messages are retained.
- The destination's original commit `2428ce5c643666fc9e90f562a9e90c8d01f98a6a` contained only README.md and
  LICENSE. It remains an ancestor through an unrelated-histories merge.
- The extracted MIT baseline is tagged `legacy-mit-v0.30.1`. No force push,
  fabricated development history, or rewrite of Personal-Project is used.
- All 339 tracked game files are imported. Shared repository configuration,
  CI, security/contribution guidance, asset notices, and file-index tooling
  become standalone equivalents. The complete former README is retained as
  [GAME_GUIDE.md](GAME_GUIDE.md).
- Dependencies, build output, test captures, OS metadata, machine configuration,
  tokens and browser saves are not committed. Existing Git history remains.

Version 0.30.2 changes repository/hosting/rights metadata and adds a public
rights/privacy page. Game rules, levels, save schemas and `tilewright.*` keys
remain compatible. The old tracked game directory is retired only after the
standalone project is validated and its playable site is available.

## Hosting and saves

The public game is https://youknowjp.github.io/Tilewright/. Upload `dist/` itself; GitHub Pages supplies the
`/Tilewright/` project prefix. The old Personal-Project repository is private
and its Pages API returned 404 at migration; this move does not make it public
or claim that the former `/Personal-Project/` address redirects. Its README
points to the canonical game/repository.

Both public paths use the same `https://youknowjp.github.io` origin, so unchanged
save keys let the new address read previous saves in the same browser. Relative
asset and share-link handling must also work under `/Tilewright/`. A migration
browser check verifies actual continuation and a win across the two path
prefixes on one origin. Players moving to another origin/browser still need
backups; no migration uploads or deletes their data.

## Rights boundary

Unlike Mallside's empty MIT starter, the Tilewright game itself was already
MIT licensed. The current proprietary terms apply to new owned material and
do not revoke the earlier grant. The [legacy notice](../LEGACY-MIT-LICENSE.txt)
and [rights guide](RIGHTS.md) remain in source and the playable package. No
claim is made that the old game can now be prevented from commercial copying.
