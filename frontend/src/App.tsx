import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  CheckSquare,
  Plus,
  Folder,
  BookOpen,
  AlertCircle,
  Activity,
  AlarmClockCheck,
  Edit,
  Trash2,
  X,
  Save,
} from "lucide-react";

// Component imports
import {
  Modal,
  TaskCard,
  CalendarView,
  DiaryView,
  FeedView,
} from "./components";

// Type and API imports
import { Task, FolderType, DiaryEntry, NewTask, NewFolder } from "./types";
import { api } from "./utils";

// Folder Management Modal Component
const FolderManagementModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  folders: FolderType[];
  onCreateFolder: (folder: NewFolder) => Promise<void>;
  onUpdateFolder: (id: number, folder: Partial<NewFolder>) => Promise<void>;
  onDeleteFolder: (id: number) => Promise<void>;
}> = ({ isOpen, onClose, folders, onCreateFolder, onUpdateFolder, onDeleteFolder }) => {
  const [newFolder, setNewFolder] = useState<NewFolder>({
    name: "",
    color: "#3B82F6",
  });
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

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
    if (editingFolder && editingFolder.name.trim() && editingFolder.name.length <= 16) {
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
            className="absolute inset-0 bg-gray-500 opacity-75"
            onClick={onClose}
          ></div>
        </div>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Manage Folders
              </h3>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Create New Folder */}
            <div className="space-y-4 mb-6">
              <h4 className="font-medium text-gray-900">Create New Folder</h4>
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="Folder name (max 12 chars)"
                    value={newFolder.name}
                    onChange={(e) => {
                      const value = e.target.value.slice(0, 16); // Limit to 12 characters
                      setNewFolder(prev => ({ ...prev, name: value }));
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    maxLength={12}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {newFolder.name.length}/16 characters
                  </p>
                </div>
                <input
                  type="color"
                  value={newFolder.color}
                  onChange={(e) => setNewFolder(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-10"
                />
                <button
                  onClick={handleCreateFolder}
                  disabled={!newFolder.name.trim() || newFolder.name.length > 16}
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Folder
                </button>
              </div>
            </div>

            {/* Existing Folders */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Existing Folders ({folders.length})</h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    {editingFolder?.id === folder.id ? (
                      // Edit mode
                      <div className="flex-1 flex items-center space-x-2">
                        <input
                          type="text"
                          value={editingFolder.name}
                          onChange={(e) => {
                            const value = e.target.value.slice(0, 16);
                            setEditingFolder(prev => prev ? { ...prev, name: value } : null);
                          }}
                          className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm"
                          maxLength={12}
                        />
                        <input
                          type="color"
                          value={editingFolder.color}
                          onChange={(e) => setEditingFolder(prev => prev ? { ...prev, color: e.target.value } : null)}
                          className="w-8 h-8 border border-gray-300 rounded"
                        />
                        <button
                          onClick={handleUpdateFolder}
                          disabled={!editingFolder.name.trim() || editingFolder.name.length > 16}
                          className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingFolder(null)}
                          className="p-1 text-gray-400 hover:text-gray-600"
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
                          <span className="font-medium">{folder.name}</span>
                          <span className="text-xs text-gray-500">
                            ({folder.name.length}/12)
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setEditingFolder(folder)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Edit folder"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(folder.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
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
                  <p className="text-gray-500 text-center py-4">No folders created yet</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={onClose}
                className="w-full border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50"
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
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() => setShowDeleteConfirm(null)}
              ></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Folder
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this folder? Tasks and diary entries in this folder will be moved to "No Folder".
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
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
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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
  const [expandedTasks, setExpandedTasks] = useState(new Set<number>());
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState("checking");
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showFolderManagementModal, setShowFolderManagementModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // NEW: State for subtask creation
  const [showNewSubtaskModal, setShowNewSubtaskModal] = useState(false);
  const [parentTaskForSubtask, setParentTaskForSubtask] = useState<
    number | null
  >(null);

  // Form states
  const [newTask, setNewTask] = useState<NewTask>({
    title: "",
    description: "",
    priority: 1,
    due_date: "",
    is_calendar_event: false,
    parent_task_id: undefined,
    indent_level: 0,
    order_index: 0,
  });
  const [newFolder, setNewFolder] = useState<NewFolder>({
    name: "",
    color: "#3B82F6",
  });

  // Data loading functions
  const loadFolders = useCallback(async () => {
    try {
      const foldersData = await api.getFolders();
      setFolders(foldersData);
    } catch (error) {
      console.error("Error loading folders:", error);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const tasksData = await api.getTasks(selectedFolder?.id || null);
      setTasks(tasksData);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedFolder?.id]);

  const loadDiaryEntries = useCallback(async () => {
    setLoading(true);
    try {
      const entriesData = await api.getDiaryEntries(
        selectedDate ? selectedDate.toISOString().split("T")[0] : undefined,
        selectedFolder?.id
      );
      setDiaryEntries(entriesData);
    } catch (error) {
      console.error("Error loading diary entries:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedFolder?.id]);

  // Load all data for feed view
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksData, entriesData] = await Promise.all([
        api.getTasks(null),
        api.getDiaryEntries(undefined, undefined),
      ]);
      setTasks(tasksData);
      setDiaryEntries(entriesData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

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
      if (currentView === "tasks") {
        loadTasks();
      } else if (currentView === "diary") {
        loadDiaryEntries();
      } else if (currentView === "feed") {
        loadAllData();
      }
    }
  }, [
    currentView,
    selectedFolder,
    selectedDate,
    backendStatus,
    loadTasks,
    loadDiaryEntries,
    loadAllData,
  ]);

  // Task handlers
  const handleTaskTitleChange = useCallback((value: string) => {
    setNewTask((prev: NewTask) => ({ ...prev, title: value }));
  }, []);

  const handleTaskDescriptionChange = useCallback((value: string) => {
    setNewTask((prev: NewTask) => ({ ...prev, description: value }));
  }, []);

  const handleTaskPriorityChange = useCallback((value: number) => {
    setNewTask((prev: NewTask) => ({ ...prev, priority: value }));
  }, []);

  const handleTaskDueDateChange = useCallback((value: string) => {
    setNewTask((prev: NewTask) => ({ ...prev, due_date: value }));
  }, []);

  const handleTaskCalendarEventChange = useCallback((value: boolean) => {
    setNewTask((prev: NewTask) => ({ ...prev, is_calendar_event: value }));
  }, []);

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
        console.error("Folder name is required and must be 12 characters or less");
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

  const handleUpdateFolder = async (id: number, updates: Partial<NewFolder>) => {
    try {
      if (updates.name && (updates.name.length === 0 || updates.name.length > 12)) {
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
      
      // Reload current view data to reflect changes
      if (currentView === "tasks") {
        loadTasks();
      } else if (currentView === "diary") {
        loadDiaryEntries();
      } else if (currentView === "feed") {
        loadAllData();
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
    }
  };

  // Create handlers
  const handleCreateTask = async (taskData?: any) => {
    try {
      const dataToUse = taskData || {
        ...newTask,
        folder_id: selectedFolder?.id || null,
        due_date: newTask.due_date
          ? new Date(newTask.due_date).toISOString()
          : null,
      };

      const createdTask = await api.createTask(dataToUse);

      // Optimistically add to UI without full reload
      setTasks((prev: Task[]) => [...prev, createdTask]);

      if (!taskData) {
        setNewTask({
          title: "",
          description: "",
          priority: 1,
          due_date: "",
          is_calendar_event: false,
          parent_task_id: undefined,
          indent_level: 0,
          order_index: 0,
        });
        setShowNewTaskModal(false);
      }
    } catch (error) {
      console.error("Error creating task:", error);
      // Only reload on error
      if (currentView === "tasks") {
        loadTasks();
      } else if (currentView === "feed") {
        loadAllData();
      }
    }
  };

  // NEW: Create subtask handler
  const handleCreateSubtask = async (parentTaskId: number) => {
    setParentTaskForSubtask(parentTaskId);
    setNewTask({
      title: "",
      description: "",
      priority: 1,
      due_date: "",
      is_calendar_event: false,
      parent_task_id: parentTaskId,
      indent_level: 0, // Will be calculated by backend
      order_index: 0,
    });
    setShowNewSubtaskModal(true);
  };

  const handleSaveSubtask = async () => {
    if (!parentTaskForSubtask) return;

    try {
      const taskData = {
        ...newTask,
        folder_id: selectedFolder?.id || null,
        due_date: newTask.due_date
          ? new Date(newTask.due_date).toISOString()
          : null,
      };

      const createdSubtask = await api.createSubtask(
        parentTaskForSubtask,
        taskData
      );

      // Optimistically add to UI without full reload
      setTasks((prev: Task[]) => [...prev, createdSubtask]);

      setNewTask({
        title: "",
        description: "",
        priority: 1,
        due_date: "",
        is_calendar_event: false,
        parent_task_id: undefined,
        indent_level: 0,
        order_index: 0,
      });
      setShowNewSubtaskModal(false);
      setParentTaskForSubtask(null);
    } catch (error) {
      console.error("Error creating subtask:", error);
      // Only reload on error
      if (currentView === "tasks") {
        loadTasks();
      } else if (currentView === "feed") {
        loadAllData();
      }
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
        // NEW: Default scheduling to false
        is_scheduled: false,
        scheduled_date: null,
      };

      const createdEntry = await api.createDiaryEntry(entryData);

      // Optimistically add to UI
      setDiaryEntries((prev) => [createdEntry, ...prev]);
    } catch (error) {
      console.error("Error creating diary entry:", error);
      // Reload on error
      if (currentView === "diary") {
        loadDiaryEntries();
      } else if (currentView === "feed") {
        loadAllData();
      }
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

      // Reload data to get updated entry
      if (currentView === "diary") {
        loadDiaryEntries();
      } else if (currentView === "feed") {
        loadAllData();
      }
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
      // Reload on error
      if (currentView === "diary") {
        loadDiaryEntries();
      } else if (currentView === "feed") {
        loadAllData();
      }
    }
  };

  const handleUpdateDiaryEntryFolder = async (
    id: number,
    folderId: number | null
  ) => {
    try {
      await api.updateDiaryEntry(id, { folder_id: folderId });

      // Reload data to get updated entry
      if (currentView === "diary") {
        loadDiaryEntries();
      } else if (currentView === "feed") {
        loadAllData();
      }
    } catch (error) {
      console.error("Error updating diary entry folder:", error);
    }
  };

  // NEW: Diary scheduling handlers
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
      // Reload on error
      if (currentView === "diary") {
        loadDiaryEntries();
      } else if (currentView === "feed") {
        loadAllData();
      }
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
      // Reload on error
      if (currentView === "diary") {
        loadDiaryEntries();
      } else if (currentView === "feed") {
        loadAllData();
      }
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

    // Update the main task immediately in UI
    updateTaskInState(task.id, newStatus);

    // If completing, also update all subtasks to completed in UI
    if (newStatus === "completed") {
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

      const subtaskIds = getSubtaskIds(task.id);
      subtaskIds.forEach((subtaskId) => {
        updateTaskInState(subtaskId, "completed");
      });
    }

    // If uncompleting, also update all subtasks to pending in UI
    if (newStatus === "pending") {
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

      const subtaskIds = getSubtaskIds(task.id);
      subtaskIds.forEach((subtaskId) => {
        updateTaskInState(subtaskId, "pending");
      });
    }

    try {
      // Make API calls in the background
      if (newStatus === "completed") {
        await markTaskAndSubtasksComplete(task.id);
      } else {
        await markTaskAndSubtasksIncomplete(task.id);
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      // Revert the optimistic update on error
      if (currentView === "tasks") {
        loadTasks();
      } else if (currentView === "feed") {
        loadAllData();
      }
    }
  };

  // NEW: Cascade completion to all subtasks
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

  // NEW: Cascade incompletion to all subtasks
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

  // NEW: Handle task deletion with optimistic updates
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
      // No need to reload - we already updated optimistically
    } catch (error) {
      console.error("Error deleting task:", error);
      // Revert the optimistic update on error
      if (currentView === "tasks") {
        loadTasks();
      } else if (currentView === "feed") {
        loadAllData();
      }
    }
  };

  // NEW: Handle task updates (for date/time scheduling) with optimistic updates
  const handleUpdateTask = async (taskId: number, updates: any) => {
    // Optimistically update the UI first
    setTasks((prev: Task[]) =>
      prev.map((t: Task) => (t.id === taskId ? { ...t, ...updates } : t))
    );

    try {
      await api.updateTask(taskId, updates);
      // No need to reload - we already updated optimistically
    } catch (error) {
      console.error("Error updating task:", error);
      // Revert the optimistic update on error
      if (currentView === "tasks") {
        loadTasks();
      } else if (currentView === "feed") {
        loadAllData();
      }
    }
  };

  const toggleTaskExpansion = useCallback(
    (taskId: number) => {
      const newExpanded = new Set(expandedTasks);
      if (newExpanded.has(taskId)) {
        newExpanded.delete(taskId);
      } else {
        newExpanded.add(taskId);
      }
      setExpandedTasks(newExpanded);
    },
    [expandedTasks]
  );

  // Connection status component
  const ConnectionStatus = () => {
    if (backendStatus === "checking") {
      return (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-700 mr-2"></div>
            Connecting to backend...
          </div>
        </div>
      );
    }

    if (backendStatus === "error") {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
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

  // Sidebar component
  const Sidebar = () => (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <nav className="flex-1 p-4">
        <div className="space-y-2 mb-6">
          <button
            onClick={() => setCurrentView("feed")}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left ${
              currentView === "feed"
                ? "bg-purple-100 text-purple-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Activity className="w-5 h-5" />
            <span>Feed</span>
          </button>

          <button
            onClick={() => setCurrentView("calendar")}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left ${
              currentView === "calendar"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <CalendarIcon className="w-5 h-5" />
            <span>Calendar</span>
          </button>

          <button
            onClick={() => setCurrentView("tasks")}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left ${
              currentView === "tasks"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <AlarmClockCheck className="w-5 h-5" />
            <span>Tasks</span>
          </button>

          <button
            onClick={() => setCurrentView("diary")}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left ${
              currentView === "diary"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>Diary</span>
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Folders</h3>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setShowFolderManagementModal(true)}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Manage folders"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowNewFolderModal(true)}
                className="p-1 text-gray-400 hover:text-gray-600"
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
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Folder className="w-4 h-4" />
              <span>All</span>
            </button>

            {folders.map((folder: FolderType) => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder)}
                className={`w-full flex items-center space-x-2 px-2 py-1 rounded text-left text-sm ${
                  selectedFolder?.id === folder.id
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50"
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
    switch (currentView) {
      case "feed":
        return (
          <FeedView
            tasks={tasks}
            diaryEntries={diaryEntries}
            folders={folders}
            loading={loading}
            onCreateTask={handleCreateTask}
            onCreateDiaryEntry={handleCreateDiaryEntry}
            onToggleTaskStatus={toggleTaskStatus}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onUpdateDiaryEntry={handleUpdateDiaryEntry}
            onDeleteDiaryEntry={handleDeleteDiaryEntry}
            onUpdateDiaryEntryFolder={handleUpdateDiaryEntryFolder}
            onCreateSubtask={handleCreateSubtask}
            onScheduleDiaryEntry={handleScheduleDiaryEntry}
            onUnscheduleDiaryEntry={handleUnscheduleDiaryEntry}
          />
        );
      case "calendar":
        return <CalendarView tasks={tasks} diaryEntries={diaryEntries} />;
      case "diary":
        return (
          <DiaryView
            diaryEntries={diaryEntries}
            folders={folders}
            loading={loading}
            onNewEntry={handleCreateDiaryEntry}
            onUpdateEntry={handleUpdateDiaryEntry}
            onDeleteEntry={handleDeleteDiaryEntry}
            onUpdateEntryFolder={handleUpdateDiaryEntryFolder}
            onScheduleEntry={handleScheduleDiaryEntry}
            onUnscheduleEntry={handleUnscheduleDiaryEntry}
          />
        );
      default:
        return (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedFolder ? selectedFolder.name : "All Tasks"}
                </h2>
                <p className="text-gray-600">{tasks.length} tasks</p>
              </div>
              <button
                onClick={() => setShowNewTaskModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks
                  .filter((task) => !task.parent_task_id) // Only render root-level tasks
                  .map((task: Task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isExpanded={expandedTasks.has(task.id)}
                      onToggleExpansion={toggleTaskExpansion}
                      onToggleStatus={toggleTaskStatus}
                      onCreateSubtask={handleCreateSubtask}
                      onUpdateTask={handleUpdateTask}
                      onDeleteTask={handleDeleteTask}
                      allTasks={tasks}
                    />
                  ))}

                {tasks.length === 0 && (
                  <div className="text-center py-12">
                    <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No tasks yet</p>
                    <button
                      onClick={() => setShowNewTaskModal(true)}
                      className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                    >
                      Create your first task
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        );
    }
  };

  if (backendStatus === "checking") {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to backend...</p>
        </div>
      </div>
    );
  }

  // Get parent task name for subtask modal
  const getParentTaskName = () => {
    if (!parentTaskForSubtask) return "";
    const parentTask = tasks.find((t) => t.id === parentTaskForSubtask);
    return parentTask ? parentTask.title : "";
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        <ConnectionStatus />

        {backendStatus === "connected" ? (
          renderCurrentView()
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-500">
              Please start the backend server to use the app
            </p>
          </div>
        )}
      </div>

      {/* Task Modal */}
      <Modal
        isOpen={showNewTaskModal}
        onClose={() => setShowNewTaskModal(false)}
        title="Create New Task"
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Task title"
            value={newTask.title}
            onChange={(e) => handleTaskTitleChange(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
          <textarea
            placeholder="Description (optional)"
            value={newTask.description}
            onChange={(e) => handleTaskDescriptionChange(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Priority
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => handleTaskPriorityChange(1)}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                  newTask.priority === 1
                    ? "bg-green-100 border-green-500 text-green-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Low
              </button>
              <button
                type="button"
                onClick={() => handleTaskPriorityChange(2)}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                  newTask.priority === 2
                    ? "bg-yellow-100 border-yellow-500 text-yellow-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Medium
              </button>
              <button
                type="button"
                onClick={() => handleTaskPriorityChange(3)}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                  newTask.priority === 3
                    ? "bg-red-100 border-red-500 text-red-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                High
              </button>
            </div>
          </div>
          <input
            type="datetime-local"
            value={newTask.due_date}
            onChange={(e) => handleTaskDueDateChange(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={newTask.is_calendar_event}
              onChange={(e) => handleTaskCalendarEventChange(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Add to Google Calendar</span>
          </label>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowNewTaskModal(false)}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTask}
              disabled={!newTask.title}
              className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Create Task
            </button>
          </div>
        </div>
      </Modal>

      {/* NEW: Subtask Modal */}
      <Modal
        isOpen={showNewSubtaskModal}
        onClose={() => {
          setShowNewSubtaskModal(false);
          setParentTaskForSubtask(null);
        }}
        title={`Create Subtask under "${getParentTaskName()}"`}
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Subtask title"
            value={newTask.title}
            onChange={(e) => handleTaskTitleChange(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
          <textarea
            placeholder="Description (optional)"
            value={newTask.description}
            onChange={(e) => handleTaskDescriptionChange(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Priority
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => handleTaskPriorityChange(1)}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                  newTask.priority === 1
                    ? "bg-green-100 border-green-500 text-green-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Low
              </button>
              <button
                type="button"
                onClick={() => handleTaskPriorityChange(2)}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                  newTask.priority === 2
                    ? "bg-yellow-100 border-yellow-500 text-yellow-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Medium
              </button>
              <button
                type="button"
                onClick={() => handleTaskPriorityChange(3)}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                  newTask.priority === 3
                    ? "bg-red-100 border-red-500 text-red-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                High
              </button>
            </div>
          </div>
          <input
            type="datetime-local"
            value={newTask.due_date}
            onChange={(e) => handleTaskDueDateChange(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={newTask.is_calendar_event}
              onChange={(e) => handleTaskCalendarEventChange(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Add to Google Calendar</span>
          </label>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setShowNewSubtaskModal(false);
                setParentTaskForSubtask(null);
              }}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSubtask}
              disabled={!newTask.title}
              className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Create Subtask
            </button>
          </div>
        </div>
      </Modal>

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
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              maxLength={12}
            />
            <p className="text-xs text-gray-500 mt-1">
              {newFolder.name.length}/12 characters
            </p>
          </div>
          <input
            type="color"
            value={newFolder.color}
            onChange={(e) => handleFolderColorChange(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 h-10"
          />
          <div className="flex space-x-3">
            <button
              onClick={() => setShowNewFolderModal(false)}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50"
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