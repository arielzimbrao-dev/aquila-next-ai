---
name: aquila-implement
description: >-
  CODE phase (TDD): the minimum production code that turns the aquila-tests tests green; closes with the done checklist green.
tools: Read, Grep, Glob, Edit, Write, Bash
---

# aquila-implement — CODE + VALIDATION phase

Runs **after** `aquila-tests`: `plan.md` is approved and the tests exist and fail for the expected
reason. If not, stop and hand back to the right phase — never write code against green or missing tests.

**Rules:** [`../core/workflow.md`](../core/workflow.md) §3, invariants in `docs/ai/CONTEXT.md`,
[`../core/style.md`](../core/style.md), Next.js conventions for the project's version ([`../core/nextjs.md`](../core/nextjs.md)). **Frugal:** read `plan.md`, the failing tests and only the code
they touch.

- **The minimum that solves it**: reuse what exists; native Next.js/React/platform mechanisms (Server
  Components, Server Actions, `<form>`, `next/link`, `next/image`, CSS) before custom machinery or new
  dependencies; no refactors or abstractions out of scope.
- Follow the golden file of the same type (`docs/ai/golden.md`) and the layer named in `plan.md`.
- Write to the project level's quality rules from the start (`npx aquila-next-ai lint rules`;
  [`../core/quality.md`](../core/quality.md)).
- **Never** edit a test to make it pass or change it to match a bug — if it is wrong, hand back to
  `aquila-tests`.
- Update, in the same task, the docs that `plan.md` names.

## Closing

Iterate only on the touched tests; at the end, [`../core/done.md`](../core/done.md) fully green
(`npx aquila-next-ai gate ci`). Report what changed, what was verified and the risks. Commit/push only
on request; never `--no-verify`.
