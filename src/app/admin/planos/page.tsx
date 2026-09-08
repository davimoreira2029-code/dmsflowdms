import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { PlanEditRow } from "@/features/admin/plan-edit-row";

export default async function AdminPlanosPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const plans = await prisma.plan.findMany({ orderBy: { precoCentavos: "asc" } });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <h1 className="text-2xl font-semibold text-navy-900">Planos</h1>
      <p className="text-sm text-neutral-500">
        Preço, limite de usuários e status ficam salvos no banco — mudar aqui não exige deploy.
      </p>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-600">
            <tr>
              <th className="px-4 py-3">Plano</th>
              <th className="px-4 py-3">Preço/mês</th>
              <th className="px-4 py-3">Limite de usuários</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {plans.map((plan) => (
              <PlanEditRow key={plan.id} plan={plan} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
