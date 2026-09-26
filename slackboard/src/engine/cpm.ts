import { Task, Schedule, ScheduleEntry } from '../types';

export function topologicalSort(tasks: Task[]): string[] | null {
  const inDegree: Record<string, number> = {};
  const adjList: Record<string, string[]> = {};
  
  tasks.forEach(task => {
    inDegree[task.id] = 0;
    adjList[task.id] = [];
  });

  tasks.forEach(task => {
    task.dependsOn.forEach(depId => {
      if (adjList[depId]) {
        adjList[depId].push(task.id);
        inDegree[task.id] = (inDegree[task.id] || 0) + 1;
      }
    });
  });

  const queue: string[] = [];
  tasks.forEach(task => {
    if (inDegree[task.id] === 0) {
      queue.push(task.id);
    }
  });

  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);

    adjList[current].forEach(neighbor => {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    });
  }

  if (sorted.length !== tasks.length) {
    return null; // Cycle detected
  }

  return sorted;
}

export function computeSchedule(tasks: Task[]): Schedule {
  const sorted = topologicalSort(tasks);
  
  if (!sorted) {
    // If cycle exists, return empty or default schedule
    return { entries: {}, projectDuration: 0, criticalPath: [] };
  }

  const entries: Record<string, ScheduleEntry> = {};
  const dependentsMap: Record<string, string[]> = {};

  tasks.forEach(task => {
    entries[task.id] = {
      taskId: task.id,
      es: 0, ef: 0, ls: 0, lf: 0,
      slack: 0, isCritical: false
    };
    dependentsMap[task.id] = [];
  });

  tasks.forEach(task => {
    task.dependsOn.forEach(depId => {
      if (dependentsMap[depId]) {
        dependentsMap[depId].push(task.id);
      }
    });
  });

  const taskMap = new Map(tasks.map(t => [t.id, t]));

  // Forward pass
  let projectDuration = 0;
  for (const taskId of sorted) {
    const task = taskMap.get(taskId)!;
    let maxES = 0;
    task.dependsOn.forEach(depId => {
      if (entries[depId] && entries[depId].ef > maxES) {
        maxES = entries[depId].ef;
      }
    });
    
    entries[taskId].es = maxES;
    entries[taskId].ef = maxES + task.duration;
    
    if (entries[taskId].ef > projectDuration) {
      projectDuration = entries[taskId].ef;
    }
  }

  // Backward pass
  for (let i = sorted.length - 1; i >= 0; i--) {
    const taskId = sorted[i];
    const task = taskMap.get(taskId)!;
    
    const dependents = dependentsMap[taskId];
    if (dependents.length === 0) {
      entries[taskId].lf = projectDuration;
    } else {
      let minLS = Infinity;
      dependents.forEach(depId => {
        if (entries[depId] && entries[depId].ls < minLS) {
          minLS = entries[depId].ls;
        }
      });
      entries[taskId].lf = minLS;
    }
    
    entries[taskId].ls = entries[taskId].lf - task.duration;
    entries[taskId].slack = entries[taskId].ls - entries[taskId].es;
    entries[taskId].isCritical = entries[taskId].slack === 0;
  }

  const criticalPath = sorted.filter(taskId => entries[taskId].isCritical);

  return {
    entries,
    projectDuration,
    criticalPath
  };
}

export function wouldCreateCycle(tasks: Task[], newEdge: { from: string; to: string }): boolean {
  // from depends on to, so we add to to from's dependsOn array
  // Wait, if it's the UI saying "A depends on B", A is `from` and B is `to`. Or maybe it's "Edge from B to A".
  // Let's test both. Actually, Kahn's builds adjList with `dep -> dependent`.
  // If `from` is dependency and `to` is dependent: then `to` depends on `from`.
  // Let's assume standard graph terminology: an edge FROM A TO B means A -> B (A must finish before B can start).
  // So B depends on A.
  const tempTasks: Task[] = tasks.map(t => {
    if (t.id === newEdge.to) {
      return { ...t, dependsOn: [...t.dependsOn, newEdge.from] };
    }
    return t;
  });

  return topologicalSort(tempTasks) === null;
}
