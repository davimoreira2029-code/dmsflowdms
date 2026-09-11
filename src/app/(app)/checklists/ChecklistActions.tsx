"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Item {
  id: string;
  descricao: string;
  obrigatorio: boolean;
}

interface Template {
  id: string;
  nome: string;
  categoria: string | null;
  items: Item[];
}

export default function ChecklistActions({ template }: { template: Template }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(template.nome);
  const [categoria, setCategoria] = useState(template.categoria || "");
  const [items, setItems] = useState(template.items.map(i => ({ ...i })));
  const [loading, setLoading] = useState(false);

  function handlePrint() {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>${template.nome}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            h1 { font-size: 20px; color: #0D1B2A; border-bottom: 2px solid #C9973A; padding-bottom: 8px; }
            .categoria { font-size: 12px; color: #666; margin-bottom: 16px; }
            .item { display: flex; align-items: flex-start; gap: 12px; padding: 10px 0; border-bottom: 1px solid #eee; }
            .check { width: 18px; height: 18px; border: 2px solid #0D1B2A; border-radius: 3px; flex-shrink: 0; margin-top: 2px; }
            .desc { font-size: 14px; color: #333; }
            .obrig { font-size: 11px; color: #999; margin-left: 6px; }
            .footer { margin-top: 30px; font-size: 11px; color: #999; text-align: center; }
            .assinatura { margin-top: 40px; display: flex; justify-content: space-between; }
            .ass-line { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 4px; font-size: 11px; color: #666; }
          </style>
        </head>
        <body>
          <h1>${template.nome}</h1>
          ${template.categoria ? `<div class="categoria">Categoria: ${template.categoria}</div>` : ""}
          <div>
            ${template.items.map(item => `
              <div class="item">
                <div class="check"></div>
                <div class="desc">${item.descricao}${item.obrigatorio ? '<span class="obrig">(obrigatório)</span>' : ""}</div>
              </div>
            `).join("")}
          </div>
          <div class="assinatura">
            <div class="ass-line">Responsável</div>
            <div class="ass-line">Data: ___/___/______</div>
          </div>
          <div class="footer">DMS FLOW — Gestão Operacional Funerária</div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  }

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch(`/api/checklist-templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, categoria, items }),
      });
      if (res.ok) {
        setEditando(false);
        router.refresh();
      } else {
        alert("Erro ao salvar. Tente novamente.");
      }
    } catch {
      alert("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja excluir este checklist?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/checklist-templates/${template.id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
      else alert("Erro ao excluir.");
    } catch {
      alert("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  if (editando) {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
          <h2 className="text-lg font-semibold text-navy-900 mb-4">Editar Checklist</h2>
          <div className="space-y-3 mb-4">
            <div>
              <label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">Nome</label>
              <input className="w-full border border-neutral-200 rounded px-3 py-2 text-sm mt-1" value={nome} onChange={e => setNome(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">Categoria</label>
              <input className="w-full border border-neutral-200 rounded px-3 py-2 text-sm mt-1" value={categoria} onChange={e => setCategoria(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">Itens</label>
              <div className="space-y-2 mt-1">
                {items.map((item, idx) => (
                  <div key={item.id} className="flex gap-2 items-center">
                    <input className="flex-1 border border-neutral-200 rounded px-3 py-1.5 text-sm" value={item.descricao} onChange={e => { const arr = [...items]; arr[idx].descricao = e.target.value; setItems(arr); }} />
                    <label className="text-xs text-neutral-500 flex items-center gap-1">
                      <input type="checkbox" checked={item.obrigatorio} onChange={e => { const arr = [...items]; arr[idx].obrigatorio = e.target.checked; setItems(arr); }} />
                      Obrig.
                    </label>
                    <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  </div>
                ))}
                <button onClick={() => setItems([...items, { id: Date.now().toString(), descricao: "", obrigatorio: false }])} className="text-xs text-navy-700 hover:underline">+ Adicionar item</button>
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditando(false)} className="px-4 py-2 text-sm border border-neutral-200 rounded hover:bg-neutral-50">Cancelar</button>
            <button onClick={handleSave} disabled={loading} className="px-4 py-2 text-sm bg-navy-900 text-white rounded hover:opacity-90 disabled:opacity-50">{loading ? "Salvando..." : "Salvar"}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button onClick={handlePrint} className="text-xs px-3 py-1 rounded border border-neutral-200 hover:bg-neutral-50 text-neutral-600 flex items-center gap-1">
        🖨️ Imprimir
      </button>
      <button onClick={() => setEditando(true)} className="text-xs px-3 py-1 rounded border border-navy-200 hover:bg-navy-50 text-navy-700 flex items-center gap-1">
        ✏️ Editar
      </button>
      <button onClick={handleDelete} disabled={loading} className="text-xs px-3 py-1 rounded border border-red-200 hover:bg-red-50 text-red-500 flex items-center gap-1">
        🗑️ Excluir
      </button>
    </div>
  );
}
