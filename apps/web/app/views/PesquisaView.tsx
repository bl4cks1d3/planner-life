"use client";

import { useState } from "react";
import {
  createPaper,
  createResearchLine,
  deletePaper,
  deleteResearchLine,
  updatePaperStatus,
  updateResearchLine,
  type Paper,
  type ResearchLine,
} from "@/lib/api";

const STATUS_LABEL: Record<Paper["status"], string> = {
  na_fila: "Na fila",
  em_leitura: "Em leitura",
  resumido: "Resumido pelo agente",
};
const STATUS_ORDER: Paper["status"][] = ["na_fila", "em_leitura", "resumido"];

export interface PesquisaViewProps {
  lines: ResearchLine[];
  papers: Paper[];
  onChange: () => void;
}

export default function PesquisaView({ lines, papers, onChange }: PesquisaViewProps) {
  const [showNewLine, setShowNewLine] = useState(false);
  const [newLine, setNewLine] = useState({ name: "", stage: "" });
  const [showNewPaper, setShowNewPaper] = useState(false);
  const [newPaper, setNewPaper] = useState({ title: "", source: "" });
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editLine, setEditLine] = useState({ stage: "", nextStep: "" });

  async function handleCreateLine() {
    if (!newLine.name.trim()) return;
    await createResearchLine({ name: newLine.name.trim(), stage: newLine.stage.trim() || undefined });
    setNewLine({ name: "", stage: "" });
    setShowNewLine(false);
    onChange();
  }

  async function handleDeleteLine(id: string) {
    await deleteResearchLine(id);
    onChange();
  }

  function startEditLine(l: ResearchLine) {
    setEditingLineId(l.id);
    setEditLine({ stage: l.stage ?? "", nextStep: l.nextStep ?? "" });
  }

  async function saveEditLine(id: string) {
    await updateResearchLine(id, {
      stage: editLine.stage.trim() || undefined,
      nextStep: editLine.nextStep.trim() || undefined,
    });
    setEditingLineId(null);
    onChange();
  }

  async function handleCreatePaper() {
    if (!newPaper.title.trim()) return;
    await createPaper({ title: newPaper.title.trim(), source: newPaper.source.trim() || undefined });
    setNewPaper({ title: "", source: "" });
    setShowNewPaper(false);
    onChange();
  }

  async function cyclePaperStatus(p: Paper) {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(p.status) + 1) % STATUS_ORDER.length];
    await updatePaperStatus(p.id, next);
    onChange();
  }

  async function handleDeletePaper(id: string) {
    await deletePaper(id);
    onChange();
  }

  return (
    <div>
      <div className="view-header">
        <div>
          <div className="view-kicker">Research Agent</div>
          <h1 className="view-title">Pesquisa científica</h1>
        </div>
      </div>
      <div className="two-col">
        <section className="col-divider">
          <div className="section-head">
            <h2>Linhas de investigação</h2>
            <button className="chat-listen" style={{ fontSize: 11 }} onClick={() => setShowNewLine((v) => !v)}>
              {showNewLine ? "cancelar" : "+ nova linha"}
            </button>
          </div>
          {showNewLine && (
            <div className="row-divider" style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "12px 24px" }}>
              <input
                className="chat-input"
                style={{ flex: "1 1 160px" }}
                placeholder="Nome da linha"
                value={newLine.name}
                onChange={(e) => setNewLine((s) => ({ ...s, name: e.target.value }))}
              />
              <input
                className="chat-input"
                style={{ flex: "1 1 140px" }}
                placeholder="Estágio (opcional)"
                value={newLine.stage}
                onChange={(e) => setNewLine((s) => ({ ...s, stage: e.target.value }))}
              />
              <button className="btn btn-primary" onClick={handleCreateLine}>
                Criar
              </button>
            </div>
          )}
          {lines.map((l) =>
            editingLineId === l.id ? (
              <div key={l.id} className="row-divider" style={{ padding: "14px 24px", display: "flex", flexWrap: "wrap", gap: 8 }}>
                <input
                  className="chat-input"
                  style={{ flex: "1 1 140px" }}
                  placeholder="Estágio"
                  value={editLine.stage}
                  onChange={(e) => setEditLine((s) => ({ ...s, stage: e.target.value }))}
                />
                <input
                  className="chat-input"
                  style={{ flex: "1 1 140px" }}
                  placeholder="Próximo passo"
                  value={editLine.nextStep}
                  onChange={(e) => setEditLine((s) => ({ ...s, nextStep: e.target.value }))}
                />
                <button className="btn btn-primary" onClick={() => saveEditLine(l.id)}>
                  Salvar
                </button>
                <button className="btn btn-secondary" onClick={() => setEditingLineId(null)}>
                  Cancelar
                </button>
              </div>
            ) : (
              <div key={l.id} className="row-divider" style={{ padding: "14px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{l.name}</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="chat-listen" style={{ fontSize: 11 }} onClick={() => startEditLine(l)}>
                      editar
                    </button>
                    <button className="chat-listen" style={{ fontSize: 11 }} onClick={() => handleDeleteLine(l.id)}>
                      excluir
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--color-neutral-700)", margin: "3px 0 8px" }}>
                  {l.stage ?? "sem estágio definido"}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  <span className="tag tag-neutral">{l.refs} refs</span>
                  {l.nextStep && <span className="tag tag-outline">{l.nextStep}</span>}
                </div>
              </div>
            )
          )}
          {lines.length === 0 && !showNewLine && (
            <p style={{ padding: "16px 24px", color: "var(--color-neutral-700)", fontSize: 14 }}>
              Nenhuma linha de pesquisa ainda.
            </p>
          )}
        </section>
        <section>
          <div className="section-head">
            <h2>Fila de leitura</h2>
            <button className="chat-listen" style={{ fontSize: 11 }} onClick={() => setShowNewPaper((v) => !v)}>
              {showNewPaper ? "cancelar" : "+ novo artigo"}
            </button>
          </div>
          {showNewPaper && (
            <div className="row-divider" style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "12px 24px" }}>
              <input
                className="chat-input"
                style={{ flex: "1 1 200px" }}
                placeholder="Título do artigo"
                value={newPaper.title}
                onChange={(e) => setNewPaper((s) => ({ ...s, title: e.target.value }))}
              />
              <input
                className="chat-input"
                style={{ flex: "0 1 140px" }}
                placeholder="Fonte (arXiv, IEEE...)"
                value={newPaper.source}
                onChange={(e) => setNewPaper((s) => ({ ...s, source: e.target.value }))}
              />
              <button className="btn btn-primary" onClick={handleCreatePaper}>
                Adicionar
              </button>
            </div>
          )}
          {papers.map((p) => (
            <div key={p.id} className="row-divider" style={{ padding: "13px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ fontSize: 14 }}>{p.title}</div>
                <button className="chat-listen" style={{ fontSize: 11 }} onClick={() => handleDeletePaper(p.id)}>
                  excluir
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", fontSize: 11, color: "var(--color-neutral-700)", marginTop: 3, alignItems: "center" }}>
                <span>{p.source ?? "sem fonte"}</span>
                <button className="tag tag-outline" style={{ cursor: "pointer", border: "1px solid var(--color-accent)" }} onClick={() => cyclePaperStatus(p)}>
                  {STATUS_LABEL[p.status]}
                </button>
              </div>
            </div>
          ))}
          {papers.length === 0 && !showNewPaper && (
            <p style={{ padding: "16px 24px", color: "var(--color-neutral-700)", fontSize: 14 }}>
              Nenhum artigo na fila ainda.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
