"use client";

import { useState } from "react";
import { createSubject, deleteSubject, updateSubject, type Subject, type Task } from "@/lib/api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export interface EstudosViewProps {
  subjects: Subject[];
  tasks: Task[];
  onChange: () => void;
}

export default function EstudosView({ subjects, tasks, onChange }: EstudosViewProps) {
  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft] = useState({ name: "", note: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState({ progress: "", note: "" });

  const deliveries = tasks
    .filter((t) => t.dueAt && t.status !== "done" && t.status !== "cancelled")
    .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime());

  async function handleCreate() {
    if (!draft.name.trim()) return;
    await createSubject({ name: draft.name.trim(), note: draft.note.trim() || undefined });
    setDraft({ name: "", note: "" });
    setShowNew(false);
    onChange();
  }

  function startEdit(s: Subject) {
    setEditingId(s.id);
    setEdit({ progress: String(s.progress), note: s.note ?? "" });
  }

  async function saveEdit(id: string) {
    await updateSubject(id, { progress: Number(edit.progress), note: edit.note.trim() || undefined });
    setEditingId(null);
    onChange();
  }

  async function handleDelete(id: string) {
    await deleteSubject(id);
    onChange();
  }

  return (
    <div>
      <div className="view-header">
        <div>
          <div className="view-kicker">Study Agent</div>
          <h1 className="view-title">Estudos</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew((v) => !v)}>
          {showNew ? "Cancelar" : "+ Nova disciplina"}
        </button>
      </div>

      {showNew && (
        <div className="pad-24 row-divider" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <input
            className="chat-input"
            style={{ flex: "1 1 200px" }}
            placeholder="Nome da disciplina"
            value={draft.name}
            onChange={(e) => setDraft((s) => ({ ...s, name: e.target.value }))}
          />
          <input
            className="chat-input"
            style={{ flex: "1 1 160px" }}
            placeholder="Nota / observação"
            value={draft.note}
            onChange={(e) => setDraft((s) => ({ ...s, note: e.target.value }))}
          />
          <button className="btn btn-primary" onClick={handleCreate}>
            Criar
          </button>
        </div>
      )}

      <div className="two-col">
        <section className="col-divider">
          <div className="section-head">
            <h2>Disciplinas</h2>
          </div>
          {subjects.map((s) =>
            editingId === s.id ? (
              <div key={s.id} className="row-divider" style={{ display: "flex", gap: 8, padding: "10px 24px", flexWrap: "wrap" }}>
                <input
                  className="chat-input"
                  type="number"
                  style={{ flex: "0 1 100px" }}
                  placeholder="Progresso %"
                  value={edit.progress}
                  onChange={(e) => setEdit((v) => ({ ...v, progress: e.target.value }))}
                />
                <input
                  className="chat-input"
                  style={{ flex: "1 1 160px" }}
                  placeholder="Nota / observação"
                  value={edit.note}
                  onChange={(e) => setEdit((v) => ({ ...v, note: e.target.value }))}
                />
                <button className="btn btn-primary" onClick={() => saveEdit(s.id)}>
                  Salvar
                </button>
                <button className="btn btn-secondary" onClick={() => setEditingId(null)}>
                  Cancelar
                </button>
              </div>
            ) : (
              <div key={s.id} className="row-divider" style={{ padding: "13px 24px" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 7 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</span>
                  <span style={{ fontSize: 11, color: "var(--color-neutral-700)" }}>{s.note ?? ""}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="progress-track" style={{ flex: 1 }}>
                    <span className="progress-fill-bar" style={{ background: "var(--color-text)", width: `${s.progress}%` }} />
                  </span>
                  <span style={{ fontSize: 11, color: "var(--color-neutral-700)" }}>{s.progress}%</span>
                  <button className="btn btn-secondary" onClick={() => startEdit(s)}>
                    Editar
                  </button>
                  <button className="btn btn-secondary" onClick={() => handleDelete(s.id)}>
                    Excluir
                  </button>
                </div>
              </div>
            )
          )}
          {subjects.length === 0 && !showNew && (
            <p style={{ padding: "16px 24px", color: "var(--color-neutral-700)", fontSize: 14 }}>
              Nenhuma disciplina cadastrada ainda.
            </p>
          )}
        </section>
        <section>
          <div className="section-head">
            <h2>Entregas e leituras</h2>
            <span className="section-meta">tarefas com prazo (edite em Projetos)</span>
          </div>
          {deliveries.map((d) => (
            <div key={d.id} className="entry-row">
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 800,
                  fontSize: 12,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "var(--color-accent)",
                }}
              >
                {formatDate(d.dueAt!)}
              </span>
              <span>
                <span style={{ fontSize: 14 }}>{d.title}</span>
                {d.notes && (
                  <span style={{ display: "block", fontSize: 11, color: "var(--color-neutral-700)" }}>{d.notes}</span>
                )}
              </span>
            </div>
          ))}
          {deliveries.length === 0 && (
            <p style={{ padding: "16px 24px", color: "var(--color-neutral-700)", fontSize: 14 }}>
              Nenhuma entrega com prazo definido.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
