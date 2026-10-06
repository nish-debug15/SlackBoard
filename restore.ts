import { writeFileSync, readFileSync } from 'fs';
import { getSeedTasks, getDefaultSettings } from './shared/src/seed.js';

const dbPath = './server/data/db.json';
const dbRaw = readFileSync(dbPath, 'utf-8');
const db = JSON.parse(dbRaw);

const nishitId = '10d6348a-549e-4baf-aea7-a7f1093c0aa3';
db[nishitId] = {
  tasks: getSeedTasks(),
  settings: getDefaultSettings()
};

writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log("Successfully restored Nishits seed data!");
