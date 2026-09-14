"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendChat } from "@/lib/api";

export default function PlanDayButton() {
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setReply(null);
    try {
      const response = await sendChat(
        "Planeje meu dia: liste minhas tarefas pendentes e diga por onde comecar."
      );
      setReply(response);
      router.refresh();
    } catch (err) {
      setReply(err instanceof Error ? err.message : "erro ao planejar o dia");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <button onClick={handleClick} disabled={loading} className="plan-button">
        {loading ? "Planejando..." : "Planejar meu dia"}
      </button>
      {reply && <p className="agent-reply">{reply}</p>}
    </section>
  );
}
