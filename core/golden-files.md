# Golden files

One **real example per artifact type** (page, layout, Server Component, Client Component, Server
Action, Route Handler, data function, hook, component test, e2e test, …), registered in the project's `docs/ai/golden.md`. Before writing a new artifact, the
agent copies the **pattern** of the golden file of the same type — not the one next door, which may be a
600-line component mixing fetching, state and markup.

Each entry has the path and 2–3 lines on **why** it is the pattern (server/client boundary, data fetching, tests). If a
golden file is renamed or grows beyond an example, replace it in the same task. `aquila-init` proposes
candidates; the dev validates.
