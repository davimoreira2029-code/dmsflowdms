"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label, FormMessage } from "@/components/ui";

const initialState = {
  razaoSocial: "",
  nomeFantasia: "",
  cnpj: "",
  telefone: "",
  whatsapp: "",
  email: "",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  adminNome: "",
  adminEmail: "",
  adminTelefone: "",
  adminSenha: "",
};

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  function update<K extends keyof typeof initialState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setLoading(false);

    if (!json.success) {
      setError(json.message);
      return;
    }

    router.push("/login?registrado=1");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-12">
      <p className="mb-1 text-center text-xs font-medium uppercase tracking-widest text-gold-500">
        DMS FLOW
      </p>
      <h1 className="mb-8 text-center text-2xl font-semibold text-navy-900">
        Criar conta — teste grátis por 7 dias
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <fieldset className="space-y-4">
          <legend className="mb-2 text-sm font-semibold text-navy-800">Dados da empresa</legend>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="razaoSocial">Razão social</Label>
              <Input id="razaoSocial" required value={form.razaoSocial} onChange={(e) => update("razaoSocial", e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label htmlFor="nomeFantasia">Nome fantasia</Label>
              <Input id="nomeFantasia" required value={form.nomeFantasia} onChange={(e) => update("nomeFantasia", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input id="cnpj" required value={form.cnpj} onChange={(e) => update("cnpj", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">E-mail da empresa</Label>
              <Input id="email" type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" value={form.telefone} onChange={(e) => update("telefone", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="cep">CEP</Label>
              <Input id="cep" value={form.cep} onChange={(e) => update("cep", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" value={form.cidade} onChange={(e) => update("cidade", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="endereco">Endereço</Label>
              <Input id="endereco" value={form.endereco} onChange={(e) => update("endereco", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="numero">Número</Label>
              <Input id="numero" value={form.numero} onChange={(e) => update("numero", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="complemento">Complemento</Label>
              <Input id="complemento" value={form.complemento} onChange={(e) => update("complemento", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="bairro">Bairro</Label>
              <Input id="bairro" value={form.bairro} onChange={(e) => update("bairro", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="estado">Estado</Label>
              <Input id="estado" maxLength={2} placeholder="MG" value={form.estado} onChange={(e) => update("estado", e.target.value)} />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-2 text-sm font-semibold text-navy-800">Administrador da conta</legend>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="adminNome">Nome completo</Label>
              <Input id="adminNome" required value={form.adminNome} onChange={(e) => update("adminNome", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="adminEmail">E-mail (login)</Label>
              <Input id="adminEmail" type="email" required value={form.adminEmail} onChange={(e) => update("adminEmail", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="adminTelefone">Telefone</Label>
              <Input id="adminTelefone" value={form.adminTelefone} onChange={(e) => update("adminTelefone", e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label htmlFor="adminSenha">Senha</Label>
              <Input
                id="adminSenha"
                type="password"
                required
                minLength={8}
                value={form.adminSenha}
                onChange={(e) => update("adminSenha", e.target.value)}
              />
            </div>
          </div>
        </fieldset>

        {error && <FormMessage tone="error">{error}</FormMessage>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Criando conta..." : "Testar gratuitamente"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-600">
        Já tem conta?{" "}
        <Link href="/login" className="text-navy-700 hover:underline">
          Entrar
        </Link>
      </p>
    </main>
  );
}
