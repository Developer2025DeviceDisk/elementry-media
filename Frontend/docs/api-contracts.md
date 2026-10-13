# API integration status

All HTTP requests live in the injected RTK Query services. The frontend never connects directly to MongoDB or Redis. Server catalog reads also dispatch those services, using isolated stores and request-scoped React caching. Public catalog pages use SSR: the backend currently sets `Cache-Control: no-store`; ISR should be introduced only with an agreed public cache and revalidation policy. MongoDB uses UUID strings as document IDs and returns the existing `id` and decimal-string price contract.

## Implemented in this checkout

Base: `NEXT_PUBLIC_API_URL` (local backend default: `http://localhost:4000/api/v1`).

Customer accounts are wired at `/account`, with profile, orders, wishlist, addresses, saved UPI methods, tracking, return/refund records and settings. Login/register open the dashboard; legacy links redirect into it. `accountApi` injects endpoints into the existing RTK Query base API. These features do not depend on the commerce flag. See [customer account API details](../../Backend/docs/customer-account.md) for routes, ownership and operations. Shipping events and externally reconciled refunds are recorded by administrators; payment transfers and saved cards await provider selection.

| Endpoint                         | Contract                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| GET /auth/csrf                   | `{ csrfToken: string }`, creates session cookie                                                        |
| POST /auth/register              | `{ name, email, password }` → `{ user, csrfToken }`                                                    |
| POST /auth/login                 | `{ email, password }` → `{ user, csrfToken }`                                                          |
| POST /auth/logout                | 204, clears session                                                                                    |
| GET /auth/me                     | `{ user: { id, name, email, role } }`                                                                  |
| GET /products?page=1&limit=12&q= | `{ data: Product[], page, limit }`; optional q searches name, SKU and description (max 100 characters) |
| GET /products/:uuid              | `Product` (price serialized as a decimal string)                                                       |

The backend uses rolling Redis-backed HttpOnly sessions, not JWT refresh tokens. `refreshSession` revalidates `/auth/me`; a 401 expires the UI session without automatically replaying mutations. CSRF bootstrap runs before writes and every write sends `X-CSRF-Token`. Login/register rotate that token. Logout and identity changes clear query caches and checkout drafts. No credentials are persisted in localStorage. A production auth deployment must configure exact CORS origins and cookie settings in NestJS. Backend authorization and CSRF checks remain authoritative.

Products do not yet have slug, image, brand, category, rating, or variant fields. URLs currently use `/products/product-name--uuid`, resolved through the implemented UUID endpoint. An optional canonical backend `slug` is supported via `/products/slug/:slug`. Do not remove UUID suffixes until this endpoint exists. Only same-origin product images are accepted; add an explicit `next/image` host allowlist and update image validation when a storage contract exists. No fabricated product data is displayed.

## Elementry Media storefront

The provided HTML theme is implemented as native Next.js components with the existing RTK Query transport. Its generated demo products and localStorage cart are not imported. Homepage and product detail reads use the real public catalog; search on `/products?q=` supports name, SKU, and description independently of the advanced search capability flag. Advanced filters, suggestions, brand/category fields, and checkout still require the proposed contracts below. The wishlist is available through the account APIs. Header cart controls remain gated by commerce. Marketing copy and statistics come from the supplied reference, not database counts. Illustrations use local icons because the reference contains image placeholders.

Local development uses frontend `http://localhost:3001` and API `http://localhost:4000/api/v1`. Include `http://localhost:3001` in backend `APP_ORIGINS` for credentialed browser requests. Keep database and Redis credentials in `Backend/.env`.

## Proposed contracts: not implemented in NestJS yet

These services and corresponding UI flows are provided as integration scaffolding. Their flags default to **false**. Enabling a flag does not implement an API. Implement and validate every relevant backend contract first.

