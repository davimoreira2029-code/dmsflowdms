"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, FormMessage } from "@/components/ui";

const MAX_LOGO_BYTES = 500 * 1024; // 500KB — arquivo original, antes do base64 inflar ~33%

export function CompanyBrandingForm({
  initialNomeFantasia,
  initialLogoUrl,
}: {
  initialNomeFantasia: string;
  initialLogoUrl: string | null;
}) {
  const router = useRouter();
  const [nomeFantasia, setNomeFantasia] = useState(initialNomeFantasia);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialLogoUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Envie um arquivo de imagem (PNG, JPG ou SVG).");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError("Imagem muito grande — envie um arquivo de até 500KB.");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const res = await fetch("/api/companies/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nomeFantasia, logoUrl: logoPreview ?? undefined }),
    });
    const json = await res.json();
    setLoading(false);

    if (!json.success) {
      setError(json.message);
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
          {logoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoPreview} alt="Logo da empresa" className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs text-neutral-400">Sem logo</span>
          )}
        </div>
        <div>
          <Label htmlFor="logo">Logo da empresa</Label>
          <input
            id="logo"
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="text-sm text-neutral-600"
          />
          <p className="mt-1 text-xs text-neutral-400">PNG, JPG ou SVG — até 500KB.</p>
        </div>
      </div>

      <div>
        <Label htmlFor="nomeFantasia">Nome exibido na plataforma</Label>
        <Input
          id="nomeFantasia"
          required
          value={nomeFantasia}
          onChange={(e) => setNomeFantasia(e.target.value)}
        />
      </div>

      {error && <FormMessage tone="error">{error}</FormMessage>}
      {success && <FormMessage tone="success">Identidade da empresa atualizada.</FormMessage>}

      <Button type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Salvar identidade"}
      </Button>
    </form>
  );
}
