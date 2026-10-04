import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { apiLimiter } from '../middleware/rateLimit.js';
import { AppError } from '../middleware/errorHandler.js';
import { validate } from '../middleware/validate.js';
import { getUsers, saveUsers, User } from '../db/users.js';

export const authRouter = Router();

const JWT_SECRET = process.env.AUTH_SECRET || 'dev_fallback_secret_do_not_use_in_prod';
if (JWT_SECRET === 'dev_fallback_secret_do_not_use_in_prod') {
  console.warn('WARNING: Using fallback JWT secret. Set AUTH_SECRET in environment.');
}

const SignupSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8)
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

authRouter.use(apiLimiter);

authRouter.post('/signup', validate(SignupSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const users = getUsers();
    if (users.find(u => u.email === email)) {
      throw new AppError(409, 'Email already in use');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser: User = { id: uuidv4(), name, email, passwordHash };
    users.push(newUser);
    saveUsers(users);
    
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, user: { id: newUser.id, name: newUser.name, email: newUser.email } });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', validate(LoginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new AppError(401, 'Invalid email or password');
    }
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    next(error);
  }
});

import { requireAuth } from '../middleware/auth.js';

authRouter.get('/me', requireAuth, (req, res) => {
  const users = getUsers();
  const user = users.find(u => u.id === (req as any).userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  res.json({ id: user.id, name: user.name, email: user.email });
});
