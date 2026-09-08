"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, FormMessage } from "@/components/ui";

const STATUS_OPTIONS = [
  { value: "A_FAZER", label: "A fazer" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "CONCLUIDA", label: "Concluída" },
  { value: "CANCELADA", label: "Cancelada" },
];

export function TaskActions({ taskId, currentStatus }: { taskId: string; currentStatus: string }) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function changeStatus(status: string) {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/tasks/${taskId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    setLoading(false);

    if (!json.success) {
      setError(json.message);
      return;
    }
    router.refresh();
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: comment }),
    });
    const json = await res.json();
    setLoading(false);

    if (!json.success) {
      setError(json.message);
      return;
    }
    setComment("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.filter((o) => o.value !== currentStatus).map((o) => (
          <Button key={o.value} variant="secondary" disabled={loading} onClick={() => changeStatus(o.value)}>
            {o.label}
          </Button>
        ))}
      </div>

      {error && <FormMessage tone="error">{error}</FormMessage>}

      <form onSubmit={submitComment} className="flex gap-2">
        <Input
          placeholder="Adicionar comentário..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" variant="secondary" disabled={loading || !comment.trim()}>
          Comentar
        </Button>
      </form>
    </div>
  );
}
