import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../index.js';
import { saveUsers } from '../db/users.js';

describe('Auth API Routes', () => {
  beforeEach(() => {
    saveUsers([]); // clear users DB
  });

  it('signup succeeds', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      name: 'Alice', email: 'alice@example.com', password: 'password123'
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('alice@example.com');
  });

  it('wrong password returns 401', async () => {
    await request(app).post('/api/auth/signup').send({
      name: 'Alice', email: 'alice@example.com', password: 'password123'
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com', password: 'wrongpassword'
    });
    expect(res.status).toBe(401);
  });

  it('a protected route without a token returns 401', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });
});
