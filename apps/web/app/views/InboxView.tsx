"use client";

import { useState } from "react";
import { GOOGLE_CONNECT_URL, createMessage, getMessageBody, type GoogleAccount, type InboxMessage } from "@/lib/api";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export interface InboxViewProps {
  messages: InboxMessage[];
  googleAccounts: GoogleAccount[];
  onToggleHandled: (message: InboxMessage) => void;
  onSyncGmail: () => void;
  syncing: boolean;
  onChange: () => void;
}

export default function InboxView({
  messages,
  googleAccounts,
  onToggleHandled,
  onSyncGmail,
  syncing,
  onChange,
}: InboxViewProps) {
  const connected = googleAccounts.length > 0;
  const [openId, setOpenId] = useState<string | null>(null);
  const [bodies, setBodies] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft] = useState({ from: "", subject: "", snippet: "" });

  async function handleCreate() {
    if (!draft.from.trim() || !draft.subject.trim()) return;
    await createMessage({
      from: draft.from.trim(),
      subject: draft.subject.trim(),
      snippet: draft.snippet.trim() || undefined,
    });
    setDraft({ from: "", subject: "", snippet: "" });
    setShowNew(false);
    onChange();
  }

  async function handleRead(m: InboxMessage) {
    if (openId === m.id) {
      setOpenId(null);
      return;
    }
    setOpenId(m.id);
    if (bodies[m.id] || !m.id.startsWith("gmail-")) return;
    setLoadingId(m.id);
    try {
      const { body } = await getMessageBody(m.id);
      setBodies((prev) => ({ ...prev, [m.id]: body }));
    } catch (err) {
      setBodies((prev) => ({ ...prev, [m.id]: err instanceof Error ? err.message : "falha ao ler o e-mail" }));
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div>
      <div className="view-header">
        <div>
          <div className="view-kicker">
            {connected
              ? `Gmail · ${googleAccounts.length} conta${googleAccounts.length > 1 ? "s" : ""} sincronizada${googleAccounts.length > 1 ? "s" : ""}`
              : "Inbox local (Gmail ainda não conectado)"}
          </div>
          <h1 className="view-title">Inbox</h1>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {connected && (
            <button className="btn btn-secondary" onClick={onSyncGmail} disabled={syncing}>
              {syncing ? "Sincronizando…" : "🔄 Sincronizar agora"}
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => setShowNew((v) => !v)}>
            {showNew ? "Cancelar" : "+ Adicionar manual"}
          </button>
          <a href={GOOGLE_CONNECT_URL} className="btn btn-secondary">
            + Conectar conta do Gmail
          </a>
        </div>
      </div>

      {showNew && (
        <div className="pad-24 row-divider" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <input
            className="chat-input"
            style={{ flex: "1 1 160px" }}
            placeholder="De (remetente)"
            value={draft.from}
            onChange={(e) => setDraft((s) => ({ ...s, from: e.target.value }))}
          />
          <input
            className="chat-input"
            style={{ flex: "2 1 220px" }}
            placeholder="Assunto"
            value={draft.subject}
            onChange={(e) => setDraft((s) => ({ ...s, subject: e.target.value }))}
          />
          <input
            className="chat-input"
            style={{ flex: "2 1 220px" }}
            placeholder="Resumo (opcional)"
            value={draft.snippet}
            onChange={(e) => setDraft((s) => ({ ...s, snippet: e.target.value }))}
          />
          <button className="btn btn-primary" onClick={handleCreate}>
            Adicionar
          </button>
        </div>
      )}

      {!connected && (
        <div className="pad-24" style={{ color: "var(--color-neutral-700)", fontSize: 13 }}>
          Este inbox já é real (persistido no Planner Core), mas ainda não sincroniza com o Gmail --
          clique em &quot;Conectar conta do Gmail&quot; acima. Mensagens abaixo foram adicionadas manualmente
          ou por outra integração.
        </div>
      )}

      {messages.map((m) => (
        <div key={m.id} className="row-divider" style={{ padding: "14px 24px", opacity: m.handled ? 0.6 : 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: "8px 16px" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", alignItems: "baseline" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{m.from}</span>
                {m.tag && (
                  <span
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.03em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      color: "var(--color-accent-700)",
                    }}
                  >
                    {m.tag}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 14, marginTop: 2, textDecoration: m.handled ? "line-through" : "none" }}>
                {m.subject}
              </div>
              {m.snippet && <div style={{ fontSize: 12, color: "var(--color-neutral-700)" }}>{m.snippet}</div>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <span style={{ fontSize: 11, color: "var(--color-neutral-700)", fontVariantNumeric: "tabular-nums" }}>
                {formatTime(m.receivedAt)}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                {m.id.startsWith("gmail-") && (
                  <button className="btn btn-secondary" onClick={() => handleRead(m)}>
                    {openId === m.id ? "Fechar" : "Ler"}
                  </button>
                )}
                <button className="btn btn-secondary" onClick={() => onToggleHandled(m)}>
                  {m.handled ? "Desmarcar" : "Tratada"}
                </button>
              </div>
            </div>
          </div>
          {openId === m.id && (
            <div
              style={{
                marginTop: 12,
                padding: 14,
                background: "var(--color-neutral-100)",
                borderRadius: "var(--radius-sm)",
                fontSize: 13,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                maxHeight: 320,
                overflowY: "auto",
              }}
            >
              {loadingId === m.id ? "Carregando…" : bodies[m.id]}
            </div>
          )}
        </div>
      ))}
      {messages.length === 0 && (
        <p className="pad-24" style={{ color: "var(--color-neutral-700)", fontSize: 14 }}>
          Nenhuma mensagem ainda.
        </p>
      )}
    </div>
  );
}
