import fs from 'fs';
import path from 'path';

const USERS_FILE = path.resolve('./data/users.json');

function ensureFile() {
  if (!fs.existsSync(path.dirname(USERS_FILE))) fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
}

export function readUsers() {
  ensureFile();
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

export function writeUsers(users) {
  ensureFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

export function findUserByEmail(email) {
  return readUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id) {
  return readUsers().find((u) => u.id === id);
}

export function addUser(user) {
  const users = readUsers();
  users.push(user);
  writeUsers(users);
  return user;
}
