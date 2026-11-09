# Changelog

## 0.4.1 — 2026-11-09

Fixes found by running the regression scan of edp-ai (the multi-stack sibling of this method) against this
package. No action needed in projects beyond `npm i -D aquila-next-ai@0.4.1` and `npx aquila-next-ai sync`.

- **`$` in a gate command** (`$&`, `$'`, `$$`) no longer corrupts `AGENTS.md`/the routers or the
  `.git/info/exclude` block (it was read as a `String.replace` pattern).
- **A BOM in `docs/ai/aquila.json`** (Windows PowerShell 5 writes one) no longer breaks every command.
- **`doctor` with an invalid config** shows the schema errors and exits 1 instead of crashing with a `TypeError`.
- **`gate`:** a gate without a command fails on its own and the others still run; the Portuguese Windows
  message "não é reconhecido como um comando" counts as a missing tool.
- **`done.gates: []`** falls back to `hooks.ci` in the done checklist instead of "no gates defined".
- **`init` never makes a fixing script a gate:** it now checks every workspace (a `lint` with `--fix` in one
  workspace ran it through `npm run lint --workspaces`) and also detects `prettier -w`; `--fix-dry-run` is not
  a fix.
- **Generated workflow:** an `install-command` with a line break or YAML-special characters is quoted (it
  produced invalid YAML).
- **Claude Code guard (`guard-bash`):** also blocks `git push -fu`, `git push --mirror`, abbreviated
  `--no-verif`, and `git.exe` (also by path, `C:/…/git.exe`).
- **Globs** (`applyTo`, `when`, `lint.options.configPaths`): `{a,b}`, `?`, `./src/**` and a bare folder
  (`src`, `src/`) match like `.gitignore`; `applyTo` lists no longer split inside `{a,b}`.
- **Local mode:** a `.vscode/settings.json` the team versions is not rewritten (a note says what to add);
  `audit_*.md` reports from `/aquila-deep-audit` go in `.git/info/exclude`; the template's `<e.g.: …>` examples
  no longer leak into `copilot-instructions.md`.
- **Lint:** `eslint-config-prettier` comes before the catalog, so it no longer switches catalog rules off
  (e.g. `curly`); an empty `srcDirs` no longer produces an invalid `files: []`; a failing `lint --baseline`
  restores the previous `docs/ai/lint-baseline.json` instead of losing it.

## 0.4.0 — 2026-11-04

Fixes from migrating four real projects to 0.3.0 (NestJS + React in one repository, NestJS in a subfolder,
Next.js at the root) and clearing lint `high` in them. **Upgrade every aquila package of a repository to 0.4.0
together.**

- **The project's own ESLint and aquila's rules:** `aquilaEslintCompat()` (`aquila-next-ai/lint/eslint/compat.mjs`), the
  last item of the project's `eslint.config`. An `eslint-disable` for a rule only `lint-aquila` runs no longer
  fails there ("Definition for rule … was not found") nor is reported as unused and deleted by `--fix` with
  `reportUnusedDisableDirectives`; only those two directive messages are dropped, only for catalog rules.
  `doctor` warns when the project's `eslint.config` lacks it.
- **No autofix that breaks the typecheck:** a catalog rule with `"fix": false` reports its fix as a suggestion;
  `unicorn/prefer-at` is one (`.at(-1)` is `T | undefined` without `noUncheckedIndexedAccess`).
- **Tests next to the code:** with `srcDirs` and `testDirs` on the same folder, production-only rules
  (`max-lines-per-function`, …) ignore `*.{spec,test,e2e-spec}.*`, and test-only rules no longer reach production
  files. `sonarjs/prefer-read-only-props` is off in tests.
- **`AGENTS.md` within 3,500 characters** with the longest options (subfolder, lint `high`, `workflow.autoCommit`,
  `done.gates`): shorter generated text, covered by a test.
- **`workflow.autoCommit`:** `true` | `"commit"` (commit, push only when asked) | `"commit+push"`; `true` keeps
  its meaning.
