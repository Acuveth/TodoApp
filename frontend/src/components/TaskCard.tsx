import React, { useState, useEffect } from "react";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Circle,
  CheckCircle2,
  Flag,
  Plus,
  Eye,
  EyeOff,
  Calendar,
  X,
  Trash2,
  Edit2,
  Save,
  FolderPlus,
  MoreVertical,
} from "lucide-react";
import { Task, FolderType } from "../types";

interface TaskCardProps {
  task: Task;
  isExpanded: boolean;
  onToggleExpansion: (taskId: number) => void;
  onToggleStatus: (task: Task) => void;
  onCreateSubtask?: (parentTaskId: number) => void;
  onUpdateTask?: (taskId: number, updates: any) => void;
  onDeleteTask?: (taskId: number) => void;
  allTasks: Task[];
  folders?: FolderType[];
}

// Enhanced Task Action Dropdown Component with Folder Submenu
const TaskActionDropdown: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onSchedule: () => void;
  onFolderSelect: (folderId: number | null) => void;
  onDelete: () => void;
  folders: FolderType[];
  currentFolderId: number | null;
}> = ({ 
  isOpen, 
  onClose, 
  onEdit, 
  onSchedule, 
  onFolderSelect, 
  onDelete, 
  folders, 
  currentFolderId 
}) => {
  const [showFolderSubmenu, setShowFolderSubmenu] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      {/* Main Dropdown */}
      <div className="absolute top-8 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-xl min-w-[180px] py-1">
        <button
          onClick={() => {
            onEdit();
            onClose();
          }}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
        >
          <Edit2 className="w-4 h-4" />
          <span>Edit Task</span>
        </button>
        
        <button
          onClick={() => {
            onSchedule();
            onClose();
          }}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
        >
          <Calendar className="w-4 h-4" />
          <span>Schedule Task</span>
        </button>
        
        {/* Folder selection with hover submenu */}
        <div 
          className="relative"
          onMouseEnter={() => setShowFolderSubmenu(true)}
          onMouseLeave={() => setShowFolderSubmenu(false)}
        >
          <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FolderPlus className="w-4 h-4" />
              <span>Change Folder</span>
            </div>
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          {/* Folder submenu */}
          {showFolderSubmenu && (
            <div className="absolute top-0 right-full ml-1 z-60 bg-white border border-gray-200 rounded-md shadow-xl min-w-[200px] py-1">
              <button
                onClick={() => {
                  onFolderSelect(null);
                  onClose();
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2 ${
                  currentFolderId === null ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <div className="w-3 h-3 rounded bg-gray-300" />
                <span>No Folder</span>
                {currentFolderId === null && <span className="ml-auto text-blue-600">✓</span>}
              </button>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => {
                    onFolderSelect(folder.id);
                    onClose();
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2 ${
                    currentFolderId === folder.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: folder.color }}
                  />
                  <span>{folder.name}</span>
                  {currentFolderId === folder.id && <span className="ml-auto text-blue-600">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <hr className="my-1" />
        
        <button
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Task</span>
        </button>
      </div>
    </>
  );
};

// Task Edit Modal Component
const TaskEditModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: any) => void;
  task: Task;
  folders?: FolderType[];
}> = ({ isOpen, onClose, onSave, task, folders = [] }) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(
    task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : ""
  );
  const [isCalendarEvent, setIsCalendarEvent] = useState(task.is_calendar_event);
  const [status, setStatus] = useState(task.status);
  const [folderId, setFolderId] = useState<number | null>(
    (task as any).folder_id || null
  );

  // Reset form when task changes
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
    setPriority(task.priority);
    setDueDate(
      task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : ""
    );
    setIsCalendarEvent(task.is_calendar_event);
    setStatus(task.status);
    setFolderId((task as any).folder_id || null);
  }, [task]);

  const handleSave = () => {
    const updates: any = {
      title: title.trim(),
      description: description.trim() || null,
      priority,
      status,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      is_calendar_event: isCalendarEvent,
      folder_id: folderId,
    };

    // Remove unchanged fields to avoid unnecessary updates
    const changes: any = {};
    if (updates.title !== task.title) changes.title = updates.title;
    if (updates.description !== (task.description || null)) changes.description = updates.description;
    if (updates.priority !== task.priority) changes.priority = updates.priority;
    if (updates.status !== task.status) changes.status = updates.status;
    if (updates.due_date !== task.due_date) changes.due_date = updates.due_date;
    if (updates.is_calendar_event !== task.is_calendar_event) changes.is_calendar_event = updates.is_calendar_event;
    if (updates.folder_id !== (task as any).folder_id) changes.folder_id = updates.folder_id;

    if (Object.keys(changes).length > 0) {
      onSave(changes);
    }
    onClose();
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
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Edit Task
              </h3>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Task title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Task description (optional)"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                        priority === p
                          ? p === 1
                            ? "bg-green-100 border-green-500 text-green-700"
                            : p === 2
                            ? "bg-yellow-100 border-yellow-500 text-yellow-700"
                            : "bg-red-100 border-red-500 text-red-700"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {p === 1 ? "Low" : p === 2 ? "Medium" : "High"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Folder Selection */}
              {folders.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Folder
                  </label>
                  <select
                    value={folderId || ""}
                    onChange={(e) => setFolderId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">No Folder</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Calendar Event */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isCalendarEvent}
                    onChange={(e) => setIsCalendarEvent(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Add to Google Calendar
                  </span>
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!title.trim()}
                className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskTitle: string;
  hasSubtasks: boolean;
}> = ({ isOpen, onClose, onConfirm, taskTitle, hasSubtasks }) => {
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
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Delete Task
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete "{taskTitle}"?
                    {hasSubtasks && (
                      <span className="block mt-1 font-medium text-red-600">
                        This will also delete all subtasks.
                      </span>
                    )}
                    <span className="block mt-1">
                      This action cannot be undone.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onConfirm}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DateTimePickerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (dateTime: string) => void;
  currentDateTime?: string;
  taskTitle: string;
}> = ({ isOpen, onClose, onSave, currentDateTime, taskTitle }) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  useEffect(() => {
    if (currentDateTime) {
      const date = new Date(currentDateTime);
      setSelectedDate(date.toISOString().split("T")[0]);
      setSelectedTime(date.toTimeString().slice(0, 5));
    } else {
      // Set default to today
      const now = new Date();
      setSelectedDate(now.toISOString().split("T")[0]);
      setSelectedTime("09:00");
    }
  }, [currentDateTime, isOpen]);

  const handleSave = () => {
    if (selectedDate && selectedTime) {
      const dateTimeString = `${selectedDate}T${selectedTime}:00`;
      onSave(dateTimeString);
      onClose();
    }
  };

  const handleClear = () => {
    onSave("");
    onClose();
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
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Schedule Task
              </h3>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Schedule "{taskTitle}" to appear on the calendar
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              {currentDateTime && (
                <button
                  onClick={handleClear}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50"
                >
                  Clear
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!selectedDate || !selectedTime}
                className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isExpanded,
  onToggleExpansion,
  onToggleStatus,
  onCreateSubtask,
  onUpdateTask,
  onDeleteTask,
  allTasks = [],
  folders = [],
}) => {
  // Hidden subtasks state with localStorage persistence
  const [hiddenSubtasks, setHiddenSubtasks] = useState<Set<number>>(() => {
    try {
      const stored = localStorage.getItem("hiddenSubtasks");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Date/Time picker state
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [dateTimePickerTaskId, setDateTimePickerTaskId] = useState<
    number | null
  >(null);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTaskId, setEditTaskId] = useState<number | null>(null);

  // Action dropdown state
  const [showActionDropdown, setShowActionDropdown] = useState<string | null>(null);

  // Save to localStorage whenever hiddenSubtasks changes
  useEffect(() => {
    try {
      localStorage.setItem(
        "hiddenSubtasks",
        JSON.stringify(Array.from(hiddenSubtasks))
      );
    } catch (error) {
      console.error("Failed to save hidden subtasks to localStorage:", error);
    }
  }, [hiddenSubtasks]);

  const toggleSubtaskVisibility = (taskId: number) => {
    setHiddenSubtasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  // Check if a specific subtask is hidden
  const isSubtaskHidden = (taskId: number) => hiddenSubtasks.has(taskId);

  // Check if all subtasks of the main task are hidden
  const areSubtasksHidden = hiddenSubtasks.has(task.id);

  // Handle date/time scheduling
  const handleScheduleTask = (taskId: number) => {
    setDateTimePickerTaskId(taskId);
    setShowDateTimePicker(true);
  };

  const handleSaveDateTime = (dateTime: string) => {
    if (dateTimePickerTaskId && onUpdateTask) {
      const updates = {
        due_date: dateTime || null,
        is_calendar_event: !!dateTime,
      };
      onUpdateTask(dateTimePickerTaskId, updates);
    }
    setDateTimePickerTaskId(null);
  };

  // Handle task deletion
  const handleDeleteTask = (taskId: number) => {
    setDeleteTaskId(taskId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTask = () => {
    if (deleteTaskId && onDeleteTask) {
      onDeleteTask(deleteTaskId);
    }
    setShowDeleteConfirm(false);
    setDeleteTaskId(null);
  };

  // Handle task editing
  const handleEditTask = (taskId: number) => {
    setEditTaskId(taskId);
    setShowEditModal(true);
  };

  const handleSaveTaskEdits = (updates: any) => {
    if (editTaskId && onUpdateTask) {
      onUpdateTask(editTaskId, updates);
    }
    setShowEditModal(false);
    setEditTaskId(null);
  };

  // Handle folder assignment
  const handleFolderSelect = (folderId: number | null) => {
    if (onUpdateTask) {
      onUpdateTask(task.id, { folder_id: folderId });
    }
    setShowActionDropdown(null);
  };

  const getTaskById = (taskId: number): Task | undefined => {
    return allTasks.find((t) => t.id === taskId);
  };

  // Get current folder for display
  const getCurrentFolder = () => {
    return folders.find((folder) => folder.id === (task as any).folder_id);
  };

  // Calculate substep progress (traditional substeps)
  const completedSubsteps =
    task.substeps?.filter((s) => s.is_completed).length || 0;
  const totalSubsteps = task.substeps?.length || 0;

  // Calculate subtask progress (child tasks) - recursively
  const getSubtaskStats = (
    taskId: number
  ): { total: number; completed: number } => {
    const directSubtasks = allTasks.filter((t) => t.parent_task_id === taskId);
    let total = directSubtasks.length;
    let completed = directSubtasks.filter(
      (t) => t.status === "completed"
    ).length;

    // Recursively count nested subtasks
    directSubtasks.forEach((subtask) => {
      const nested = getSubtaskStats(subtask.id);
      total += nested.total;
      completed += nested.completed;
    });

    return { total, completed };
  };

  const subtaskStats = getSubtaskStats(task.id);
  const totalSubtasks = subtaskStats.total;
  const completedSubtasks = subtaskStats.completed;
  const hasSubtasks = totalSubtasks > 0;

  // Overall progress calculation
  const totalItems = totalSubsteps + totalSubtasks;
  const completedItems = completedSubsteps + completedSubtasks;
  const overallProgress = totalItems > 0 ? completedItems / totalItems : 0;

  // Auto-completion suggestion
  const shouldAutoComplete =
    hasSubtasks &&
    completedSubtasks === totalSubtasks &&
    totalSubtasks > 0 &&
    task.status !== "completed";

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 3:
        return "text-red-500";
      case 2:
        return "text-yellow-500";
      case 1:
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusIcon = (status: string, onClick?: () => void) => {
    switch (status) {
      case "completed":
        return (
          <button
            onClick={onClick}
            className="hover:scale-110 transition-transform"
          >
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </button>
        );
      case "in_progress":
        return (
          <button
            onClick={onClick}
            className="hover:scale-110 transition-transform"
          >
            <Circle className="w-5 h-5 text-blue-500" />
          </button>
        );
      default:
        return (
          <button
            onClick={onClick}
            className="hover:scale-110 transition-transform"
          >
            <Circle className="w-5 h-5 text-gray-400" />
          </button>
        );
    }
  };

  // Recursive subtask renderer with individual hide functionality (limited to level 1)
  const renderSubtasks = (
    parentId: number,
    level: number = 0
  ): React.ReactElement[] => {
    const directSubtasks = allTasks.filter(
      (t) => t.parent_task_id === parentId
    );

    return directSubtasks.map((subtask) => {
      // Check if this specific subtask is hidden
      const isThisSubtaskHidden = isSubtaskHidden(subtask.id);

      const nestedSubtasks = allTasks.filter(
        (t) => t.parent_task_id === subtask.id
      );
      const hasNested = nestedSubtasks.length > 0;

      // Only allow hide functionality for level 0 subtasks (direct children of main tasks)
      const canHideSubtasks = level === 0 && hasNested;

      return (
        <div key={subtask.id}>
          <div
            className="flex items-start space-x-2 mt-2"
            style={{ marginLeft: `${24 * (level + 1)}px` }}
          >
            {getStatusIcon(subtask.status, () => onToggleStatus(subtask))}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span
                  className={`font-medium ${
                    subtask.status === "completed"
                      ? "line-through text-gray-500"
                      : "text-gray-900"
                  }`}
                >
                  {subtask.title}
                </span>
                <Flag
                  className={`w-4 h-4 ${getPriorityColor(subtask.priority)}`}
                />
                {subtask.due_date && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-blue-500" />
                    <span className="text-xs text-blue-600">
                      {new Date(subtask.due_date).toLocaleDateString()}{" "}
                      {new Date(subtask.due_date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
                {/* Show indicator if subtask has nested children that are hidden (only for level 0) */}
                {canHideSubtasks && isThisSubtaskHidden && (
                  <span className="text-xs text-gray-400">(hidden)</span>
                )}
              </div>
              {subtask.description && (
                <p className="text-gray-600 mt-1">{subtask.description}</p>
              )}
            </div>

            {/* Action buttons for subtasks */}
            <div className="flex items-center space-x-1">
              {/* Action dropdown for subtask */}
              <div className="relative">
                <button
                  onClick={() => setShowActionDropdown(
                    showActionDropdown === `subtask-${subtask.id}` ? null : `subtask-${subtask.id}`
                  )}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  title="More actions"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {showActionDropdown === `subtask-${subtask.id}` && (
                  <TaskActionDropdown
                    isOpen={true}
                    onClose={() => setShowActionDropdown(null)}
                    onEdit={() => handleEditTask(subtask.id)}
                    onSchedule={() => handleScheduleTask(subtask.id)}
                    onFolderSelect={(folderId) => {
                      if (onUpdateTask) {
                        onUpdateTask(subtask.id, { folder_id: folderId });
                      }
                      setShowActionDropdown(null);
                    }}
                    onDelete={() => handleDeleteTask(subtask.id)}
                    folders={folders}
                    currentFolderId={(subtask as any).folder_id || null}
                  />
                )}
              </div>

              {/* Hide/Show button for subtask - only show for level 0 subtasks with nested children */}
              {canHideSubtasks && (
                <button
                  onClick={() => toggleSubtaskVisibility(subtask.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  title={
                    isThisSubtaskHidden
                      ? "Show nested subtasks"
                      : "Hide nested subtasks"
                  }
                >
                  {isThisSubtaskHidden ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              )}

              {/* Add subtask button for nested subtasks */}
              {onCreateSubtask && (
                <button
                  onClick={() => onCreateSubtask(subtask.id)}
                  className="p-1 text-gray-400 hover:text-blue-600 rounded"
                  title="Add subtask"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Recursively render nested subtasks - only if not hidden */}
          {hasNested &&
            !isThisSubtaskHidden &&
            renderSubtasks(subtask.id, level + 1)}
        </div>
      );
    });
  };

  // Indentation styling
  const indentStyle = {
    marginLeft: `${task.indent_level * 24}px`,
  };

  const currentFolder = getCurrentFolder();

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
      style={indentStyle}
    >
      <div className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {getStatusIcon(task.status, () => onToggleStatus(task))}

            <div className="flex-1">
              <div className="space-y-2">
                {/* Title row */}
                <h3
                  className={`font-medium cursor-pointer leading-relaxed ${
                    task.status === "completed"
                      ? "line-through text-gray-500"
                      : "text-gray-900"
                  } ${shouldAutoComplete ? "text-green-600" : ""}`}
                  onClick={() => onToggleExpansion(task.id)}
                >
                  {task.title}
                </h3>

                {/* Metadata row - priority, date/time, folder, and status indicators */}
                <div className="flex items-center space-x-3 flex-wrap">
                  <div className="flex items-center space-x-1">
                    <Flag
                      className={`w-4 h-4 ${getPriorityColor(task.priority)}`}
                    />
                    <span className="text-xs text-gray-500">
                      {task.priority === 3
                        ? "High"
                        : task.priority === 2
                        ? "Medium"
                        : "Low"}
                    </span>
                  </div>

                  {/* Show calendar icon and date/time if task has due date */}
                  {task.due_date && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-blue-600">
                        {new Date(task.due_date).toLocaleDateString()}{" "}
                        {new Date(task.due_date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}

                  {/* Folder indicator */}
                  {currentFolder && (
                    <div className="flex items-center space-x-1">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: currentFolder.color }}
                      />
                      <span className="text-xs text-gray-500">
                        {currentFolder.name}
                      </span>
                    </div>
                  )}

                  {/* Auto-completion indicator */}
                  {shouldAutoComplete && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Ready to complete
                    </span>
                  )}
                </div>
              </div>

              {task.description && (
                <p className="text-gray-600 mt-1">{task.description}</p>
              )}

              {/* Progress bar */}
              {totalItems > 0 && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="bg-gray-200 rounded-full h-2 flex-1">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          overallProgress === 1 ? "bg-green-500" : "bg-blue-500"
                        }`}
                        style={{ width: `${overallProgress * 100}%` }}
                      />
                    </div>
                    <span>
                      {completedItems}/{totalItems}
                    </span>
                  </div>

                  {/* Progress breakdown */}
                  {totalSubsteps > 0 && totalSubtasks > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Steps: {completedSubsteps}/{totalSubsteps}, Subtasks:{" "}
                      {completedSubtasks}/{totalSubtasks}
                    </div>
                  )}
                </div>
              )}

              {/* Subtask indicator */}
              {hasSubtasks && (
                <div className="mt-2 text-sm text-gray-600">
                  📁 {totalSubtasks} subtask{totalSubtasks !== 1 ? "s" : ""}
                  {completedSubtasks > 0 && ` (${completedSubtasks} completed)`}
                  {areSubtasksHidden && " (hidden)"}
                </div>
              )}

              {/* Recursively render all subtasks - only if not hidden */}
              {hasSubtasks && !areSubtasksHidden && (
                <div className="mt-1">{renderSubtasks(task.id)}</div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-1">
            {/* Main action dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowActionDropdown(
                  showActionDropdown === `task-${task.id}` ? null : `task-${task.id}`
                )}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                title="More actions"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showActionDropdown === `task-${task.id}` && (
                <TaskActionDropdown
                  isOpen={true}
                  onClose={() => setShowActionDropdown(null)}
                  onEdit={() => handleEditTask(task.id)}
                  onSchedule={() => handleScheduleTask(task.id)}
                  onFolderSelect={handleFolderSelect}
                  onDelete={() => handleDeleteTask(task.id)}
                  folders={folders}
                  currentFolderId={(task as any).folder_id || null}
                />
              )}
            </div>

            {/* Hide/Show subtasks button */}
            {hasSubtasks && (
              <button
                onClick={() => toggleSubtaskVisibility(task.id)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                title={areSubtasksHidden ? "Show subtasks" : "Hide subtasks"}
              >
                {areSubtasksHidden ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            )}

            {/* Add subtask button */}
            {onCreateSubtask && (
              <button
                onClick={() => onCreateSubtask(task.id)}
                className="p-1 text-gray-400 hover:text-blue-600 rounded"
                title="Add subtask"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}

            {/* Expand/collapse button - only show if there are traditional substeps */}
            {totalSubsteps > 0 && (
              <button onClick={() => onToggleExpansion(task.id)}>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded content for traditional substeps only */}
      {isExpanded && task.substeps && task.substeps.length > 0 && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <h4 className="font-medium text-gray-900">Steps</h4>
          <div className="space-y-1">
            {task.substeps.map((substep: any) => (
              <div key={substep.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={substep.is_completed}
                  className="rounded border-gray-300"
                  readOnly
                />
                <span
                  className={
                    substep.is_completed
                      ? "line-through text-gray-500"
                      : "text-gray-700"
                  }
                >
                  {substep.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Edit Modal */}
      {editTaskId && (
        <TaskEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditTaskId(null);
          }}
          onSave={handleSaveTaskEdits}
          task={getTaskById(editTaskId) || task}
          folders={folders}
        />
      )}

      {/* Date/Time Picker Modal */}
      <DateTimePickerModal
        isOpen={showDateTimePicker}
        onClose={() => {
          setShowDateTimePicker(false);
          setDateTimePickerTaskId(null);
        }}
        onSave={handleSaveDateTime}
        currentDateTime={
          dateTimePickerTaskId
            ? getTaskById(dateTimePickerTaskId)?.due_date
            : undefined
        }
        taskTitle={
          dateTimePickerTaskId
            ? getTaskById(dateTimePickerTaskId)?.title || "Task"
            : "Task"
        }
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTaskId(null);
        }}
        onConfirm={confirmDeleteTask}
        taskTitle={
          deleteTaskId ? getTaskById(deleteTaskId)?.title || "Task" : "Task"
        }
        hasSubtasks={
          deleteTaskId
            ? allTasks.some((t) => t.parent_task_id === deleteTaskId)
            : false
        }
      />
    </div>
  );
};

export default TaskCard;