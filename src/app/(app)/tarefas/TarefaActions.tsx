"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
interface Tarefa { id: string; titulo: string; descricao: string | null; prioridade: string; status: string; }
export default function TarefaActions({ tarefa }: { tarefa: Tarefa }) {
  const router = useRouter();
  const [ed, setEd] = useState(false);
  const [tit, setTit] = useState(tarefa.titulo);
  const [desc, setDesc] = useState(tarefa.descricao || "");
  const [prio, setPrio] = useState(tarefa.prioridade);
  const [stat, setStat] = useState(tarefa.status);
  const [loading, setLoading] = useState(false);
  async function save() {
    setLoading(true);
    try {
      const r = await fetch("/api/tasks/" + tarefa.id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ titulo: tit, descricao: desc, prioridade: prio, status: stat }) });
      if (r.ok) { setEd(false); router.refresh(); } else alert("Erro.");
    } catch { alert("Erro."); } finally { setLoading(false); }
  }
  async function del() {
    if (!confirm("Excluir?")) return;
    const r = await fetch("/api/tasks/" + tarefa.id, { method: "DELETE" });
    if (r.ok) router.refresh();
  }
  function imprimir() {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write("<html><body><h1>" + tit + "</h1><p>" + prio + "</p><p>" + stat + "</p></body></html>");
    w.document.close();
    w.print();
  }
  if (ed) return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: "8px", padding: "24px", width: "90%", maxWidth: "500px" }}>
        <h2 style={{ marginBottom: "16px", fontWeight: 600 }}>Editar Tarefa</h2>
        <div style={{ marginBottom: "8px" }}>Titulo
          <input style={{ display: "block", width: "100%", border: "1px solid #ddd", borderRadius: "4px", padding: "8px", boxSizing: "border-box" }} value={tit} onChange={e => setTit(e.target.value)} />
        </div>
        <div style={{ marginBottom: "8px" }}>Descricao
          <textarea style={{ display: "block", width: "100%", border: "1px solid #ddd", borderRadius: "4px", padding: "8px", boxSizing: "border-box", height: "60px" }} value={desc} onChange={e => setDesc(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <div style={{ flex: 1 }}>Prioridade
            <select style={{ display: "block", width: "100%", border: "1px solid #ddd", borderRadius: "4px", padding: "8px" }} value={prio} onChange={e => setPrio(e.target.value)}>
              <option value="URGENTE">URGENTE</option>
              <option value="ALTA">ALTA</option>
              <option value="NORMAL">NORMAL</option>
              <option value="BAIXA">BAIXA</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>Status
            <select style={{ display: "block", width: "100%", border: "1px solid #ddd", borderRadius: "4px", padding: "8px" }} value={stat} onChange={e => setStat(e.target.value)}>
              <option value="A_FAZER">A fazer</option>
              <option value="EM_ANDAMENTO">Em andamento</option>
              <option value="CONCLUIDA">Concluida</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button onClick={() => setEd(false)} style={{ padding: "8px 16px", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer" }}>Cancelar</button>
          <button onClick={save} disabled={loading} style={{ padding: "8px 16px", background: "#0D1B2A", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>{loading ? "..." : "Salvar"}</button>
        </div>
      </div>
    </div>
  );
  return (
    <div style={{ display: "flex", gap: "6px" }} onClick={e => e.preventDefault()}>
      <button onClick={imprimir} style={{ fontSize: "11px", padding: "3px 8px", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer" }}>Imprimir</button>
      <button onClick={() => setEd(true)} style={{ fontSize: "11px", padding: "3px 8px", border: "1px solid #bfdbfe", borderRadius: "4px", cursor: "pointer", color: "#3b82f6" }}>Editar</button>
      <button onClick={del} style={{ fontSize: "11px", padding: "3px 8px", border: "1px solid #fca5a5", borderRadius: "4px", cursor: "pointer", color: "#ef4444" }}>Excluir</button>
    </div>
  );
}