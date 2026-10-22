# MiNE Media A320H catalog entry

The owner supplied the name, content, regular price of INR 399999.00, sale price of INR 351000.00, and confirmed stock of 20 on 22 October 2026. The product belongs to Show, uses SKU MINE-A320H, and reuses the existing responsive listing/detail page, quantity selector, WhatsApp ordering, and capability-gated purchase controls.

## Maintenance

`Backend/catalog/mine-a320h.json` is the product content source. From Frontend run `npm run catalog:sync` after changing catalog files. It generates `src/lib/constants/catalog-content.json`, a public display snapshot that is committed for standalone frontend builds. It excludes product IDs, live sale prices, stock, active status, and availability. RTK Query fills missing optional display fields from this snapshot while preserving values returned by the API. Images reuse the same snapshot.

After building Backend, run `node --env-file=.env scripts/import-catalog-product.cjs mine-a320h --stock=20` to apply confirmed stock and import by SKU. Omit `--stock` for later content-only imports to preserve current inventory. Existing product IDs and active status are preserved. The products validator must already support the optional content fields.

The currently deployed legacy Render API rejects category query parameters. Server-rendered Shop/Show reads retry only that specific validation error by looking up the known category SKUs through real product search. They filter and paginate the returned products without creating inventory. Updated APIs continue to perform their own category filtering. Other API failures are surfaced normally.

## Manufacturer verification

The [manufacturer A320H page](https://www.minemedia.tv/Video-Receiver-Decoder/Mine-A320H-5G-Bonding-Video-Decoder.html) confirms 8K decoding, HDMI input/output, bonded network workflows, RTMP/RTSP/SRT, and audio integration. HDMI replaces the supplied generic SDI claim; HLS is omitted because the source does not confirm it for this model. No numerical latency guarantee, battery, ruggedness rating, or included accessories are invented.

The product photo was downloaded without editing from `https://www.minemedia.tv/static/products/A320H/Mine%20A320H%205G%20Bonding%20Video%20Decoder.png` into `Frontend/public/images/products/mine-a320h/decoder.png`. Other manufacturer page illustrations are labelled A318H and are not used as A320H product photos.

Three additional A320H photos were downloaded without editing from the [US Broadcast A320H product gallery](https://usbroadcast.co/product/mine-media-a320h-8k-5g-bonding-decoder/):

- `https://usbroadcast.co/wp-content/uploads/2023/11/A320H-Front-Angle.jpg` → `front-angle.jpg`
- `https://usbroadcast.co/wp-content/uploads/2023/11/Mine-Media-A320H-front-view.jpg` → `front.jpg`
- `https://usbroadcast.co/wp-content/uploads/2023/11/Mine-Media-A320H-rear-view.jpg` → `rear.jpg`

The gallery now contains four selectable product images, including the original manufacturer photo.
