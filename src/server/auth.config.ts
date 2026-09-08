import type { NextAuthConfig } from "next-auth";

/**
 * Config "leve" do Auth.js: sem Credentials Provider, sem bcrypt, sem
 * chamadas ao Prisma. Existe só para o middleware (Edge Runtime), que
 * não suporta APIs Node.js nem o engine nativo do Prisma.
 *
 * O middleware usa isso apenas para leitura rápida das claims do JWT
 * (role, companyId, mustChangePassword) para redirecionar a UX. Ele NÃO
 * é a fonte de verdade de segurança — cada rota de API e Server Component
 * valida de novo com a config completa (server/auth.ts), que roda em
 * Node.js e confere o session_version contra o banco a cada requisição.
 */
export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    session({ session, token }) {
      session.user.id = token.sub as string;
      session.user.role = token.role;
      session.user.companyId = token.companyId;
      session.user.mustChangePassword = token.mustChangePassword;
      return session;
    },
  },
};
