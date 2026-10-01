export type ColumnId = 'todo' | 'inprogress' | 'done';

export type Task = {
  id: string;
  title: string;
  column: ColumnId;
  duration: number; // days
  dependsOn: string[]; // task ids
  createdAt?: string;
};

export type ScheduleEntry = {
  taskId: string;
  es: number;
  ef: number;
  ls: number;
  lf: number;
  slack: number;
  isCritical: boolean;
};

export type Schedule = {
  entries: Record<string, ScheduleEntry>;
  projectDuration: number;
  criticalPath: string[]; // task IDs in topo order where slack = 0
};

export type ProjectSettings = {
  name: string;
  startDate: string; // ISO date string, e.g. '2024-01-15'
};

export type CopilotProposedTask = {
  tempId: string;
  title: string;
  duration: number;
  dependsOn: string[]; // can reference existing task IDs or other tempIds
};

export type CopilotProposal = {
  tasks: CopilotProposedTask[];
  currentProjectDuration: number;
  projectedProjectDuration: number;
};
