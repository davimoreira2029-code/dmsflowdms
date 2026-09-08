/**
 * Item 18: "Não permitir que usuários comuns visualizem informações
 * pessoais além do necessário para sua função." Mascara tudo exceto os
 * últimos 2 dígitos. Função pura, sem I/O.
 */
export function maskCpf(cpf: string | null | undefined): string | null {
  if (!cpf) return null;

  const digits = cpf.replace(/\D/g, "");
  if (digits.length < 2) return "***";

  const lastTwo = digits.slice(-2);
  return `***.***.***-${lastTwo}`;
}
