import { listActivePlans } from "@/server/services/billing.service";
import Link from "next/link";

export default async function PlanosPage() {
  const plans = await listActivePlans();

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
              <p className="mt-2 text-2xl font-semibold text-navy-900">
                R$ {(plan.precoCentavos / 100).toFixed(2).replace(".", ",")}
                <span className="text-sm font-normal text-neutral-500">/mes</span>
              </p>
              <p className="mt-2 text-xs text-neutral-500">Ate {plan.limiteUsuarios} usuarios</p>
            </div>
            <Link href={`/registro?plano=${plan.id}`} className="mt-6 block w-full rounded-md bg-navy-900 px-4 py-2 text-center text-sm font-semibold text-white hover:opacity-90 transition-colors">
              Comecar agora
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
