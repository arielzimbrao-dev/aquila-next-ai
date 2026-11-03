# CONTEXT.md — project rules and map

> Project knowledge for AI agents (method: `aquila-next-ai`). **(to fill in)** — the `aquila-docs` skill
> fills it from the code; the dev validates. Precedence: `.aquila/core/precedence.md` — real code wins.
> Budget: ≤ 14.5 KB. Long detail goes to `docs/`; only the pointer stays here.

## 1. Overview

<5 lines: what the system does, for whom, main inputs and outputs.>

**Stack:** Next.js <version> (App Router | Pages Router) · React <version> · <styling · UI kit · data/API · auth · hosting> (versions: `package.json`).

## 2. Map: problem → where to look

Start here and at [`docs/c4/`](../c4/README.md); **then** confirm in the code. No broad sweeps.

- <Area/problem> → `<real path>` (<key file>) · doc: <link>
- Task from a track → [`docs/tracks/README.md`](../tracks/README.md)
- Per-folder rules → [`.github/instructions/`](../../.github/instructions/) (`applyTo`)
- Build/change (recipes, API, events, conventions) → [`docs/reference/`](../reference/README.md) ·
  operate (diagnosis, replay, rollout) → [`docs/runbooks/`](../runbooks/README.md)

## 3. Layers

<Which layers exist (routes in `app/`, UI components, server-only data/services, Server Actions, client
hooks/state), which folder holds each, what each may import, and where the `"use client"` boundaries are.
Server-only code imported by a Client Component is a bug.>

## 4. Invariants (always preserve)

- <e.g.: secrets and DB access only in server-only modules; nothing sensitive in `NEXT_PUBLIC_*`>
- <e.g.: every Server Action validates input and checks authorization; mutations revalidate the affected paths/tags>

## 5. Large docs (read by section only)

- <file> — <which section to open for what>

## 6. Git and deploy

- Branches: <convention> · PR to <branch> · deploy: <CI/CD only?>
