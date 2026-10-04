import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const USERS_PATH = process.env.NODE_ENV === 'test'
  ? resolve(__dirname, '../../data/test-users.json')
  : resolve(__dirname, '../../data/users.json');

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

function ensureDir(): void {
  const dir = dirname(USERS_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function getUsers(): User[] {
  ensureDir();
  if (!existsSync(USERS_PATH)) {
    writeFileSync(USERS_PATH, JSON.stringify([], null, 2), 'utf-8');
    return [];
  }
  try {
    return JSON.parse(readFileSync(USERS_PATH, 'utf-8')) as User[];
  } catch {
    return [];
  }
}

export function saveUsers(users: User[]): void {
  ensureDir();
  writeFileSync(USERS_PATH, JSON.stringify(users, null, 2), 'utf-8');
}
