import { Router, Request, Response } from 'express';
import { getTasks } from '../db.js';
import { computeSchedule } from '@slackboard/shared';
import { apiLimiter } from '../middleware/rateLimit.js';

export const scheduleRouter = Router();
scheduleRouter.use(apiLimiter);

// GET /api/schedule - always derived, never stored
scheduleRouter.get('/', (_req: Request, res: Response) => {
  const tasks = getTasks((req as any).userId);
  const schedule = computeSchedule(tasks);
  res.json(schedule);
});
