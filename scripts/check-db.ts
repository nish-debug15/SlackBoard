import { readFileSync } from 'fs';
import { computeSchedule } from '@slackboard/shared';

const dbPath = 'server/data/db.json';
const dbRaw = readFileSync(dbPath, 'utf8');
const db = JSON.parse(dbRaw);

const tasks = db.tasks;
console.log('Task count:', tasks.length);

const schedule = computeSchedule(tasks);
console.log('Project duration:', schedule.projectDuration);
