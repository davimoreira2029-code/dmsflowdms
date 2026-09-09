"use client";
import { useState } from "react";
interface Plan { id: string; nome: string; precoCentavos: number; limiteUsuarios: number; }
export default function PlanosClient({ plans }: { plans: Plan[] }) {
  const [loading, setLoading] = useState<string | null>(null);
  async function handleContratar(plan: Plan) {
    setLoading(plan.id);
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId: plan.id, planNome: plan.nome, valor: plan.precoCentavos / 100 }) });
      const data = await res.json();
      if (data.checkoutUrl) { window.location.href = data.checkoutUrl; }
      else { alert("Erro ao iniciar pagamento."); }
    } catch { alert("Erro de conexao."); }
    finally { setLoading(null); }
  }
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="mb-10 text-center">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-gold-500">DMS FLOW</p>
        <h1 className="text-2xl font-semibold text-navy-900">Escolha seu plano</h1>
        <p className="mt-2 text-sm text-neutral-500">Selecione o plano ideal para sua empresa funeraria</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-lg border border-neutral-200 bg-white p-6 flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <p className="text-sm font-semibold text-navy-900">{plan.nome}</p>
              <p className="mt-2 text-2xl font-semibold text-navy-900">R$ {(plan.precoCentavos / 100).toFixed(2).replace(".", ",")}<span className="text-sm font-normal text-neutral-500">/mes</span></p>
              <p className="mt-2 text-xs text-neutral-500">Ate {plan.limiteUsuarios} usuarios</p>
            </div>
            <button onClick={() => handleContratar(plan)} disabled={loading === plan.id} className="mt-6 block w-full rounded-md bg-navy-900 px-4 py-2 text-center text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
              {loading === plan.id ? "Aguarde..." : "Contratar agora"}
            </button>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <p className="text-sm text-neutral-500">Quer testar antes? <a href="/registro" className="text-navy-700 hover:underline font-medium">Teste gratis por 7 dias</a></p>
      </div>
    </main>
  );
}
