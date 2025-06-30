// API configuration with HIERARCHY support, DELETE functionality, DIARY SCHEDULING, and FOLDER MANAGEMENT
const API_BASE_URL = "http://localhost:8000";

// Helper function to get auth headers
const getAuthHeaders = (token?: string) => {
  const authToken = token || localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  
  return headers;
};

// Helper function for authenticated requests
const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const headers = getAuthHeaders();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  // Handle unauthorized responses
  if (response.status === 401) {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
    throw new Error('Authentication required');
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response;
};

export const api = {
  // Authentication endpoints
  getGoogleAuthUrl: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/google`);
    return response.json();
  },

  getCurrentUser: async (token?: string) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/auth/me`);
    return response.json();
  },

  logout: async () => {
    const response = await authenticatedFetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
    });
    return response.json();
  },

  // Development-only endpoint
  devLogin: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/dev-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return response.json();
  },
  healthCheck: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },
  getTasks: async (folderId: number | null = null) => {
    const url = folderId
      ? `${API_BASE_URL}/api/tasks?folder_id=${folderId}`
      : `${API_BASE_URL}/api/tasks`;
    const response = await authenticatedFetch(url);
    return response.json();
  },
  createTask: async (taskData: any) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/tasks`, {
      method: "POST",
      body: JSON.stringify(taskData),
    });
    return response.json();
  },

  updateTask: async (taskId: number, updates: any) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    return response.json();
  },

  deleteTask: async (taskId: number) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
      method: "DELETE",
    });
    return response.json();
  },

  createSubtask: async (parentTaskId: number, taskData: any) => {
    console.log(`Creating subtask for parent ${parentTaskId}:`, taskData);
    
    const response = await authenticatedFetch(
      `${API_BASE_URL}/api/tasks/${parentTaskId}/subtasks`,
      {
        method: "POST",
        body: JSON.stringify(taskData),
      }
    );
    
    return response.json();
  },

  createTaskWithInheritance: async (taskData: any) => {
    console.log("Creating task with data:", taskData);
    
    const response = await fetch(`${API_BASE_URL}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });
    
    if (!response.ok) {
      throw new Error("Failed to create task");
    }
    
    return response.json();
  },

  getFolders: async () => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/folders`);
    return response.json();
  },

  createFolder: async (folderData: any) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/folders`, {
      method: "POST",
      body: JSON.stringify(folderData),
    });
    return response.json();
  },
  // Update folder
  updateFolder: async (folderId: number, updates: any) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/folders/${folderId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    return response.json();
  },

  deleteFolder: async (folderId: number) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/folders/${folderId}`, {
      method: "DELETE",
    });
    return response.json();
  },

   // Diary Entries
   getDiaryEntries: async (entryDate?: string, folderId?: number) => {
    let url = `${API_BASE_URL}/api/diary`;
    const params = new URLSearchParams();
    if (entryDate) params.append("entry_date", entryDate);
    if (folderId) params.append("folder_id", folderId.toString());
    if (params.toString()) url += `?${params.toString()}`;

    const response = await authenticatedFetch(url);
    return response.json();
  },

  createDiaryEntry: async (entryData: any) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/diary`, {
      method: "POST",
      body: JSON.stringify(entryData),
    });
    return response.json();
  },

  updateDiaryEntry: async (entryId: number, updates: any) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/diary/${entryId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    return response.json();
  },

  deleteDiaryEntry: async (entryId: number) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/diary/${entryId}`, {
      method: "DELETE",
    });
    return response.json();
  },

  scheduleDiaryEntry: async (entryId: number, scheduledDate: string) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/diary/${entryId}`, {
      method: "PUT",
      body: JSON.stringify({
        scheduled_date: scheduledDate,
        is_scheduled: true,
      }),
    });
    return response.json();
  },

  unscheduleDiaryEntry: async (entryId: number) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/diary/${entryId}`, {
      method: "PUT",
      body: JSON.stringify({
        scheduled_date: null,
        is_scheduled: false,
      }),
    });
    return response.json();
  },

  getQuests: async (folderId: number | null = null) => {
    const url = folderId
      ? `${API_BASE_URL}/api/quests?folder_id=${folderId}`
      : `${API_BASE_URL}/api/quests`;
    const response = await authenticatedFetch(url);
    return response.json();
  },

  createQuest: async (questData: any) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/quests`, {
      method: "POST",
      body: JSON.stringify(questData),
    });
    return response.json();
  },

  updateQuest: async (questId: number, updates: any) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/quests/${questId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    return response.json();
  },

  deleteQuest: async (questId: number) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/quests/${questId}`, {
      method: "DELETE",
    });
    return response.json();
  },

  addQuestParagraph: async (questId: number, paragraphData: any) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/quests/${questId}/paragraphs`, {
      method: "POST",
      body: JSON.stringify(paragraphData),
    });
    return response.json();
  },

  updateQuestParagraph: async (questId: number, paragraphId: number, updates: any) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/quests/${questId}/paragraphs/${paragraphId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    return response.json();
  },

  deleteQuestParagraph: async (questId: number, paragraphId: number) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/quests/${questId}/paragraphs/${paragraphId}`, {
      method: "DELETE",
    });
    return response.json();
  },
};