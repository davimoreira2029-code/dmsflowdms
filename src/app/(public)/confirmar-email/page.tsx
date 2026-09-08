"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FormMessage } from "@/components/ui";

function ConfirmarEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Link de confirmação inválido.");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((json) => {
        setStatus(json.success ? "success" : "error");
        setMessage(json.message);
      })
      .catch(() => {
        setStatus("error");
        setMessage("Não foi possível confirmar o e-mail. Tente novamente.");
      });
  }, [token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
      <div className="w-full max-w-sm text-center">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-gold-500">DMS FLOW</p>
        <h1 className="mb-6 text-xl font-semibold text-navy-900">Confirmação de e-mail</h1>

        {status === "loading" && <p className="text-sm text-neutral-600">Confirmando...</p>}
        {status === "success" && <FormMessage tone="success">{message}</FormMessage>}
        {status === "error" && <FormMessage tone="error">{message}</FormMessage>}

        <div className="mt-6">
          <Link href="/login" className="text-sm text-navy-700 hover:underline">
            Ir para o login
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ConfirmarEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
          <p className="text-sm text-neutral-600">Carregando...</p>
        </main>
      }
    >
      <ConfirmarEmailContent />
    </Suspense>
  );
}
