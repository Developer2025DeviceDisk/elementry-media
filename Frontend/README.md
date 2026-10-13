# Elementry frontend

Next.js App Router, strict TypeScript, Redux Toolkit/RTK Query, Tailwind v4, locally owned shadcn/ui primitives, React Hook Form/Zod, ESLint/Prettier, and Playwright.

Use Node.js 22.14 or newer (Node 22 LTS is configured in CI).

```powershell
cd Frontend
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Open http://localhost:3001. NestJS defaults to port 4000. Add `http://localhost:3001` to the backend `APP_ORIGINS`; start the backend and its configured dependencies separately. Frontend environment files contain public URLs and capability switches only. Never copy `Backend/.env` into this directory. Restart Next.js after changing public environment variables; production values are embedded at build time.

```powershell
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The E2E suite runs against a local HTTP contract fixture and mocked browser API responses, including failure and role cases. Tests use frontend/API ports 3102/4102 and `.next-e2e`, allowing a regular development server to stay open. Live account verification with MongoDB/Redis is covered by [the backend browser checks](../Backend/docs/customer-account.md).

## Architecture

- `app`: server route shells, metadata, layouts, and boundaries. Public product catalog and detail pages render on the server.
- `store/api`: one base API, injected domain endpoints, credentials/CSRF handling, and targeted invalidation. All backend communication goes through RTK Query, including server catalog reads.
- `store/slices`: client UI/session metadata only. User, cart, products, orders, and admin records live in RTK Query caches.
- `features`: focused interactive screens. `components`: shared accessible UI and domain components.
- `lib/validations`: schemas; `types`: API contracts; `config/env.ts`: validation of public environment values.
- Stores are created per provider/request; there is no process-global user store. Authenticated data is queried on the client and never placed in a public SSR cache. Server data props are request snapshots, not another Redux server-state slice.
- Authenticated screens gate rendering with `/auth/me`; NestJS must enforce authentication, ownership, roles, and permissions independently.
- URL parameters own applied search/filter state. Redux only owns the mobile filter panel UI. Search suggestions use a 300 ms debounce; search and sorting happen in NestJS/OpenSearch.
- RTK Query mutations expose sanitized errors. No raw backend messages, stack traces, or automatic mutation retries are shown.
- Monetary values are backend decimal strings; `Intl.NumberFormat` is used only to display them.

Customers land on `/account` after login and can access all eight sections. Profile, orders, wishlist, addresses, saved UPI details, tracking, return/refund records and settings use implemented backend APIs independently of commerce flags. Read [API contracts and missing backend work](docs/api-contracts.md) before enabling separate cart/checkout, advanced search, recovery or admin capabilities.

## Development conventions

Use `useAppDispatch` and `useAppSelector`. Add endpoints with `baseApi.injectEndpoints` and invalidate entity/list tags that actually changed. Avoid copying API results into slices. Keep ordinary forms and one-screen state local. Add approved remote image domains before using storage-hosted images. Use shadcn's CLI to add components; the checked-in components are locally owned and configured in `components.json`.

Production requires HTTPS origins/cookies, backend authorization, a provider sandbox verification run, real image assets, and completed API contracts. The current public catalog uses SSR because the backend marks responses `no-store`; do not introduce ISR for private or user-specific data. Use pagination and a backend sitemap cursor for larger catalogs.
