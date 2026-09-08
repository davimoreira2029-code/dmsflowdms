import { notFound, redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getProductDetail } from "@/server/services/inventory.service";
import { Badge } from "@/components/ui";
import { InventoryMovementForm } from "@/features/inventory/inventory-movement-form";

const TIPO_LABEL: Record<string, string> = {
  ENTRADA: "Entrada",
  SAIDA: "Saída",
  AJUSTE: "Ajuste",
};

export default async function ProdutoDetalhePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const product = await getProductDetail(params.id, session.user.companyId);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-6 py-8">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-navy-900">{product.nome}</h1>
        {product.abaixoDoMinimo && <Badge tone="rejected">Abaixo do mínimo</Badge>}
      </div>
      <p className="text-sm text-neutral-600">
        Quantidade atual: <strong>{product.quantidade}</strong> {product.unidade} — mínimo: {product.estoqueMinimo}
      </p>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Nova movimentação</h2>
        <InventoryMovementForm productId={product.id} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Histórico</h2>
        {product.movements.length === 0 ? (
          <p className="text-sm text-neutral-500">Nenhuma movimentação registrada.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-600">
                <tr>
                  <th className="px-4 py-2">Data</th>
                  <th className="px-4 py-2">Tipo</th>
                  <th className="px-4 py-2">Quantidade</th>
                  <th className="px-4 py-2">Motivo</th>
                  <th className="px-4 py-2">Usuário</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {product.movements.map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-2 text-neutral-600">
                      {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(m.createdAt)}
                    </td>
                    <td className="px-4 py-2">{TIPO_LABEL[m.tipo] ?? m.tipo}</td>
                    <td className="px-4 py-2">{m.quantidade}</td>
                    <td className="px-4 py-2 text-neutral-600">{m.motivo ?? "—"}</td>
                    <td className="px-4 py-2 text-neutral-600">{m.user?.name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
