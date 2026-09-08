"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, FormMessage } from "@/components/ui";

interface ItemDraft {
  descricao: string;
  obrigatorio: boolean;
}

export function NewTemplateForm() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [itens, setItens] = useState<ItemDraft[]>([{ descricao: "", obrigatorio: true }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateItem(index: number, patch: Partial<ItemDraft>) {
    setItens((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItens((prev) => [...prev, { descricao: "", obrigatorio: true }]);
  }

  function removeItem(index: number) {
    setItens((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      nome,
      categoria: categoria || undefined,
      itens: itens
        .filter((it) => it.descricao.trim().length > 0)
        .map((it, ordem) => ({ descricao: it.descricao, obrigatorio: it.obrigatorio, ordem })),
    };

    const res = await fetch("/api/checklist-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setLoading(false);

    if (!json.success) {
      setError(json.message);
      return;
    }

    setNome("");
    setCategoria("");
    setItens([{ descricao: "", obrigatorio: true }]);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nome">Nome do checklist</Label>
          <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="categoria">Categoria</Label>
          <Input id="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="VEICULO, URNA..." />
        </div>
      </div>

      <div>
        <Label>Itens</Label>
        <div className="space-y-2">
          {itens.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={item.descricao}
                onChange={(e) => updateItem(index, { descricao: e.target.value })}
                placeholder={`Item ${index + 1}`}
                className="flex-1"
              />
              <label className="flex items-center gap-1 text-xs text-neutral-600">
                <input
                  type="checkbox"
                  checked={item.obrigatorio}
                  onChange={(e) => updateItem(index, { obrigatorio: e.target.checked })}
                />
                Obrigatório
              </label>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-xs text-red-600 hover:underline"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addItem} className="mt-2 text-sm text-navy-700 hover:underline">
          + Adicionar item
        </button>
      </div>

      {error && <FormMessage tone="error">{error}</FormMessage>}

      <Button type="submit" disabled={loading}>
        {loading ? "Criando..." : "Criar checklist"}
      </Button>
    </form>
  );
}
