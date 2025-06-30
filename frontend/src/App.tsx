// Fixed frontend/src/App.tsx - Folder filtering bug fix

import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  Folder,
  AlertCircle,
  Activity,
  Edit,
  Trash2,
  X,
  Save,
} from "lucide-react";

// Component imports
import { Modal, CalendarView, FeedView } from "./components";

// Type and API imports
import {
  Task,
  FolderType,
  DiaryEntry,
  Quest,
  NewTask,
  NewFolder,
} from "./types";
import { api } from "./utils";

// Folder Management Modal Component
const FolderManagementModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  folders: FolderType[];
  onCreateFolder: (folder: NewFolder) => Promise<void>;
  onUpdateFolder: (id: number, folder: Partial<NewFolder>) => Promise<void>;
  onDeleteFolder: (id: number) => Promise<void>;
}> = ({
  isOpen,
  onClose,
  folders,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
}) => {
  const [newFolder, setNewFolder] = useState<NewFolder>({
    name: "",
    color: "#3B82F6",
  });
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(
    null
  );

  const handleCreateFolder = async () => {
    if (newFolder.name.trim() && newFolder.name.length <= 16) {
      try {
        await onCreateFolder(newFolder);
        setNewFolder({ name: "", color: "#3B82F6" });
      } catch (error) {
        console.error("Error creating folder:", error);
      }
    }
  };

  const handleUpdateFolder = async () => {
    if (
      editingFolder &&
      editingFolder.name.trim() &&
      editingFolder.name.length <= 16
    ) {
      try {
        await onUpdateFolder(editingFolder.id, {
          name: editingFolder.name,
          color: editingFolder.color,
        });
        setEditingFolder(null);
      } catch (error) {
        console.error("Error updating folder:", error);
      }
    }
  };

  const handleDeleteFolder = async (id: number) => {
    try {
      await onDeleteFolder(id);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting folder:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div
            className="absolute inset-0 bg-black opacity-75"
            onClick={onClose}
          ></div>
        </div>
        <div className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-gray-800 px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg leading-6 font-medium text-white">
                Manage Folders
              </h3>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-300 focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Create New Folder */}
            <div className="space-y-4 mb-6">
              <h4 className="font-medium text-white">Create New Folder</h4>
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="Folder name (max 12 chars)"
                    value={newFolder.name}
                    onChange={(e) => {
                      const value = e.target.value.slice(0, 16); // Limit to 12 characters
                      setNewFolder((prev) => ({ ...prev, name: value }));
                    }}
                    className="w-full border border-gray-600 bg-gray-700 text-white rounded-md px-3 py-2"
                    maxLength={12}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {newFolder.name.length}/16 characters
                  </p>
                </div>
                <input
                  type="color"
                  value={newFolder.color}
                  onChange={(e) =>
                    setNewFolder((prev) => ({ ...prev, color: e.target.value }))
                  }
                  className="w-full border border-gray-600 bg-gray-700 rounded-md px-3 py-2 h-10"
                />
                <button
                  onClick={handleCreateFolder}
                  disabled={
                    !newFolder.name.trim() || newFolder.name.length > 16
                  }
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Folder
                </button>
              </div>
            </div>

            {/* Existing Folders */}
            <div className="space-y-4">
              <h4 className="font-medium text-white">
                Existing Folders ({folders.length})
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="flex items-center justify-between p-3 border border-gray-600 rounded-md hover:bg-gray-700"
                  >
                    {editingFolder?.id === folder.id ? (
                      // Edit mode
                      <div className="flex-1 flex items-center space-x-2">
                        <input
                          type="text"
                          value={editingFolder.name}
                          onChange={(e) => {
                            const value = e.target.value.slice(0, 16);
                            setEditingFolder((prev) =>
                              prev ? { ...prev, name: value } : null
                            );
                          }}
                          className="flex-1 border border-gray-600 bg-gray-700 text-white rounded-md px-2 py-1 text-sm"
                          maxLength={12}
                        />
                        <input
                          type="color"
                          value={editingFolder.color}
                          onChange={(e) =>
                            setEditingFolder((prev) =>
                              prev ? { ...prev, color: e.target.value } : null
                            )
                          }
                          className="w-8 h-8 border border-gray-600 rounded"
                        />
                        <button
                          onClick={handleUpdateFolder}
                          disabled={
                            !editingFolder.name.trim() ||
                            editingFolder.name.length > 16
                          }
                          className="p-1 text-green-400 hover:text-green-300 disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingFolder(null)}
                          className="p-1 text-gray-400 hover:text-gray-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      // View mode
                      <>
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: folder.color }}
                          />
                          <span className="font-medium text-white">
                            {folder.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({folder.name.length}/12)
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setEditingFolder(folder)}
                            className="p-1 text-gray-400 hover:text-blue-400"
                            title="Edit folder"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(folder.id)}
                            className="p-1 text-gray-400 hover:text-red-400"
                            title="Delete folder"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {folders.length === 0 && (
                  <p className="text-gray-400 text-center py-4">
                    No folders created yet
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={onClose}
                className="w-full border border-gray-600 text-gray-300 py-2 rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-black opacity-75"
                onClick={() => setShowDeleteConfirm(null)}
              ></div>
            </div>
            <div className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
              <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-400" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-white">
                      Delete Folder
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-400">
                        Are you sure you want to delete this folder? Tasks and
                        diary entries in this folder will be moved to "No
                        Folder".
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => handleDeleteFolder(showDeleteConfirm)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-800 text-base font-medium text-gray-300 hover:bg-gray-700 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function TodoApp() {
  const [currentView, setCurrentView] = useState("feed");
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState("checking");
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showFolderManagementModal, setShowFolderManagementModal] =
    useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Form states
  const [newFolder, setNewFolder] = useState<NewFolder>({
    name: "",
    color: "#3B82F6",
  });

  // Data loading functions
  const loadFolders = useCallback(async () => {
    try {
      const foldersData = await api.getFolders();
      setFolders(Array.isArray(foldersData) ? foldersData : []);
    } catch (error) {
      console.error("Error loading folders:", error);
      setFolders([]); // Set to empty array on error
    }
  }, []);

  // FIXED: Load all data for feed view - don't filter by folder in API call
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      // IMPORTANT: Always load ALL data, filter in frontend
      const [tasksData, entriesData, questsData] = await Promise.all([
        api.getTasks(null), // Pass null to get ALL tasks
        api.getDiaryEntries(undefined, undefined), // Get ALL diary entries
        api.getQuests(null), // Get ALL quests
      ]);

      // Ensure all data has proper typing and folder references
      const processedTasks = Array.isArray(tasksData)
        ? tasksData.map((task) => ({
            ...task,
            folder_id: task.folder_id || null, // Ensure folder_id is always present
          }))
        : [];

      const processedEntries = Array.isArray(entriesData)
        ? entriesData.map((entry) => ({
            ...entry,
            folder_id: entry.folder_id || null,
          }))
        : [];

      const processedQuests = Array.isArray(questsData)
        ? questsData.map((quest) => ({
            ...quest,
            folder_id: quest.folder_id || null,
          }))
        : [];

      setTasks(processedTasks);
      setDiaryEntries(processedEntries);
      setQuests(processedQuests);
    } catch (error) {
      console.error("Error loading data:", error);
      // Set to empty arrays on error
      setTasks([]);
      setDiaryEntries([]);
      setQuests([]);
    } finally {
      setLoading(false);
    }
  }, []); // Remove selectedFolder dependency

  // Initial connection and data loading
  useEffect(() => {
    const testConnection = async () => {
      try {
        await api.healthCheck();
        setBackendStatus("connected");
        loadFolders();
      } catch (error) {
        setBackendStatus("error");
        console.error("Backend connection failed:", error);
      }
    };
    testConnection();
  }, [loadFolders]);

  useEffect(() => {
    if (backendStatus === "connected") {
      // Load folders first, then load other data
      loadFolders().then(() => {
        loadAllData();
      });
    }
  }, [currentView, selectedDate, backendStatus, loadFolders, loadAllData]); // Remove selectedFolder dependency

  // Folder handlers with character limit
  const handleFolderNameChange = useCallback((value: string) => {
    const limitedValue = value.slice(0, 12); // Limit to 12 characters
    setNewFolder((prev: NewFolder) => ({ ...prev, name: limitedValue }));
  }, []);

  const handleFolderColorChange = useCallback((value: string) => {
    setNewFolder((prev: NewFolder) => ({ ...prev, color: value }));
  }, []);

  // Updated folder management functions
  const handleCreateFolder = async (folderData?: NewFolder) => {
    try {
      const dataToUse = folderData || newFolder;
      if (!dataToUse.name.trim() || dataToUse.name.length > 12) {
        console.error(
          "Folder name is required and must be 12 characters or less"
        );
        return;
      }

      await api.createFolder(dataToUse);

      if (!folderData) {
        setNewFolder({ name: "", color: "#3B82F6" });
        setShowNewFolderModal(false);
      }

      loadFolders();
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };

  const handleUpdateFolder = async (
    id: number,
    updates: Partial<NewFolder>
  ) => {
    try {
      if (
        updates.name &&
        (updates.name.length === 0 || updates.name.length > 12)
      ) {
        console.error("Folder name must be between 1 and 12 characters");
        return;
      }

      await api.updateFolder(id, updates);
      loadFolders();
    } catch (error) {
      console.error("Error updating folder:", error);
    }
  };

  const handleDeleteFolder = async (id: number) => {
    try {
      await api.deleteFolder(id);

      // If the deleted folder was selected, reset to "All"
      if (selectedFolder?.id === id) {
        setSelectedFolder(null);
      }

      loadFolders();
      loadAllData();
    } catch (error) {
      console.error("Error deleting folder:", error);
    }
  };

  // Create handlers
  const handleCreateTask = async (taskData?: any) => {
    try {
      const dataToUse = taskData || {
        title: "",
        description: "",
        priority: 1,
        due_date: "",
        is_calendar_event: false,
        parent_task_id: undefined,
        indent_level: 0,
        order_index: 0,
        folder_id: selectedFolder?.id || null,
      };
  
      if (dataToUse.due_date) {
        dataToUse.due_date = new Date(dataToUse.due_date).toISOString();
      }
  
      const createdTask = await api.createTask(dataToUse);
  
      // If this is a subtask creation, reload data to ensure proper inheritance
      if (dataToUse.parent_task_id) {
        console.log('Subtask created, reloading data to reflect inheritance...');
        loadAllData();
      } else {
        // Optimistically add to UI for root tasks
        setTasks((prev: Task[]) => [...prev, createdTask]);
      }
    } catch (error) {
      console.error("Error creating task:", error);
      loadAllData();
    }
  };

  const handleCreateSubtask = async (parentTaskId: number) => {
    try {
      // Find the parent task to get its folder
      const parentTask = tasks.find(t => t.id === parentTaskId);
      const parentFolderId = parentTask?.folder_id || null;
      
      console.log(`Creating subtask for parent ${parentTaskId} with inherited folder ${parentFolderId}`);
      
      const subtaskData = {
        title: "New Subtask",
        description: "",
        priority: 1,
        due_date: null,
        is_calendar_event: false,
        parent_task_id: parentTaskId,
        folder_id: parentFolderId, // This will be overridden by backend inheritance
      };
  
      await api.createSubtask(parentTaskId, subtaskData);
      
      // Always reload data after creating subtasks to ensure proper inheritance
      console.log('Subtask created, reloading data...');
      loadAllData();
    } catch (error) {
      console.error("Error creating subtask:", error);
      loadAllData();
    }
  };

  const handleCreateDiaryEntry = async (entryText: string) => {
    try {
      // Parse the first line as title, rest as content
      const lines = entryText.split("\n");
      const title = lines[0]?.trim() || "";
      const content = lines.slice(1).join("\n").trim();

      const now = new Date();
      const entryData = {
        entry_date: now.toISOString().split("T")[0],
        title:
          title ||
          `Entry ${now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}`,
        content: content || entryText.trim(),
        folder_id: selectedFolder?.id || null,
        is_scheduled: false,
        scheduled_date: null,
      };

      const createdEntry = await api.createDiaryEntry(entryData);

      // Optimistically add to UI
      setDiaryEntries((prev) => [createdEntry, ...prev]);
    } catch (error) {
      console.error("Error creating diary entry:", error);
      loadAllData();
    }
  };

  // Quest handlers
  const handleCreateQuest = async (questData?: any) => {
    try {
      const dataToUse = questData || {
        title: "",
        folder_id: selectedFolder?.id || null,
        paragraphs: [],
      };

      if (!dataToUse.title.trim()) {
        console.error("Quest title is required");
        return;
      }

      const createdQuest = await api.createQuest(dataToUse);

      // Optimistically add to UI
      setQuests((prev) => [createdQuest, ...prev]);
    } catch (error) {
      console.error("Error creating quest:", error);
      loadAllData();
    }
  };

  const handleUpdateQuest = async (questId: number, updates: any) => {
    try {
      await api.updateQuest(questId, updates);
      loadAllData();
    } catch (error) {
      console.error("Error updating quest:", error);
    }
  };

  const handleDeleteQuest = async (questId: number) => {
    try {
      await api.deleteQuest(questId);

      // Optimistically remove from UI
      setQuests((prev) => prev.filter((quest) => quest.id !== questId));
    } catch (error) {
      console.error("Error deleting quest:", error);
      loadAllData();
    }
  };

  const handleAddQuestParagraph = async (questId: number, content: string) => {
    try {
      await api.addQuestParagraph(questId, { content });
      loadAllData();
    } catch (error) {
      console.error("Error adding quest paragraph:", error);
    }
  };

  const handleUpdateQuestParagraph = async (
    questId: number,
    paragraphId: number,
    content: string
  ) => {
    try {
      await api.updateQuestParagraph(questId, paragraphId, { content });
      loadAllData();
    } catch (error) {
      console.error("Error updating quest paragraph:", error);
    }
  };

  const handleDeleteQuestParagraph = async (
    questId: number,
    paragraphId: number
  ) => {
    try {
      await api.deleteQuestParagraph(questId, paragraphId);
      loadAllData();
    } catch (error) {
      console.error("Error deleting quest paragraph:", error);
    }
  };

  const handleUpdateDiaryEntry = async (id: number, entryText: string) => {
    try {
      // Parse the first line as title, rest as content
      const lines = entryText.split("\n");
      const title = lines[0]?.trim() || "";
      const content = lines.slice(1).join("\n").trim();

      const updateData = {
        title: title || undefined,
        content: content || entryText.trim(),
      };

      await api.updateDiaryEntry(id, updateData);
      loadAllData();
    } catch (error) {
      console.error("Error updating diary entry:", error);
    }
  };

  const handleDeleteDiaryEntry = async (id: number) => {
    try {
      await api.deleteDiaryEntry(id);

      // Optimistically remove from UI
      setDiaryEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch (error) {
      console.error("Error deleting diary entry:", error);
      loadAllData();
    }
  };

  const handleUpdateDiaryEntryFolder = async (
    id: number,
    folderId: number | null
  ) => {
    try {
      await api.updateDiaryEntry(id, { folder_id: folderId });
      loadAllData();
    } catch (error) {
      console.error("Error updating diary entry folder:", error);
    }
  };

  // Diary scheduling handlers
  const handleScheduleDiaryEntry = async (
    id: number,
    scheduledDate: string
  ) => {
    try {
      await api.scheduleDiaryEntry(id, scheduledDate);

      // Optimistically update the UI
      setDiaryEntries((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                scheduled_date: scheduledDate,
                is_scheduled: true,
              }
            : entry
        )
      );
    } catch (error) {
      console.error("Error scheduling diary entry:", error);
      loadAllData();
    }
  };

  const handleUnscheduleDiaryEntry = async (id: number) => {
    try {
      await api.unscheduleDiaryEntry(id);

      // Optimistically update the UI
      setDiaryEntries((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                scheduled_date: undefined,
                is_scheduled: false,
              }
            : entry
        )
      );
    } catch (error) {
      console.error("Error unscheduling diary entry:", error);
      loadAllData();
    }
  };

  // Task actions
  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
  
    // Optimistically update the UI first (no screen refresh)
    const updateTaskInState = (taskId: number, status: string) => {
      setTasks((prev: Task[]) =>
        prev.map((t: Task) => (t.id === taskId ? { ...t, status } : t))
      );
    };
  
    // Helper function to get all subtask IDs recursively
    const getSubtaskIds = (parentId: number): number[] => {
      const directSubtasks = tasks.filter(
        (t) => t.parent_task_id === parentId
      );
      let allSubtaskIds = directSubtasks.map((t) => t.id);
  
      directSubtasks.forEach((subtask) => {
        allSubtaskIds = allSubtaskIds.concat(getSubtaskIds(subtask.id));
      });
  
      return allSubtaskIds;
    };
  
    // Update the main task immediately in UI
    updateTaskInState(task.id, newStatus);
  
    // FIXED: Update all subtasks in UI for BOTH completing AND uncompleting
    const subtaskIds = getSubtaskIds(task.id);
    subtaskIds.forEach((subtaskId) => {
      updateTaskInState(subtaskId, newStatus);
    });
  
    try {
      // Make API calls in the background
      if (newStatus === "completed") {
        await markTaskAndSubtasksComplete(task.id);
      } else {
        await markTaskAndSubtasksIncomplete(task.id);
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      loadAllData();
    }
  };

  // Cascade completion to all subtasks
  const markTaskAndSubtasksComplete = async (taskId: number) => {
    // Update the main task
    await api.updateTask(taskId, { status: "completed" });

    // Find all subtasks (recursively)
    const getSubtaskIds = (parentId: number): number[] => {
      const directSubtasks = tasks.filter((t) => t.parent_task_id === parentId);
      let allSubtaskIds = directSubtasks.map((t) => t.id);

      // Recursively get nested subtasks
      directSubtasks.forEach((subtask) => {
        allSubtaskIds = allSubtaskIds.concat(getSubtaskIds(subtask.id));
      });

      return allSubtaskIds;
    };

    const subtaskIds = getSubtaskIds(taskId);

    // Update all subtasks to completed
    for (const subtaskId of subtaskIds) {
      try {
        await api.updateTask(subtaskId, { status: "completed" });
      } catch (error) {
        console.error(`Error updating subtask ${subtaskId}:`, error);
      }
    }
  };

  // Cascade incompletion to all subtasks
  const markTaskAndSubtasksIncomplete = async (taskId: number) => {
    // Update the main task
    await api.updateTask(taskId, { status: "pending" });

    // Find all subtasks (recursively)
    const getSubtaskIds = (parentId: number): number[] => {
      const directSubtasks = tasks.filter((t) => t.parent_task_id === parentId);
      let allSubtaskIds = directSubtasks.map((t) => t.id);

      // Recursively get nested subtasks
      directSubtasks.forEach((subtask) => {
        allSubtaskIds = allSubtaskIds.concat(getSubtaskIds(subtask.id));
      });

      return allSubtaskIds;
    };

    const subtaskIds = getSubtaskIds(taskId);

    // Update all subtasks to pending
    for (const subtaskId of subtaskIds) {
      try {
        await api.updateTask(subtaskId, { status: "pending" });
      } catch (error) {
        console.error(`Error updating subtask ${subtaskId}:`, error);
      }
    }
  };

  // Handle task deletion with optimistic updates
  const handleDeleteTask = async (taskId: number) => {
    // Get all tasks that will be deleted (task + all its subtasks)
    const getTasksToDelete = (parentId: number): number[] => {
      const directSubtasks = tasks.filter((t) => t.parent_task_id === parentId);
      let allTaskIds = [parentId, ...directSubtasks.map((t) => t.id)];

      directSubtasks.forEach((subtask) => {
        const nestedIds = getTasksToDelete(subtask.id);
        allTaskIds = allTaskIds.concat(
          nestedIds.filter((id) => id !== subtask.id)
        ); // Avoid duplicates
      });

      return allTaskIds;
    };

    const tasksToDelete = getTasksToDelete(taskId);

    // Optimistically remove from UI first
    setTasks((prev: Task[]) =>
      prev.filter((t: Task) => !tasksToDelete.includes(t.id))
    );

    try {
      await api.deleteTask(taskId);
    } catch (error) {
      console.error("Error deleting task:", error);
      loadAllData();
    }
  };

  // Handle task updates (for date/time scheduling) with optimistic updates
  const handleUpdateTask = async (taskId: number, updates: any) => {
    // Optimistically update the UI first
    setTasks((prev: Task[]) =>
      prev.map((t: Task) => (t.id === taskId ? { ...t, ...updates } : t))
    );
  
    try {
      await api.updateTask(taskId, updates);
      
      // If folder_id was changed, reload all data to get updated subtasks
      if ('folder_id' in updates) {
        console.log('Folder changed, reloading all data to reflect inheritance...');
        loadAllData();
      }
    } catch (error) {
      console.error("Error updating task:", error);
      loadAllData(); // Reload on error to sync state
    }
  };

  // Connection status component
  const ConnectionStatus = () => {
    if (backendStatus === "checking") {
      return (
        <div className="bg-yellow-900 border border-yellow-600 text-yellow-200 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-200 mr-2"></div>
            Connecting to backend...
          </div>
        </div>
      );
    }

    if (backendStatus === "error") {
      return (
        <div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            Backend connection failed. Make sure FastAPI is running on
            http://localhost:8000
          </div>
        </div>
      );
    }
    console.log("Connected to backend successfully");
    return null;
  };

  // FIXED: Filter data in frontend based on selected folder
  const getFilteredData = () => {
    if (!selectedFolder) {
      // Return all data when no folder is selected
      return { tasks, diaryEntries, quests };
    }
  
    // Filter data by selected folder
    // Note: Subtasks automatically inherit their parent's folder_id on the backend
    const filteredTasks = tasks.filter(
      (task) => task.folder_id === selectedFolder.id
    );
    const filteredDiaryEntries = diaryEntries.filter(
      (entry) => (entry as any).folder_id === selectedFolder.id
    );
    const filteredQuests = quests.filter(
      (quest) => quest.folder_id === selectedFolder.id
    );
  
    return {
      tasks: filteredTasks,
      diaryEntries: filteredDiaryEntries,
      quests: filteredQuests,
    };
  };

  // Sidebar component
  const Sidebar = () => (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col h-full">
      <nav className="flex-1 p-4">
        <div className="space-y-2 mb-6">
          <button
            onClick={() => setCurrentView("feed")}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left ${
              currentView === "feed"
                ? "bg-purple-900 text-purple-300"
                : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            <Activity className="w-5 h-5" />
            <span>Feed</span>
          </button>

          <button
            onClick={() => setCurrentView("calendar")}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left ${
              currentView === "calendar"
                ? "bg-blue-900 text-blue-300"
                : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            <CalendarIcon className="w-5 h-5" />
            <span>Calendar</span>
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Folders</h3>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setShowFolderManagementModal(true)}
                className="p-1 text-gray-400 hover:text-gray-300"
                title="Manage folders"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowNewFolderModal(true)}
                className="p-1 text-gray-400 hover:text-gray-300"
                title="Add folder"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setSelectedFolder(null)}
              className={`w-full flex items-center space-x-2 px-2 py-1 rounded text-left text-sm ${
                selectedFolder === null
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:bg-gray-700"
              }`}
            >
              <Folder className="w-4 h-4" />
              <span>All</span>
            </button>

            {(folders || []).map((folder: FolderType) => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder)}
                className={`w-full flex items-center space-x-2 px-2 py-1 rounded text-left text-sm ${
                  selectedFolder?.id === folder.id
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:bg-gray-700"
                }`}
              >
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: folder.color }}
                />
                <span className="truncate">{folder.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );

  // Render different views
  const renderCurrentView = () => {
    const filteredData = getFilteredData();

    switch (currentView) {
      case "feed":
        return (
          <FeedView
            tasks={filteredData.tasks}
            diaryEntries={filteredData.diaryEntries}
            quests={filteredData.quests}
            folders={folders}
            loading={loading}
            onCreateTask={handleCreateTask}
            onCreateDiaryEntry={handleCreateDiaryEntry}
            onCreateQuest={handleCreateQuest}
            onToggleTaskStatus={toggleTaskStatus}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onUpdateDiaryEntry={handleUpdateDiaryEntry}
            onDeleteDiaryEntry={handleDeleteDiaryEntry}
            onUpdateDiaryEntryFolder={handleUpdateDiaryEntryFolder}
            onUpdateQuest={handleUpdateQuest}
            onDeleteQuest={handleDeleteQuest}
            onAddQuestParagraph={handleAddQuestParagraph}
            onUpdateQuestParagraph={handleUpdateQuestParagraph}
            onDeleteQuestParagraph={handleDeleteQuestParagraph}
            onCreateSubtask={handleCreateSubtask}
            onScheduleDiaryEntry={handleScheduleDiaryEntry}
            onUnscheduleDiaryEntry={handleUnscheduleDiaryEntry}
          />
        );
      case "calendar":
        return (
          <CalendarView
            tasks={filteredData.tasks}
            diaryEntries={filteredData.diaryEntries}
            quests={filteredData.quests}
            folders={folders}
            onToggleTaskStatus={toggleTaskStatus}
            onEditTask={(task: Task) => {
              // You can implement task editing here if needed
              console.log("Edit task:", task);
            }}
            onScheduleTask={handleUpdateTask}
            onUpdateTaskFolder={(taskId: number, folderId: number | null) =>
              handleUpdateTask(taskId, { folder_id: folderId })
            }
            onDeleteTask={handleDeleteTask}
            onCreateSubtask={handleCreateSubtask}
            onEditDiary={(entry: DiaryEntry) => {
              // Handle diary editing from calendar
              console.log("Edit diary:", entry);
            }}
            onScheduleDiary={handleScheduleDiaryEntry}
            onUpdateDiaryFolder={handleUpdateDiaryEntryFolder}
            onDeleteDiary={handleDeleteDiaryEntry}
            onEditQuest={(quest: Quest) => {
              // Handle quest editing from calendar
              console.log("Edit quest:", quest);
            }}
            onUpdateQuestFolder={(questId: number, folderId: number | null) =>
              handleUpdateQuest(questId, { folder_id: folderId })
            }
            onDeleteQuest={handleDeleteQuest}
          />
        );
      default:
        return (
          <FeedView
            tasks={filteredData.tasks}
            diaryEntries={filteredData.diaryEntries}
            quests={filteredData.quests}
            folders={folders}
            loading={loading}
            onCreateTask={handleCreateTask}
            onCreateDiaryEntry={handleCreateDiaryEntry}
            onCreateQuest={handleCreateQuest}
            onToggleTaskStatus={toggleTaskStatus}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onUpdateDiaryEntry={handleUpdateDiaryEntry}
            onDeleteDiaryEntry={handleDeleteDiaryEntry}
            onUpdateDiaryEntryFolder={handleUpdateDiaryEntryFolder}
            onUpdateQuest={handleUpdateQuest}
            onDeleteQuest={handleDeleteQuest}
            onAddQuestParagraph={handleAddQuestParagraph}
            onUpdateQuestParagraph={handleUpdateQuestParagraph}
            onDeleteQuestParagraph={handleDeleteQuestParagraph}
            onCreateSubtask={handleCreateSubtask}
            onScheduleDiaryEntry={handleScheduleDiaryEntry}
            onUnscheduleDiaryEntry={handleUnscheduleDiaryEntry}
          />
        );
    }
  };

  if (backendStatus === "checking") {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Connecting to backend...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex">
      <Sidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        <ConnectionStatus />

        {backendStatus === "connected" ? (
          renderCurrentView()
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-400">
              Please start the backend server to use the app
            </p>
          </div>
        )}
      </div>

      {/* Folder Modal */}
      <Modal
        isOpen={showNewFolderModal}
        onClose={() => setShowNewFolderModal(false)}
        title="Create New Folder"
      >
        <div className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Folder name (max 12 chars)"
              value={newFolder.name}
              onChange={(e) => handleFolderNameChange(e.target.value)}
              className="w-full border border-gray-600 bg-gray-700 text-white rounded-md px-3 py-2"
              maxLength={12}
            />
            <p className="text-xs text-gray-400 mt-1">
              {newFolder.name.length}/12 characters
            </p>
          </div>
          <input
            type="color"
            value={newFolder.color}
            onChange={(e) => handleFolderColorChange(e.target.value)}
            className="w-full border border-gray-600 bg-gray-700 rounded-md px-3 py-2 h-10"
          />
          <div className="flex space-x-3">
            <button
              onClick={() => setShowNewFolderModal(false)}
              className="flex-1 border border-gray-600 text-gray-300 py-2 rounded-md hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={() => handleCreateFolder()}
              disabled={!newFolder.name.trim() || newFolder.name.length > 12}
              className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Create Folder
            </button>
          </div>
        </div>
      </Modal>

      {/* Folder Management Modal */}
      <FolderManagementModal
        isOpen={showFolderManagementModal}
        onClose={() => setShowFolderManagementModal(false)}
        folders={folders}
        onCreateFolder={handleCreateFolder}
        onUpdateFolder={handleUpdateFolder}
        onDeleteFolder={handleDeleteFolder}
      />
    </div>
  );
}

export default TodoApp;
