# Next.js testing — unit, component, e2e

Entry: [`../nextjs.md`](../nextjs.md). Method: tests first, failing, per [`../workflow.md`](../workflow.md);
copy the golden component/e2e test of the project ([`../golden-files.md`](../golden-files.md)).
Official guide: <https://nextjs.org/docs/app/guides/testing>.

## Runners

- Use the project's runner and config. Vitest (`@vitejs/plugin-react`, `jsdom`/`happy-dom`,
  `vite-tsconfig-paths` for aliases) or Jest via `next/jest` (SWC transform, loads `.env`, mocks CSS/images).
  Don't switch runners inside a feature task.
- E2E: Playwright (default in the Next docs) or Cypress if the project already uses it.
- Files: `*.test.ts(x)` next to the source or in `__tests__/`; e2e in `e2e/` or `tests/` — follow the project.

## What to test where

| Code | Test |
|---|---|
| Pure functions, schemas, mappers, hooks without Next APIs | Unit (fast, no DOM when possible) |
| Client Components, sync Server Components | Component test with Testing Library |
| Server Actions, data functions, Route Handlers | Unit: call the function with mocked `next/headers`, `next/cache`, auth and DB/HTTP boundary |
| **Async Server Components**, pages, layouts, middleware/proxy, routing, caching | E2E (unit runners don't support async RSC) |
| A user flow across server and client | At least one E2E (happy path + main failure) |

## Component tests ([Testing Library](https://testing-library.com/docs/queries/about#priority))

- Query like a user: `getByRole('button', { name: /save/i })`, `getByLabelText`, `getByText`; `getByTestId`
  only as a last resort. If a role query can't find it, the markup is probably inaccessible — fix the markup.
- Interact with `@testing-library/user-event` (`await user.click(...)`, `await user.type(...)`), not `fireEvent`.
- Async UI: `await screen.findBy…` / `waitFor`; never fixed sleeps.
- Assert visible behavior: text, roles, enabled/disabled, `aria-invalid`, navigation called — not state
  variables, class names or hook internals. No snapshot tests as the only assertion.
- Cover: renders data · loading/empty/error states · validation messages · pending/disabled while
  submitting · keyboard path for the main action.

```tsx
it('shows a field error and keeps the form editable when the title is empty', async () => {
  const user = userEvent.setup();
  render(<NewPostForm action={vi.fn().mockResolvedValue({ errors: { title: ['Required'] } })} />);
  await user.click(screen.getByRole('button', { name: /publish/i }));
  expect(await screen.findByText('Required')).toBeVisible();
  expect(screen.getByLabelText(/title/i)).toHaveAttribute('aria-invalid', 'true');
});
```

## Mocking Next.js APIs

- `next/navigation` (`useRouter`, `usePathname`, `useSearchParams`) needs a mock in unit tests
  (`vi.mock('next/navigation', …)` or `next-router-mock`); assert `push` was called with the exact URL.
- `next/headers` (`cookies`, `headers`) and `next/cache` (`revalidatePath`, `revalidateTag`, `updateTag`)
  mocked in Server Action tests; assert revalidation was called with the right path/tag.
- `redirect`/`notFound` throw: assert with `await expect(action(...)).rejects.toThrow()` and check the mocked
  call (or the `NEXT_REDIRECT` digest), never let them silently pass.
- Network: mock at the boundary you own (the data/API client) or with MSW handlers; never call real third parties.
- `server-only` imports fail in jsdom — alias it to an empty module in the test config if the project does so.

## Server Action / Route Handler tests

```ts
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/auth', () => ({ verifySession: vi.fn().mockResolvedValue({ userId: 'u1' }) }));

it('rejects a post for another user’s project', async () => {
  db.project.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'u2' });
  await expect(createPost(initial, form({ projectId: 'p1', title: 'x' }))).resolves.toEqual({ error: 'forbidden' });
  expect(db.post.create).not.toHaveBeenCalled();
});
```

- Cases: unauthenticated · unauthorized resource · invalid input (exact field errors) · success (DB call
  arguments + revalidation + redirect) · upstream failure (error value, nothing half-written).
- Route Handlers: build a `Request`/`NextRequest`, call `GET`/`POST` directly, assert status, headers and JSON body.

## E2E with Playwright ([docs](https://nextjs.org/docs/app/guides/testing/playwright))

- `webServer` in `playwright.config` runs the app; prefer `next build && next start` in CI (production
  behavior: caching, prefetching, no dev overlays), dev server locally if the project does.
- Selectors: `page.getByRole`, `getByLabel`, `getByText`; web-first assertions (`await expect(locator).toBeVisible()`)
  — no `waitForTimeout`.
- Isolated data: seed via API/DB fixture per test or per worker; each test independent and order-free.
- Auth: log in once with `storageState` per role; still test the login flow itself once.
- Cover per touched page/flow: happy path, validation failure, unauthorized access (redirect/403),
  not-found, and the resulting state after a mutation (reload shows it — catches missing revalidation).
- Mock third parties with `page.route` or a fake server; never hit production services.
- Accessibility smoke: `@axe-core/playwright` on touched pages when the project has it.

## Coverage & gates

- Coverage via the runner (`vitest --coverage` / `jest --coverage`); thresholds from the project's config and
  gates. Async Server Components covered by e2e won't show in unit coverage — don't add fake unit tests to
  inflate numbers; exclude `app/**/page.tsx`/`layout.tsx` only if the project already does.

## Mapping to the method

| Method step | Next.js artifact |
|---|---|
| Test cases from the plan | One `describe` per behavior; titles state the rule |
| Failing tests first | Component test for UI, unit test for action/handler, e2e for each new page/flow |
| Minimal code | Server Component page + client leaf + action/DAL function |
| Done checklist | Unit + e2e green, `next build` green, no `only`/`skip` |
