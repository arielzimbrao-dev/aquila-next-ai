# Next.js versions — what changes when writing code

Detect the major (and React major) first ([`../nextjs.md`](../nextjs.md) §1). Only the deltas that change
how code is written are listed; upgrades follow the official guide and codemods
(`npx @next/codemod@latest upgrade`) for the target major.

## 12 ([blog](https://nextjs.org/blog/next-12))

- Pages Router only. SWC compiler replaces Babel (unless a `.babelrc` exists).
- Middleware: beta `pages/_middleware.ts` in 12.0 → single root `middleware.ts` from 12.2 (stable).
- React 18 support (12.1+); Node ≥ 12.22.

## 12 → 13 ([guide](https://nextjs.org/docs/app/guides/upgrading/version-13))

- **App Router** (`app/`): beta in 13.0, stable in 13.4 — Server Components, layouts, streaming, `loading`/`error`.
- `next/link` renders the `<a>` itself (no child `<a>`); new `next/image` (old one → `next/legacy/image`).
- `next/font` built in (13.2; `@next/font` package deprecated). Metadata API and Route Handlers (13.2).
- Server Actions alpha (13.4, `experimental.serverActions`). `fetch` cached by default (`force-cache`).
- Node ≥ 16.14; React ≥ 18.2.

## 13 → 14 ([guide](https://nextjs.org/docs/app/guides/upgrading/version-14))

- **Server Actions stable** (no flag). Node ≥ 18.17.
- `next export` command removed → `output: 'export'` in `next.config`.
- `ImageResponse` import moved from `next/server` to `next/og`.
- `viewport`, `themeColor`, `colorScheme` leave `metadata` → `export const viewport` / `generateViewport`.
- Partial Prerendering preview (experimental). React canary features used by the App Router
  (`useFormState`, `useFormStatus`).

## 14 → 15 ([guide](https://nextjs.org/docs/app/guides/upgrading/version-15), [blog](https://nextjs.org/blog/next-15))

- **React 19** for the App Router (Pages Router may stay on 18). `useFormState` → `useActionState`
  (from `react`); `ref` is a regular prop (no `forwardRef` in new code); `<Context>` as provider.
- **Async request APIs**: `cookies()`, `headers()`, `draftMode()`, and `params`/`searchParams` in pages,
  layouts, route handlers and `generateMetadata` are **promises** — `await` them (`use()` in Client
  Components). Sync access still works with a warning in 15 (codemod `next-async-request-api`).
- **Caching defaults flipped**: `fetch` not cached by default; GET Route Handlers dynamic by default;
  client router cache `staleTimes.dynamic` = 0. Opt in explicitly ([`data.md`](data.md)).
- `next/form` (`<Form>`), `connection()` replaces `unstable_noStore`, `instrumentation.ts` stable with
  `onRequestError`, `after()` (stable in 15.1; `unstable_after` in 15.0), `unstable_rethrow`.
- `next.config.ts` supported; `experimental.serverComponentsExternalPackages` → `serverExternalPackages`;
  `experimental.bundlePagesExternals` → `bundlePagesRouterDependencies`.
- `NextRequest.geo`/`ip` removed (use the host's helpers); runtime `experimental-edge` → `edge`;
  `@next/font` removed. ESLint 9 supported.
- Node ≥ 18.18. Turbopack dev stable (`next dev --turbopack`).
- Later minors: 15.1 `forbidden()`/`unauthorized()` (experimental `authInterrupts`); 15.5 Node.js runtime
  for middleware stable, typed routes stable, `next lint` deprecated, Turbopack builds beta.

## 15 → 16 ([guide](https://nextjs.org/docs/app/guides/upgrading/version-16), [blog](https://nextjs.org/blog/next-16))

- **Node ≥ 20.9**, TypeScript ≥ 5.1. React 19.2 (`<ViewTransition>`, `useEffectEvent`, `<Activity>`).
- **Turbopack is the default** for `next dev` and `next build` (`--webpack` to opt out; custom webpack
  config needs it). `experimental.turbopack` → top-level `turbopack`.
- **Sync request APIs removed**: `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()` must
  be awaited.
- **`middleware.ts` → `proxy.ts`** (export `proxy`), Node.js runtime; `middleware` is deprecated (kept for
  Edge). Config flags renamed accordingly (e.g. `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`).
- **Cache Components**: `cacheComponents: true` enables `"use cache"`, `cacheLife()`, `cacheTag()` (no
  `unstable_` prefix) and Partial Prerendering; replaces `experimental.dynamicIO`/`experimental.ppr`.
  With it, uncached request-time data must be inside `<Suspense>`; segment configs like `dynamic`/`revalidate`
  don't apply.
- **Cache APIs**: `revalidateTag(tag, profile)` requires a `cacheLife` profile (`'max'`, `'hours'`,
  `{ expire }`); new `updateTag(tag)` (Server Actions only, read-your-writes) and `refresh()` (Server
  Actions, refresh uncached data).
- **`next lint` removed** and `next build` no longer lints → run ESLint directly (`eslint .`, flat config
  with `eslint-config-next`); make sure the `lint` gate doesn't call `next lint`.
- `next/image`: `images.domains` deprecated (use `remotePatterns`); local images with query strings need
  `images.localPatterns`; default `minimumCacheTTL` 4 h; `qualities` defaults to `[75]`; local-IP upstreams
  blocked by default; `priority` deprecated in favor of `preload`.
- Parallel routes: every `@slot` needs an explicit `default.tsx` (build fails otherwise).
- Removed: AMP, `serverRuntimeConfig`/`publicRuntimeConfig`, `experimental.dynamicIO`.
  `next/legacy/image` is deprecated. React Compiler support stable (`reactCompiler: true`, opt-in).
- `next dev` writes to `.next/dev` (dev and build can run side by side).

## Do / don't by project version

| Project on | Do | Don't |
|---|---|---|
| 12 | Pages Router data functions; root `middleware.ts` (12.2+) | `app/`, `next/font`, Metadata API |
| 13 | App Router (13.4+); explicit `cache: 'no-store'` / `revalidate` because fetch caches by default; Server Actions only if the flag is on | `useActionState`; async `params`; `next/og` |
| 14 | Server Actions + `useFormState`/`useFormStatus`; `export const viewport`; `output: 'export'` | `await params`; `connection()`; `after()`; `next/form` |
| 15 | `await params/searchParams/cookies()/headers()`; explicit caching opt-in; `useActionState`; `next/form`; `onRequestError` | Assuming fetch is cached; `useFormState`; `"use cache"` unless `experimental.dynamicIO` is on |
| 16 | Everything from 15; `proxy.ts`; `"use cache"` + `cacheLife`/`cacheTag` when `cacheComponents` is on; `revalidateTag(tag, profile)` / `updateTag`; ESLint CLI | Sync request APIs; `next lint`; `images.domains`; `serverRuntimeConfig`; `experimental.ppr`/`dynamicIO`; slots without `default` |

Unconfirmed in official sources at the time of writing: anything about v17; exact patch versions of later
16.x security releases (check the advisories for the installed version).
