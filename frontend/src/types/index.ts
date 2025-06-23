// Type definitions with HIERARCHY support
export interface Task {
  id: number;
  title: string;
  description?: string;
  priority: number;
  status: string;
  due_date?: string;
  is_calendar_event: boolean;
  parent_task_id?: number; // Hierarchy support
  indent_level: number; // Indentation level
  order_index: number; // Ordering within level
  created_at: string;
  progress?: number; // Calculated progress from subtasks
  auto_completed?: boolean; // Auto-completed based on subtasks
  substeps?: TaskSubstep[];
  notes?: TaskNote[];
  subtasks?: Task[]; // Child tasks
}

export interface TaskSubstep {
  id: number;
  title: string;
  description?: string;
  is_completed: boolean;
  order_index: number;
  created_at: string;
}

export interface TaskNote {
  id: number;
  content: string;
  created_at: string;
}

export interface FolderType {
  id: number;
  name: string;
  color: string;
  parent_folder_id?: number;
  created_at: string;
}

export interface DiaryEntry {
  id: number;
  entry_date: string;
  title?: string;
  content: string;
  created_at: string;
  folder_id?: number;
}

export interface NewTask {
  title: string;
  description: string;
  priority: number;
  due_date: string;
  is_calendar_event: boolean;
  parent_task_id?: number; // For creating subtasks
  indent_level?: number; // Indentation level
  order_index?: number; // Ordering
}

export interface NewFolder {
  name: string;
  color: string;
}

export interface NewDiaryEntry {
  entry_date: string;
  title: string;
  content: string;
  folder_id?: number;
}