- **`doctor`:** a gate listed in `done.gates` (e.g. tests that only the project's own CI runs) is no longer
  reported as "never runs". The Claude Code plugin install is printed as
  `cd "<project>" && claude plugin marketplace add ./.aquila && claude plugin install aquila@aquila-next-ai --scope local`
  (local scope leaves the versioned `.claude/settings.json` untouched; in team mode that file already enables the
  plugin, so Claude Code offers it when the folder is opened).
- **Project in a subfolder:** `/aquila-docs` writes per-folder rules at the repository root
  (`.github/instructions/<folder>-<area>.instructions.md`, `applyTo` prefixed by the folder), where Copilot reads
  them; `check` counts those root rules for coverage and the 2,500-char budget.

## 0.3.0 — 2026-11-03

Fixes from installing the 0.2.0 family in real repositories (a NestJS backend and a React frontend in one repo, a
NestJS project in a subfolder, Next.js at the root, npm workspaces). aquila-ai, aquila-react-ai and
aquila-next-ai now come from one source: everything that is not technology-specific (CLI, hooks, CI, gates,
lint engine) is identical in the three; conventions, lint plugins and presets stay per stack. **Upgrade every
aquila package of a repository to 0.3.0 together.**

- **Hook dispatcher v2, one file for the three packages.** 0.2.0 shipped three incompatible dispatchers
  (different headers; aquila-next-ai wrote the registry as `<dir>\t<package>` and kept it out of git). The
  v2 header is recognized by every 0.2.0 version (none downgrades it); v1 copies are upgraded; a hand-written
  hook in `.aquila-hooks/` is left alone. The dispatcher reads both registry formats and finds the package
  hoisted to the repository root (npm/pnpm workspaces). `.aquila-hooks/projects` has one fixed header, keeps the
  other packages' lines as written and is sorted by folder, so the init order no longer matters.
- **Executable bit:** `init`/`sync` record `.aquila-hooks/pre-commit|pre-push` as `100755` in the index (Windows
  versioned them `100644`, so Linux/macOS clones never ran them); `check` fails when they are not.
- **core.hooksPath:** a custom path whose folder is gone or has no hooks is migrated to `.aquila-hooks` with a
  warning; a real manager (husky…) is kept, with the exact call to the dispatcher, or migrated with
  `init --hooks=dispatcher`. `check --ready` accepts `cd <dir> && npx <package> gate …` and
  `"$(git rev-parse --show-toplevel)/.aquila-hooks/<phase>"`.
- **CI:** `ci.workflow: false` (no generated workflow; `doctor` prints the steps for your pipeline and no longer
  reports it missing), `ci.services` / `ci.env` (e.g. Postgres, so `gate ci` runs the full suite). The workflow
  of a project in a subfolder also triggers on its own file.
- **Done ≠ CI:** `done.gates` lists the definition of done in `AGENTS.md` independently of `hooks.ci`.
- **init reads the project:** a lint/format script that fixes files (`--fix`, `--write`) is never a gate
  (`lint:check`/`lint:ci` preferred); coverage thresholds come from `jest.config`/`vite(st).config`/`package.json`;
  with a `coverage` gate CI no longer also runs `test`; the identifiers' language sets `language.code`
  (`--code-lang`); `--lang=pt-BR|pt-PT` writes the `docs/` indexes (adr, c4, tracks, reference, runbooks,
  skills) in that language; warns when no gate runs tests. aquila-next-ai: on Next.js ≥ 16 a `next lint` script
  becomes `npx eslint .`.
- **Lint:** `lint --baseline` (ESLint bulk suppressions in `docs/ai/lint-baseline.json`: only new violations
  fail), `lint --fix`, `lint.overrides` per rule in `aquila.json`. The lint plugins are optional
  `peerDependencies` with ranges that work together; `init` prints the exact install (`--install` runs it) and
  picks eslint-plugin-unicorn 65.0.1 for ESLint 9 / ≥ 66 for ESLint 10; `doctor` checks the versions. ESLint is
  found when hoisted; ESLint 8 (`.eslintrc`) and a TypeScript project without typescript-eslint are reported
  instead of failing on every file; a rule the installed plugin version lacks is skipped and reported.
  aquila-ai: `consistent-type-imports` never turns constructor-injected imports into `import type` (Nest DI
  would break at runtime). Each package loads only its own stack's plugins.
- **Commits:** the "commit/push only when asked" rule admits a standing instruction of the owner;
  `workflow.autoCommit: true` writes it into `AGENTS.md`.
- **PR size:** generated and managed files (`.aquila/`, `.aquila-hooks/`, routers, `.claude/commands/aquila-*`,
  `aquila-gates*.yml`, the lint baseline) don't count towards `review.prMaxFiles`.
- **Subfolder projects:** Copilot gets a root `.github/instructions/aquila-<folder>.instructions.md` scoped to
  the folder, and the root `.vscode/settings.json` points at the project's agents and skills.
- **Team mode** versions the `/aquila-*` commands (they were excluded from git yet committed in practice).
- **CLI:** `--help`/`-h` on every command; `check --verbose` (otherwise the files without per-folder
  instructions are a one-line count); `doctor` tells which folder to open Claude Code in when a repository
  has several aquila projects; the plugin is reported "not verified" (never "missing") when the `claude` CLI
  fails. `AGENTS.md` stays within its 3,500-character budget.
- Docs: README sections "Monorepo / project in a subfolder" and "Adopting in a legacy project", the same
  "The aquila family" section in the three READMEs. aquila-react-ai: `core/react.md` no longer prescribes
  TanStack Query/Zod/MSW/Playwright — the project's existing stack wins.

## 0.2.0 — 2026-11-04

Monorepo support: the project may live in a subfolder of the git repository and share it with the sibling
packages (`aquila-ai`, `aquila-react-ai`). Run `npx aquila-next-ai init` again in each project to migrate.

- **Git hooks** find the project from their own location instead of the repository root, so
  `node_modules` in `repo/frontend` is found.
- **Shared hooks dispatcher** at the repository root (`.aquila-hooks/`, `core.hooksPath = .aquila-hooks`)
  when the project is in a subfolder or another aquila project shares the repository: it runs
  `<package> gate <phase>` in each project registered in `.aquila-hooks/projects`, only when that folder has
  changes in the commit (staged files) or push (pushed range). Same file and contract in the three packages;
  a root project with `.aquila/githooks` joins it automatically. Before, `core.hooksPath` was relative to the
  project (git resolves it from the root), so no hook ran, silently.
- **CI workflow** of a subfolder project is generated at the repository root as
  `.github/workflows/aquila-gates-<folder>.yml`, with `paths` and `working-directory`; `sync` removes the
  0.1.0 workflow GitHub never read. `gate ci` compares changed files relative to the project
  (`git diff --relative`), so `when` globs work in a subfolder.
- **`.git/info/exclude`** entries (mode `local`) are prefixed with the project folder; one block per project.
- **`check`** fails when the hooks or the workflow sit where git/GitHub never run them (hooksPath resolving to
  another folder, dispatcher missing/replaced/not executable, project not registered, a registered project
  without its bin, workflow inside the subfolder). **`doctor`** shows the subfolder, the dispatcher and how
  many aquila projects share it.
- README: "Monorepo / project in a subfolder" and the sibling packages.

## 0.1.0 — 2026-11-03

- First open-source release as the `aquila-next-ai` npm package for Next.js projects, adapted from
  `aquila-ai` (the NestJS edition): CLI (`npx aquila-next-ai init|sync|check|doctor|gate|lint|tokens`), skills `/aquila-*`,
  roles plan/tests/implement/review, Claude Code plugin, Copilot and Codex adapters, ESLint quality levels,
  small-PR directive (`review.prMaxFiles`, default 30, `--pr-max-files`),
  self-contained GitHub Actions workflow and Next.js conventions (Server/Client Components, data and caching, Server Actions, UI/a11y,
  security, testing; focus on Next.js 15 and 16). Stack `node-next` adds a `build` gate (`next build`) in CI.
