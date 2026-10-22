# CNDLive D1 catalog entry

The owner supplied the name, description, use cases, FAQs, regular price INR 100000.00, sale price INR 50000.00, and confirmed stock of 10 on 22 October 2026. The product uses SKU CND-D1 and belongs to Show. It reuses the existing product listing/detail, quantity, image gallery, WhatsApp ordering, and capability-gated cart/Buy now controls.

## Maintenance

Content source: `Backend/catalog/cndlive-d1.json`. Run `npm run catalog:sync` from Frontend after editing catalog content. This includes optional `specifications` in the public display snapshot so the technical highlights remain available with an older backend serializer. Live IDs, sale prices, stock, and availability continue to come from the API.

After building Backend, run `node --env-file=.env scripts/import-catalog-product.cjs cndlive-d1 --stock=10`. The import applies the current products validator, preserving the existing unique indexes and all other collections, and upserts by SKU. Omit `--stock` for future content-only imports to preserve current inventory. Optional specifications are also serialized by the updated backend.

## Verified specifications and photos

The [current manufacturer specifications](https://www.cndlive.com/products/d1-4k-ip-video-decoder/specs) confirm HDMI up to 3840×2160p60, SDI up to 1920×1080p60, DC 12V/2A, dimensions 140×131.2×43.7mm, weight 443g, and working temperature -10°C to 45°C. The latter three replace the unconfirmed dimensions, weight, and temperature in the supplied text. No 4K-over-3G-SDI, unconfirmed accessories, delivery promises, or warranty terms are claimed. Protocols follow the requested common subset; no additional firmware-dependent protocol is promised.

Four product photos were downloaded without editing from the [US Broadcast D1 gallery](https://usbroadcast.co/product/cndlive-d1-hdmi-sdi-video-decoder/):

- `https://usbroadcast.co/wp-content/uploads/2024/11/D1-Front-Top.jpg` → `front-top.jpg`
- `https://usbroadcast.co/wp-content/uploads/2024/11/D1-Front-Left-Iso.jpg` → `front-angle.jpg`
- `https://usbroadcast.co/wp-content/uploads/2024/11/D1-Front-Bottom-Iso.jpg` → `front-bottom.jpg`
- `https://usbroadcast.co/wp-content/uploads/2024/11/D1-Rear.jpg` → `rear.jpg`

Local assets live under `Frontend/public/images/products/cndlive-d1`.
