import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { listEnabledModules, type ModuleCode } from "@/server/services/module.service";
import { countUnread } from "@/server/services/notification.service";
import { daysRemainingInTrial, isTrialExpired } from "@/server/services/billing-rules";
import { LogoutButton } from "@/features/auth/logout-button";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  /** Se ausente, o item aparece para qualquer empresa (ex.: Configurações). */
  module?: ModuleCode;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/servicos", label: "Serviços", icon: "⚰️", module: "GESTAO_FUNERARIA" },
  { href: "/checklists", label: "Checklists", icon: "📋", module: "GESTAO_FUNERARIA" },
  { href: "/tarefas", label: "Tarefas", icon: "📝" },
  { href: "/veiculos", label: "Veículos", icon: "🚗", module: "VEICULOS" },
  { href: "/equipe", label: "Equipe", icon: "👥", module: "EQUIPE" },
  { href: "/estoque", label: "Estoque", icon: "📦", module: "ESTOQUE" },
  { href: "/urnas", label: "Urnas", icon: "⚱️", module: "PRODUTOS" },
  { href: "/notificacoes", label: "Notificações", icon: "🔔", module: "NOTIFICACOES" },
  { href: "/relatorios", label: "Relatórios", icon: "📊", module: "RELATORIOS" },
  { href: "/configuracoes", label: "Configurações", icon: "⚙️" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // O middleware já protege estas rotas — isto é a segunda camada
  // (defesa em profundidade), igual às demais páginas server-side do projeto.
  if (!session?.user) {
    redirect("/login");
  }

  const { companyId, name, role } = session.user;

  // SUPER_ADMIN não tem empresa — não deveria estar em rotas (app)/*.
  if (!companyId) {
    redirect("/admin/password-recovery");
  }

  const enabledModules = await listEnabledModules(companyId);
  const visibleItems = NAV_ITEMS.filter((item) => !item.module || enabledModules.includes(item.module));

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { nomeFantasia: true, logoUrl: true, status: true, trialEndsAt: true },
  });

  // Item 30: trial vencido bloqueia o app, mas permite login (para
  // contratar um plano) e nunca apaga dado nenhum — só troca a tela.
  if (company?.status === "EXPIRED") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
        <div className="max-w-sm text-center">
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-gold-500">DMS FLOW</p>
          <h1 className="mb-2 text-xl font-semibold text-navy-900">Seu período de teste terminou</h1>
          <p className="mb-6 text-sm text-neutral-600">
            Seus dados estão salvos e seguros. Escolha um plano para continuar usando a plataforma.
          </p>
          <a
            href="/planos"
            className="inline-block rounded-md bg-navy-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-800"
          >
            Ver planos
          </a>
        </div>
      </div>
    );
  }

  const trialDaysRemaining =
    company?.status === "TRIAL" && company.trialEndsAt ? daysRemainingInTrial(company.trialEndsAt) : null;
  const trialIsExpiringSoon =
    company?.status === "TRIAL" && company.trialEndsAt && !isTrialExpired(company.trialEndsAt);

  const unreadCount = await countUnread(companyId, session.user.id);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col bg-navy-950 text-white md:flex">
        <div className="px-6 py-6">
          <p className="text-xs font-medium uppercase tracking-widest text-gold-400">DMS FLOW</p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-200 hover:bg-navy-900 hover:text-white"
            >
              <span>{item.icon}</span>
              {item.label}
              {item.href === "/notificacoes" && unreadCount > 0 && (
                <span className="ml-auto rounded-full bg-gold-500 px-1.5 py-0.5 text-[10px] font-semibold text-navy-950">
                  {unreadCount}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            {company?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logoUrl} alt={company.nomeFantasia} className="h-8 w-8 rounded object-contain" />
            ) : null}
            <div>
              <p className="text-sm font-medium text-navy-900">{company?.nomeFantasia}</p>
              <p className="text-xs text-neutral-400">Olá, {name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-neutral-400">{role}</span>
            <LogoutButton />
          </div>
        </header>
        {trialIsExpiringSoon && (
          <div className="flex items-center justify-between bg-gold-100 px-6 py-2 text-sm text-navy-900">
            <span>Seu período de teste termina em {trialDaysRemaining} dia(s).</span>
            <a href="/planos" className="font-medium underline">
              Escolher plano
            </a>
          </div>
        )}
        <main className="flex-1 bg-neutral-50">{children}</main>
      </div>
    </div>
  );
}
