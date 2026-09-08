import Link from "next/link";
import type { OnboardingStep } from "@/server/services/onboarding.service";

export function OnboardingCard({ steps, percent }: { steps: OnboardingStep[]; percent: number }) {
  if (percent === 100) return null;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-navy-900">Configuração da empresa: {percent}%</p>
      </div>
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div className="h-full bg-gold-500" style={{ width: `${percent}%` }} />
      </div>
      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.key} className="flex items-center justify-between text-sm">
            <span className={step.done ? "text-neutral-400 line-through" : "text-neutral-700"}>
              {step.done ? "✓ " : "○ "}
              {step.label}
            </span>
            {!step.done && (
              <Link href={step.href} className="text-xs font-medium text-navy-700 hover:underline">
                Fazer agora
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
