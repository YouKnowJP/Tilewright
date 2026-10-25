# Tilewright development tools

Run the usual commands from the Tilewright folder:

```sh
npm start
npm run verify
```

| Location | Responsibility |
| --- | --- |
| [check.mjs](check.mjs) | Recursively checks syntax in source, tests, and tools. |
| [build.mjs](build.mjs) | Packages only the explicit public-file allowlist into `dist/`. |
| [browser/checks.mjs](browser/checks.mjs) | Entry point for all 30 optional live browser-check families. |
| [browser/](browser/) | Feature-specific checks and shared UI/capture helpers. |
| [solvers/](solvers/) | Developer witness generators; produce ordinary input journals through the public rules. |

## Optional live checks

Install the locked development tools with `npm ci`. For the release checks:

```sh
npx playwright install --with-deps --only-shell chromium
npm run test:browser:smoke
```

The command builds the static package, starts a temporary loopback server, and
plays that exact package. It checks phone/desktop looks and recovery while frames
are suspended, both training lessons and a real creator export, journey-specific
wardrobe backups and fresh starts, quota failures, and the full Lanternfair book.
It closes the browser and server afterward. No separate server is needed.

This suite gates deployment in CI. Failures retain a screenshot, console/error
JSON, and Playwright trace in `playwright-report/release-smoke/<engine>/`; successful
reruns remove the matching stale failure files. CI keeps failure reports for seven
days. Reports are ignored by Git and excluded from the game. See the official
[Playwright CI guide](https://playwright.dev/docs/ci).

To repeat one case, for example:

```sh
npm run test:browser:smoke -- saved-looks-and-continue-390
```

Unknown case names fail instead of silently passing an empty suite. For all 30
extended browser families, keep the development server running and Google Chrome
available, then run `npm run test:browser`. Individual modules also export
functions for focused checks and Firefox/WebKit runs.

The browser suite lives in `scripts/browser/`; the npm command stays the same.
`ui-driver.mjs` shares real UI interactions, and `artifacts.mjs` puts optional
captures in the project's ignored `.playwright-mcp/` folder even when a harness
is launched from the repository root. Copy only reviewed evidence to
`docs/screenshots/`; routine checks never overwrite documentation images.

The route generators and `story-driver.mjs` live together in `scripts/solvers/`.
Saved route fixtures stay in `tests/fixtures/`. Source, fixtures, browser tools,
and generators remain separate, and the static build excludes all developer
tools. See the [documentation index](../docs/README.md) and
[repository organization guide](../../docs/README.md).
