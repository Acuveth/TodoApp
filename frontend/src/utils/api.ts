// API configuration with HIERARCHY support, DELETE functionality, DIARY SCHEDULING, and FOLDER MANAGEMENT
const API_BASE_URL = "http://localhost:8000";

export const api = {
  healthCheck: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },
  getTasks: async (folderId: number | null = null) => {
    const url = folderId
      ? `${API_BASE_URL}/api/tasks?folder_id=${folderId}`
      : `${API_BASE_URL}/api/tasks`;
    const response = await fetch(url);
    return response.json();
  },
  createTask: async (taskData: any) => {
    const response = await fetch(`${API_BASE_URL}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });
    return response.json();
  },
  updateTask: async (taskId: number, updates: any) => {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return response.json();
  },
  // Delete task
  deleteTask: async (taskId: number) => {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete task");
    }
    return response.json();
  },
  // Create subtask under a parent task
  createSubtask: async (parentTaskId: number, taskData: any) => {
    const response = await fetch(
      `${API_BASE_URL}/api/tasks/${parentTaskId}/subtasks`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      }
    );
    return response.json();
  },
  getFolders: async () => {
    const response = await fetch(`${API_BASE_URL}/api/folders`);
    return response.json();
  },
  createFolder: async (folderData: any) => {
    const response = await fetch(`${API_BASE_URL}/api/folders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(folderData),
    });
    return response.json();
  },
  // Update folder
  updateFolder: async (folderId: number, updates: any) => {
    const response = await fetch(`${API_BASE_URL}/api/folders/${folderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error("Failed to update folder");
    }
    return response.json();
  },
  // Delete folder
  deleteFolder: async (folderId: number) => {
    const response = await fetch(`${API_BASE_URL}/api/folders/${folderId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete folder");
      }
      return response.json();
  },
  getDiaryEntries: async (entryDate?: string, folderId?: number) => {
    let url = `${API_BASE_URL}/api/diary`;
    const params = new URLSearchParams();
    if (entryDate) params.append("entry_date", entryDate);
    if (folderId) params.append("folder_id", folderId.toString());
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url);
    return response.json();
  },
  createDiaryEntry: async (entryData: any) => {
    const response = await fetch(`${API_BASE_URL}/api/diary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entryData),
    });
    return response.json();
  },
  updateDiaryEntry: async (entryId: number, updates: any) => {
    const response = await fetch(`${API_BASE_URL}/api/diary/${entryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return response.json();
  },
  deleteDiaryEntry: async (entryId: number) => {
    const response = await fetch(`${API_BASE_URL}/api/diary/${entryId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete diary entry");
    }
    return response.json();
  },

  scheduleDiaryEntry: async (entryId: number, scheduledDate: string) => {
    const response = await fetch(`${API_BASE_URL}/api/diary/${entryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduled_date: scheduledDate,
        is_scheduled: true,
      }),
    });
    return response.json();
  },

  unscheduleDiaryEntry: async (entryId: number) => {
    const response = await fetch(`${API_BASE_URL}/api/diary/${entryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduled_date: null,
        is_scheduled: false,
      }),
    });
    return response.json();
  },
};