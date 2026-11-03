# Changelog

## 0.1.0 — 2026-11-03

- First open-source release as the `aquila-next-ai` npm package for Next.js projects, adapted from
  `aquila-ai` (the NestJS edition): CLI (`npx aquila-next-ai init|sync|check|doctor|gate|lint|tokens`), skills `/aquila-*`,
  roles plan/tests/implement/review, Claude Code plugin, Copilot and Codex adapters, ESLint quality levels,
  small-PR directive (`review.prMaxFiles`, default 30, `--pr-max-files`),
  self-contained GitHub Actions workflow and Next.js conventions (Server/Client Components, data and caching, Server Actions, UI/a11y,
  security, testing; focus on Next.js 15 and 16). Stack `node-next` adds a `build` gate (`next build`) in CI.
