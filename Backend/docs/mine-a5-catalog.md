# Mine A5 catalog entry

`catalog/mine-a5.json` contains the supplied product information, INR sale price of 69000.00, regular price of 100000.00, and the `show` category. Prices persist as Decimal128 and serialize as decimal strings. Optional content fields keep existing products compatible.

Run `npm run catalog:mine-a5` from Backend with the intended database configured in `.env`. This builds the API, updates only the products validator, and upserts the product by the manufacturer SKU MINE-A5. Existing product IDs, active status, and inventory are preserved. A new record starts with availability `on-request` and zero confirmed stock; confirm inventory before enabling direct purchases. Repeating the import updates content without duplicating the product.

The owner confirmed 10 units on 22 October 2026. After building, `node --env-file=.env scripts/import-mine-a5.cjs --stock=10` explicitly applies that confirmed inventory and removes the on-request status. Omit `--stock` on later content-only imports to preserve current stock.

Deploy the API changes as well as the frontend. The category is reachable from Shop and at `/categories/show`; API reads use `GET /products?category=show`. Catalog cache keys use version 3 and include the category; updated data can take CACHE_TTL_SECONDS to appear.

After building, run `node --env-file=.env scripts/check-mine-a5.cjs` to start a temporary local API and verify the persisted camera through real HTTP list/detail reads, including category/brand filtering, exact prices, images, features, and FAQs. It closes the server and database connections when finished.

Frontend business configuration:

- The confirmed business WhatsApp destination is +91 9015747301. `next.config.ts` embeds `9015747301` by default; `NEXT_PUBLIC_WHATSAPP_NUMBER` can override it with a number including country code, digits only. Rebuild/redeploy after changing it. The component disables WhatsApp ordering if no number is supplied outside the normal Next.js configuration.
- Keep `NEXT_PUBLIC_COMMERCE_API_ENABLED=false` until the cart, orders, and payment contracts in `Frontend/docs/api-contracts.md` exist in the deployed backend. Add to cart and Buy now use the selected quantity through the existing RTK Query cart mutation. Buy now opens checkout only after a successful add. They stay disabled while commerce or confirmed inventory is unavailable.

## Sources checked 22 October 2026

Product photos and the included-items list come from the [manufacturer product page](https://www.minemedia.tv/Live-Camera/Mine-A5.html). It lists one camera, protective handbag, USB Type-C cable, and manual. The local image files under `Frontend/public/images/products/mine-a5` were downloaded without editing from:

- `https://www.minemedia.tv/static/products/A5/A5%204G%20Streaming%20%20Camera.png`
- `https://www.minemedia.tv/static/products/A5/A5-4g-bonding-streaming-camera.jpg`
- `https://www.minemedia.tv/static/products/A5/A5-Package%20list.jpg`

The gallery also includes all five additional AVIF camera images supplied by the owner in `Frontend/public/images/products/mine-a5`. All eight images are listed in `catalog/mine-a5.json` and available as selectable thumbnails on the detail page.

Older deployed APIs may omit the optional `images` field even when MongoDB has it. The frontend RTK Query product reads fill missing/empty Mine A5 image metadata from `src/lib/constants/product-images.ts`. This maps the real MINE-A5 SKU to its eight local assets and preserves API-provided images and all live product values. The image gallery therefore works before the updated backend serializer is deployed; other new catalog fields still require the backend deployment.

The [manufacturer guide](https://www.minemedia.tv/static/download/Mine%20A5%204G%20Bonding%20Streaming%20Camera-Guide.pdf) states that streaming and recording cannot both run at 4K simultaneously. The resolution FAQ includes this qualification. No additional accessories, delivery promises, stock, reviews, or warranty terms are invented.
