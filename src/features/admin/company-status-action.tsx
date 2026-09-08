"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, FormMessage } from "@/components/ui";

export function CompanyStatusAction({ companyId, currentStatus }: { companyId: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSuspended = currentStatus === "SUSPENDED";

  async function toggle() {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/admin/companies/${companyId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: isSuspended ? "ACTIVE" : "SUSPENDED" }),
    });
    const json = await res.json();
    setLoading(false);

    if (!json.success) {
      setError(json.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button variant={isSuspended ? "primary" : "danger"} disabled={loading} onClick={toggle}>
        {isSuspended ? "Reativar empresa" : "Bloquear empresa"}
      </Button>
      {error && <FormMessage tone="error">{error}</FormMessage>}
    </div>
  );
}
