import { clsx } from "clsx";
import type { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes } from "react";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-navy-900 text-white hover:bg-navy-800",
        variant === "secondary" &&
          "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "w-full rounded-md border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition-colors placeholder:text-neutral-400 focus:border-navy-600 focus:ring-1 focus:ring-navy-600",
        className,
      )}
      {...props}
    />
  );
}

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className="mb-1.5 block text-sm font-medium text-neutral-800" {...props} />;
}

export function FormMessage({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  return (
    <p
      className={clsx(
        "rounded-md px-3 py-2 text-sm",
        tone === "error" && "bg-red-50 text-red-700",
        tone === "success" && "bg-emerald-50 text-emerald-700",
      )}
    >
      {children}
    </p>
  );
}

export function Badge({ children, tone }: { children: React.ReactNode; tone: BadgeTone }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone === "pending" && "bg-amber-100 text-amber-800",
        tone === "approved" && "bg-blue-100 text-blue-800",
        tone === "rejected" && "bg-red-100 text-red-800",
        tone === "completed" && "bg-emerald-100 text-emerald-800",
        tone === "neutral" && "bg-neutral-100 text-neutral-700",
      )}
    >
      {children}
    </span>
  );
}

export type BadgeTone = "pending" | "approved" | "rejected" | "completed" | "neutral";

const STATUS_TO_TONE: Record<string, BadgeTone> = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  COMPLETED: "completed",
  EXPIRED: "neutral",
  CANCELED: "neutral",
};

/** Converte qualquer string de status (mesmo não tipada) em um tone válido do Badge. */
export function toneForStatus(status: string): BadgeTone {
  return STATUS_TO_TONE[status] ?? "neutral";
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-navy-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}
