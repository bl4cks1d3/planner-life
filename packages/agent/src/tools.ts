export const CORE_API_URL = process.env.CORE_API_URL ?? "http://localhost:4000";

export const SYSTEM_PROMPT = `Voce e o Personal Agent do Planner Life, um sistema operacional pessoal de IA.
Seu papel e ajudar o usuario a organizar tarefas, projetos, clientes (CRM),
disciplinas, pesquisa cientifica, habitos, inbox e agenda. Voce tem acesso
a ferramentas com CRUD completo (criar, listar, editar e excluir) para
tarefas, projetos, clientes, disciplinas, linhas de pesquisa, artigos,
habitos e tarefas do Google Tasks -- alem de poder ler e-mails completos
(read_email) e a agenda do Google Calendar. Use a ferramenta apropriada
sempre que precisar mexer em algum desses dados. Responda sempre em
portugues, de forma direta e util. Nao invente dados: se precisar de uma
informacao que so existe no Planner Core ou no Google, use a ferramenta
apropriada em vez de supor.

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
    name: "update_task",
    description: "Edita titulo, prazo, notas ou projeto de uma tarefa (sem mexer no status).",
    parameters: {
      type: "object",
      properties: {
        taskId: { type: "string" },
        title: { type: "string" },
        projectId: { type: "string" },
        dueAt: { type: "string" },
        notes: { type: "string" },
      },
      required: ["taskId"],
    },
  },
  {
    name: "delete_task",
    description: "Exclui uma tarefa permanentemente.",
    parameters: {
      type: "object",
      properties: { taskId: { type: "string" } },
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
    name: "update_project",
    description: "Edita o nome ou objetivo de um projeto.",
    parameters: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        name: { type: "string" },
        goal: { type: "string" },
      },
      required: ["projectId"],
    },
  },
  {
    name: "delete_project",
    description: "Exclui um projeto e todas as suas tarefas.",
    parameters: {
      type: "object",
      properties: { projectId: { type: "string" } },
      required: ["projectId"],
    },
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

  // CRM
  {
    name: "create_client",
    description: "Cria um cliente ou lead no CRM do Planner Life.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        stage: { type: "string", enum: ["lead", "contact", "proposal", "closed"] },
        value: { type: "number", description: "Valor estimado/fechado em reais" },
        nextAction: { type: "string", description: "Proxima acao a tomar com esse cliente" },
        nextActionAt: { type: "string", description: "Data da proxima acao, ISO 8601" },
      },
      required: ["name"],
    },
  },
  {
    name: "list_clients",
    description: "Lista todos os clientes/leads do CRM.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "update_client",
    description: "Atualiza o estagio, valor ou proxima acao de um cliente do CRM.",
    parameters: {
      type: "object",
      properties: {
        clientId: { type: "string" },
        stage: { type: "string", enum: ["lead", "contact", "proposal", "closed"] },
        value: { type: "number" },
        nextAction: { type: "string" },
        nextActionAt: { type: "string" },
      },
      required: ["clientId"],
    },
  },
  {
    name: "delete_client",
    description: "Exclui um cliente/lead do CRM.",
    parameters: {
      type: "object",
      properties: { clientId: { type: "string" } },
      required: ["clientId"],
    },
  },

  // Estudos
  {
    name: "create_subject",
    description: "Cadastra uma disciplina/materia para acompanhar o progresso.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        note: { type: "string", description: "Ex: media atual, observacao" },
      },
      required: ["name"],
    },
  },
  {
    name: "list_subjects",
    description: "Lista as disciplinas cadastradas e o progresso de cada uma.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "update_subject",
    description: "Atualiza o progresso (0-100) ou a nota de uma disciplina.",
    parameters: {
      type: "object",
      properties: {
        subjectId: { type: "string" },
        progress: { type: "number" },
        note: { type: "string" },
      },
      required: ["subjectId"],
    },
  },
  {
    name: "delete_subject",
    description: "Exclui uma disciplina.",
    parameters: {
      type: "object",
      properties: { subjectId: { type: "string" } },
      required: ["subjectId"],
    },
  },

  // Pesquisa
  {
    name: "create_research_line",
    description: "Cria uma linha de investigacao de pesquisa cientifica.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        stage: { type: "string", description: "Ex: revisao de literatura, escrita do metodo" },
        nextStep: { type: "string" },
      },
      required: ["name"],
    },
  },
  {
    name: "list_research_lines",
    description: "Lista as linhas de investigacao de pesquisa.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "delete_research_line",
    description: "Exclui uma linha de pesquisa (os artigos ligados a ela ficam sem linha, mas nao sao excluidos).",
    parameters: {
      type: "object",
      properties: { lineId: { type: "string" } },
      required: ["lineId"],
    },
  },
  {
    name: "create_paper",
    description: "Adiciona um artigo cientifico na fila de leitura, opcionalmente ligado a uma linha de pesquisa.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        source: { type: "string", description: "Ex: arXiv, IEEE, ACM" },
        researchLineId: { type: "string" },
      },
      required: ["title"],
    },
  },
  {
    name: "list_papers",
    description: "Lista os artigos da fila de leitura, opcionalmente filtrando por linha de pesquisa.",
    parameters: {
      type: "object",
      properties: { researchLineId: { type: "string" } },
    },
  },
  {
    name: "update_paper_status",
    description: "Atualiza o status de leitura de um artigo.",
    parameters: {
      type: "object",
      properties: {
        paperId: { type: "string" },
        status: { type: "string", enum: ["na_fila", "em_leitura", "resumido"] },
      },
      required: ["paperId", "status"],
    },
  },
  {
    name: "delete_paper",
    description: "Remove um artigo da fila de leitura.",
    parameters: {
      type: "object",
      properties: { paperId: { type: "string" } },
      required: ["paperId"],
    },
  },

  // Habitos
  {
    name: "create_habit",
    description: "Cria um habito para acompanhar (ex: beber agua, dormir, treinar).",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        unit: { type: "string", description: "Ex: ml, copos, horas, sessoes" },
        target: { type: "number", description: "Meta diaria/periodica" },
      },
      required: ["name"],
    },
  },
  {
    name: "list_habits",
    description: "Lista os habitos acompanhados e seu progresso atual.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "update_habit",
    description: "Atualiza o valor atual e/ou a meta de um habito.",
    parameters: {
      type: "object",
      properties: {
        habitId: { type: "string" },
        current: { type: "number" },
        target: { type: "number" },
      },
      required: ["habitId"],
    },
  },
  {
    name: "delete_habit",
    description: "Exclui um habito.",
    parameters: {
      type: "object",
      properties: { habitId: { type: "string" } },
      required: ["habitId"],
    },
  },

  // Inbox
  {
    name: "list_messages",
    description: "Lista as mensagens mais recentes do inbox do Planner Life (assunto e preview, sem o corpo completo).",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "read_email",
    description: "Le o corpo completo de um e-mail sincronizado do Gmail (use o id retornado por list_messages).",
    parameters: {
      type: "object",
      properties: { messageId: { type: "string" } },
      required: ["messageId"],
    },
  },
  {
    name: "mark_message_handled",
    description: "Marca uma mensagem do inbox como tratada (ou desfaz isso).",
    parameters: {
      type: "object",
      properties: {
        messageId: { type: "string" },
        handled: { type: "boolean" },
      },
      required: ["messageId", "handled"],
    },
  },

  // Google Tasks
  {
    name: "list_google_tasks",
    description: "Lista as tarefas do Google Tasks (conta Google conectada).",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "create_google_task",
    description: "Cria uma tarefa no Google Tasks.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        notes: { type: "string" },
        due: { type: "string", description: "Data em ISO 8601" },
      },
      required: ["title"],
    },
  },
  {
    name: "update_google_task",
    description: "Atualiza titulo, notas, prazo ou status de uma tarefa do Google Tasks.",
    parameters: {
      type: "object",
      properties: {
        taskId: { type: "string" },
        title: { type: "string" },
        notes: { type: "string" },
        due: { type: "string" },
        status: { type: "string", enum: ["needsAction", "completed"] },
      },
      required: ["taskId"],
    },
  },
  {
    name: "delete_google_task",
    description: "Exclui uma tarefa do Google Tasks.",
    parameters: {
      type: "object",
      properties: { taskId: { type: "string" } },
      required: ["taskId"],
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
    case "update_task": {
      const { taskId, ...rest } = input;
      return coreFetch(`/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(rest) });
    }
    case "delete_task":
      return coreFetch(`/tasks/${input.taskId}`, { method: "DELETE" });

    case "create_project":
      return coreFetch("/projects", { method: "POST", body: JSON.stringify(input) });
    case "list_projects":
      return coreFetch("/projects");
    case "update_project": {
      const { projectId, ...rest } = input;
      return coreFetch(`/projects/${projectId}`, { method: "PATCH", body: JSON.stringify(rest) });
    }
    case "delete_project":
      return coreFetch(`/projects/${input.projectId}`, { method: "DELETE" });

    case "save_memory":
      return coreFetch("/memory", {
        method: "POST",
        body: JSON.stringify({ ...input, source: "personal-agent" }),
      });

    case "create_client":
      return coreFetch("/clients", { method: "POST", body: JSON.stringify(input) });
    case "list_clients":
      return coreFetch("/clients");
    case "update_client": {
      const { clientId, ...rest } = input;
      return coreFetch(`/clients/${clientId}`, { method: "PATCH", body: JSON.stringify(rest) });
    }
    case "delete_client":
      return coreFetch(`/clients/${input.clientId}`, { method: "DELETE" });

    case "create_subject":
      return coreFetch("/subjects", { method: "POST", body: JSON.stringify(input) });
    case "list_subjects":
      return coreFetch("/subjects");
    case "update_subject": {
      const { subjectId, ...rest } = input;
      return coreFetch(`/subjects/${subjectId}`, { method: "PATCH", body: JSON.stringify(rest) });
    }
    case "delete_subject":
      return coreFetch(`/subjects/${input.subjectId}`, { method: "DELETE" });

    case "create_research_line":
      return coreFetch("/research/lines", { method: "POST", body: JSON.stringify(input) });
    case "list_research_lines":
      return coreFetch("/research/lines");
    case "delete_research_line":
      return coreFetch(`/research/lines/${input.lineId}`, { method: "DELETE" });
    case "create_paper":
      return coreFetch("/research/papers", { method: "POST", body: JSON.stringify(input) });
    case "list_papers": {
      const params = new URLSearchParams(input as Record<string, string>);
      return coreFetch(`/research/papers?${params.toString()}`);
    }
    case "update_paper_status":
      return coreFetch(`/research/papers/${input.paperId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: input.status }),
      });
    case "delete_paper":
      return coreFetch(`/research/papers/${input.paperId}`, { method: "DELETE" });

    case "create_habit":
      return coreFetch("/habits", { method: "POST", body: JSON.stringify(input) });
    case "list_habits":
      return coreFetch("/habits");
    case "update_habit": {
      const { habitId, ...rest } = input;
      return coreFetch(`/habits/${habitId}`, { method: "PATCH", body: JSON.stringify(rest) });
    }
    case "delete_habit":
      return coreFetch(`/habits/${input.habitId}`, { method: "DELETE" });

    case "list_messages":
      return coreFetch("/messages");
    case "read_email":
      return coreFetch(`/integrations/google/gmail/${encodeURIComponent(input.messageId as string)}/body`);
    case "mark_message_handled":
      return coreFetch(`/messages/${input.messageId}/handled`, {
        method: "PATCH",
        body: JSON.stringify({ handled: input.handled }),
      });

    case "list_google_tasks":
      return coreFetch("/integrations/google/tasks");
    case "create_google_task":
      return coreFetch("/integrations/google/tasks", { method: "POST", body: JSON.stringify(input) });
    case "update_google_task": {
      const { taskId, ...rest } = input;
      return coreFetch(`/integrations/google/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(rest) });
    }
    case "delete_google_task":
      return coreFetch(`/integrations/google/tasks/${input.taskId}`, { method: "DELETE" });

    default:
      throw new Error(`ferramenta desconhecida: ${name}`);
  }
}
