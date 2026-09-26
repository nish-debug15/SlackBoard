import { describe, it, expect } from 'vitest';
import { topologicalSort, computeSchedule, wouldCreateCycle } from './cpm';
import { Task } from '../types';

describe('CPM Engine', () => {
  it('handles a linear chain correctly', () => {
    const tasks: Task[] = [
      { id: 'A', title: 'A', column: 'todo', duration: 2, dependsOn: [] },
      { id: 'B', title: 'B', column: 'todo', duration: 3, dependsOn: ['A'] },
      { id: 'C', title: 'C', column: 'todo', duration: 1, dependsOn: ['B'] },
    ];

    const schedule = computeSchedule(tasks);
    expect(schedule.projectDuration).toBe(6);
    expect(schedule.criticalPath).toEqual(['A', 'B', 'C']);
    
    expect(schedule.entries['A']).toMatchObject({ es: 0, ef: 2, ls: 0, lf: 2, slack: 0, isCritical: true });
    expect(schedule.entries['B']).toMatchObject({ es: 2, ef: 5, ls: 2, lf: 5, slack: 0, isCritical: true });
    expect(schedule.entries['C']).toMatchObject({ es: 5, ef: 6, ls: 5, lf: 6, slack: 0, isCritical: true });
  });

  it('handles a graph with a branch and merge', () => {
    // A(2) -> B(3) -> D(1)
    //      -> C(1) ->
    const tasks: Task[] = [
      { id: 'A', title: 'A', column: 'todo', duration: 2, dependsOn: [] },
      { id: 'B', title: 'B', column: 'todo', duration: 3, dependsOn: ['A'] },
      { id: 'C', title: 'C', column: 'todo', duration: 1, dependsOn: ['A'] },
      { id: 'D', title: 'D', column: 'todo', duration: 1, dependsOn: ['B', 'C'] },
    ];

    const schedule = computeSchedule(tasks);
    expect(schedule.projectDuration).toBe(6);
    expect(schedule.criticalPath).toEqual(['A', 'B', 'D']);

    expect(schedule.entries['A']).toMatchObject({ es: 0, ef: 2, ls: 0, lf: 2, slack: 0, isCritical: true });
    expect(schedule.entries['B']).toMatchObject({ es: 2, ef: 5, ls: 2, lf: 5, slack: 0, isCritical: true });
    expect(schedule.entries['C']).toMatchObject({ es: 2, ef: 3, ls: 4, lf: 5, slack: 2, isCritical: false });
    expect(schedule.entries['D']).toMatchObject({ es: 5, ef: 6, ls: 5, lf: 6, slack: 0, isCritical: true });
  });

  it('returns null for a cycle', () => {
    const tasks: Task[] = [
      { id: 'A', title: 'A', column: 'todo', duration: 1, dependsOn: ['B'] },
      { id: 'B', title: 'B', column: 'todo', duration: 1, dependsOn: ['A'] },
    ];

    expect(topologicalSort(tasks)).toBeNull();
  });

  it('detects if adding an edge would create a cycle', () => {
    const tasks: Task[] = [
      { id: 'A', title: 'A', column: 'todo', duration: 1, dependsOn: [] },
      { id: 'B', title: 'B', column: 'todo', duration: 1, dependsOn: ['A'] },
    ];

    // Adding an edge from B to A (meaning A depends on B) would create a cycle.
    expect(wouldCreateCycle(tasks, { from: 'B', to: 'A' })).toBe(true);
    
    // Adding an edge from C to A (if C exists) would not.
    const tasksWithC: Task[] = [
      ...tasks,
      { id: 'C', title: 'C', column: 'todo', duration: 1, dependsOn: [] }
    ];
    expect(wouldCreateCycle(tasksWithC, { from: 'C', to: 'B' })).toBe(false);
  });
});
