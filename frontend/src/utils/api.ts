// API configuration
const API_BASE_URL = 'http://localhost:8000';

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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    });
    return response.json();
  },
  updateTask: async (taskId: number, updates: any) => {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return response.json();
  },
  getFolders: async () => {
    const response = await fetch(`${API_BASE_URL}/api/folders`);
    return response.json();
  },
  createFolder: async (folderData: any) => {
    const response = await fetch(`${API_BASE_URL}/api/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(folderData),
    });
    return response.json();
  },
  getDiaryEntries: async (entryDate?: string, folderId?: number) => {
    let url = `${API_BASE_URL}/api/diary`;
    const params = new URLSearchParams();
    if (entryDate) params.append('entry_date', entryDate);
    if (folderId) params.append('folder_id', folderId.toString());
    if (params.toString()) url += `?${params.toString()}`;
    
    const response = await fetch(url);
    return response.json();
  },
  createDiaryEntry: async (entryData: any) => {
    const response = await fetch(`${API_BASE_URL}/api/diary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entryData),
    });
    return response.json();
  },
};