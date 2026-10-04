import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tasksRouter } from './routes/tasks.js';
import { scheduleRouter } from './routes/schedule.js';
import { copilotRouter } from './routes/copilot.js';
import { settingsRouter } from './routes/settings.js';
import { errorHandler } from './middleware/errorHandler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

import { requireAuth } from './middleware/auth.js';
import { authRouter } from './routes/auth.js';

app.use('/api/auth', authRouter);
app.use('/api/tasks', requireAuth, tasksRouter);
app.use('/api/schedule', requireAuth, scheduleRouter);
app.use('/api/copilot', requireAuth, copilotRouter);
app.use('/api/settings', requireAuth, settingsRouter);

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`SlackBoard server running on port ${PORT}`);
  });
}

export { app };