| Flag                                    | Endpoints required                                                                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SEARCH_API_ENABLED`        | GET /products supporting q/category/brand/minPrice/maxPrice/rating/sort; GET /search/suggestions?q=; GET /categories; GET /categories/slug/:slug |
| `NEXT_PUBLIC_COMMERCE_API_ENABLED`      | Cart/checkout, order creation, provider payments and reviews listed below                                                                        |
| `NEXT_PUBLIC_ADMIN_API_ENABLED`         | All /admin endpoints listed below with enforced ADMIN role                                                                                       |
| `NEXT_PUBLIC_PASSWORD_RECOVERY_ENABLED` | POST /auth/forgot-password, POST /auth/reset-password                                                                                            |

Additional public catalog services: GET `/products/featured`, `/products/:id/related`, and `/products/slug/:slug`. Featured/related services are unused until supported. The home page shows the latest product page, rather than labelling products as backend-selected featured items.

### Commerce

- GET /cart → `Cart`; POST /cart/items `{ productId, quantity, variantId? }`; PATCH /cart/items/:id `{ quantity }`; DELETE /cart/items/:id; DELETE /cart. Mutations return the canonical Cart and invalidate only Cart.
- POST /cart/coupon `{ code }`; DELETE /cart/coupon → Cart. These services are available for coupon UI integration.
- Wishlist read/add/remove endpoints are implemented independently of the commerce flag. Profile editing uses `PATCH /account/profile` with `{ name, phone }`.
- Order read/cancel/return endpoints are implemented under `/account/orders`, with `/orders` aliases. Their purchase snapshot contract is `CustomerOrder` in `src/types/account.ts`.
- `POST /orders` for checkout creation remains proposed. It must enforce authoritative totals, ownership, transactions, inventory and idempotency; reusing a key with different input must return 409. Checkout/admin scaffolding in `src/types/order.ts` must be mapped to the purchase snapshot contract when these APIs are implemented.
- POST /payments/session `{ orderId }` → `{ id, orderId, checkoutUrl }`; POST /payments/verify `{ orderId, paymentId }` → `{ verified, orderId }`. Backend chooses provider, verifies signatures/webhooks, checks payment amount/currency and ownership, and confirms the order. Session creation must also be idempotent for each order. Hosted provider redirects are validated against `lib/constants/payment.ts`. Configure provider success callback to `/checkout/success?orderId=...&paymentId=...`. Browser return parameters never prove payment success. Secrets belong only in NestJS.
- GET /products/:id/reviews?page=&limit= → PageResult<Review>; POST same path `{ rating, comment }` → Review. Backend validates purchase eligibility/moderation as needed.
- Cart totals `{ subtotal, discount, tax, shipping, total, currency }` are decimal strings calculated by NestJS. The checkout summary is the cart estimate; address-dependent shipping and tax must be reconciled in the backend order/payment provider before charging. Add a backend quote endpoint and UI confirmation if final prices can materially differ.

### Admin

- GET /admin/dashboard → `{ revenue, currency, orders, customers, lowStock }`.
- GET /admin/products?page=&limit=&q= → PageResult<Product>; POST /admin/products → Product; PATCH/DELETE /admin/products/:id. Payload: ProductInput in `src/types/product.ts`.
- GET /admin/orders?page=&limit=&status= → PageResult<Order>; PATCH /admin/orders/:id `{ status }`. Enforce allowed status transitions and verified payment state in the backend.
- PATCH /admin/inventory/:id `{ stock }` → Product. Inventory list uses the paginated admin products endpoint.
- GET/POST /admin/categories → Category[]/Category.
- GET /admin/customers?page=&limit= → PageResult<User>.
- GET/POST /admin/coupons → Coupon[]/Coupon.
- GET /admin/reviews?page=&limit= → PageResult<Review>; DELETE /admin/reviews/:id.
- GET /admin/analytics → `{ date, revenue: number, orders: number }[]`. Numbers here are chart values, not authoritative money calculations.

All collections should add `total` to PageResult when available. Current pagination uses a full-page heuristic because the implemented catalog has no total count. For large catalogs, add a cursor or dedicated sitemap export API; the sitemap currently stops at 49,900 product URLs to stay within protocol limits. Add category sitemap entries when categories exist.

Password recovery must use expiring single-use tokens and non-enumerating responses. No speculative `/auth/refresh` call is made against this session backend.
