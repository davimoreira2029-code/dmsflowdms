import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getPlatformDashboard } from "@/server/services/platform-admin.service";
import { StatCard } from "@/components/ui";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const stats = await getPlatformDashboard();

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <h1 className="text-2xl font-semibold text-navy-900">Dashboard da plataforma</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total de empresas" value={stats.totalCompanies} />
        <StatCard label="Empresas ativas" value={stats.empresasAtivas} />
        <StatCard label="Em trial" value={stats.empresasEmTrial} />
        <StatCard label="Suspensas" value={stats.empresasSuspensas} />
        <StatCard label="Canceladas" value={stats.empresasCanceladas} />
        <StatCard label="Usuários (todas as empresas)" value={stats.totalUsers} />
      </div>
    </div>
  );
}
