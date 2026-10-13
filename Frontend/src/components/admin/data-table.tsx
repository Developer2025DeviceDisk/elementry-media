import type { ReactNode } from 'react';
import { EmptyState } from '@/components/common/states';
export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
}
export function DataTable<T extends { id: string }>({
  rows,
  columns,
  caption,
}: {
  rows: T[];
  columns: Column<T>[];
  caption: string;
}) {
  if (!rows.length)
    return (
      <EmptyState title="No records yet" description="Records will appear here when available." />
    );
  return (
    <div className="overflow-x-auto rounded-xl border bg-background">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b bg-muted/50">
          <tr>
            {columns.map((column) => (
              <th scope="col" key={column.key} className="px-5 py-4 font-semibold">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b last:border-0">
              {columns.map((column) => (
                <td key={column.key} className="px-5 py-4">
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
