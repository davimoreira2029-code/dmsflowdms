"use client";

import { arrayToCsv } from "@/lib/csv";
import { Button } from "@/components/ui";

export function ReportTable({ title, rows }: { title: string; rows: Record<string, string | number>[] }) {
  function exportCsv() {
    const csv = arrayToCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const [firstRow] = rows;
  if (!firstRow) {
    return (
      <p className="rounded-md border border-dashed border-neutral-200 px-6 py-8 text-center text-sm text-neutral-500">
        Nenhum dado disponível para este relatório.
      </p>
    );
  }

  const columns = Object.keys(firstRow);

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2 print:hidden">
        <Button variant="secondary" onClick={exportCsv}>
          Exportar CSV
        </Button>
        <Button variant="secondary" onClick={() => window.print()}>
          Imprimir
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-600">
            <tr>
              {columns.map((c) => (
                <th key={c} className="whitespace-nowrap px-4 py-2">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rows.map((row, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c} className="whitespace-nowrap px-4 py-2 text-neutral-700">
                    {String(row[c] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
