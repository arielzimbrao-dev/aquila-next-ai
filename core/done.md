# Done checklist

Single copy. The **concrete commands** for each item live in the project's `docs/ai/aquila.json` (`gates`);
`npx aquila-next-ai gate ci` runs those selected in `hooks.ci` (all by default) and prints only failures and
totals.

- [ ] `typecheck`
- [ ] `build` — `next build` green (catches server/client boundary, prerender and type errors)
- [ ] `test` — unit tests, all green
- [ ] `lint` — zero warnings (project lint + `lint-aquila` at the `lint.level` level; see
      [quality](quality.md))
- [ ] `format` — formatting checked
- [ ] `coverage` — the project command enforces the thresholds; the numbers in `docs/ai/aquila.json` →
      `coverage` document the contract (they appear in `AGENTS.md`) and are not enforced by aquila-next-ai;
      `coverage.enforced` says whether the project tool fails below them (jest `coverageThreshold`). Only
      real asserts count.
      Having a coverage gate does not prove equivalence with `test`: keep both, unless the team explicitly
      confirms they run the same tests and checks.
- [ ] `e2e` — evaluate when what connects the pieces changes: routing, middleware/proxy, auth, forms and
      server/client data flow. A
      `gates.e2e.when` glob list filters CI execution by changed paths; local hooks do not apply the filter.
- [ ] `npx aquila-next-ai check` — if docs changed: links, budgets, instructions, adapters
- [ ] generated docs regenerated and versioned (CI compares them)
- [ ] API contract (Route Handlers, OpenAPI, typed client) in sync — if the API changed and the project maintains one
- [ ] accessibility basics on touched UI: semantic elements, labels, focus, contrast (axe in e2e if the project has it)
- [ ] `docs/c4/` updated — if files changed layer, routes or integrations changed ([docs](docs.md))

Never declare done without all applicable items green. Never `--no-verify`.
