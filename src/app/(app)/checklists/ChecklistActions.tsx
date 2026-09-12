"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Item { id: string; descricao: string; obrigatorio: boolean; }
interface Template { id: string; nome: string; categoria: string | null; items: Item[]; }

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
    const html = "<html><head><title>" + template.nome + "</title><style>body{font-family:Arial;padding:20px}h1{border-bottom:2px solid #C9973A;padding-bottom:8px}.item{padding:10px 0;border-bottom:1px solid #eee;display:flex;gap:12px}.check{width:18px;height:18px;border:2px solid #333;flex-shrink:0}.assinatura{margin-top:40px;display:flex;justify-content:space-between}.ass-line{border-top:1px solid #333;width:200px;text-align:center;padding-top:4px;font-size:11px}</style></head><body><h1>" + nome + "</h1>" + items.map(function(item) { return "<div class=item><div class=check></div><div>" + item.descricao + (item.obrigatorio ? " (obrigatorio)" : "") + "</div></div>"; }).join("") + "<div class=assinatura><div class=ass-line>Responsavel</div><div class=ass-line>Data: ___/___/______</div></div></body></html>";
    win.document.write(html);
    win.document.close();
    win.print();
  }

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch("/api/checklist-templates/" + template.id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, categoria, items })
      });
      if (res.ok) { setEditando(false); router.refresh(); }
      else alert("Erro ao salvar.");
    } catch { alert("Erro de conexao."); }
    finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!confirm("Excluir este checklist?")) return;
    const res = await fetch("/api/checklist-templates/" + template.id, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("Erro ao excluir.");
  }

  if (editando) return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <div style={{background:"white",borderRadius:"8px",padding:"24px",width:"100%",maxWidth:"500px",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
        <h2 style={{fontSize:"16px",fontWeight:"600",marginBottom:"16px"}}>Editar Checklist</h2>
        <div style={{marginBottom:"12px"}}>
          <label style={{fontSize:"11px",fontWeight:"500",color:"#666",textTransform:"uppercase"}}>Nome</label>
          <input style={{width:"100%",border:"1px solid #ddd",borderRadius:"4px",padding:"8px 12px",fontSize:"14px",marginTop:"4px",boxSizing:"border-box"}} value={nome} onChange={e => setNome(e.target.value)} />
        </div>
        <div style={{marginBottom:"12px"}}>
          <label style={{fontSize:"11px",fontWeight:"500",color:"#666",textTransform:"uppercase"}}>Categoria</label>
          <input style={{width:"100%",border:"1px solid #ddd",borderRadius:"4px",padding:"8px 12px",fontSize:"14px",marginTop:"4px",boxSizing:"border-box"}} value={categoria} onChange={e => setCategoria(e.target.value)} />
        </div>
        <div style={{marginBottom:"16px"}}>
          <label style={{fontSize:"11px",fontWeight:"500",color:"#666",textTransform:"uppercase"}}>Itens</label>
          <div style={{marginTop:"8px",display:"flex",flexDirection:"column",gap:"8px"}}>
            {items.map((item, idx) => (
              <div key={item.id} style={{display:"flex",gap:"8px",alignItems:"center"}}>
                <input style={{flex:1,border:"1px solid #ddd",borderRadius:"4px",padding:"6px 10px",fontSize:"13px"}} value={item.descricao} onChange={e => { const arr=[...items]; arr[idx].descricao=e.target.value; setItems(arr); }} />
                <label style={{fontSize:"12px",color:"#666",display:"flex",alignItems:"center",gap:"4px",whiteSpace:"nowrap"}}>
                  <input type="checkbox" checked={item.obrigatorio} onChange={e => { const arr=[...items]; arr[idx].obrigatorio=e.target.checked; setItems(arr); }} /> Obrig.
                </label>
                <button onClick={() => setItems(items.filter((_,i) => i!==idx))} style={{color:"#ef4444",fontSize:"14px",cursor:"pointer",border:"none",background:"none"}}>✕</button>
              </div>
            ))}
            <button onClick={() => setItems([...items, { id: Date.now().toString(), descricao: "", obrigatorio: false }])} style={{fontSize:"12px",color:"#0D1B2A",textDecoration:"underline",cursor:"pointer",border:"none",background:"none",textAlign:"left"}}>+ Adicionar item</button>
          </div>
        </div>
        <div style={{display:"flex",gap:"8px",justifyContent:"flex-end"}}>
          <button onClick={() => setEditando(false)} style={{padding:"8px 16px",fontSize:"13px",border:"1px solid #ddd",borderRadius:"4px",cursor:"pointer"}}>Cancelar</button>
          <button onClick={handleSave} disabled={loading} style={{padding:"8px 16px",fontSize:"13px",background:"#0D1B2A",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",opacity:loading?0.5:1}}>{loading ? "Salvando..." : "Salvar"}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{display:"flex",gap:"8px"}}>
      <button onClick={handlePrint} style={{fontSize:"12px",padding:"4px 10px",border:"1px solid #ddd",borderRadius:"4px",cursor:"pointer"}}>Imprimir</button>
      <button onClick={() => setEditando(true)} style={{fontSize:"12px",padding:"4px 10px",border:"1px solid #bfdbfe",borderRadius:"4px",cursor:"pointer",color:"#3b82f6"}}>Editar</button>
      <button onClick={handleDelete} style={{fontSize:"12px",padding:"4px 10px",border:"1px solid #fca5a5",borderRadius:"4px",cursor:"pointer",color:"#ef4444"}}>Excluir</button>
    </div>
  );
}