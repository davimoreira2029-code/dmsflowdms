"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input, Label, FormMessage } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const json = await res.json();

    setLoading(false);
    setSubmitted(true);
    setMessage(json.message);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
      <div className="w-full max-w-sm">
        <p className="mb-1 text-center text-xs font-medium uppercase tracking-widest text-gold-500">
          DMS FLOW
        </p>
        <h1 className="mb-2 text-center text-xl font-semibold text-navy-900">Recuperar acesso</h1>
        <p className="mb-6 text-center text-sm text-neutral-600">
          Digite o e-mail cadastrado. Sua solicitação será analisada pelo administrador do sistema.
        </p>

        {submitted ? (
          <FormMessage tone="success">{message}</FormMessage>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail cadastrado</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Enviando..." : "Solicitar recuperação"}
            </Button>
          </form>
        )}

        <div className="mt-4 text-center text-sm">
          <Link href="/login" className="text-navy-700 hover:underline">
            Voltar ao login
          </Link>
        </div>
      </div>
    </main>
  );
}
