"use client";
import { useRouter } from "next/navigation";
interface Item { id: string; descricao: string; obrigatorio: boolean; }
interface Template { id: string; nome: string; categoria: string | null; items: Item[]; }
export default function ChecklistActions({ template }: { template: Template }) {
  const router = useRouter();
  function handlePrint() {
    const win = window.open("", "_blank");
    if (!win) return;
    const html = "<html><head><title>" + template.nome + "</title><style>body{font-family:Arial;padding:20px}h1{border-bottom:2px solid #C9973A;padding-bottom:8px}.item{padding:10px 0;border-bottom:1px solid #eee;display:flex;gap:12px}.check{width:18px;height:18px;border:2px solid #333;flex-shrink:0}.assinatura{margin-top:40px;display:flex;justify-content:space-between}.ass-line{border-top:1px solid #333;width:200px;text-align:center;padding-top:4px;font-size:11px}</style></head><body><h1>" + template.nome + "</h1>" + template.items.map(function(item) { return "<div class=item><div class=check></div><div>" + item.descricao + (item.obrigatorio ? " (obrigatorio)" : "") + "</div></div>"; }).join("") + "<div class=assinatura><div class=ass-line>Responsavel</div><div class=ass-line>Data: ___/___/______</div></div></body></html>";
    win.document.write(html);
    win.document.close();
    win.print();
  }
  async function handleDelete() {
    if (!confirm("Excluir este checklist?")) return;
    const res = await fetch("/api/checklist-templates/" + template.id, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("Erro ao excluir.");
  }
  return (
    <div style={{display:"flex",gap:"8px"}}>
      <button onClick={handlePrint} style={{fontSize:"12px",padding:"4px 10px",border:"1px solid #ddd",borderRadius:"4px",cursor:"pointer"}}>Imprimir</button>
      <button onClick={handleDelete} style={{fontSize:"12px",padding:"4px 10px",border:"1px solid #fca5a5",borderRadius:"4px",cursor:"pointer",color:"#ef4444"}}>Excluir</button>
    </div>
  );
}