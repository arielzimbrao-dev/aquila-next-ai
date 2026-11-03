# Changelog

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
