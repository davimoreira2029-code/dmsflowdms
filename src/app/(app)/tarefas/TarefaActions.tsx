"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Tarefa {
  id: string;
  titulo: string;
  descricao: string | null;
  prioridade: string;
  status: string;
}

const STATUS_LABEL: Record<string, string> = { A_FAZER: "A fazer", EM_ANDAMENTO: "Em andamento", CONCLUIDA: "Concluída", CANCELADA: "Cancelada" };

export default function TarefaActions({ tarefa }: { tarefa: Tarefa }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState(tarefa.titulo);
  const [descricao, setDescricao] = useState(tarefa.descricao || "");
  const [prioridade, setPrioridade] = useState(tarefa.prioridade);
  const [status, setStatus] = useState(tarefa.status);
  const [loading, setLoading] = useState(false);

  function handlePrint() {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write("<html><body><h1>" + titulo + "</h1><p>Prioridade: " + prioridade + "</p><p>Status: " + (STATUS_LABEL[status] || status) + "</p>" + (descricao ? "<p>" + descricao + "</p>" : "") + "<p style='margin-top:40px'>Responsavel: _______________ Data: ___/___/______</p></body></html>");
    w.document.close();
    w.print();
  }

  async function handleSave() {
    setLoading(true);
    try {
      const r = await fetch("/api/tasks/" + tarefa.id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ titulo, descricao, prioridade, status }) });
      if (r.ok) { setEditando(false); router.refresh(); } else alert("Erro.");
    } catch { alert("Erro."); } finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!confirm("Excluir?")) return;
    const r = await fetch("/api/tasks/" + tarefa.id, { method: "DELETE" });
    if (r.ok) router.refresh();
  }

  if (editando) return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: "8px", padding: "24px", width: "90%", maxWidth: "500px" }}>
        <h2 style={{ marginBottom: "16px", fontWeight: 600 }}>Editar Tarefa</h2>
        <div style={{ marginBottom: "8px" }}>Título<br /><input style={{ width: "100%", border: "1px solid #ddd", borderRadius: "4px", padding: "8px", boxSizing: "border-box" }} value={titulo} onChange={e => setTitulo(e.target.value)} /></div>
        <div style={{ marginBottom: "8px" }}>Descrição<br /><textarea style={{ width: "100%", border: "1px solid #ddd", borderRadius: "4px", padding: "8px", boxSizing: "border-box", height: "80px" }} value={descricao} onChange={e => setDescricao(e.target.value)} /></div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          <div style={{ flex: 1 }}>Prioridade<br /><select style={{ width: "100%", border: "1px solid #ddd", borderRadius: "4px", padding: "8px" }} value={prioridade} onChange={e => setPrioridade(e.target.value)}><option value="URGENTE">URGENTE</option><option value="ALTA">ALTA</option><option value="NORMAL">NORMAL</option><option value="BAIXA">BAIXA</option></select></div>