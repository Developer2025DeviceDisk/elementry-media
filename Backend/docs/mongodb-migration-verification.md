# MongoDB migration verification

Verified on 2026-10-13 against the supplied MongoDB Atlas cluster.

- Atlas connection succeeded. Application database: `elementry`.
- Deployed `users`, `products`, `orders`, `orderItems` with strict validators and unique/query indexes.
- Replaced the Prisma/PostgreSQL runtime and removed its dependencies and migration commands. Clean builds remove stale compiled database modules.
- Preserved the frontend API contract: UUID `id`, decimal-string prices, ISO timestamps, cookie/CSRF authentication, RTK Query transport.
- Backend unit/HTTP tests: 52 passed across 10 suites.
- Combined integration run: 19 passed across two suites. Seven API checks use real MongoDB Atlas and the configured Redis service to verify CSRF/session rotation, registration/login/logout, replay revocation, duplicate accounts, catalog/search/pagination, schema constraints, role/disabled-account changes, health, and concurrent atomic rate counts. Twelve MongoDB checks cover persistence, cache fallback, monetary boundaries, order snapshots, transactional import/rollback, and startup protection.
- One MongoDB-only HTTP test retains a Redis service double; the full API integration suite uses the real service. Test records are removed from isolated test databases and Redis namespaces; no demo data was inserted into the application database.
- Frontend type check, 19 unit tests and production build passed. Backend type check/build passed. Production dependency audit found no vulnerabilities.

The supplied Redis endpoint is configured in `Backend/.env`. MongoDB and Redis connection checks both succeeded. Normal API startup with the application configuration succeeded; readiness and catalog requests returned HTTP 200. Credentials remain only in the ignored backend environment file. Redis handles shared sessions, rate limiting and catalog caching.

Live browser checks passed in desktop Chromium and a mobile Chromium context using the production frontend build, real NestJS API, MongoDB Atlas and Redis. Verified registration, persisted customer/password hash, HttpOnly cookie, expiring Redis session, session survival after reload, logout/replay rejection, login, catalog search/empty state and product detail. These checks used an isolated test database and Redis namespace; temporary servers and test records were cleaned up afterward. Run `node --env-file=.env scripts/check-live-browser.cjs` with Node 22.14+ to repeat them after building both apps.

Existing PostgreSQL records were not copied because no source data export was supplied. The read-only legacy export and transactional MongoDB importer are documented in `Backend/README.md`; synthetic imports and rollback were verified on Atlas.

Cart, checkout, payments, admin mutations and password recovery were absent from the original backend and remain outside the database migration. Their frontend capability flags remain disabled.

The subsequent customer account implementation is verified separately in [Customer account dashboard](customer-account.md). It adds profile editing, owned order reads/cancellation/returns, wishlist, addresses, saved UPI methods, tracking, refund records and account security while keeping cart/checkout and provider transfers separate.
