const fs = require('fs');
const content = [
'"use client";',
'import { useState } from "react";',
'import { useRouter } from "next/navigation";',
'interface Tarefa { id: string; titulo: string; descricao: string | null; prioridade: string; status: string; }',
'const SL = { A_FAZER: "A fazer", EM_ANDAMENTO: "Em andamento", CONCLUIDA: "Concluida", CANCELADA: "Cancelada" };',
'export default function TarefaActions({ tarefa }: { tarefa: Tarefa }) {',
'  const router = useRouter();',
'  const [ed, setEd] = useState(false);',
'  const [tit, setTit] = useState(tarefa.titulo);',
'  const [desc, setDesc] = useState(tarefa.descricao || "");',
'  const [prio, setPrio] = useState(tarefa.prioridade);',
'  const [stat, setStat] = useState(tarefa.status);',
'  const [loading, setLoading] = useState(false);',
'  function print() { const w = window.open("","_blank"); if(!w) return; w.document.write("<html><body><h1>"+tit+"</h1><p>"+prio+"</p><p>"+(SL[stat as keyof typeof SL]||stat)+"</p>"+(desc?"<p>"+desc+"</p>":"")+"<p style=margin-top:40px>Responsavel: _______________ Data: ___/___/______</p></body></html>"); w.document.close(); w.print(); }',
'  async function save() { setLoading(true); try { const r=await fetch("/api/tasks/"+tarefa.id,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({titulo:tit,descricao:desc,prioridade:prio,status:stat})}); if(r.ok){setEd(false);router.refresh();}else alert("Erro."); } catch{alert("Erro.");} finally{setLoading(false);} }',
'  async function del() { if(!confirm("Excluir?"))return; const r=await fetch("/api/tasks/"+tarefa.id,{method:"DELETE"}); if(r.ok)router.refresh(); }',
'  if(ed) return (<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:50,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{background:"white",borderRadius:"8px",padding:"24px",width