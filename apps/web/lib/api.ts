const CORE_API_URL = process.env.NEXT_PUBLIC_CORE_API_URL ?? "http://localhost:4000";
const AGENT_API_URL = process.env.NEXT_PUBLIC_AGENT_API_URL ?? "http://localhost:4100";

export interface Project {
  id: string;
  name: string;
  goal?: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  projectId?: string;
  status: "pending" | "in_progress" | "done" | "cancelled";
  dueAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getProjects(): Promise<Project[]> {
  const res = await fetch(`${CORE_API_URL}/projects`, { cache: "no-store" });
  if (!res.ok) throw new Error("falha ao buscar projetos do Planner Core");
  return res.json();
}

export async function getTasks(): Promise<Task[]> {
  const res = await fetch(`${CORE_API_URL}/tasks`, { cache: "no-store" });
  if (!res.ok) throw new Error("falha ao buscar tarefas do Planner Core");
  return res.json();
}

export async function sendChat(message: string): Promise<string> {
  const res = await fetch(`${AGENT_API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error("falha ao conversar com o Personal Agent");
  const data = (await res.json()) as { reply: string };
  return data.reply;
}
