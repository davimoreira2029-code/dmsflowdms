import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { listProducts } from "@/server/services/inventory.service";
import { Badge } from "@/components/ui";
import { NewProductForm } from "@/features/inventory/new-product-form";

const CATEGORIA_LABEL: Record<string, string> = {
  URNAS: "Urnas",
  MATERIAIS: "Materiais",
  EPIS: "EPIs",
  PRODUTOS_LABORATORIAIS: "Produtos laboratoriais",
  ORNAMENTACAO: "Ornamentação",
  LIMPEZA: "Limpeza",
  OUTROS: "Outros",
};

export default async function EstoquePage() {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const products = await listProducts(session.user.companyId);
  const belowMinimumCount = products.filter((p) => p.abaixoDoMinimo).length;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy-900">Estoque</h1>
        {belowMinimumCount > 0 && (
          <Badge tone="rejected">{belowMinimumCount} item(ns) abaixo do mínimo</Badge>
        )}
      </div>

      {products.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-200 px-6 py-8 text-center text-sm text-neutral-500">
          Nenhum produto cadastrado ainda.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-600">
              <tr>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Quantidade</th>
                <th className="px-4 py-3">Mínimo</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Link href={`/estoque/${p.id}`} className="font-medium text-navy-700 hover:underline">
                      {p.nome}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{CATEGORIA_LABEL[p.categoria] ?? p.categoria}</td>
                  <td className="px-4 py-3">
                    {p.quantidade} {p.unidade}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{p.estoqueMinimo}</td>
                  <td className="px-4 py-3">
                    {p.abaixoDoMinimo && <Badge tone="rejected">Abaixo do mínimo</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Cadastrar produto
        </h2>
        <NewProductForm />
      </section>
    </div>
  );
}
