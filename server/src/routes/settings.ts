import { Router, Request, Response, NextFunction } from 'express';
import { getSettings, setSettings, resetDB } from '../db.js';
import { validate } from '../middleware/validate.js';
import { SettingsSchema } from '../schemas.js';
import { apiLimiter } from '../middleware/rateLimit.js';

export const settingsRouter = Router();
settingsRouter.use(apiLimiter);

// GET /api/settings
settingsRouter.get('/', (_req: Request, res: Response) => {
  res.json(getSettings());
});

// PUT /api/settings
settingsRouter.put('/', validate(SettingsSchema), (req: Request, res: Response, next: NextFunction) => {
  try {
    setSettings(req.body);
    res.json(req.body);
  } catch (err) {
    next(err);
  }
});

// POST /api/settings/reset
settingsRouter.post('/reset', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const db = resetDB();
    res.json({ tasks: db.tasks, settings: db.settings });
  } catch (err) {
    next(err);
  }
});
