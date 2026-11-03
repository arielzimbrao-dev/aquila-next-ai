# Next.js conventions

How agents write Next.js code under aquila-next-ai. Project rules win (`docs/ai/`, `.github/instructions/`,
golden files — [`golden-files.md`](golden-files.md)); this file is the default when the project is silent.
Open a reference file only for the area the task touches.

## 1. Version and router first

1. Read the installed major: `next` in `package.json` (resolve ranges against the lockfile or
   `node_modules/next/package.json`). The generated `AGENTS.md` states it (`Next.js <major>`, refreshed by
   `npx aquila-next-ai sync`); the installed package still wins on conflict ([`precedence.md`](precedence.md)).
   Also read `react`: hooks like `useActionState`/`useOptimistic` need React 19.
2. Detect the router: `app/` (or `src/app/`) = App Router; `pages/` = Pages Router; both = incremental
   migration — write new routes in the router the project chose for that area, never mix inside one route.
3. Apply the rules of that major from [`nextjs/versions.md`](nextjs/versions.md). Never use an API newer than
   the project's version; never "upgrade while passing by" — a major bump is its own task (ADR + plan).
4. Version-specific syntax to check every time: async `params`/`searchParams`/`cookies()`/`headers()`
   (v15+), `fetch` caching defaults (v15 changed them), `middleware.ts` vs `proxy.ts` (v16), `"use cache"`
   + `cacheComponents` (v16), `revalidateTag` signature (v16).
5. Docs: <https://nextjs.org/docs> is the current major; older majors under `/docs/<n>` (e.g. `/docs/14`).

## 2. Checklist (default rules)

**Structure & components** — [`nextjs/architecture.md`](nextjs/architecture.md)
- Routes are folders in `app/`; special files `page`, `layout`, `loading`, `error`, `not-found`, `route`.
  Colocate route-only components; shared UI in `components/`, server-only logic in `lib/`/`server/`.
- **Server Components by default.** `"use client"` only on the leaf that needs state, effects, event
  handlers or browser APIs; pass Server Components as `children` instead of moving whole trees to the client.
- Props crossing the server→client boundary must be serializable; never pass secrets or full DB rows.
- `import 'server-only'` in modules with secrets/DB access so a client import fails the build.

**Data, mutations, APIs** — [`nextjs/data.md`](nextjs/data.md)
- Fetch on the server (async Server Components, data functions in a data access layer), in parallel
  (`Promise.all`), close to where it's used; React `cache()` to dedupe per request.
- Caching is explicit and version-dependent: know what is static, dynamic and revalidated
  (`revalidate`, tags, `"use cache"` on v16 with `cacheComponents`).
- Mutations via **Server Actions** (forms, `useActionState`); every action validates input (Zod or the
  project's schema), checks authentication **and** authorization, then `revalidatePath`/`revalidateTag`
  (`updateTag` on v16) or `redirect`.
- Route Handlers (`route.ts`) for public/third-party HTTP APIs and webhooks — not for your own pages'
  data (call the data layer directly from Server Components).
- Expected errors are returned as values; unexpected ones throw to `error.tsx`. Never wrap `redirect()`/
  `notFound()` in a `try/catch` that swallows them.

**UI, performance, accessibility** — [`nextjs/ui.md`](nextjs/ui.md)
- `next/link`, `next/image` (explicit `width`/`height` or `fill` + `sizes`), `next/font`, `next/script`.
- `loading.tsx`/`<Suspense>` for streaming; skeletons that match the final layout (no layout shift).
- Semantic HTML first; every interactive element reachable by keyboard with an accessible name.
- Metadata via `metadata`/`generateMetadata`, never hand-written `<head>` in the App Router.

**Config, security, ops** — [`nextjs/security-config.md`](nextjs/security-config.md)
- Env validated once (`src/env.ts`); `NEXT_PUBLIC_*` is public and inlined at **build** time;
  `process.env` only in config ([`quality.md`](quality.md) `configPaths`).
- Auth checks close to the data (data layer, Server Actions, Route Handlers) — middleware/proxy is an
  optimistic redirect, not the security boundary.
- Security headers/CSP, `images.remotePatterns` allow-list, no `dangerouslySetInnerHTML` without sanitizing.
- Server logs via a structured logger + `instrumentation.ts`; client errors to the project's reporter.

**Testing** — [`nextjs/testing.md`](nextjs/testing.md)
- Unit/component: the project's runner (Vitest or Jest via `next/jest`) + Testing Library, queries by role.
- Async Server Components are not supported by unit runners → cover them with e2e (Playwright).
- Server Actions/data functions: call them as functions with mocked `next/headers`, `next/cache`, auth.
- Tests come first (failing) per [`workflow.md`](workflow.md).

## 3. Review red flags

- API or syntax newer than the project's Next/React major; sync `params`/`cookies()` on v15+ (removed on v16).
- `"use client"` at a layout/page root without need; `useEffect` + `fetch` for data the server could load.
- Secret, DB client or server-only module reachable from a Client Component; sensitive data in `NEXT_PUBLIC_*`.
- Server Action or Route Handler without validation or authorization; mutation without revalidation.
- Auth enforced only in middleware/proxy; `redirect()` inside a swallowing `try/catch`.
- `<img>`/`<a>` instead of `next/image`/`next/link` for internal assets/routes; missing `sizes` with `fill`.
- Clickable `div`, missing labels/alt; new dependency for what the platform or React already does.
