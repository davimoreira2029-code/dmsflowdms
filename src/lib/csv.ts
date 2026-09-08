/**
 * Converte uma lista de objetos em CSV. Função pura — sem I/O. Usada
 * para exportação "Excel quando tecnicamente apropriado" (item 24).
 * Escapa vírgula, aspas e quebra de linha conforme RFC 4180.
 */
export function arrayToCsv(rows: Record<string, string | number | null | undefined>[]): string {
  const [firstRow] = rows;
  if (!firstRow) return "";

  const headers = Object.keys(firstRow);
  const escape = (value: unknown): string => {
    const str = value === null || value === undefined ? "" : String(value);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ];

  return lines.join("\n");
}
