import { useState, useEffect } from 'react';
import { Task, Schedule } from '../types';
import { computeSchedule } from '../engine/cpm';

const STORAGE_KEY = 'slackboard_tasks';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse tasks from local storage', e);
      }
    }
    return [];
  });

  const [schedule, setSchedule] = useState<Schedule>(() => computeSchedule(tasks));

  // Persist to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  // Recompute schedule
  useEffect(() => {
    setSchedule(computeSchedule(tasks));
  }, [tasks]);

  const addTask = (task: Task) => {
    setTasks(prev => [...prev, task]);
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const moveTask = (id: string, newColumn: 'todo' | 'inprogress' | 'done') => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, column: newColumn } : t));
  };

  return {
    tasks,
    schedule,
    addTask,
    updateTask,
    deleteTask,
    moveTask
  };
}
