import type { Task } from './types';

export const TASKS: Task[] = [
  { id: 't1', title: 'Buy groceries', status: 'todo', priority: 'high', due: '2026-02-13' },
  { id: 't2', title: 'Write blog post', status: 'doing', priority: 'medium', due: '2026-02-14' },
  { id: 't3', title: 'Fix leaky faucet', status: 'todo', priority: 'low' },
  { id: 't4', title: 'Read chapter 5', status: 'done', priority: 'medium', due: '2026-02-10' },
  { id: 't5', title: 'Call dentist', status: 'todo', priority: 'high', due: '2026-02-12' },
  { id: 't6', title: 'Update resume', status: 'doing', priority: 'high' },
  { id: 't7', title: 'Organize desk', status: 'done', priority: 'low' },
];
