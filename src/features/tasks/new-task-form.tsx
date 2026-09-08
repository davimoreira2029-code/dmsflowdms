"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, FormMessage } from "@/components/ui";

export function NewTaskForm() {
  const router = useRouter();
  const [form, setForm] = useState({ titulo: "", descricao: "", prioridade: "NORMAL", prazo: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setLoading(false);

    if (!json.success) {
      setError(json.message);
      return;
    }

    setForm({ titulo: "", descricao: "", prioridade: "NORMAL", prazo: "" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5">
      <div>
        <Label htmlFor="titulo">Título</Label>
        <Input id="titulo" required value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="prioridade">Prioridade</Label>
          <select
            id="prioridade"
            value={form.prioridade}
            onChange={(e) => setForm((f) => ({ ...f, prioridade: e.target.value }))}
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
          >
            <option value="BAIXA">Baixa</option>
            <option value="NORMAL">Normal</option>
            <option value="ALTA">Alta</option>
            <option value="URGENTE">Urgente</option>
          </select>
        </div>
        <div>
          <Label htmlFor="prazo">Prazo</Label>
          <Input id="prazo" type="date" value={form.prazo} onChange={(e) => setForm((f) => ({ ...f, prazo: e.target.value }))} />
        </div>
      </div>
      <div>
        <Label htmlFor="descricao">Descrição</Label>
        <Input id="descricao" value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
      </div>

      {error && <FormMessage tone="error">{error}</FormMessage>}

      <Button type="submit" disabled={loading}>
        {loading ? "Criando..." : "Criar tarefa"}
      </Button>
    </form>
  );
}
