export function StatsCard({ title, value }: { title: string; value: string | number }) {
  return (
    <article className="rounded-xl border bg-background p-6">
      <h2 className="text-sm text-muted-foreground">{title}</h2>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </article>
  );
}
