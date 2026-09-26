export type Task = {
  id: string;
  title: string;
  column: 'todo' | 'inprogress' | 'done';
  duration: number;       // days
  dependsOn: string[];    // task ids
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
  criticalPath: string[];
};
