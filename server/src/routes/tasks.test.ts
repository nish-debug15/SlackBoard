import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../index.js';
import { resetDB, getTasks } from '../db.js';
import { saveUsers } from '../db/users.js';
import { Task } from '@slackboard/shared';

describe('Tasks API Routes', () => {
  let token = '';
  let userId = '';

  beforeEach(async () => {
    // Reset DB to clean state before each test
    saveUsers([]); // clear users DB
    
    const signupRes = await request(app).post('/api/auth/signup').send({
      name: 'Test', email: 'test@example.com', password: 'password123'
    });
    token = signupRes.body.token;
    userId = signupRes.body.user.id;
    
    resetDB(userId);
  });

  it('GET /api/tasks returns all tasks', async () => {
    const res = await request(app).get('/api/tasks').set('Authorization', `Bearer ${token}`);
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
      .set('Authorization', `Bearer ${token}`)
      .send(newTask);
      
    expect(res.status).toBe(201);
    expect(res.body.title).toBe(newTask.title);
    
    const tasks = getTasks(userId);
    expect(tasks.some(t => t.title === 'New Feature')).toBe(true);
  });

  it('POST /api/tasks rejects cycle-forming dependency', async () => {
    const tasks = getTasks(userId);
    // In seed data: design depends on research. 
    // If we make research depend on design, it's a cycle.
    const designTask = tasks.find(t => t.id === 'design')!;
    
    const updateReq = {
      title: 'Market Research',
      duration: 3,
      dependsOn: ['design'],
      column: 'todo'
    };
    
    const res = await request(app)
      .put('/api/tasks/research')
      .set('Authorization', `Bearer ${token}`)
      .send(updateReq);
      
    expect(res.status).toBe(422);
    expect(res.body.error).toContain('cycle');
  });

  it('DELETE /api/tasks cascades dependencies', async () => {
    const res = await request(app).delete('/api/tasks/research').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    
    const tasks = getTasks(userId);
    const designTask = tasks.find(t => t.id === 'design')!;
    expect(designTask.dependsOn.includes('research')).toBe(false);
  });
});
