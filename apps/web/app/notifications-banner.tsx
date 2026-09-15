"use client";

import { useEffect, useState } from "react";
import { ackNotification, getPendingNotifications, type AgentNotification } from "@/lib/api";

/**
 * Mesma fila de notificacoes proativas que o app desktop mostra como
 * notificacao nativa do SO -- aqui aparece como um toast flutuante, pra
 * quem esta usando pelo navegador tambem ver o Jarvis avisando sozinho
 * (resumo da manha, compromisso chegando).
 */
export default function NotificationsBanner() {
  const [items, setItems] = useState<AgentNotification[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const pending = await getPendingNotifications();
      if (!cancelled && pending.length > 0) {
        setItems((prev) => [...prev, ...pending.filter((p) => !prev.some((x) => x.id === p.id))]);
      }
    }
    poll();
    const interval = setInterval(poll, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  function dismiss(id: string) {
    setItems((prev) => prev.filter((n) => n.id !== id));
    ackNotification(id);
  }

  if (items.length === 0) return null;

  return (
    <div className="notifications-stack">
      {items.map((n) => (
        <div key={n.id} className="notification-toast">
          <div className="notification-toast-title">{n.title}</div>
          <div className="notification-toast-body">{n.body}</div>
          <button className="chat-listen" style={{ marginTop: 6 }} onClick={() => dismiss(n.id)}>
            dispensar
          </button>
        </div>
      ))}
    </div>
  );
}
