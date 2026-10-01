import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../index.js';
import { resetDB, getTasks } from '../db.js';
import { Task } from '@slackboard/shared';

describe('Tasks API Routes', () => {
  beforeEach(() => {
    // Reset DB to clean state before each test
    resetDB();
  });

  it('GET /api/tasks returns all tasks', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('POST /api/tasks creates a new task', async () => {
    const newTask = {
      title: 'New Feature',
      duration: 5,
      dependsOn: [],
      column: 'todo'
    };
    
    const res = await request(app)
      .post('/api/tasks')
      .send(newTask);
      
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.title).toBe('New Feature');
    expect(res.body.duration).toBe(5);
  });

  it('POST /api/tasks rejects cycle-forming dependency', async () => {
    // We already have "research" in the seed data. Let's create a new task that depends on research.
    const res1 = await request(app)
      .post('/api/tasks')
      .send({
        title: 'Task A',
        duration: 2,
        dependsOn: ['research'],
        column: 'todo'
      });
    const taskIdA = res1.body.id;

    // Try to update research to depend on Task A (creating a cycle: research -> Task A -> research)
    const res2 = await request(app)
      .put('/api/tasks/research')
      .send({
        title: 'Market Research',
        duration: 3,
        dependsOn: [taskIdA],
        column: 'todo'
      });
      
    expect(res2.status).toBe(422);
    expect(res2.body.error).toContain('cycle');
  });

  it('DELETE /api/tasks cascades dependencies', async () => {
    // seed data has "design" depending on "research"
    const tasksBefore = getTasks();
    const designBefore = tasksBefore.find((t: Task) => t.id === 'design');
    expect(designBefore?.dependsOn).toContain('research');

    const res = await request(app).delete('/api/tasks/research');
    expect(res.status).toBe(200);

    const tasksAfter = getTasks();
    const designAfter = tasksAfter.find((t: Task) => t.id === 'design');
    expect(designAfter?.dependsOn).not.toContain('research');
  });
});
