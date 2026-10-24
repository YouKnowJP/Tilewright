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

Keep the development server running, make Playwright and Chrome available in
the developer environment, then run `npm run test:browser`. Individual browser
modules also export functions for focused checks and cross-engine runs.

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
