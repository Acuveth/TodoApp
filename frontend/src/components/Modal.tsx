// Type definitions
export interface Task {
    id: number;
    title: string;
    description?: string;
    priority: number;
    status: string;
    due_date?: string;
    is_calendar_event: boolean;
    created_at: string;
    substeps?: TaskSubstep[];
    notes?: TaskNote[];
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
    mood?: number;
    weather?: string;
    created_at: string;
  }
  
  export interface NewTask {
    title: string;
    description: string;
    priority: number;
    due_date: string;
    is_calendar_event: boolean;
  }
  
  export interface NewFolder {
    name: string;
    color: string;
  }
  
  export interface NewDiaryEntry {
    entry_date: string;
    title: string;
    content: string;
    mood: number;
    weather: string;
  }