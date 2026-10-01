import { Task, Schedule, ScheduleEntry } from './types.js';

/**
 * Topological sort using Kahn's algorithm.
 * Returns the sorted task IDs if the graph is a DAG.
 * Returns { cycle: string[] } with the actual cycle path if a cycle exists.
 */
export function topoSort(tasks: Task[]): string[] | { cycle: string[] } {
  // Build adjacency list and in-degree map
  // dependsOn means: if task B has dependsOn: ['A'], then A -> B (A must finish first)
  const taskIds = new Set(tasks.map(t => t.id));
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>(); // from dependency to dependent
  
  for (const t of tasks) {
    inDegree.set(t.id, 0);
    adjList.set(t.id, []);
  }
  
  for (const t of tasks) {
    for (const depId of t.dependsOn) {
      if (taskIds.has(depId)) {
        adjList.get(depId)!.push(t.id);
        inDegree.set(t.id, (inDegree.get(t.id) ?? 0) + 1);
      }
    }
  }
  
  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }
  
  const sorted: string[] = [];
  const tempInDegree = new Map(inDegree);
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);
    for (const neighbor of adjList.get(current) ?? []) {
      const newDeg = (tempInDegree.get(neighbor) ?? 1) - 1;
      tempInDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }
  
  if (sorted.length === tasks.length) {
    return sorted;
  }
  
  // Cycle detected - find the actual cycle path using DFS
  return { cycle: findCycle(tasks) };
}

/**
 * Find an actual cycle path using DFS.
 * Returns the cycle as an array of task IDs forming the cycle.
 */
function findCycle(tasks: Task[]): string[] {
  const taskIds = new Set(tasks.map(t => t.id));
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>();
  const parent = new Map<string, string | null>();
  
  for (const t of tasks) {
    color.set(t.id, WHITE);
    parent.set(t.id, null);
  }
  
  // For cycle detection: task depends on depId means edge depId -> task
  // But for DFS cycle detection, we follow edges from dependency to dependent
  // Build adjacency: depId -> [dependents]
  const adj = new Map<string, string[]>();
  for (const t of tasks) adj.set(t.id, []);
  for (const t of tasks) {
    for (const depId of t.dependsOn) {
      if (taskIds.has(depId)) {
        adj.get(depId)!.push(t.id);
      }
    }
  }
  
  for (const t of tasks) {
    if (color.get(t.id) === WHITE) {
      const cycle = dfs(t.id, adj, color, parent);
      if (cycle) return cycle;
    }
  }
  
  return []; // Should not reach here if called only when cycle exists
}

function dfs(
  u: string,
  adj: Map<string, string[]>,
  color: Map<string, number>,
  parent: Map<string, string | null>
): string[] | null {
  const GRAY = 1, BLACK = 2;
  color.set(u, GRAY);
  
  for (const v of adj.get(u) ?? []) {
    if (color.get(v) === GRAY) {
      // Found cycle: reconstruct from v back to v through parent chain
      const cycle: string[] = [v];
      let curr = u;
      while (curr !== v) {
        cycle.push(curr);
        curr = parent.get(curr)!;
      }
      cycle.push(v);
      cycle.reverse();
      return cycle;
    }
    if (color.get(v) === 0) { // WHITE
      parent.set(v, u);
      const result = dfs(v, adj, color, parent);
      if (result) return result;
    }
  }
  
  color.set(u, BLACK);
  return null;
}

/**
 * Compute the full CPM schedule.
 * Returns empty schedule if cycle detected.
 */
export function computeSchedule(tasks: Task[]): Schedule {
  if (tasks.length === 0) {
    return { entries: {}, projectDuration: 0, criticalPath: [] };
  }

  const sortResult = topoSort(tasks);
  if (!Array.isArray(sortResult)) {
    // Cycle detected
    return { entries: {}, projectDuration: 0, criticalPath: [] };
  }
  
  const sorted = sortResult;
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const entries: Record<string, ScheduleEntry> = {};
  
  // Build dependents map (who depends on me)
  const dependentsMap = new Map<string, string[]>();
  for (const t of tasks) dependentsMap.set(t.id, []);
  for (const t of tasks) {
    for (const depId of t.dependsOn) {
      if (dependentsMap.has(depId)) {
        dependentsMap.get(depId)!.push(t.id);
      }
    }
  }
  
  // Initialize entries
  for (const t of tasks) {
    entries[t.id] = { taskId: t.id, es: 0, ef: 0, ls: 0, lf: 0, slack: 0, isCritical: false };
  }
  
  // Forward pass (in topo order)
  let projectDuration = 0;
  for (const taskId of sorted) {
    const task = taskMap.get(taskId)!;
    let maxEF = 0;
    for (const depId of task.dependsOn) {
      if (entries[depId]) {
        maxEF = Math.max(maxEF, entries[depId].ef);
      }
    }
    entries[taskId].es = maxEF;
    entries[taskId].ef = maxEF + task.duration;
    projectDuration = Math.max(projectDuration, entries[taskId].ef);
  }
  
  // Backward pass (reverse topo order)
  for (let i = sorted.length - 1; i >= 0; i--) {
    const taskId = sorted[i];
    const task = taskMap.get(taskId)!;
    const dependents = dependentsMap.get(taskId) ?? [];
    
    if (dependents.length === 0) {
      entries[taskId].lf = projectDuration;
    } else {
      let minLS = Infinity;
      for (const depId of dependents) {
        if (entries[depId]) {
          minLS = Math.min(minLS, entries[depId].ls);
        }
      }
      entries[taskId].lf = minLS;
    }
    
    entries[taskId].ls = entries[taskId].lf - task.duration;
    entries[taskId].slack = entries[taskId].ls - entries[taskId].es;
    entries[taskId].isCritical = entries[taskId].slack === 0;
  }
  
  // Critical path: tasks with slack === 0, in topo order
  const criticalPath = sorted.filter(id => entries[id].isCritical);
  
  return { entries, projectDuration, criticalPath };
}

/**
 * Check if adding a dependency would create a cycle.
 * Parameters: from = the task that will be depended upon, to = the task that will depend on it.
 * i.e., `to` will add `from` to its dependsOn.
 * Returns null if no cycle would be created.
 * Returns the offending cycle path as string[] if a cycle would be created.
 */
export function wouldCreateCycle(
  tasks: Task[],
  from: string,
  to: string
): string[] | null {
  // Self-loop
  if (from === to) return [from, to];
  
  // Create temporary task list with the new edge
  const tempTasks = tasks.map(t => {
    if (t.id === to) {
      return { ...t, dependsOn: [...t.dependsOn, from] };
    }
    return t;
  });
  
  const result = topoSort(tempTasks);
  if (Array.isArray(result)) {
    return null; // No cycle
  }
  return result.cycle;
}

/**
 * Calculate the impact of a task slipping by N days.
 * Uses the correct formula: max(0, N - slack(task))
 * Returns the number of days the project end would move.
 */
export function slipImpact(
  schedule: Schedule,
  taskId: string,
  slipDays: number
): number {
  const entry = schedule.entries[taskId];
  if (!entry) return 0;
  return Math.max(0, slipDays - entry.slack);
}
