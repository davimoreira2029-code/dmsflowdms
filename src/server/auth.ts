import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/server/db";
import { authConfig } from "@/server/auth.config";
import { loginRateLimiter } from "@/server/rate-limit";

/**
 * Config COMPLETA do Auth.js — usa bcrypt e Prisma, portanto só pode
 * rodar em Node.js (Route Handlers, Server Components, Server Actions).
 * NUNCA importar este arquivo a partir de `middleware.ts` — para isso
 * existe `auth.config.ts`, que é Edge-safe.
 *
 * DECISÃO TÉCNICA: sessão JWT, não sessão em banco. O Credentials
 * Provider do Auth.js não é compatível com estratégia de sessão em
 * banco (não há Account OAuth para vincular). Para invalidar sessões
 * após redefinição administrativa de senha, usamos um contador
 * `sessionVersion` no usuário, conferido a cada requisição no callback
 * `jwt` — é o único lugar em que o Auth.js aceita retornar `null` para
 * invalidar a sessão oficialmente.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().toLowerCase().trim();
        const password = credentials?.password?.toString();

        if (!email || !password) return null;

        // Item 8: "controle de tentativas; rate limiting". Limite por
        // e-mail (não por IP — mais simples e cobre o cenário principal
        // de força bruta contra uma conta específica). Resposta
        // permanece genérica (null) — não revela que o bloqueio foi por
        // rate limit em vez de senha errada, evitando enumeração.
        if (!loginRateLimiter.check(email, 5, 15 * 60 * 1000)) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: { company: { select: { status: true } } },
        });
        if (!user) return null;
        if (user.status !== "ACTIVE") return null;
        if (user.company && (user.company.status === "SUSPENDED" || user.company.status === "CANCELED")) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) return null;

        loginRateLimiter.reset(email);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          mustChangePassword: user.mustChangePassword,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      // No login inicial, `user` vem do authorize() acima.
      if (user) {
        token.role = user.role;
        token.companyId = user.companyId;
        token.mustChangePassword = user.mustChangePassword;
        token.sessionVersion = user.sessionVersion;
        return token;
      }

      // Requisições seguintes: confere se a sessão ainda é válida.
      const currentUser = await prisma.user.findUnique({
        where: { id: token.sub },
        select: {
          status: true,
          sessionVersion: true,
          mustChangePassword: true,
          role: true,
          companyId: true,
          company: { select: { status: true } },
        },
      });

      if (!currentUser || currentUser.status !== "ACTIVE") {
        return null; // invalida a sessão — usuário será deslogado
      }

      // SUPER_ADMIN não pertence a nenhuma empresa (companyId null) —
      // só usuários de tenant são afetados por bloqueio de empresa.
      if (
        currentUser.company &&
        (currentUser.company.status === "SUSPENDED" || currentUser.company.status === "CANCELED")
      ) {
        return null; // empresa bloqueada pelo Super Admin: derruba a sessão
      }

      if (currentUser.sessionVersion !== token.sessionVersion) {
        return null; // senha foi redefinida pelo admin: derruba a sessão
      }

      // Mantém o token sincronizado com mudanças que não exigem logout
      // (ex.: must_change_password virando false após a troca).
      token.role = currentUser.role;
      token.companyId = currentUser.companyId;
      token.mustChangePassword = currentUser.mustChangePassword;

      return token;
    },
  },
});
