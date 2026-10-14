# Elementry commerce backend

NestJS with the official MongoDB Node.js driver and Redis. Persistent users, products, orders and order items live in MongoDB. Redis continues to handle sessions, atomic rate limits and catalog caching. Node 22 LTS is recommended; the backend supports Node 20.9+.

Product brands are supported in MongoDB, catalog filters, detail pages and wishlists. The storefront lists the 43 store-supplied brands and official websites. See [brand setup and maintenance](docs/product-brands.md).

The customer account area is documented in [Customer account dashboard](docs/customer-account.md): profile, owned orders, wishlist, addresses, saved UPI methods, shipping, return/refund records, preferences and password/session security. Run `npm run db:setup` after upgrading to deploy its collections and indexes.

## Setup

From `Backend`:

```sh
npm ci
# First setup only: copy .env.example to .env and generate SESSION_SECRET.
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# Optional local services; skip MongoDB if using Atlas or the installed server.
docker compose up -d
npm run db:setup
npm run db:check
npm run start:dev
```

Do not overwrite an existing `.env`. On PowerShell, `Copy-Item .env.example .env` creates the initial configuration. If local MongoDB already occupies port 27017, start only `docker compose up -d redis`. On Windows without Docker, Redis documents [Memurai and WSL setup](https://redis.io/docs/latest/operate/oss_and_stack/install/archive/install-redis/install-redis-on-windows/).

- `MONGODB_URI`: Atlas `mongodb+srv://USER:URL_ENCODED_PASSWORD@CLUSTER.mongodb.net/?retryWrites=true&w=majority` or local `mongodb://127.0.0.1:27017`. Atlas must allow the backend's network address. Production requires TLS with certificate verification.
- `MONGODB_DATABASE`: explicit application database, default `elementry`. The database selection is independent of the URI path.
- `REDIS_URL`: local `redis://127.0.0.1:6379`; authenticated `rediss://` in production.
- `REDIS_PREFIX`: unique per environment. The MongoDB transition uses a new prefix so old catalog entries and sessions are not reused.
- `APP_ORIGINS`: exact frontend origins; include `http://localhost:3001` for local development. Production requires HTTPS.
- `SESSION_SECRET`: at least 32 random characters; store only on the backend.
- `COOKIE_SAME_SITE`: `lax` for same-site deployments; `none` only with production HTTPS.
- `TRUST_PROXY`: exact trusted ingress addresses/CIDRs; leave empty without a proxy.

The frontend still uses RTK Query and `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1`. Never place MongoDB or Redis credentials in frontend environment variables.

## Schema and deployment

`npm run db:setup` deploys idempotent collection validators and indexes. Use a schema deployment credential with collection/index management permissions; the runtime identity needs only application read/write access and permission to inspect collections/indexes. The application connects, pings and verifies validators and required unique indexes at startup; it fails if setup is missing and never modifies schema itself.

Collections:

| Collection | Constraints |
| --- | --- |
| `users` | UUID `_id`, normalized unique email, customer/admin role, password hash, nullable disabled timestamp |
| `products` | UUID `_id`, unique SKU, Decimal128 price with at most 2 decimal places, nonnegative integer stock, catalog index |
| `orders` | UUID `_id`, user UUID, status enum, Decimal128 total, unique idempotency key, history/status indexes |
| `orderItems` | UUID `_id`, order/product UUIDs, positive integer quantity, Decimal128 unit price, unique order/product pair, immutable snapshot fields |

UUID string IDs preserve existing API links. BSON `_id` is mapped to API `id`; Decimal128 money is serialized through exact decimal arithmetic as two-decimal strings. Timestamps remain ISO strings. Validators reject invalid document types, negative values, fractional quantities and unsupported monetary precision.

MongoDB does not provide PostgreSQL foreign keys or delete cascades. Future order writes must check references and reserve inventory inside MongoDB transactions; user/product deletion must protect referenced order history. Multi-document transactions require Atlas or a replica set. The supplied standalone local MongoDB is enough for existing account/catalog APIs; it does not enable checkout.

Run schema setup once before deploying API instances. For an existing MongoDB database, review records against validators before setup. Index creation fails on duplicates rather than silently dropping them. Build the supplied Dockerfile or run `npm ci`, `npm run build`, `npm start`. Inject runtime secrets, use HTTPS ingress, and configure trusted proxies. Readiness checks MongoDB and Redis; liveness remains independent of both.

The production image contains compiled code and setup scripts. With deployment environment variables already injected, run `node scripts/setup-mongodb.cjs` in a release job and `node scripts/check-connections.cjs` for a read-only check. The npm convenience commands rebuild first and require a source checkout with development dependencies.

## Existing PostgreSQL data

The switch changes code and configuration; it does not automatically copy a previous database. To preserve existing records, pause writes and export the old four tables with `scripts/export-legacy-postgresql.sql` using a trusted PostgreSQL connection. Save the result as `Backend/migration-data/export.json` (ignored by Git). It contains password hashes and must remain private.

```sh
psql "$LEGACY_DATABASE_URL" -X -A -t -f scripts/export-legacy-postgresql.sql -o migration-data/export.json
npm run db:import -- migration-data/export.json
npm run db:import -- migration-data/export.json --apply
```

The first import command validates without writing. The apply command requires an empty destination and an Atlas/replica-set transaction. It preserves IDs, password hashes, roles, timestamps, money and order snapshots; it validates uniqueness and references before writing. Failed imports roll back atomically. Keep the original database intact until counts and application behavior are verified. The runtime has no PostgreSQL dependencies.

## API and security

Base: `http://localhost:4000/api/v1`.

| Method | Route | Access |
| --- | --- | --- |
| GET | `/health/live`, `/health/ready` | Public |
| GET | `/auth/csrf` | Public, creates CSRF session |
| POST | `/auth/register`, `/auth/login` | Public plus CSRF |
| GET | `/auth/me` | Authenticated |
| POST | `/auth/logout` | CSRF, destroys current session |
| GET | `/products?page=1&limit=20&q=` | Public active catalog, maximum limit 100 |
| GET | `/products/:uuid` | Public active product |

Login/registration regenerate the session and CSRF token; send the returned token as `X-CSRF-Token` for subsequent writes. Cookies are HttpOnly and secure in production. Scrypt password hashes, idle/absolute expiry, exact CORS origins, DTO validation and request limits remain enforced. Current roles and disabled status are loaded from MongoDB on each authenticated request. Duplicate email/SKU errors return generic 409 responses without database details. Logs and connection checks never print credentials.

Search is a case-insensitive literal substring of name, SKU or description, with separate cache entries and stable timestamp/UUID ordering. MongoDB is authoritative; Redis cache failures fall back to MongoDB. Sessions and rate limits fail closed on Redis failure. Cache entries expire after configured TTL plus up to 10% jitter. Redis uses atomic Lua counters, shared sessions and environment namespaces; no application-wide flush operations are used.

## Verification

```sh
npm run typecheck
npm test
npm run build
npm run db:check
npm audit --omit=dev --audit-level=high
```

Real integration tests require MongoDB and Redis. Always use an isolated test database:

```powershell
$env:TEST_MONGODB_URI = 'mongodb://127.0.0.1:27017'
$env:TEST_MONGODB_DATABASE = 'elementry_test'
$env:TEST_REDIS_URL = 'redis://127.0.0.1:6379'
npm run test:integration
```

For MongoDB-only integration checks while Redis is being configured, set `TEST_MONGODB_URI` and run `npm run test:mongodb`. This verifies real persistence and catalog cache fallback; it does not verify the deployed Redis session store.

Atlas tests include transactional imports and rollback. For a local replica set, set `TEST_MONGODB_TRANSACTIONS=true` to enable those checks. Standalone local MongoDB skips that test because transactions are unavailable. CI starts a single-node replica set and runs the transaction test.

If the database name is omitted, tests generate a unique `elementry_test_...` database. The suite deploys its test schema, creates/deletes only its own records and a random Redis namespace, and never drops an entire database. CI runs these checks using MongoDB and Redis services. Integration coverage includes registration/login/logout, CSRF/session rotation, duplicate accounts, persistence, disabled users and role changes, Decimal128 prices, search/pagination, schema constraints, readiness and atomic rate counting.

For real-service browser checks, follow the isolated build commands in [Customer account dashboard](docs/customer-account.md), then run `node --env-file=.env scripts/check-live-browser.cjs` from `Backend` with Node 22.14+. The script checks desktop/mobile account actions on ports 3101/4201, then removes its isolated MongoDB records and Redis namespace. It requires frontend Playwright and installed Chromium.

Customer order read/cancel/return controllers and account routes are implemented. Cart, checkout/order creation, provider payments, product administration and password recovery remain separate commerce work. Their flags stay disabled; account features operate independently.
