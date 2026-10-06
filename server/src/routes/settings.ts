import { Router, Request, Response, NextFunction } from 'express';
import { getSettings, setSettings, resetDB } from '../db.js';
import { validate } from '../middleware/validate.js';
import { SettingsSchema } from '../schemas.js';
import { apiLimiter } from '../middleware/rateLimit.js';

export const settingsRouter = Router();
settingsRouter.use(apiLimiter);

// GET /api/settings
settingsRouter.get('/', (req: Request, res: Response) => {
  res.json(getSettings((req as any).userId));
});

// PUT /api/settings
settingsRouter.put('/', validate(SettingsSchema), (req: Request, res: Response, next: NextFunction) => {
  try {
    setSettings((req as any).userId, req.body);
    res.json(req.body);
  } catch (err) {
    next(err);
  }
});

// POST /api/settings/reset
settingsRouter.post('/reset', (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = resetDB((req as any).userId);
    res.json({ tasks: db.tasks, settings: db.settings });
  } catch (err) {
    next(err);
  }
});
