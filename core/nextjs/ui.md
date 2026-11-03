# Next.js UI — performance, accessibility, metadata, styling

Entry: [`../nextjs.md`](../nextjs.md). Version deltas: [`versions.md`](versions.md).

## Core Web Vitals ([docs](https://nextjs.org/docs/app/guides/production-checklist))

- **LCP**: the hero image is a `next/image` with `priority` (v16: `preload`) and correct `sizes`; data for
  above-the-fold content comes from the server, not a client fetch after hydration.
- **CLS**: every image/video/embed reserves space (`width`/`height` or `fill` in a sized parent);
  skeletons match final dimensions; fonts via `next/font` (self-hosted, `size-adjust`, no layout shift).
- **INP**: keep handlers light; heavy work off the main thread or deferred (`useTransition`,
  `useDeferredValue`); avoid re-rendering large trees on each keystroke.
- Measure, don't guess: `next build` output (route sizes, static/dynamic), `@next/bundle-analyzer` if the
  project has it, `useReportWebVitals` / the host's analytics. Without a measurement, a perf claim is a hypothesis.

## Bundle discipline

- Every `"use client"` module and its imports ship to the browser — keep them small; import only what you
  use (`import { debounce } from 'lodash-es'`, not the whole library).
- `next/dynamic(() => import('./Chart'), { ssr: false })` (inside a Client Component) for heavy,
  below-the-fold or browser-only widgets; show a sized placeholder.
- Third-party scripts with `next/script` (`strategy="afterInteractive"` / `"lazyOnload"`), or
  `@next/third-parties` for common embeds (GTM, YouTube, Maps) when the project uses it.
- No new dependency for what the platform does: `<dialog>`, `<details>`, `<input type="date">`,
  `Intl.DateTimeFormat`/`Intl.NumberFormat`, CSS `:has()`/container queries, `structuredClone`.

## Images and fonts

- `next/image`: local imports get width/height automatically; remote ones need dimensions and a matching
  `images.remotePatterns` entry (`domains` is deprecated). `fill` requires `sizes` and a positioned parent.
- Meaningful images: `alt` describes the content; decorative: `alt=""`.
- `next/font/google` or `next/font/local` at module scope, applied via `className`/CSS variable in the root
  layout; one instance per font, reused.

## Accessibility (WCAG 2.2 AA as the default target)

- Semantic elements first: `<button>` for actions, `<a>`/`<Link>` for navigation, `<label>` for every input,
  headings in order, landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`). ARIA only to fill gaps.
- Keyboard: everything interactive is focusable and operable; visible focus (`:focus-visible`); no
  positive `tabIndex`; modals trap and restore focus (`<dialog>` or the project's accessible primitives —
  Radix/React Aria/shadcn).
- Forms: errors associated with fields (`aria-describedby`, `aria-invalid`), announced on submit
  (live region or focus the summary); don't rely on color alone.
- Next.js announces route changes by default (route announcer) — keep a unique `<title>`/`<h1>` per page.
- Respect `prefers-reduced-motion`; contrast ≥ 4.5:1 for text; `lang` on `<html>`.
- Verify: Testing Library role queries in unit tests already enforce names/roles; `@axe-core/playwright`
  in e2e when the project has it; `eslint-plugin-jsx-a11y` comes with `eslint-config-next`.

## Metadata and SEO ([docs](https://nextjs.org/docs/app/getting-started/metadata-and-og-images))

- `export const metadata` or `generateMetadata()` in layouts/pages (App Router); `title.template` in the
  root layout; `metadataBase` set once so relative OG URLs resolve. `viewport`/`themeColor` go in
  `export const viewport` (v14+), not in `metadata`.
- `generateMetadata` sharing data with the page: use the same cached data function (React `cache()`).
- File conventions: `opengraph-image.tsx` (`ImageResponse` from `next/og`), `icon`, `sitemap.ts`,
  `robots.ts`, `manifest.ts`.
- Private/auth pages: `robots: { index: false }`. Canonical URLs via `alternates.canonical`.
- Pages Router: `next/head` per page.

## Styling

- Follow the project's system (Tailwind, CSS Modules, a CSS-in-JS that supports RSC, the UI kit). Don't
  introduce a second one.
- Global CSS only in the root layout (`app/layout.tsx` / `_app.tsx`); component styles colocated
  (`*.module.css`) or utility classes.
- Runtime CSS-in-JS that needs React context (styled-components, Emotion) works only in Client Components
  and needs the registry setup — prefer zero-runtime options in new code if the project allows.
- Design tokens (colors, spacing, radius) from the theme/variables, not hard-coded values; dark mode via the
  project's mechanism (CSS variables / `class` strategy).

## Internationalization

- Follow the project's i18n setup (`[locale]` segment + middleware/proxy, `next-intl`, etc.). App Router has no
  built-in `i18n` config (Pages Router does). Never hard-code user-facing strings in a translated project.
- Format dates, numbers and currencies with `Intl` using the active locale; beware server/client
  timezone differences causing hydration mismatches (format on one side, or pass the timezone).

## Hydration

- Server and first client render must match: no `Date.now()`, `Math.random()`, `window`/`localStorage`
  reads or locale-dependent formatting during render of Client Components. Read browser-only values in
  `useEffect` or render the widget client-only.
- `suppressHydrationWarning` only for known, harmless cases (e.g. theme attribute on `<html>`).
- Invalid HTML nesting (`<div>` in `<p>`, `<a>` in `<a>`) causes hydration errors — fix the markup.
