import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Task, ProjectSettings, getSeedTasks, getDefaultSettings } from '@slackboard/shared';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.NODE_ENV === 'test' 
  ? resolve(__dirname, '../data/test-db.json')
  : resolve(__dirname, '../data/db.json');

interface UserData {
  tasks: Task[];
  settings: ProjectSettings;
}

type DB = Record<string, UserData>;

function ensureDir(): void {
  const dir = dirname(DB_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function readDB(): DB {
  ensureDir();
  if (!existsSync(DB_PATH)) {
    writeFileSync(DB_PATH, JSON.stringify({}, null, 2), 'utf-8');
    return {};
  }
  try {
    const raw = readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.tasks && Array.isArray(parsed.tasks)) {
      // Legacy single-user DB format. Wipe it or start fresh.
      return {};
    }
    return parsed as DB;
  } catch {
    return {};
  }
}

function writeDB(db: DB): void {
  ensureDir();
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

function ensureUser(db: DB, userId: string) {
  if (!db[userId]) {
    const today = new Date();
    db[userId] = {
      tasks: [],
      settings: {
        name: 'My Project',
        startDate: today.toISOString().split('T')[0],
      }
    };
  }
}

export function getTasks(userId: string): Task[] {
  const db = readDB();
  ensureUser(db, userId);
  return db[userId].tasks;
}

export function setTasks(userId: string, tasks: Task[]): void {
  const db = readDB();
  ensureUser(db, userId);
  db[userId].tasks = tasks;
  writeDB(db);
}

export function getSettings(userId: string): ProjectSettings {
  const db = readDB();
  ensureUser(db, userId);
  return db[userId].settings;
}

export function setSettings(userId: string, settings: ProjectSettings): void {
  const db = readDB();
  ensureUser(db, userId);
  db[userId].settings = settings;
  writeDB(db);
}

export function resetDB(userId: string): UserData {
  const db = readDB();
  db[userId] = {
    tasks: getSeedTasks(),
    settings: getDefaultSettings()
  };
  writeDB(db);
  return db[userId];
}
