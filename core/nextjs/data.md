# Next.js data — fetching, caching, Server Actions, Route Handlers

Entry: [`../nextjs.md`](../nextjs.md). Version deltas: [`versions.md`](versions.md).

## Fetching ([docs](https://nextjs.org/docs/app/getting-started/fetching-data))

- Fetch in async Server Components or server-only data functions — not in `useEffect` — unless the data is
  truly client-driven (live updates, user-typed search with a client cache already in the project).
- Avoid waterfalls: start independent requests together (`Promise.all`) or pass a promise down and `use()`
  it inside `<Suspense>` (React 19).
- Dedupe per request: `fetch` GETs with the same URL/options are memoized during a render; wrap non-fetch
  calls (ORM, SDK) in React `cache()` so `generateMetadata` and the page share one query.
- Call your data layer directly from Server Components. Never `fetch('/api/...')` your own Route Handler
  from the server — extra hop, and relative URLs don't resolve there.
- Paginate and select only needed fields; large lists stream or virtualize on the client.

## Caching and revalidation ([docs](https://nextjs.org/docs/app/guides/caching))

Defaults changed across majors — always confirm against the installed version:

| | v13–14 | v15 | v16 (`cacheComponents: true`) |
|---|---|---|---|
| `fetch` | cached (`force-cache`) | not cached by default | not cached; cache with `"use cache"` |
| GET `route.ts` | static by default | dynamic by default | dynamic; `"use cache"` to cache |
| Client router cache (pages) | 30 s dynamic | 0 s (`staleTimes`) | 0 s |
| Opt-in to cache | default | `cache: 'force-cache'`, `export const revalidate = n`, `unstable_cache` | `"use cache"` + `cacheLife()` + `cacheTag()` |

- Time-based: `export const revalidate = 3600` (segment) or `fetch(url, { next: { revalidate: 3600 } })`;
  v16: `cacheLife('hours')` inside a `"use cache"` scope.
- On-demand: tag reads (`next: { tags: ['orders'] }` / `cacheTag('orders')`) and invalidate after writes:
  `revalidateTag('orders')` (v16: `revalidateTag('orders', 'max')` — second argument required; inside
  Server Actions prefer `updateTag('orders')` for read-your-own-writes), or `revalidatePath('/orders')`.
- `"use cache"` functions: arguments and closed-over values become the cache key — they must be
  serializable; never read `cookies()`/`headers()` inside (read outside, pass values in). Personalized
  data → don't cache it or key it per user explicitly (`"use cache: private"` where available).
- Opt out explicitly when needed: `connection()` (v15+), `cache: 'no-store'`, `export const dynamic =
  'force-dynamic'` (pre-v16 segment config; not used with `cacheComponents`).
- Never cache responses that depend on the user without the user in the key — that is a data leak.

## Server Actions ([docs](https://nextjs.org/docs/app/getting-started/updating-data))

- `'use server'` at the top of a `lib/actions/*.ts` file (or inline in a Server Component). Each exported
  async function becomes a **public POST endpoint** — treat it like an API route.
- Order inside every action: authenticate → authorize the specific resource → validate input → mutate →
  revalidate/redirect.

```ts
'use server';
const Schema = z.object({ title: z.string().min(1).max(120) });
export async function createPost(_prev: State, formData: FormData): Promise<State> {
  const session = await verifySession();              // DAL: throws/redirects if not logged in
  const parsed = Schema.safeParse({ title: formData.get('title') });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };
  await db.post.create({ data: { ...parsed.data, authorId: session.userId } });
  revalidatePath('/posts');
  redirect('/posts');                                 // outside try/catch: it throws by design
}
```

- Client side: `<form action={createPost}>` works without JS (progressive enhancement); `useActionState`
  (React 19; `useFormState` before) for returned errors and pending state; `useFormStatus` in the submit
  button; `useOptimistic` for instant feedback. Disable submit while pending.
- Return expected errors (validation, conflict) as serializable values; throw only for unexpected ones.
  Never return raw exception messages or stack traces.
- Don't trust hidden inputs or bound arguments (`action.bind(null, id)`) — re-check ownership of `id` on
  the server. Closed-over values are encrypted, not trusted.
- Limits: default body 1 MB (`serverActions.bodySizeLimit`); behind proxies/other hosts set
  `serverActions.allowedOrigins`. Actions run sequentially per client — not for parallel data fetching.

## Route Handlers ([docs](https://nextjs.org/docs/app/api-reference/file-conventions/route))

- `app/api/**/route.ts` exporting `GET`/`POST`/… with Web `Request`/`Response` (`NextRequest`/`NextResponse`
  for cookies/rewrites). Use for webhooks, public/mobile APIs, file downloads, OAuth callbacks.
- Validate body/query (Zod), authenticate (session or token), authorize, return correct status codes
  (400/401/403/404/409/422) with a stable error shape; never leak stack traces.
- Webhooks: verify the signature on the **raw** body (`await req.text()`), make handlers idempotent.
- `params` is a promise on v15+: `{ params }: { params: Promise<{ id: string }> }` → `const { id } = await params`.
- Pages Router API routes (`pages/api`) follow the same rules with `req`/`res`.

## Forms ([`next/form`](https://nextjs.org/docs/app/api-reference/components/form), v15+)

- Search/filter forms that navigate (GET): `<Form action="/search">` from `next/form` (prefetch + client
  navigation); mutations: `<form action={serverAction}>`.
- Client validation (HTML `required`, `type`, `pattern`, or the project's form library) is UX only — the
  server validates again with the same schema.
- Show field errors next to fields (`aria-describedby`, `aria-invalid`) and a summary for form-level errors.

## Errors ([docs](https://nextjs.org/docs/app/getting-started/error-handling))

- `error.tsx` per segment (client component with `reset`), `global-error.tsx` for the root layout,
  `not-found.tsx` + `notFound()`. v15.1+ experimental `forbidden()`/`unauthorized()` only if the project enabled them.
- `redirect`, `notFound` and dynamic-API bailouts throw special errors: never catch them generically; if a
  `try/catch` is unavoidable, call `unstable_rethrow(error)` first.
- Log unexpected server errors once (`instrumentation.ts` `onRequestError`, v15+, or the project's
  reporter); production `error.tsx` shows a digest, not the message.
