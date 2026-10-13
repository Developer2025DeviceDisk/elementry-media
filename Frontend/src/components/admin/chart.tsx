'use client';
import type { AnalyticsPoint } from '@/store/api/adminApi';
export default function Chart({ data }: { data: AnalyticsPoint[] }) {
  const max = Math.max(1, ...data.map((point) => point.revenue));
  return (
    <figure className="rounded-xl border bg-background p-6">
      <figcaption className="mb-6 font-semibold">Revenue over time</figcaption>
      <div className="flex h-52 items-end gap-2 overflow-x-auto" aria-hidden="true">
        {data.map((point) => (
          <div
            key={point.date}
            className="min-w-8 flex-1 rounded-t bg-primary"
            style={{ height: `${Math.max(1, (point.revenue / max) * 100)}%` }}
            title={`${point.date}: ${point.revenue}`}
          />
        ))}
      </div>
      <table className="sr-only">
        <caption>Revenue and order counts</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Revenue</th>
            <th>Orders</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.date}>
              <td>{point.date}</td>
              <td>{point.revenue}</td>
              <td>{point.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
