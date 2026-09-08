"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button, Input, Label, FormMessage } from "@/components/ui";

export default function ChangePasswordPage() {
  const [currentTemporaryPassword, setCurrentTemporaryPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentTemporaryPassword, newPassword, confirmNewPassword }),
    });
    const json = await res.json();
    setLoading(false);

    if (!json.success) {
      setError(json.message);
      return;
    }

    setDone(true);
    setTimeout(() => signOut({ callbackUrl: "/login" }), 1500);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
      <div className="w-full max-w-sm">
        <p className="mb-1 text-center text-xs font-medium uppercase tracking-widest text-gold-500">
          DMS FLOW
        </p>
        <h1 className="mb-2 text-center text-xl font-semibold text-navy-900">
          Crie uma nova senha
        </h1>
        <p className="mb-6 text-center text-sm text-neutral-600">
          Por segurança, você precisa criar uma nova senha antes de continuar.
        </p>

        {done ? (
          <FormMessage tone="success">Senha alterada com sucesso. Redirecionando para o login...</FormMessage>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="temp">Senha temporária</Label>
              <Input
                id="temp"
                type={showCurrent ? "text" : "password"}
                required
                value={currentTemporaryPassword}
                onChange={(e) => setCurrentTemporaryPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowCurrent((v) => !v)} className="mt-1 text-xs text-neutral-600 hover:underline">
                {showCurrent ? "Ocultar senha" : "Mostrar senha"}
              </button>
            </div>
            <div>
              <Label htmlFor="new">Nova senha</Label>
              <Input
                id="new"
                type={showNew ? "text" : "password"}
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowNew((v) => !v)} className="mt-1 text-xs text-neutral-600 hover:underline">
                {showNew ? "Ocultar senha" : "Mostrar senha"}
              </button>
            </div>
            <div>
              <Label htmlFor="confirm">Confirmar nova senha</Label>
              <Input
                id="confirm"
                type="password"
                required
                minLength={8}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowConfirm((v) => !v)} className="mt-1 text-xs text-neutral-600 hover:underline">
                {showConfirm ? "Ocultar senha" : "Mostrar senha"}
              </button>
            </div>

            {error && <FormMessage tone="error">{error}</FormMessage>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Salvando..." : "Definir nova senha"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
