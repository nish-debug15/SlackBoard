import { Task, ProjectSettings } from './types.js';

/**
 * 14-task product launch plan.
 * 
 * Graph structure:
 *   Research(3) ──┬──> Design(5) ──┬──> Frontend(8) ──┬──> Integration(3) ──> QA(4) ──> Staging(2) ──> Deploy(1)
 *                 │               │                  │
 *                 └──> API Spec(2)└──> API Dev(6) ────┘
 *                 
 *   Content(4) ──> Docs(3) ──> Review(2) ──> Deploy(1)  [merges at Deploy]
 *   
 *   Analytics(2) ──> Monitoring(1) ──> Deploy(1) [merges at Deploy]
 *
 * Critical path: Research -> Design -> Frontend -> Integration -> QA -> Staging -> Deploy
 * Project duration: 3+5+8+3+4+2+1 = 26 days
 */
export function getSeedTasks(): Task[] {
  return [
    { id: 'research',     title: 'Market Research',       column: 'done',       duration: 3, dependsOn: [] },
    { id: 'design',       title: 'UI/UX Design',          column: 'done',       duration: 5, dependsOn: ['research'] },
    { id: 'api-spec',     title: 'API Specification',     column: 'done',       duration: 2, dependsOn: ['research'] },
    { id: 'frontend',     title: 'Frontend Development',  column: 'inprogress', duration: 8, dependsOn: ['design'] },
    { id: 'api-dev',      title: 'API Development',       column: 'inprogress', duration: 6, dependsOn: ['api-spec', 'design'] },
    { id: 'content',      title: 'Content Strategy',      column: 'done',       duration: 4, dependsOn: [] },
    { id: 'docs',         title: 'Documentation',         column: 'todo',       duration: 3, dependsOn: ['content', 'api-spec'] },
    { id: 'integration',  title: 'Integration Testing',   column: 'todo',       duration: 3, dependsOn: ['frontend', 'api-dev'] },
    { id: 'qa',           title: 'QA & Bug Fixes',        column: 'todo',       duration: 4, dependsOn: ['integration'] },
    { id: 'review',       title: 'Content Review',        column: 'todo',       duration: 2, dependsOn: ['docs'] },
    { id: 'analytics',    title: 'Analytics Setup',       column: 'todo',       duration: 2, dependsOn: [] },
    { id: 'monitoring',   title: 'Monitoring Setup',      column: 'todo',       duration: 1, dependsOn: ['analytics'] },
    { id: 'staging',      title: 'Staging Deployment',    column: 'todo',       duration: 2, dependsOn: ['qa', 'review'] },
    { id: 'deploy',       title: 'Production Deploy',     column: 'todo',       duration: 1, dependsOn: ['staging', 'monitoring'] },
  ];
}

export function getDefaultSettings(): ProjectSettings {
  const today = new Date();
  return {
    name: 'Product Launch',
    startDate: today.toISOString().split('T')[0],
  };
}
