# Style

- **Language**: `docs/ai/aquila.json` → `language` (`code`, `docs`, `answers`; default `en` for all) —
  the generated `AGENTS.md` repeats it (other values: `pt-BR`, `pt-PT`, …). Always talk to the dev in the
  `answers` language, without mixing variants (`pt-PT` ≠ `pt-BR`). aquila-next-ai's own texts are in English;
  what the agent writes follows the project's `language`.
- **Comments**: none by default. When the "why" is not obvious, a short JSDoc on the declaration. No
  comments that restate the code, no commented-out code.
- **Simplicity**: reuse the existing helper/pattern before writing one; the smallest change all callers go
  through; no speculative abstractions.
- **Errors**: logged **and** rethrown — never swallowed.
- **Configuration** only through the project's config mechanism (never ad-hoc environment variable reads).
- **Secrets** never in code, examples, logs or docs.
- **Output to the dev**: concise; what changed, what was verified, risks to review before merge.

## Readable code

Code is read far more often than it is written: a dev new to the file must understand it in one read,
without asking. The lint `high` level caps the worst cases (function ≤ 80 lines, ≤ 5 params, depth ≤ 3,
complexity — [quality](quality.md)); the targets below are what to write from the start.

- **Names say what, not how**: whole words from the domain (the glossary in `docs/ai/CONTEXT.md`), no
  abbreviations beyond the universal ones (`id`, `url`, `api`). Functions are verbs (`calculateInvoiceTotal`),
  classes and types are nouns (`InvoiceRepository`), booleans read as a yes/no question (`isActive`,
  `hasAccess`, `canRetry`). No `data`, `info`, `item`, `temp`, `result2`, `handleStuff`, `utils`/`helpers`
  dumping grounds. One name per concept across the codebase; a longer name for a wider scope.
- **One function, one job**, at one level of abstraction: if describing it needs "and", split it. Aim for
  ~20 lines and ≤ 3 parameters (an options object beyond that). A boolean parameter that switches behavior
  → two functions. A `get…`/`is…` never writes; side effects are visible in the name.
- **Flat flow**: guard clauses and early returns instead of nested `if`/`else`; no nested ternaries; a
  complex condition becomes a named variable or function (`const isOverdue = …`); no magic numbers or
  strings — named constants.
- **Small, cohesive files**: one concept per file, related code together; pure logic separated from I/O and
  framework code, so it can be read and tested on its own.
- **Types document intent**: explicit at module boundaries, no `any`; a union of named states instead of
  several booleans that can contradict each other.
- **Consistency over taste**: follow the project's existing patterns (golden files) even when you prefer
  another; the same problem is solved the same way everywhere.
- **Tests read as the spec**: the name states the behavior (`rejects an order without items`), arrange → act
  → assert, one behavior per test.
- **Before delivering**: reread the diff as the next dev. Anything you had to think twice about → rename or
  extract until it reads plainly. No clever one-liners where a plain loop or `if` is clearer.
