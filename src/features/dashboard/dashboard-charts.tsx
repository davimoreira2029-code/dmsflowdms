"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const STATUS_LABEL: Record<string, string> = {
  NOVO: "Novo",
  EM_PREPARACAO: "Em preparação",
  EM_ANDAMENTO: "Em andamento",
  AGUARDANDO: "Aguardando",
  FINALIZADO: "Finalizado",
  ARQUIVADO: "Arquivado",
};

export function ServicesByStatusChart({ byStatus }: { byStatus: Record<string, number> }) {
  const data = Object.entries(STATUS_LABEL).map(([key, label]) => ({
    status: label,
    quantidade: byStatus[key] ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <XAxis dataKey="status" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="quantidade" fill="#1E5EFF" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
