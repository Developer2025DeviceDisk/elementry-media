# Customer account dashboard

Customers land on `/account` after signing in or registering. Navigation includes My Profile, My Orders, Wishlist, Saved Addresses, Payment Methods, Order Tracking, Returns and Refunds, and Account Settings. Legacy `/profile`, `/orders` and `/wishlist` links redirect into the account area.

Data comes from authenticated NestJS endpoints through the existing RTK Query API. Each endpoint derives ownership from the session. Foreign order/address/payment-method IDs return 404. Customers cannot set roles, shipping events or refund states. Account features work independently of the cart/checkout commerce flag.

## APIs

Base: `/api/v1`. These routes require authentication; writes require CSRF.

| Route | Behavior |
| --- | --- |
| `GET /account` | Profile, counts and five recent owned orders |
| `GET/PATCH /account/profile` | Read/update name and phone; email stays protected |
| `GET/POST /account/addresses` | List/create addresses |
| `PATCH/DELETE /account/addresses/:id` | Edit/remove an owned address |
| `POST /account/addresses/:id/default` | Set a default address |
| `GET/POST /account/payment-methods` | List/create saved UPI details |
| `PATCH/DELETE /account/payment-methods/:id` | Edit/remove an owned UPI method |
| `POST /account/payment-methods/:id/default` | Set a preferred UPI method |
| `GET /account/wishlist` | Saved product records |
| `POST /account/wishlist/items` | Save an active product idempotently |
| `DELETE /account/wishlist/items/:id` | Remove a saved product |
| `GET /account/orders?page=&limit=` | Paginated owned purchase records |
| `GET /account/orders/:id` | Items, tracking, return state and permitted actions |
| `POST /account/orders/:id/cancel` | Cancel a pending order with a status check |
| `POST /account/orders/:id/returns` | Request one return for a fulfilled order |
| `GET /account/returns?page=&limit=` | Owned return/refund records |
| `GET/PATCH /account/settings` | Communication preferences |
| `POST /account/password` | Change password and revoke all sessions |
| `POST /account/sessions/revoke` | Verify password and sign out all devices |

`/wishlist` and customer read/cancel/return routes under `/orders` are supported aliases. Order items are purchase snapshots `{ id, productId, name, sku, quantity, unitPrice }`. Current catalog prices/names never replace historical values.

Accounts allow 20 addresses, 10 UPI methods and 200 wishlist products. Account edits use MongoDB transactions to prevent lost updates. Deleting a default selects the first remaining entry or clears it. These mutations require Atlas or a replica set.

Password/security actions increment the stored session version. Guards check it on every authenticated request, immediately invalidating previous Redis sessions without scanning shared keys. Successful actions destroy the current session and clear frontend caches. Pre-update sessions are version zero.

## Operations and provider scope

Only administrators can record shipping with `POST /admin/account/orders/:id/tracking`, accepting `{ status, carrier?, trackingNumber?, note }`. Shipping requires a paid/fulfilled order and a carrier/tracking number. Events cannot move backwards. Delivery sets the order to fulfilled. Customers view recorded timestamps; absent tracking produces an empty state.

`PATCH /admin/account/returns/:id` accepts `{ status, note, refundReference? }`. Transitions: REQUESTED → APPROVED or REJECTED; APPROVED → RECEIVED → REFUND_PENDING → REFUNDED. Recording a completed refund requires an external reconciliation reference. Amount/currency come from the stored full-order total. Customers request/view returns; they cannot approve them or record refunds.

As requested, Payment Methods manages saved UPI details. Saving an ID does not verify ownership or charge it. Refund records describe payments processed externally; the app does not transfer funds. Saved cards, automatic payments/refunds, courier feeds and outgoing notifications require providers when selected. Cart/checkout and automatic order creation remain separate commerce work.

## Verification

Verified on 2026-10-13: 52 backend unit/HTTP tests, 29 integration tests across three suites, 19 frontend unit tests and 28 fixture browser regression tests passed. Live desktop/mobile checks with real MongoDB and Redis passed for dashboard counts and all account sections, including password changes, cross-session revocation and sign-out of all devices. Both apps passed type checks/builds; frontend lint and formatting passed. The configured API readiness endpoint and frontend `/account` responded with HTTP 200 on ports 4000 and 3001.

The customer integration suite tests real MongoDB/Redis with two customers and an administrator: ownership isolation, profile persistence, address/UPI CRUD and defaults, wishlist idempotency, historical snapshots, cancellation, shipping permissions/transitions, return review, preferences, password changes and session revocation. Tests use isolated databases/namespaces and remove their records.

Live browser checks exercise desktop/mobile account actions with temporary customers, order snapshots, tracking and refund fixtures. They use ports 3101/4201 and `.next-browser`, allowing the regular development server to stay open. Screenshots are saved to `Backend/test-results`.

From `Frontend` with Node 22.14+:

```powershell
$env:NEXT_TEST_BUILD = 'browser'
$env:NEXT_PUBLIC_API_URL = 'http://localhost:4201/api/v1'
$env:NEXT_PUBLIC_APP_URL = 'http://localhost:3101'
npm run build
Remove-Item Env:NEXT_TEST_BUILD,Env:NEXT_PUBLIC_API_URL,Env:NEXT_PUBLIC_APP_URL
```

Then from `Backend`:

```powershell
node --env-file=.env scripts/check-live-browser.cjs
```

Normal development uses ports 3001/4000 and `.next`. Fixture E2E tests use 3102/4102 and `.next-e2e`.
