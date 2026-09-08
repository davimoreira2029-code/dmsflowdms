/** Item 30: trial de 7 dias. Função pura — sem I/O. */
export function isTrialExpired(trialEndsAt: Date, now: Date = new Date()): boolean {
  return now > trialEndsAt;
}

/** Dias restantes de trial, sempre >= 0 (nunca negativo, mesmo se já venceu). */
export function daysRemainingInTrial(trialEndsAt: Date, now: Date = new Date()): number {
  const diffMs = trialEndsAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}
