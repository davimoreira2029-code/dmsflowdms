"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Urna {
  id: string;
  modelo: string;
  fabricante: string | null;
  material: string | null;
  quantidade: number;
  estoqueMinimo: number;
}

export default function UrnActions({ urna }: { urna: Urna }) {
  const router = useRouter();
  const [ed, setEd] = useState(false);
  const [modelo, setModelo] = useState(urna.modelo);
  const [fabricante, setFabricante] = useState(urna.fabricante || "");
  const [material, setMaterial] = useState(urna.material || "");
  const [quantidade, setQuantidade] = useState(urna.quantidade);
  const [loading, setLoading] = useState(false);

  function imprimir() {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write("<html><body><h1>Urna: " + modelo + "</h1><p>Fabricante: " + (fabricante || "-") + "</p><p>Material: " + (material || "-") + "</p><p>Quantidade: " + quantidade + "</p><p style='margin-top:40px'>Responsavel: _______________ Data: ___/___/______</p></body></html>");
    w.document.close();
    w.print();
  }

  async function save() {
    setLoading(true);
    try {
      const r = await fetch("/api/urns/" + urna.id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ modelo, fabricante, material, quantidade }) });
      if (r.ok) { setEd(false); router.refresh(); } else alert("Erro.");
    } catch { alert("Erro."); } finally { setLoading(false); }
  }

  async function del() {
    if (!confirm("Excluir esta urna?")) return;
    const r = await fetch("/api/urns/" + urna.id, { method: "DELETE" });
    if (r.ok) router.refresh();
    else alert("Erro ao excluir.");
  }

  if (ed) return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: "8px", padding: "24px", width: "90%", maxWidth: "500px" }}>
        <h2 style={{ marginBottom: "16px", fontWeight: 600 }}>Editar Urna</h2>
        <div style={{ marginBottom: "8px" }}>Modelo<br /><input style={{ width: "100%", border: "1px solid #ddd", borderRadius: "4px", padding: "8px", boxSizing: "border-box" }} value={modelo} onChange={e => setModelo(e.target.value)} /></div>
        <div style={{ marginBottom: "8px" }}>Fabricante<br /><input style={{ width: "100%", border: "1px solid #ddd", borderRadius: "4px", padding: "8px", boxSizing: "border-box" }} value={fabricante} onChange={e => setFabricante(e.target.value)} /></div>
        <div style={{ marginBottom: "8px" }}>Material<br /><input style={{ width: "100%", border: "1px solid #ddd", borderRadius: "4px", padding: "8px", boxSizing: "border-box" }} value={material} onChange={e => setMaterial(e.target.value)} /></div>
        <div style={{ marginBottom: "16px" }}>Quantidade<br /><input type="number" style={{ width: "100%", border: "1px solid #ddd", borderRadius: "4px", padding: "8px", boxSizing: "border-box" }} value={quantidade} onChange={e => setQuantidade(Number(e.target.value))} /></div>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button onClick={() => setEd(false)} style={{ padding: "8px 16px", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer" }}>Cancelar</button>
          <button onClick={save} disabled={loading} style={{ padding: "8px 16px", background: "#0D1B2A", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>{loading ? "..." : "Salvar"}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", gap: "6px" }}>
      <button onClick={imprimir} style={{ fontSize: "11px", padding: "3px 8px", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer" }}>Imprimir</button>
      <button onClick={() => setEd(true)} style={{ fontSize: "11px", padding: "3px 8px", border: "1px solid #bfdbfe", borderRadius: "4px", cursor: "pointer", color: "#3b82f6" }}>Editar</button>
      <button onClick={del} style={{ fontSize: "11px", padding: "3px 8px", border: "1px solid #fca5a5", borderRadius: "4px", cursor: "pointer", color: "#ef4444" }}>Excluir</button>
    </div>
  );
}