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
  | "project.created"
  | "project.updated"
  | "memory.created"
  | "agent.started"
  | "agent.finished"
  | "device.connected"
  | "device.disconnected"
  | "message.received";
