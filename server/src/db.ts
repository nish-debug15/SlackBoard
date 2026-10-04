import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Task, ProjectSettings } from '@slackboard/shared';
import { getSeedTasks, getDefaultSettings } from '@slackboard/shared';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.NODE_ENV === 'test' 
  ? resolve(__dirname, '../data/test-db.json')
  : resolve(__dirname, '../data/db.json');

interface DB {
  tasks: Task[];
  settings: ProjectSettings;
}

function ensureDir(): void {
  const dir = dirname(DB_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function readDB(): DB {
  ensureDir();
  if (!existsSync(DB_PATH)) {
    const defaultDB: DB = {
      tasks: getSeedTasks(),
      settings: getDefaultSettings(),
    };
    writeFileSync(DB_PATH, JSON.stringify(defaultDB, null, 2), 'utf-8');
    return defaultDB;
  }
  try {
    const raw = readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw) as DB;
  } catch {
    const defaultDB: DB = {
      tasks: getSeedTasks(),
      settings: getDefaultSettings(),
    };
    writeFileSync(DB_PATH, JSON.stringify(defaultDB, null, 2), 'utf-8');
    return defaultDB;
  }
}

function writeDB(db: DB): void {
  ensureDir();
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

export function getTasks(): Task[] {
  return readDB().tasks;
}

export function setTasks(tasks: Task[]): void {
  const db = readDB();
  db.tasks = tasks;
  writeDB(db);
}

export function getSettings(): ProjectSettings {
  return readDB().settings;
}

export function setSettings(settings: ProjectSettings): void {
  const db = readDB();
  db.settings = settings;
  writeDB(db);
}

export function resetDB(): DB {
  const defaultDB: DB = {
    tasks: getSeedTasks(),
    settings: getDefaultSettings(),
  };
  writeDB(defaultDB);
  return defaultDB;
}
