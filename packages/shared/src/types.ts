export type TaskStatus = "pending" | "in_progress" | "done" | "cancelled";

export interface Project {
  id: string;
  name: string;
  goal?: string;
  progress: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  projectId?: string;
  status: TaskStatus;
  dueAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryEntry {
  id: string;
  content: string;
  tags: string[];
  source: string; // e.g. "personal-agent", "user"
  createdAt: string;
}

export type ClientStage = "lead" | "contact" | "proposal" | "closed";

export interface Client {
  id: string;
  name: string;
  stage: ClientStage;
  value: number;
  nextAction?: string;
  nextActionAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  progress: number; // 0-100
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchLine {
  id: string;
  name: string;
  stage?: string;
  refs: number;
  nextStep?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaperStatus = "na_fila" | "em_leitura" | "resumido";

export interface Paper {
  id: string;
  title: string;
  source?: string;
  status: PaperStatus;
  researchLineId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  name: string;
  unit: string;
  target: number;
  current: number;
  createdAt: string;
  updatedAt: string;
}

export interface InboxMessage {
  id: string;
  from: string;
  subject: string;
  snippet?: string;
  tag?: string;
  action?: string;
  handled: boolean;
  receivedAt: string;
  createdAt: string;
}

export interface PlannerEvent {
  id: string;
  type: PlpEventType;
  payload: Record<string, unknown>;
  origin: string; // node name that produced the event
  createdAt: string;
}

export type PlpEventType =
  | "task.created"
  | "task.updated"
  | "task.completed"
  | "task.deleted"
  | "project.created"
  | "project.updated"
  | "project.deleted"
  | "memory.created"
  | "memory.deleted"
  | "client.created"
  | "client.updated"
  | "client.deleted"
  | "subject.created"
  | "subject.updated"
  | "subject.deleted"
  | "research_line.created"
  | "research_line.updated"
  | "research_line.deleted"
  | "paper.created"
  | "paper.updated"
  | "paper.deleted"
  | "habit.created"
  | "habit.updated"
  | "habit.deleted"
  | "message.synced"
  | "message.handled"
  | "agent.started"
  | "agent.finished"
  | "device.connected"
  | "device.disconnected"
  | "message.received";
