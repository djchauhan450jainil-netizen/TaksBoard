export enum Priority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
}

export type TaskStatus = 'pending' | 'done';

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Task {
  id: string;
  subject_id: string;
  title: string;
  priority: Priority;
  status: TaskStatus;
  order_index: number;
  created_at: string;
  due_date?: string; // Optional due date to support "Due Soon" filter
}

export type TaskFilter = 'all' | 'high' | 'due_soon';

export type Theme = 'light' | 'dark';
