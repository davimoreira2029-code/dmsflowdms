import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/server/auth.config";

/**
 * Proteção de rota em nível de middleware, rodando no Edge Runtime.
 * Usa a config LEVE (sem bcrypt/Prisma) — por isso as claims aqui
 * refletem o JWT no momento em que foi emitido, não uma checagem fresca
 * contra o banco. Isso é aceitável para redirecionamento de UX, mas
 * IMPORTANTE: não é a fonte de verdade de segurança — toda rota de API
 * e Server Component valida de novo com a config completa
 * (server/guards/require-role.ts + server/auth.ts), que roda em Node.js
 * e confere o session_version contra o banco a cada requisição.
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;
  const role = req.auth?.user?.role;
  const mustChangePassword = req.auth?.user?.mustChangePassword;

  const isAdminRoute = pathname.startsWith("/admin");
  const isAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/servicos") ||
    pathname.startsWith("/checklists") ||
    pathname.startsWith("/tarefas") ||
    pathname.startsWith("/veiculos") ||
    pathname.startsWith("/equipe") ||
    pathname.startsWith("/estoque") ||
    pathname.startsWith("/urnas") ||
    pathname.startsWith("/notificacoes") ||
    pathname.startsWith("/relatorios") ||
    pathname.startsWith("/configuracoes");
  const isChangePasswordRoute = pathname.startsWith("/change-password");

  if ((isAdminRoute || isAppRoute) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAdminRoute && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isLoggedIn && mustChangePassword && !isChangePasswordRoute) {
    return NextResponse.redirect(new URL("/change-password", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/servicos/:path*",
    "/checklists/:path*",
    "/tarefas/:path*",
    "/veiculos/:path*",
    "/equipe/:path*",
    "/estoque/:path*",
    "/urnas/:path*",
    "/notificacoes/:path*",
    "/relatorios/:path*",
    "/configuracoes/:path*",
    "/change-password",
  ],
};
