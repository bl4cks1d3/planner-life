"use client";

import { useState } from "react";
import {
  createClient,
  deleteClient,
  updateClient,
  type Client,
  type ClientStage,
} from "@/lib/api";

const STAGES: { key: ClientStage; label: string }[] = [
  { key: "lead", label: "Leads" },
  { key: "contact", label: "Contato" },
  { key: "proposal", label: "Proposta" },
  { key: "closed", label: "Fechado" },
];

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export interface CrmViewProps {
  clients: Client[];
  onChange: () => void;
}

export default function CrmView({ clients, onChange }: CrmViewProps) {
  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft] = useState({ name: "", value: "", nextAction: "" });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState({ stage: "lead" as ClientStage, value: "", nextAction: "" });

  const funnel = STAGES.map((s) => {
    const inStage = clients.filter((c) => c.stage === s.key);
    return { ...s, count: inStage.length, value: inStage.reduce((sum, c) => sum + c.value, 0) };
  });

  async function handleCreate() {
    if (!draft.name.trim()) return;
    await createClient({
      name: draft.name.trim(),
      value: draft.value ? Number(draft.value) : undefined,
      nextAction: draft.nextAction.trim() || undefined,
    });
    setDraft({ name: "", value: "", nextAction: "" });
    setShowNew(false);
    onChange();
  }

  function startEdit(c: Client) {
    setEditingId(c.id);
    setEdit({ stage: c.stage, value: String(c.value), nextAction: c.nextAction ?? "" });
  }

  async function saveEdit(id: string) {
    await updateClient(id, {
      stage: edit.stage,
      value: edit.value ? Number(edit.value) : undefined,
      nextAction: edit.nextAction.trim() || undefined,
    });
    setEditingId(null);
    onChange();
  }

  async function handleDelete(id: string) {
    await deleteClient(id);
    onChange();
  }

  return (
    <div>
      <div className="view-header">
        <div>
          <div className="view-kicker">CRM</div>
          <h1 className="view-title">Clientes</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew((v) => !v)}>
          {showNew ? "Cancelar" : "+ Novo cliente"}
        </button>
      </div>

      {showNew && (
        <div className="pad-24 row-divider" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <input
            className="chat-input"
            style={{ flex: "1 1 180px" }}
            placeholder="Nome do cliente"
            value={draft.name}
            onChange={(e) => setDraft((s) => ({ ...s, name: e.target.value }))}
          />
          <input
            className="chat-input"
            style={{ flex: "0 1 140px" }}
            type="number"
            placeholder="Valor (R$)"
            value={draft.value}
            onChange={(e) => setDraft((s) => ({ ...s, value: e.target.value }))}
          />
          <input
            className="chat-input"
            style={{ flex: "1 1 200px" }}
            placeholder="Próxima ação (opcional)"
            value={draft.nextAction}
            onChange={(e) => setDraft((s) => ({ ...s, nextAction: e.target.value }))}
          />
          <button className="btn btn-primary" onClick={handleCreate}>
            Criar
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", borderBottom: "1px solid var(--color-divider)" }}>
        {funnel.map((f) => (
          <div key={f.key} className="col-divider row-divider" style={{ padding: "16px 24px" }}>
            <div className="stat-label">{f.label}</div>
            <div className="stat-value">{f.count}</div>
            <div style={{ fontSize: 11, color: "var(--color-neutral-700)" }}>{formatBRL(f.value)}</div>
          </div>
        ))}
      </div>

      <div className="pad-24" style={{ overflowX: "auto" }}>
        <table className="table" style={{ minWidth: 640 }}>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Estágio</th>
              <th>Valor</th>
              <th>Próxima ação</th>
              <th>Quando</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) =>
              editingId === c.id ? (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td>
                    <select
                      className="chat-input"
                      value={edit.stage}
                      onChange={(e) => setEdit((s) => ({ ...s, stage: e.target.value as ClientStage }))}
                    >
                      {STAGES.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className="chat-input"
                      type="number"
                      value={edit.value}
                      onChange={(e) => setEdit((s) => ({ ...s, value: e.target.value }))}
                    />
                  </td>
                  <td colSpan={2}>
                    <input
                      className="chat-input"
                      value={edit.nextAction}
                      onChange={(e) => setEdit((s) => ({ ...s, nextAction: e.target.value }))}
                    />
                  </td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-primary" onClick={() => saveEdit(c.id)}>
                      Salvar
                    </button>
                    <button className="btn btn-secondary" onClick={() => setEditingId(null)}>
                      Cancelar
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td>{STAGES.find((s) => s.key === c.stage)?.label ?? c.stage}</td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>{formatBRL(c.value)}</td>
                  <td style={{ color: "var(--color-neutral-700)" }}>{c.nextAction ?? "—"}</td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>{formatDate(c.nextActionAt)}</td>
                  <td style={{ display: "flex", gap: 6, whiteSpace: "nowrap" }}>
                    <button className="btn btn-secondary" onClick={() => startEdit(c)}>
                      Editar
                    </button>
                    <button className="btn btn-secondary" onClick={() => handleDelete(c.id)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              )
            )}
            {clients.length === 0 && (
              <tr>
                <td colSpan={6} style={{ color: "var(--color-neutral-700)" }}>
                  Nenhum cliente ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
