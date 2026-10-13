-- Read-only export from the former PostgreSQL schema. Keep the output private.
-- Text casts preserve exact decimals when JSON is parsed by JavaScript.
SELECT jsonb_build_object(
  'users', COALESCE((SELECT jsonb_agg(to_jsonb(u)) FROM "User" u), '[]'::jsonb),
  'products', COALESCE((SELECT jsonb_agg(to_jsonb(p) || jsonb_build_object('price', p.price::text)) FROM "Product" p), '[]'::jsonb),
  'orders', COALESCE((SELECT jsonb_agg(to_jsonb(o) || jsonb_build_object('total', o.total::text)) FROM "Order" o), '[]'::jsonb),
  'orderItems', COALESCE((SELECT jsonb_agg(to_jsonb(i) || jsonb_build_object('unitPrice', i."unitPrice"::text)) FROM "OrderItem" i), '[]'::jsonb)
);
