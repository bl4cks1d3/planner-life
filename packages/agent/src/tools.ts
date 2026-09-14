export const CORE_API_URL = process.env.CORE_API_URL ?? "http://localhost:4000";

export const SYSTEM_PROMPT = `Voce e o Personal Agent do Planner Life, um sistema operacional pessoal de IA.
Seu papel e ajudar o usuario a organizar tarefas, projetos e memoria pessoal.
Use as ferramentas disponiveis sempre que precisar criar, listar ou concluir
tarefas e projetos, ou salvar algo importante na memoria. Responda sempre em
portugues, de forma direta e util. Nao invente dados: se precisar de uma
informacao que so existe no Planner Core, use a ferramenta apropriada.

Suas respostas sao exibidas como texto simples (sem renderizar markdown),
entao nunca use tabelas, cabecalhos com # ou blocos de codigo. Para listas,
use um traco "-" por linha. Prefira paragrafos curtos.`;

/**
 * Schema neutro de ferramenta (JSON Schema puro), independente de provedor.
 * Cada provider (Anthropic, Groq/OpenAI, Gemini) adapta isso para o formato
 * que espera -- assim trocar de modelo de IA nunca exige duplicar a
 * definicao das ferramentas.
 */
export interface AgentTool {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Definicao das ferramentas que o Personal Agent pode usar. Cada uma delas
 * chama a API REST do Planner Core -- o agente nunca acessa o banco
 * diretamente, entao qualquer runtime de agente (PicoClaw, Hermes, etc.)
 * pode ser trocado no futuro sem perder essa integracao.
 */
export const AGENT_TOOLS: AgentTool[] = [
  {
    name: "create_task",
    description: "Cria uma nova tarefa no Planner Life.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Titulo da tarefa" },
        projectId: { type: "string", description: "ID do projeto relacionado" },
        dueAt: { type: "string", description: "Prazo em ISO 8601, ex: 2026-09-15T18:00:00" },
        notes: { type: "string", description: "Notas adicionais" },
      },
      required: ["title"],
    },
  },
  {
    name: "list_tasks",
    description: "Lista tarefas existentes, opcionalmente filtrando por status ou projeto.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["pending", "in_progress", "done", "cancelled"],
        },
        projectId: { type: "string" },
      },
    },
  },
  {
    name: "complete_task",
    description: "Marca uma tarefa como concluida.",
    parameters: {
      type: "object",
      properties: {
        taskId: { type: "string", description: "ID da tarefa" },
      },
      required: ["taskId"],
    },
  },
  {
    name: "create_project",
    description: "Cria um novo projeto no Planner Life.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        goal: { type: "string", description: "Objetivo do projeto" },
      },
      required: ["name"],
    },
  },
  {
    name: "list_projects",
    description: "Lista todos os projetos e seu progresso.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "save_memory",
    description:
      "Salva uma informacao importante na memoria de longo prazo do usuario (preferencias, fatos, contexto recorrente).",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
      },
      required: ["content"],
    },
  },
];

async function coreFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${CORE_API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Planner Core respondeu ${res.status}: ${body}`);
  }
  return res.json();
}

export async function runTool(name: string, input: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "create_task":
      return coreFetch("/tasks", { method: "POST", body: JSON.stringify(input) });
    case "list_tasks": {
      const params = new URLSearchParams(input as Record<string, string>);
      return coreFetch(`/tasks?${params.toString()}`);
    }
    case "complete_task":
      return coreFetch(`/tasks/${input.taskId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "done" }),
      });
    case "create_project":
      return coreFetch("/projects", { method: "POST", body: JSON.stringify(input) });
    case "list_projects":
      return coreFetch("/projects");
    case "save_memory":
      return coreFetch("/memory", {
        method: "POST",
        body: JSON.stringify({ ...input, source: "personal-agent" }),
      });
    default:
      throw new Error(`ferramenta desconhecida: ${name}`);
  }
}
