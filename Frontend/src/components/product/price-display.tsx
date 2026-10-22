import { money } from '@/lib/utils';
export function PriceDisplay({
  price,
  currency,
  regularPrice,
}: {
  price: string;
  currency: string;
  regularPrice?: string;
}) {
  const onSale = regularPrice && Number(regularPrice) > Number(price);
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="font-semibold">
        {onSale && <span className="sr-only">Sale price: </span>}
        <span>{money(price, currency)}</span>
      </span>
      {onSale && (
        <span className="text-base font-normal text-muted-foreground">
          <span className="sr-only">Regular price: </span>
          <del>{money(regularPrice, currency)}</del>
        </span>
      )}
    </span>
  );
}
