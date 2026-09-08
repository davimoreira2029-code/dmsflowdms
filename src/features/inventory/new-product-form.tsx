"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, FormMessage } from "@/components/ui";

const CATEGORIAS = [
  { value: "URNAS", label: "Urnas" },
  { value: "MATERIAIS", label: "Materiais" },
  { value: "EPIS", label: "EPIs" },
  { value: "PRODUTOS_LABORATORIAIS", label: "Produtos laboratoriais" },
  { value: "ORNAMENTACAO", label: "Ornamentação" },
  { value: "LIMPEZA", label: "Limpeza" },
  { value: "OUTROS", label: "Outros" },
];

export function NewProductForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: "",
    categoria: "MATERIAIS",
    codigo: "",
    unidade: "",
    quantidade: "0",
    estoqueMinimo: "0",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/inventory/products", {
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

    setForm({ nome: "", categoria: "MATERIAIS", codigo: "", unidade: "", quantidade: "0", estoqueMinimo: "0" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="nome">Nome do produto</Label>
          <Input id="nome" required value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
        </div>
        <div>
          <Label htmlFor="categoria">Categoria</Label>
          <select
            id="categoria"
            value={form.categoria}
            onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
          >
            {CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="unidade">Unidade</Label>
          <Input id="unidade" placeholder="un, kg, litro..." value={form.unidade} onChange={(e) => setForm((f) => ({ ...f, unidade: e.target.value }))} />
        </div>
        <div>
          <Label htmlFor="quantidade">Quantidade inicial</Label>
          <Input id="quantidade" type="number" min={0} value={form.quantidade} onChange={(e) => setForm((f) => ({ ...f, quantidade: e.target.value }))} />
        </div>
        <div>
          <Label htmlFor="estoqueMinimo">Estoque mínimo</Label>
          <Input id="estoqueMinimo" type="number" min={0} value={form.estoqueMinimo} onChange={(e) => setForm((f) => ({ ...f, estoqueMinimo: e.target.value }))} />
        </div>
      </div>

      {error && <FormMessage tone="error">{error}</FormMessage>}

      <Button type="submit" disabled={loading}>
        {loading ? "Cadastrando..." : "Cadastrar produto"}
      </Button>
    </form>
  );
}
