# Next.js config, security and operations

Entry: [`../nextjs.md`](../nextjs.md). Version deltas: [`versions.md`](versions.md).

## Environment variables ([docs](https://nextjs.org/docs/app/guides/environment-variables))

- Load order: `process.env` → `.env.$(NODE_ENV).local` → `.env.local` (not in `test`) → `.env.$(NODE_ENV)` →
  `.env`. `.env*.local` is gitignored; `.env.example` lists keys without values.
- **`NEXT_PUBLIC_*` is public**: inlined into the client bundle at **build** time. Never put secrets there;
  changing it requires a rebuild (one Docker image for many environments → read config at runtime on the
  server and pass it down, or use a runtime config endpoint).
- Server-only vars are available in Server Components, actions, route handlers, `instrumentation.ts`;
  in a Client Component they are `undefined`, not an error — another reason to centralize.
- Validate once at startup and export a typed object (`src/env.ts` with Zod or `@t3-oss/env-nextjs`);
  everything else imports from it. `process.env` only in config paths ([`../quality.md`](../quality.md)
  `configPaths`). Dynamic access (`process.env[name]`) is never inlined on the client.
- `next.config.(js|mjs|ts)` holds framework config, not app config; `serverRuntimeConfig`/
  `publicRuntimeConfig` are legacy (removed in v16) — use env vars.

## Server/client boundary hygiene ([docs](https://nextjs.org/docs/app/guides/data-security))

- Data Access Layer: one server-only module per domain does auth check + query + returns a minimal DTO.
  Pages/actions/route handlers call it; components never import the DB client.
- `import 'server-only'` in the DAL, secrets and SDK clients; optional `experimental.taint`
  (`taintObjectReference`, `taintUniqueValue`) as a second safety net, not the primary control.
- Everything passed to a Client Component lands in the HTML/RSC payload — treat props as public output.
- Server Actions are public POST endpoints (see [`data.md`](data.md)): validate and authorize in each one;
  unused actions are tree-shaken and IDs are unguessable (v14+/15), but that is not access control.

## Authentication & authorization ([docs](https://nextjs.org/docs/app/guides/authentication))

- Use the project's auth library (Auth.js, Clerk, Better Auth, Supabase, custom JWT session). Don't roll a
  new one inside a feature task.
- Sessions: `httpOnly`, `secure`, `sameSite=lax` (or stricter) cookies; encrypt/sign stateless sessions
  (e.g. `jose`); short expiry + rotation; delete on logout.
- **Middleware/proxy is not the security boundary**: use it for optimistic redirects (reading the cookie
  only, no DB calls on every request). Enforce auth/authorization in the DAL, Server Actions and Route
  Handlers. (CVE-2025-29927 bypassed middleware-only auth via `x-middleware-subrequest` — patched in
  12.3.5/13.5.9/14.2.25/15.2.3; keep `next` on a patched release.)
- Layouts don't re-render on navigation — an auth check only in a layout doesn't protect child pages
  or actions; check in the page/DAL.
- Authorization per object (user owns the resource / tenant matches) in the DAL or action, not only in UI
  (hiding a button is not authorization). Return 401 vs 403 correctly; don't reveal whether an account exists.
- Hash passwords with `argon2`/`bcrypt` if the app stores them; constant-time comparison for tokens.

## HTTP hardening

- Security headers in `next.config` `headers()` or middleware/proxy: `Content-Security-Policy`,
  `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
  `Permissions-Policy`, `frame-ancestors` (CSP) / `X-Frame-Options`. `poweredByHeader: false`.
- CSP with nonces ([docs](https://nextjs.org/docs/app/guides/content-security-policy)): generate the nonce in
  middleware/proxy and read it with `headers()` — this makes pages dynamic; accept it or use a hash/static
  policy for static sites.
- XSS: React escapes by default; `dangerouslySetInnerHTML` only with sanitized HTML (DOMPurify/
  `sanitize-html`); never put user input in `href` without allowing only `http(s):`/`mailto:` schemes.
- Images: tight `images.remotePatterns` (protocol + hostname + pathname); the optimizer is a proxy — an
  open pattern lets anyone use your server to fetch arbitrary URLs.
- Redirects from user input (`?next=`) only to same-origin relative paths.
- Rate limit login, signup, OTP, contact forms and expensive actions (host WAF, Upstash/Redis, the
  project's limiter) — Server Actions included.
- CSRF: Server Actions compare `Origin` to `Host` (configure `allowedOrigins` behind proxies); custom
  Route Handlers using cookie auth need their own CSRF protection for state-changing methods.
- Dependencies: keep `next`, `react`, `react-dom` on patched releases — RSC had critical advisories
  (e.g. CVE-2025-55182, Dec 2025, fixed in patched 15.x/16.0.x releases). `npm audit` in CI if the project has it.

## Logging and observability ([docs](https://nextjs.org/docs/app/guides/instrumentation))

- Server: structured logger (pino or the project's) — no `console.log` in committed code; never log
  tokens, cookies, passwords or full request bodies.
- `instrumentation.ts` (stable v15) `register()` for OpenTelemetry (`@vercel/otel` or SDK) and
  `onRequestError` (v15+) to report server errors once with route context.
- Client: errors to the project's reporter (Sentry etc.) from `error.tsx`/`global-error.tsx`; Web Vitals via
  `useReportWebVitals` or the host's analytics.
- `after()` (v15.1+ stable) for logging/analytics work that must not delay the response.

## Build, deploy, runtime

- Node.js runtime by default; Edge runtime (`export const runtime = 'edge'`) only when the project uses it
  and every dependency supports it (no Node APIs). v16 `proxy.ts` runs on Node.js.
- Self-hosting: `output: 'standalone'` for Docker; configure a shared cache handler if running more than
  one instance with ISR/`"use cache"`; set `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` consistently across
  instances. Static export: `output: 'export'` (no server features).
- Health/readiness on self-hosted deployments: a lightweight `app/api/health/route.ts` (dynamic, no auth,
  no secrets in the body).
- `next build` is a gate: type errors, invalid server/client imports and prerender failures surface there.
