export function StockStatus({
  stock,
  availability,
}: {
  stock: number;
  availability?: 'on-request';
}) {
  return (
    <p className={`text-sm ${stock > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
      {availability === 'on-request'
        ? 'Availability: confirm with us'
        : stock > 0
          ? 'In stock'
          : 'Out of stock'}
    </p>
  );
}
