// Type definitions with HIERARCHY support
export interface Task {
  id: number;
  title: string;
  description?: string;
  priority: number;
  status: string;
  due_date?: string;
  is_calendar_event: boolean;
  parent_task_id?: number; // NEW: Hierarchy support
  indent_level: number; // NEW: Indentation level
  order_index: number; // NEW: Ordering within level
  created_at: string;
  progress?: number; // NEW: Calculated progress from subtasks
  auto_completed?: boolean; // NEW: Auto-completed based on subtasks
  substeps?: TaskSubstep[];
  notes?: TaskNote[];
  subtasks?: Task[]; // NEW: Child tasks
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
  parent_task_id?: number; // NEW: For creating subtasks
  indent_level?: number; // NEW: Indentation level
  order_index?: number; // NEW: Ordering
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

// NEW: Interface for task hierarchy operations
export interface TaskIndentUpdate {
  task_id: number;
  indent_change: number; // +1 to indent, -1 to outdent
}

// NEW: Interface for task reordering
export interface TaskReorder {
  task_id: number;
  new_order_index: number;
  new_parent_id?: number;
}
