/**
 * Rate limiter simples em memória (janela deslizante por contagem).
 *
 * LIMITAÇÃO CONHECIDA: em memória do processo Node — funciona bem para
 * um único servidor, mas não é compartilhado entre múltiplas instâncias
 * (ex.: deploy com vários containers atrás de um load balancer). Se a
 * plataforma escalar horizontalmente, trocar por um backend
 * compartilhado (Redis) usando a mesma interface `check`/`reset`.
 *
 * Fábrica em vez de módulo com Map global: permite testes isolados sem
 * estado vazando entre casos de teste.
 */
export function createRateLimiter() {
  const store = new Map<string, { count: number; windowStart: number }>();

  return {
    /** Retorna `true` se a tentativa é permitida, `false` se o limite foi atingido. */
    check(key: string, maxAttempts: number, windowMs: number, now: number = Date.now()): boolean {
      const entry = store.get(key);

      if (!entry || now - entry.windowStart > windowMs) {
        store.set(key, { count: 1, windowStart: now });
        return true;
      }

      if (entry.count >= maxAttempts) {
        return false;
      }

      entry.count += 1;
      return true;
    },

    /** Limpa o contador — usado após sucesso (ex.: login correto). */
    reset(key: string) {
      store.delete(key);
    },
  };
}

export type RateLimiter = ReturnType<typeof createRateLimiter>;

// Instâncias singleton para uso real da aplicação.
export const loginRateLimiter = createRateLimiter();
export const forgotPasswordRateLimiter = createRateLimiter();
