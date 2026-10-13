import { money } from '@/lib/utils';
export function PriceDisplay({ price, currency }: { price: string; currency: string }) {
  return <span className="font-semibold">{money(price, currency)}</span>;
}
