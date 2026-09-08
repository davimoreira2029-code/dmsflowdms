"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, FormMessage } from "@/components/ui";

export function PasswordRecoveryActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "approving" | "rejecting">("idle");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [showTemporaryPassword, setShowTemporaryPassword] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleApprove(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/admin/password-recovery/${requestId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ temporaryPassword }),
    });
    const json = await res.json();
    setLoading(false);

    if (!json.success) {
      setError(json.message);
      return;
    }

    setSuccess(json.message);
    setMode("idle");
    router.refresh();
  }

  async function handleReject(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/admin/password-recovery/${requestId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminNotes }),
    });
    const json = await res.json();
    setLoading(false);

    if (!json.success) {
      setError(json.message);
      return;
    }

    setSuccess(json.message);
    setMode("idle");
    router.refresh();
  }

  if (success) return <FormMessage tone="success">{success}</FormMessage>;

  if (mode === "approving") {
    return (
      <form onSubmit={handleApprove} className="space-y-4 rounded-lg border border-neutral-200 p-5">
        <h3 className="font-medium text-navy-900">Redefinir senha do usuário</h3>
        <div>
          <Label htmlFor="temp-password">Nova senha temporária</Label>
          <div className="relative">
            <Input
              id="temp-password"
              type={showTemporaryPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              value={temporaryPassword}
              onChange={(e) => setTemporaryPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="pr-16"
            />
            <button
              type="button"
              onClick={() => setShowTemporaryPassword((value) => !value)}
              className="absolute inset-y-0 right-2 my-auto h-8 rounded px-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
              aria-label={showTemporaryPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showTemporaryPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            O usuário será obrigado a criar uma senha própria no primeiro acesso.
          </p>
        </div>
        {error && <FormMessage tone="error">{error}</FormMessage>}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Definir nova senha"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setMode("idle")}>
            Cancelar
          </Button>
        </div>
      </form>
    );
  }

  if (mode === "rejecting") {
    return (
      <form onSubmit={handleReject} className="space-y-4 rounded-lg border border-neutral-200 p-5">
        <h3 className="font-medium text-navy-900">Rejeitar solicitação</h3>
        <div>
          <Label htmlFor="notes">Observações (opcional)</Label>
          <Input
            id="notes"
            type="text"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
          />
        </div>
        {error && <FormMessage tone="error">{error}</FormMessage>}
        <div className="flex gap-2">
          <Button type="submit" variant="danger" disabled={loading}>
            {loading ? "Rejeitando..." : "Confirmar rejeição"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setMode("idle")}>
            Cancelar
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex gap-2">
      <Button onClick={() => setMode("approving")}>Aprovar</Button>
      <Button variant="danger" onClick={() => setMode("rejecting")}>
        Rejeitar
      </Button>
    </div>
  );
}
