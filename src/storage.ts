import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface Todo {
  id: number;
  title: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");

function sanitizePerson(person: string): string {
  const clean = person.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_");
  if (!clean) throw new Error("Nom de personne invalide");
  return clean;
}

function filePathFor(person: string): string {
  return path.join(DATA_DIR, `todos-${sanitizePerson(person)}.json`);
}

async function readTodos(person: string): Promise<Todo[]> {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await readFile(filePathFor(person), "utf-8");
    return JSON.parse(raw) as Todo[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function writeTodos(person: string, todos: Todo[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(filePathFor(person), JSON.stringify(todos, null, 2), "utf-8");
}

export async function listTodos(person: string): Promise<Todo[]> {
  return readTodos(person);
}

export async function addTodo(person: string, title: string): Promise<Todo> {
  const todos = await readTodos(person);
  const now = new Date().toISOString();
  const nextId = todos.reduce((max, t) => Math.max(max, t.id), 0) + 1;
  const todo: Todo = { id: nextId, title, done: false, createdAt: now, updatedAt: now };
  todos.push(todo);
  await writeTodos(person, todos);
  return todo;
}

export async function updateTodo(person: string, id: number, title: string): Promise<Todo> {
  const todos = await readTodos(person);
  const todo = todos.find((t) => t.id === id);
  if (!todo) throw new Error(`Todo ${id} introuvable pour ${person}`);
  todo.title = title;
  todo.updatedAt = new Date().toISOString();
  await writeTodos(person, todos);
  return todo;
}

export async function setTodoDone(person: string, id: number, done: boolean): Promise<Todo> {
  const todos = await readTodos(person);
  const todo = todos.find((t) => t.id === id);
  if (!todo) throw new Error(`Todo ${id} introuvable pour ${person}`);
  todo.done = done;
  todo.updatedAt = new Date().toISOString();
  await writeTodos(person, todos);
  return todo;
}

export async function deleteTodo(person: string, id: number): Promise<void> {
  const todos = await readTodos(person);
  const next = todos.filter((t) => t.id !== id);
  if (next.length === todos.length) throw new Error(`Todo ${id} introuvable pour ${person}`);
  await writeTodos(person, next);
}

export async function listPersons(): Promise<string[]> {
  await mkdir(DATA_DIR, { recursive: true });
  const files = await readdir(DATA_DIR);
  return files
    .map((f) => f.match(/^todos-(.+)\.json$/)?.[1])
    .filter((p): p is string => Boolean(p));
}
