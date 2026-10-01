import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { Task, Schedule, ProjectSettings, computeSchedule, getSeedTasks, getDefaultSettings } from '@slackboard/shared';
import type { ColumnId, CopilotProposal } from '@slackboard/shared';

const API_BASE = '/api';
const TASKS_STORAGE_KEY = 'slackboard_tasks';
const SETTINGS_STORAGE_KEY = 'slackboard_settings';

interface TasksContextValue {
  tasks: Task[];
  schedule: Schedule;
  settings: ProjectSettings;
  loading: boolean;
  error: string | null;
  addTask: (task: Omit<Task, 'id'>) => Promise<Task | null>;
  updateTask: (task: Task) => Promise<boolean>;
  deleteTask: (id: string) => Promise<{ cascadedDependents: Array<{ id: string; title: string }> } | null>;
  moveTask: (id: string, column: ColumnId) => Promise<boolean>;
  updateSettings: (settings: ProjectSettings) => Promise<boolean>;
  resetData: () => Promise<boolean>;
  clearError: () => void;
}

const TasksContext = createContext<TasksContextValue | null>(null);

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage(TASKS_STORAGE_KEY, getSeedTasks()));
  const [settings, setSettings] = useState<ProjectSettings>(() => loadFromStorage(SETTINGS_STORAGE_KEY, getDefaultSettings()));
  const [schedule, setSchedule] = useState<Schedule>(() => computeSchedule(tasks));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recompute schedule when tasks change
  useEffect(() => {
    setSchedule(computeSchedule(tasks));
  }, [tasks]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Fetch from server on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchInitial() {
      try {
        const [tasksRes, settingsRes] = await Promise.all([
          fetch(`${API_BASE}/tasks`),
          fetch(`${API_BASE}/settings`),
        ]);
        if (!cancelled && tasksRes.ok) {
          const serverTasks = await tasksRes.json();
          setTasks(serverTasks);
        }
        if (!cancelled && settingsRes.ok) {
          const serverSettings = await settingsRes.json();
          setSettings(serverSettings);
        }
      } catch {
        // Server down - use localStorage cache
        console.warn('Server unavailable, using cached data');
      }
    }
    fetchInitial();
    return () => { cancelled = true; };
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const addTask = useCallback(async (taskData: Omit<Task, 'id'>): Promise<Task | null> => {
    // Optimistic: generate temp ID
    const tempId = crypto.randomUUID();
    const optimistic: Task = { ...taskData, id: tempId };
    setTasks(prev => [...prev, optimistic]);

    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      if (!res.ok) {
        const data = await res.json();
        setTasks(prev => prev.filter(t => t.id !== tempId)); // Rollback
        setError(data.error || 'Failed to create task');
        return null;
      }
      const created: Task = await res.json();
      setTasks(prev => prev.map(t => t.id === tempId ? created : t));
      return created;
    } catch {
      // Keep optimistic update if server is down
      return optimistic;
    }
  }, []);

  const updateTask = useCallback(async (task: Task): Promise<boolean> => {
    const prev = tasks;
    setTasks(current => current.map(t => t.id === task.id ? task : t));

    try {
      const res = await fetch(`${API_BASE}/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      if (!res.ok) {
        const data = await res.json();
        setTasks(prev); // Rollback
        setError(data.error || 'Failed to update task');
        return false;
      }
      return true;
    } catch {
      return true; // Keep optimistic if server down
    }
  }, [tasks]);

  const deleteTask = useCallback(async (id: string): Promise<{ cascadedDependents: Array<{ id: string; title: string }> } | null> => {
    const prev = tasks;
    const dependents = tasks.filter(t => t.dependsOn.includes(id));
    
    // Optimistic: strip deps and remove
    setTasks(current => 
      current
        .map(t => t.dependsOn.includes(id) ? { ...t, dependsOn: t.dependsOn.filter(d => d !== id) } : t)
        .filter(t => t.id !== id)
    );

    try {
      const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setTasks(prev); // Rollback
        const data = await res.json();
        setError(data.error || 'Failed to delete task');
        return null;
      }
      const data = await res.json();
      return data;
    } catch {
      return { cascadedDependents: dependents.map(d => ({ id: d.id, title: d.title })) };
    }
  }, [tasks]);

  const moveTask = useCallback(async (id: string, column: ColumnId): Promise<boolean> => {
    const prev = tasks;
    setTasks(current => current.map(t => t.id === id ? { ...t, column } : t));

    try {
      const res = await fetch(`${API_BASE}/tasks/${id}/column`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column }),
      });
      if (!res.ok) {
        setTasks(prev);
        return false;
      }
      return true;
    } catch {
      return true;
    }
  }, [tasks]);

  const updateSettings = useCallback(async (newSettings: ProjectSettings): Promise<boolean> => {
    const prev = settings;
    setSettings(newSettings);

    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (!res.ok) {
        setSettings(prev);
        return false;
      }
      return true;
    } catch {
      return true;
    }
  }, [settings]);

  const resetData = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/settings/reset`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
        setSettings(data.settings);
        return true;
      }
    } catch {
      // Fallback: reset locally
      setTasks(getSeedTasks());
      setSettings(getDefaultSettings());
      return true;
    }
    return false;
  }, []);

  return (
    <TasksContext.Provider value={{
      tasks, schedule, settings, loading, error,
      addTask, updateTask, deleteTask, moveTask,
      updateSettings, resetData, clearError,
    }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks(): TasksContextValue {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error('useTasks must be used within TasksProvider');
  return ctx;
}
