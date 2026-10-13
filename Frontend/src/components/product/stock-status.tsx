export function StockStatus({ stock }: { stock: number }) {
  return (
    <p className={`text-sm ${stock > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
      {stock > 0 ? 'In stock' : 'Out of stock'}
    </p>
  );
}
