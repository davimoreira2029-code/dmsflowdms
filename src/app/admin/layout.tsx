import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/server/auth";
import { LogoutButton } from "@/features/auth/logout-button";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/admin/empresas", label: "Empresas", icon: "🏢" },
  { href: "/admin/planos", label: "Planos", icon: "💳" },
  { href: "/admin/password-recovery", label: "Recuperações de senha", icon: "🔐" },
  { href: "/admin/logs", label: "Logs", icon: "🧾" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Segunda camada de proteção (defesa em profundidade) — o middleware
  // já barra isso, mas nunca confiamos só nele.
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col bg-navy-950 text-white md:flex">
        <div className="px-6 py-6">
          <p className="text-xs font-medium uppercase tracking-widest text-gold-400">DMS FLOW</p>
          <p className="mt-1 text-xs text-neutral-400">Painel administrativo</p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-200 hover:bg-navy-900 hover:text-white"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
          <p className="text-sm text-neutral-500">Super Admin — {session.user.name}</p>
          <LogoutButton />
        </header>
        <main className="flex-1 bg-neutral-50">{children}</main>
      </div>
    </div>
  );
}
