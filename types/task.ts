// Unified types for tasks, checklists, and users

export type ChecklistItem = {
  id: string;
  text: string;
  checked: boolean;
};

export type User = {
  name: string;
  initials: string;
  color: string;
  id: string;
};

export type Task = {
  id: string;
  record_id: string;
  type: string;
  key: string;
  summary: string;
  description: string;
  comments: string[];
  status: string;
  created: string;
  updated: string;
  assigner: User;
  assigned_to: User;
  dueDate?: string;
  checklist?: ChecklistItem[];
  order?: number;
  more_data?: {
    task_status: string;
    due_date?: string;
    sprint_id?: string;
    title?: string;
    description?: string;
    checklist?: ChecklistItem[];
    assigned_by?: string;
    assigned_to?: string;
    assigned_date?: string;
    assigned_time?: string;
    status_updated_by?: string;
    status_updated_date?: string;
    status_updated_time?: string;
    task_order?: number;
  };
  setReminder?: {
    date: string;
    time: string;
    title: string;
    description: string;
  };
};
