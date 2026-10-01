import { computeSchedule, topoSort, wouldCreateCycle, slipImpact } from './cpm.js';
import { Task } from './types.js';

/**
 * Test Graph Structure:
 *   A(3) ──> B(4) ──> D(2)
 *                      ^
 *   C(2) ──> E(5) ────┘
 *                      
 *   F(6) (orphan)
 */
describe('CPM Engine', () => {
  const baseTasks: Task[] = [
    { id: 'A', title: 'A', column: 'todo', duration: 3, dependsOn: [] },
    { id: 'C', title: 'C', column: 'todo', duration: 2, dependsOn: [] },
    { id: 'F', title: 'F', column: 'todo', duration: 6, dependsOn: [] },
    { id: 'B', title: 'B', column: 'todo', duration: 4, dependsOn: ['A'] },
    { id: 'E', title: 'E', column: 'todo', duration: 5, dependsOn: ['C'] },
    { id: 'D', title: 'D', column: 'todo', duration: 2, dependsOn: ['B', 'E'] },
  ];

  it('computes correct full graph metrics (parallel chains, orphan, etc.)', () => {
    const schedule = computeSchedule(baseTasks);
    
    // Project duration
    expect(schedule.projectDuration).toBe(9);
    
    // Check A
    expect(schedule.entries['A']).toEqual({ taskId: 'A', es: 0, ef: 3, ls: 0, lf: 3, slack: 0, isCritical: true });
    // Check C
    expect(schedule.entries['C']).toEqual({ taskId: 'C', es: 0, ef: 2, ls: 0, lf: 2, slack: 0, isCritical: true });
    // Check F
    expect(schedule.entries['F']).toEqual({ taskId: 'F', es: 0, ef: 6, ls: 3, lf: 9, slack: 3, isCritical: false });
    // Check B
    expect(schedule.entries['B']).toEqual({ taskId: 'B', es: 3, ef: 7, ls: 3, lf: 7, slack: 0, isCritical: true });
    // Check E
    expect(schedule.entries['E']).toEqual({ taskId: 'E', es: 2, ef: 7, ls: 2, lf: 7, slack: 0, isCritical: true });
    // Check D
    expect(schedule.entries['D']).toEqual({ taskId: 'D', es: 7, ef: 9, ls: 7, lf: 9, slack: 0, isCritical: true });

    // Critical paths: both branches
    // Should include A, C, B, E, D (F is non-critical).
    // The exact topo order could be A, C, B, E, D or similar
    expect(schedule.criticalPath).toContain('A');
    expect(schedule.criticalPath).toContain('C');
    expect(schedule.criticalPath).toContain('B');
    expect(schedule.criticalPath).toContain('E');
    expect(schedule.criticalPath).toContain('D');
    expect(schedule.criticalPath).not.toContain('F');
  });

  it('computes linear chain correctly', () => {
    const tasks: Task[] = [
      { id: 'A', title: 'A', column: 'todo', duration: 2, dependsOn: [] },
      { id: 'B', title: 'B', column: 'todo', duration: 3, dependsOn: ['A'] },
      { id: 'C', title: 'C', column: 'todo', duration: 1, dependsOn: ['B'] },
    ];
    const schedule = computeSchedule(tasks);
    expect(schedule.projectDuration).toBe(6);
    expect(schedule.criticalPath).toEqual(['A', 'B', 'C']);
    expect(schedule.entries['A'].slack).toBe(0);
    expect(schedule.entries['B'].slack).toBe(0);
    expect(schedule.entries['C'].slack).toBe(0);
  });

  it('computes branch and merge where one branch has slack', () => {
    const tasks: Task[] = [
      { id: 'A', title: 'A', column: 'todo', duration: 2, dependsOn: [] },
      { id: 'B', title: 'B', column: 'todo', duration: 3, dependsOn: ['A'] },
      { id: 'C', title: 'C', column: 'todo', duration: 1, dependsOn: ['A'] },
      { id: 'D', title: 'D', column: 'todo', duration: 1, dependsOn: ['B', 'C'] },
    ];
    // Critical path A(2) -> B(3) -> D(1) = 6
    // Branch A(2) -> C(1) -> D(1) = 4, so C has 2 days slack
    const schedule = computeSchedule(tasks);
    expect(schedule.projectDuration).toBe(6);
    expect(schedule.entries['B'].isCritical).toBe(true);
    expect(schedule.entries['C'].slack).toBe(2);
    expect(schedule.entries['C'].isCritical).toBe(false);
  });

  it('handles multiple dependents (picks min(LS) in backward pass)', () => {
    // A -> B(2) -> D(3)
    // A -> C(4) -> E(1)
    // If A(1):
    // B branch takes 1 + 2 + 3 = 6
    // C branch takes 1 + 4 + 1 = 6
    const tasks: Task[] = [
      { id: 'A', title: 'A', column: 'todo', duration: 1, dependsOn: [] },
      { id: 'B', title: 'B', column: 'todo', duration: 2, dependsOn: ['A'] },
      { id: 'C', title: 'C', column: 'todo', duration: 4, dependsOn: ['A'] },
      { id: 'D', title: 'D', column: 'todo', duration: 3, dependsOn: ['B'] }, // LF=6, LS=3. B: LF=3, LS=1
      { id: 'E', title: 'E', column: 'todo', duration: 1, dependsOn: ['C'] }, // LF=6, LS=5. C: LF=5, LS=1
    ];
    // A LF should be min(LS of B, LS of C) = min(1, 1) = 1. Wait, let's make them unbalanced
    tasks.find(t => t.id === 'D')!.duration = 4; // Now B branch is longer (2+4=6 vs C branch 4+1=5)
    // Project duration = 1 + 2 + 4 = 7
    // E: LF=7, LS=6. C: LF=6, LS=2.
    // D: LF=7, LS=3. B: LF=3, LS=1.
    // A: LF = min(1, 2) = 1.
    const schedule = computeSchedule(tasks);
    expect(schedule.projectDuration).toBe(7);
    expect(schedule.entries['A'].lf).toBe(1);
    expect(schedule.entries['C'].slack).toBe(1);
  });

  it('detects self-loop cycle', () => {
    const tasks: Task[] = [
      { id: 'A', title: 'A', column: 'todo', duration: 1, dependsOn: ['A'] },
    ];
    const schedule = computeSchedule(tasks);
    expect(schedule.projectDuration).toBe(0); // empty schedule on cycle
    const result = topoSort(tasks);
    expect(result).toHaveProperty('cycle');
    expect((result as {cycle: string[]}).cycle).toEqual(['A', 'A']);
  });

  it('detects 3-node cycle', () => {
    const tasks: Task[] = [
      { id: 'A', title: 'A', column: 'todo', duration: 1, dependsOn: ['C'] },
      { id: 'B', title: 'B', column: 'todo', duration: 1, dependsOn: ['A'] },
      { id: 'C', title: 'C', column: 'todo', duration: 1, dependsOn: ['B'] },
    ];
    const schedule = computeSchedule(tasks);
    expect(schedule.projectDuration).toBe(0);
    const result = topoSort(tasks);
    expect(result).toHaveProperty('cycle');
    // We expect the cycle to contain A, B, C
    const cycle = (result as {cycle: string[]}).cycle;
    expect(cycle.length).toBeGreaterThanOrEqual(3); // typically A->B->C->A
  });

  it('duration edit - critical task extends project', () => {
    const tasks = structuredClone(baseTasks);
    // Edit A from 3 to 4
    tasks.find(t => t.id === 'A')!.duration = 4;
    const schedule = computeSchedule(tasks);
    // Project was 9, now branch A-B-D is 4+4+2 = 10
    expect(schedule.projectDuration).toBe(10);
  });

  it('duration edit - non-critical within slack does not change project duration', () => {
    const tasks = structuredClone(baseTasks);
    // Edit F from 6 to 8 (has 3 slack, so can go up to 9)
    tasks.find(t => t.id === 'F')!.duration = 8;
    const schedule = computeSchedule(tasks);
    expect(schedule.projectDuration).toBe(9);
    expect(schedule.entries['F'].slack).toBe(1); // Slack reduces to 1
  });

  it('duration edit - non-critical beyond slack extends project', () => {
    const tasks = structuredClone(baseTasks);
    // Edit F from 6 to 11 (has 3 slack, adding 5 days. Should extend by 5-3=2 days)
    tasks.find(t => t.id === 'F')!.duration = 11;
    const schedule = computeSchedule(tasks);
    expect(schedule.projectDuration).toBe(11);
  });

  it('slipImpact formula calculates correct delays', () => {
    const schedule = computeSchedule(baseTasks);
    
    // Critical task slip by 2 days -> delays by 2
    expect(slipImpact(schedule, 'A', 2)).toBe(2);
    
    // Non-critical task (F) slip by 2 days (slack=3) -> no delay
    expect(slipImpact(schedule, 'F', 2)).toBe(0);
    
    // Non-critical task (F) slip by 5 days (slack=3) -> delays by 2
    expect(slipImpact(schedule, 'F', 5)).toBe(2);
  });

  it('wouldCreateCycle detects cycle correctly', () => {
    // baseTasks: A->B->D, C->E->D, F
    // Adding edge E->B (B depends on E). 
    // E depends on C. C depends on nothing.
    // B depends on A. 
    // Wait, E depends on C, so C->E. B depends on E, so C->E->B. D depends on B, so C->E->B->D.
    // D also depends on E. No cycle!
    expect(wouldCreateCycle(baseTasks, 'E', 'B')).toBeNull();

    // Now try adding an edge D->B (B depends on D)
    // But D depends on B. B->D->B = cycle.
    const cycle1 = wouldCreateCycle(baseTasks, 'D', 'B');
    expect(cycle1).not.toBeNull();
    
    // Cross-branch cycle: B depends on A. D depends on B.
    // D depends on E. E depends on C.
    // Let's add C depends on D. D->C->E->D
    const cycle2 = wouldCreateCycle(baseTasks, 'D', 'C');
    expect(cycle2).not.toBeNull();
    // It should contain D, C, E
    expect(cycle2).toContain('D');
    expect(cycle2).toContain('C');
    expect(cycle2).toContain('E');
  });

  it('computes empty task list correctly', () => {
    const schedule = computeSchedule([]);
    expect(schedule.projectDuration).toBe(0);
    expect(schedule.criticalPath).toEqual([]);
    expect(Object.keys(schedule.entries).length).toBe(0);
  });
});
