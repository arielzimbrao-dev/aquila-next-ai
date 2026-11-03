# Next.js architecture — routing, Server/Client Components, composition

Entry: [`../nextjs.md`](../nextjs.md). Version deltas: [`versions.md`](versions.md).

## App Router layout ([docs](https://nextjs.org/docs/app/getting-started/project-structure))

- A folder is a route segment; it becomes public only with a `page.tsx` (or `route.ts`). Other files in the
  folder are safely colocated (components, tests, helpers).
- Special files per segment: `layout` (persists across navigation, keeps state), `template` (remounts),
  `page`, `loading` (Suspense boundary), `error` (error boundary, **client** component), `not-found`,
  `default` (parallel routes fallback), `route` (HTTP handler — never next to a `page` in the same segment).
- Organization: `(group)` folders group routes or give them separate root layouts without changing the URL;
  `_private` folders opt out of routing; `[id]`, `[...slug]`, `[[...slug]]` for dynamic segments;
  `@slot` for parallel routes; `(.)x` for intercepting routes (modals).
- Follow the project's existing layout (`src/app` vs `app`, feature folders vs colocated); suggested default:

```text
app/(marketing)/page.tsx          app/(app)/orders/[id]/page.tsx
app/(app)/orders/_components/      ← route-only UI
components/ui/                     ← shared, presentational
lib/data/orders.ts                 ← server-only data access (import 'server-only')
lib/actions/orders.ts              ← Server Actions ('use server')
```

- Files: kebab-case or the project's convention; components PascalCase; one component per file for shared UI.

## Server and Client Components ([docs](https://nextjs.org/docs/app/getting-started/server-and-client-components))

- Everything in `app/` is a Server Component unless the file (or an importer up the module graph) has
  `"use client"`. The directive marks a **boundary**: that module and everything it imports ship to the browser.
- Use a Client Component only for: state/effects (`useState`, `useEffect`), event handlers, browser APIs
  (`window`, `localStorage`), custom hooks that use those, or client-only libraries.
- Push the boundary down: keep the page/layout on the server and make only the interactive leaf a client
  component (`<LikeButton />`, not the whole `<Post />`).
- Interleave by composition: a Client Component can render Server Components passed as `children`/props;
  it cannot `import` a Server Component.

```tsx
// app/cart/page.tsx (server)
export default async function Page() {
  const cart = await getCart();                 // server-only data layer
  return <Drawer><CartLines lines={cart.lines} /></Drawer>; // Drawer is 'use client', CartLines stays server
}
```

- Props server→client must be serializable (plain objects, arrays, Date, Map/Set, promises on React 19,
  Server Actions). No class instances, functions (except Server Actions) or ORM entities.
- Send only what the client renders — map to a view model; never pass full user/DB rows (they end up in
  the RSC payload, visible in the page source).
- `import 'server-only'` in modules touching secrets, DB or internal APIs; `import 'client-only'` for
  modules that touch `window`. Build fails on the wrong side instead of leaking.
- Context providers are client components: wrap `{children}` in a `providers.tsx` as deep as possible,
  not around `<html>` unless every page needs it.
- Third-party components using hooks without `"use client"`: re-export them from a local file with the directive.

## Rendering model ([docs](https://nextjs.org/docs/app/guides/caching))

- A route is **static** (prerendered at build/revalidation) unless it uses request-time data: `cookies()`,
  `headers()`, `searchParams`, `connection()`, uncached fetches (behavior per version — [`versions.md`](versions.md)).
- Check the build output (`next build` route table) after changing data access: a page that silently turned
  dynamic is a performance regression; one that turned static may serve stale/personalized data.
- `generateStaticParams` for known dynamic segments; `dynamicParams = false` to 404 the rest.
- Streaming: wrap slow parts in `<Suspense fallback>` (or `loading.tsx` for the segment) so the shell renders first.
- v16 with `cacheComponents`: dynamic is the default and caching is opt-in with `"use cache"`; uncached
  request-time data must sit inside `<Suspense>` (Partial Prerendering) — the build errors otherwise.

## Navigation ([docs](https://nextjs.org/docs/app/getting-started/linking-and-navigating))

- `<Link href>` for internal routes (prefetches in production); `useRouter()` from `next/navigation`
  (App Router) — never `next/router` there — only for imperative navigation after an event.
- `redirect()`/`permanentRedirect()` on the server, `notFound()` for missing resources; they throw — call
  them outside `try` blocks.
- URL is state: filters, tabs, pagination in `searchParams` (shareable, back-button friendly) rather than
  `useState`. `useSearchParams()` in a Client Component needs a `<Suspense>` boundary to keep the route static.

## State management

- Server data stays on the server (Server Components + revalidation). Don't mirror it into a client store.
- Local UI state in components; lift only as far as needed; URL for shareable state.
- Client cache libraries (TanStack Query, SWR) only for client-driven data (polling, infinite scroll,
  optimistic UIs beyond `useOptimistic`) and only if the project already uses one.
- Global stores (Zustand, Redux, Jotai): follow the project; never create a store per request on the
  server or share module-level mutable state between requests.

## Pages Router (existing projects) ([docs](https://nextjs.org/docs/pages))

- Data: `getStaticProps` (+ `revalidate` for ISR), `getStaticPaths`, `getServerSideProps`; API in
  `pages/api/*`. Everything in a page component ships to the client — keep secrets in the data functions.
- `_app.tsx` for providers/global CSS, `_document.tsx` only for `<html>`/`<body>` attributes.
- Don't port a page to the App Router as a side effect; migration is its own task (ADR + plan).

## Layering

- UI components don't fetch, don't know the DB and don't read env; they receive data via props.
- Data access in one server-only layer (DAL): auth check + query + map to DTO. Pages, actions and route
  handlers call it.
- Follow the project's layer rule (`.github/instructions/`) and golden files; this file does not impose
  feature-sliced/atomic design on projects that don't use it.
