import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Plus,
  Calendar as CalendarIcon,
  CheckSquare,
  BookOpen,
  Clock,
  Flag,
  Edit,
  Trash2,
  FolderPlus,
  Eye,
  EyeOff,
  X,
  AlarmClockCheck,
  Filter,
  ChevronDown,
  RotateCcw,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { Task, DiaryEntry, FolderType, NewTask, NewDiaryEntry } from "../types";
import { Modal, TaskCard } from "./";

interface FeedViewProps {
  tasks: Task[];
  diaryEntries: DiaryEntry[];
  folders: FolderType[];
  loading: boolean;
  onCreateTask: (taskData: any) => Promise<void>;
  onCreateDiaryEntry: (content: string) => Promise<void>;
  onToggleTaskStatus: (task: Task) => Promise<void>;
  onUpdateTask: (taskId: number, updates: any) => Promise<void>;
  onDeleteTask: (taskId: number) => Promise<void>;
  onUpdateDiaryEntry: (id: number, content: string) => Promise<void>;
  onDeleteDiaryEntry: (id: number) => Promise<void>;
  onUpdateDiaryEntryFolder: (
    id: number,
    folderId: number | null
  ) => Promise<void>;
  onCreateSubtask?: (parentTaskId: number) => void;
  // NEW: Diary scheduling props
  onScheduleDiaryEntry?: (id: number, scheduledDate: string) => Promise<void>;
  onUnscheduleDiaryEntry?: (id: number) => Promise<void>;
}

type FeedItem = {
  id: string;
  type: "task" | "diary";
  data: Task | DiaryEntry;
  created_at: string;
  due_date?: string;
  scheduled_date?: string; // NEW: For diary entries
};

type TabType = "all" | "today" | "diaries" | "tasks";

// NEW: Filter and Sort types - SIMPLIFIED
type FilterBy = "priority" | "created_at" | "due_date";
type SortOrder = "asc" | "desc";

interface TaskSort {
  by: FilterBy;
  order: SortOrder;
}

// NEW: Filter Dropdown Component
const FilterDropdown: React.FC<{
  label: string;
  value: string;
  options: { value: string; label: string; color?: string }[];
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}> = ({ label, value, options, onChange, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm border transition-colors ${
          value !== "all" 
            ? "bg-blue-50 border-blue-200 text-blue-700" 
            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
        }`}
      >
        {icon && <span className="text-gray-500">{icon}</span>}
        <span>{selectedOption?.label || label}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen && (
        <div className="absolute top-8 left-0 z-10 bg-white border border-gray-200 rounded-md shadow-lg min-w-[160px]">
          <div className="p-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center space-x-2 ${
                  value === option.value ? "bg-blue-50 text-blue-700" : "text-gray-700"
                }`}
              >
                {option.color && (
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: option.color }}
                  />
                )}
                <span>{option.label}</span>
                {value === option.value && <span className="ml-auto">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// NEW: Date/Time Picker Modal for Diary Scheduling
const DateTimePickerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (dateTime: string) => void;
  onClear?: () => void;
  currentDateTime?: string;
  entryTitle: string;
}> = ({ isOpen, onClose, onSave, onClear, currentDateTime, entryTitle }) => {
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
    if (onClear) {
      onClear();
      onClose();
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
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Schedule Diary Entry
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
                Schedule "{entryTitle}" to appear on the calendar
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
              {currentDateTime && onClear && (
                <button
                  onClick={handleClear}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50"
                >
                  Unschedule
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

const FeedView: React.FC<FeedViewProps> = ({
  tasks,
  diaryEntries,
  folders,
  loading,
  onCreateTask,
  onCreateDiaryEntry,
  onToggleTaskStatus,
  onUpdateTask,
  onDeleteTask,
  onUpdateDiaryEntry,
  onDeleteDiaryEntry,
  onUpdateDiaryEntryFolder,
  onCreateSubtask,
  onScheduleDiaryEntry,
  onUnscheduleDiaryEntry,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showNewDiaryModal, setShowNewDiaryModal] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showFolderSelect, setShowFolderSelect] = useState<string | null>(null);
  const [editingDiary, setEditingDiary] = useState<DiaryEntry | null>(null);
  const [showEditDiaryModal, setShowEditDiaryModal] = useState(false);
  const [editDiaryContent, setEditDiaryContent] = useState("");

  // NEW: Simplified Filter State
  const [taskSort, setTaskSort] = useState<TaskSort>({
    by: "created_at",
    order: "desc",
  });
  const [showFilters, setShowFilters] = useState(false);

  // NEW: Scheduling state
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [entryToSchedule, setEntryToSchedule] = useState<DiaryEntry | null>(
    null
  );

  // Task creation state
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

  // Diary creation state
  const [newDiaryContent, setNewDiaryContent] = useState("");

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  // NEW: Helper functions for sorting only
  const sortTasks = useCallback((taskList: Task[]): Task[] => {
    return [...taskList].sort((a, b) => {
      let compareValue = 0;

      switch (taskSort.by) {
        case "created_at":
          compareValue = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "priority":
          compareValue = b.priority - a.priority; // Higher priority first for desc
          break;
        case "due_date":
          const aDue = a.due_date ? new Date(a.due_date).getTime() : Infinity;
          const bDue = b.due_date ? new Date(b.due_date).getTime() : Infinity;
          compareValue = aDue - bDue;
          break;
        default:
          compareValue = 0;
      }

      return taskSort.order === "desc" ? -compareValue : compareValue;
    });
  }, [taskSort]);

  // Combine and sort items by creation time
  const createFeedItems = useCallback((): FeedItem[] => {
    const feedItems: FeedItem[] = [];

    // Add tasks to feed (only root tasks for cleaner feed view)
    let tasksToShow = tasks.filter((task) => !task.parent_task_id);
    
    // Apply sorting only to tasks tab
    if (activeTab === "tasks") {
      tasksToShow = sortTasks(tasksToShow);
    }

    tasksToShow.forEach((task) => {
      feedItems.push({
        id: `task-${task.id}`,
        type: "task",
        data: task,
        created_at: task.created_at,
        due_date: task.due_date,
      });
    });

    // Add diary entries to feed
    diaryEntries.forEach((entry) => {
      feedItems.push({
        id: `diary-${entry.id}`,
        type: "diary",
        data: entry,
        created_at: entry.created_at,
        scheduled_date: entry.scheduled_date,
      });
    });

    // Sort by creation time (newest first) if not tasks tab
    if (activeTab !== "tasks") {
      return feedItems.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return feedItems;
  }, [tasks, diaryEntries, activeTab, sortTasks]);

  // Filter items based on active tab
  const filteredItems = useCallback((): FeedItem[] => {
    const allItems = createFeedItems();

    switch (activeTab) {
      case "today":
        return allItems.filter((item) => {
          if (item.type === "task" && item.due_date) {
            return item.due_date.startsWith(today);
          }
          if (item.type === "diary") {
            const entry = item.data as DiaryEntry;
            // Show entries created today or scheduled for today
            return (
              entry.entry_date === today ||
              (entry.is_scheduled &&
                entry.scheduled_date &&
                entry.scheduled_date.startsWith(today))
            );
          }
          return false;
        });
      case "diaries":
        return allItems.filter((item) => item.type === "diary");
      case "tasks":
        return allItems.filter((item) => item.type === "task");
      default:
        return allItems;
    }
  }, [createFeedItems, activeTab, today]);

  // NEW: Simplified filter options
  const sortOptions = [
    { value: "created_at", label: "Latest First (Created)" },
    { value: "priority", label: "Priority (High to Low)" },
    { value: "due_date", label: "Due Date (Earliest First)" },
  ];

  // Reset sorting
  const resetSort = () => {
    setTaskSort({
      by: "created_at",
      order: "desc",
    });
  };

  // Check if sorting is not default
  const isCustomSort = useMemo(() => {
    return taskSort.by !== "created_at" || taskSort.order !== "desc";
  }, [taskSort]);

  // Task handlers
  const handleTaskTitleChange = useCallback((value: string) => {
    setNewTask((prev) => ({ ...prev, title: value }));
  }, []);

  const handleTaskDescriptionChange = useCallback((value: string) => {
    setNewTask((prev) => ({ ...prev, description: value }));
  }, []);

  const handleTaskPriorityChange = useCallback((value: number) => {
    setNewTask((prev) => ({ ...prev, priority: value }));
  }, []);

  const handleTaskDueDateChange = useCallback((value: string) => {
    setNewTask((prev) => ({ ...prev, due_date: value }));
  }, []);

  const handleTaskCalendarEventChange = useCallback((value: boolean) => {
    setNewTask((prev) => ({ ...prev, is_calendar_event: value }));
  }, []);

  const handleCreateTask = async () => {
    try {
      const taskData = {
        ...newTask,
        folder_id: null,
        due_date: newTask.due_date
          ? new Date(newTask.due_date).toISOString()
          : null,
      };

      await onCreateTask(taskData);

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
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const handleCreateDiaryEntry = async () => {
    try {
      const trimmed = newDiaryContent.trim();
      if (trimmed) {
        await onCreateDiaryEntry(trimmed);
        setNewDiaryContent("");
        setShowNewDiaryModal(false);
      }
    } catch (error) {
      console.error("Error creating diary entry:", error);
    }
  };

  const handleEditDiary = (entry: DiaryEntry) => {
    setEditingDiary(entry);
    const combinedText = entry.title
      ? `${entry.title}\n${entry.content}`
      : entry.content;
    setEditDiaryContent(combinedText);
    setShowEditDiaryModal(true);
  };

  const handleSaveEditDiary = async () => {
    if (editingDiary && editDiaryContent.trim()) {
      try {
        await onUpdateDiaryEntry(editingDiary.id, editDiaryContent.trim());
        setShowEditDiaryModal(false);
        setEditingDiary(null);
        setEditDiaryContent("");
      } catch (error) {
        console.error("Error updating diary entry:", error);
      }
    }
  };

  const handleFolderSelect = async (
    itemId: string,
    folderId: number | null
  ) => {
    try {
      const [type, id] = itemId.split("-");
      if (type === "diary") {
        await onUpdateDiaryEntryFolder(parseInt(id), folderId);
      }
      setShowFolderSelect(null);
    } catch (error) {
      console.error("Error updating folder:", error);
    }
  };

  // NEW: Diary scheduling handlers
  const handleScheduleEntry = useCallback((entry: DiaryEntry) => {
    setEntryToSchedule(entry);
    setShowSchedulePicker(true);
  }, []);

  const handleSaveSchedule = useCallback(
    async (dateTime: string) => {
      if (entryToSchedule && onScheduleDiaryEntry) {
        try {
          await onScheduleDiaryEntry(entryToSchedule.id, dateTime);
          setEntryToSchedule(null);
        } catch (error) {
          console.error("Error scheduling diary entry:", error);
        }
      }
    },
    [entryToSchedule, onScheduleDiaryEntry]
  );

  const handleClearSchedule = useCallback(async () => {
    if (entryToSchedule && onUnscheduleDiaryEntry) {
      try {
        await onUnscheduleDiaryEntry(entryToSchedule.id);
        setEntryToSchedule(null);
      } catch (error) {
        console.error("Error unscheduling diary entry:", error);
      }
    }
  }, [entryToSchedule, onUnscheduleDiaryEntry]);

  const toggleItemExpansion = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

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

  const getCurrentFolder = (item: FeedItem) => {
    if (item.type === "diary") {
      const entry = item.data as DiaryEntry;
      return folders.find((folder) => folder.id === (entry as any).folder_id);
    }
    return null;
  };

  // NEW: Helper function to format scheduled time
  const formatScheduledTime = (scheduledDate: string) => {
    const date = new Date(scheduledDate);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Simple markdown-like formatting for display
  const formatContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br />");
  };

  const renderFeedItem = (item: FeedItem) => {
    const isExpanded = expandedItems.has(item.id);

    if (item.type === "task") {
      const task = item.data as Task;

      // Add a type indicator and timestamp above the TaskCard for feed context
      return (
        <div key={item.id} className="space-y-2">
          {/* Feed context header */}
          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <div className="flex items-center space-x-2">
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>
                {new Date(task.created_at).toLocaleDateString()}{" "}
                {new Date(task.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          {/* Use the full TaskCard component */}
          <TaskCard
            task={task}
            isExpanded={expandedItems.has(task.id.toString())}
            onToggleExpansion={(taskId) => {
              const newExpanded = new Set(expandedItems);
              const taskIdStr = taskId.toString();
              if (newExpanded.has(taskIdStr)) {
                newExpanded.delete(taskIdStr);
              } else {
                newExpanded.add(taskIdStr);
              }
              setExpandedItems(newExpanded);
            }}
            onToggleStatus={onToggleTaskStatus}
            onCreateSubtask={onCreateSubtask}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
            allTasks={tasks}
            folders={folders} // Pass folders to TaskCard
          />
        </div>
      );
    } else {
      const entry = item.data as DiaryEntry;
      const folder = getCurrentFolder(item);

      return (
        <div
          key={item.id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => toggleItemExpansion(item.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-purple-700">
                    Diary Entry
                  </span>
                  {folder && (
                    <>
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: folder.color }}
                      />
                      <span className="text-xs text-gray-500">
                        {folder.name}
                      </span>
                    </>
                  )}
                </div>

                {/* NEW: Scheduling indicator */}
                {entry.is_scheduled && entry.scheduled_date && (
                  <div className="flex items-center space-x-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    <CalendarIcon className="w-3 h-3" />
                    <span>{formatScheduledTime(entry.scheduled_date)}</span>
                  </div>
                )}
              </div>

              {entry.title && (
                <h3 className="font-medium text-lg text-gray-900 mb-2">
                  {entry.title}
                </h3>
              )}

              <div className="text-gray-600 mb-2">
                {isExpanded ? (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: formatContent(entry.content),
                    }}
                  />
                ) : (
                  <p className="line-clamp-3">
                    {entry.content.length > 200
                      ? `${entry.content.substring(0, 200)}...`
                      : entry.content}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(entry.created_at).toLocaleDateString()}{" "}
                    {new Date(entry.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* NEW: Schedule button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleScheduleEntry(entry);
                }}
                className={`p-1 rounded transition-colors ${
                  entry.is_scheduled
                    ? "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                }`}
                title={
                  entry.is_scheduled ? "Reschedule entry" : "Schedule entry"
                }
              >
                <CalendarIcon className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditDiary(entry);
                }}
                className="p-1 text-gray-400 hover:text-blue-600 rounded"
                title="Edit diary entry"
              >
                <Edit className="w-4 h-4" />
              </button>

              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFolderSelect(
                      showFolderSelect === item.id ? null : item.id
                    );
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  title="Change folder"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>

                {showFolderSelect === item.id && (
                  <div className="absolute top-8 right-0 z-10 bg-white border border-gray-200 rounded-md shadow-lg min-w-[200px]">
                    <div className="p-2">
                      <button
                        onClick={() => handleFolderSelect(item.id, null)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center space-x-2"
                      >
                        <div className="w-3 h-3 rounded bg-gray-300" />
                        <span>No Folder</span>
                      </button>
                      {folders.map((folder) => (
                        <button
                          key={folder.id}
                          onClick={() => handleFolderSelect(item.id, folder.id)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center space-x-2"
                        >
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: folder.color }}
                          />
                          <span>{folder.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteDiaryEntry(entry.id);
                }}
                className="p-1 text-gray-400 hover:text-red-600 rounded"
                title="Delete diary entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      );
    }
  };

  const tabs = [
    { id: "all", label: "All", icon: Clock },
    { id: "today", label: "Today", icon: CalendarIcon },
    { id: "diaries", label: "Diaries", icon: BookOpen },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
  ];

  return (
    <>
      <style>{`
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      <div className="w-full">
        {/* Header with tabs */}
        <div className="mb-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* NEW: Simplified Sort Controls for Tasks Tab */}
          {activeTab === "tasks" && (
            <div className="mt-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Sort Dropdown */}
                  <FilterDropdown
                    label="Sort by"
                    value={taskSort.by}
                    options={sortOptions}
                    onChange={(value) =>
                      setTaskSort((prev) => ({
                        ...prev,
                        by: value as FilterBy,
                      }))
                    }
                  />
                  
                  {/* Sort Order Toggle */}
                  <button
                    onClick={() =>
                      setTaskSort((prev) => ({
                        ...prev,
                        order: prev.order === "asc" ? "desc" : "asc",
                      }))
                    }
                    className="px-3 py-1.5 border border-gray-300 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-50 flex items-center space-x-1"
                    title={`Sort ${taskSort.order === "asc" ? "ascending" : "descending"}`}
                  >
                    {taskSort.order === "asc" ? (
                      <SortAsc className="w-4 h-4" />
                    ) : (
                      <SortDesc className="w-4 h-4" />
                    )}
                    <span className="text-xs">
                      {taskSort.order === "asc" ? "Asc" : "Desc"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feed content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems().length > 0 ? (
              filteredItems().map(renderFeedItem)
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  {activeTab === "today" ? (
                    <CalendarIcon className="w-12 h-12 mx-auto" />
                  ) : activeTab === "diaries" ? (
                    <BookOpen className="w-12 h-12 mx-auto" />
                  ) : activeTab === "tasks" ? (
                    <CheckSquare className="w-12 h-12 mx-auto" />
                  ) : (
                    <Clock className="w-12 h-12 mx-auto" />
                  )}
                </div>
                <p className="text-gray-500">
                  {isCustomSort ? (
                    <>No tasks match current sorting</>
                  ) : (
                    <>
                      {activeTab === "today"
                        ? "No items for today"
                        : activeTab === "diaries"
                        ? "No diary entries yet"
                        : activeTab === "tasks"
                        ? "No tasks yet"
                        : "No items yet"}
                    </>
                  )}
                </p>
                {isCustomSort ? (
                  <button
                    onClick={resetSort}
                    className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                  >
                    Reset sorting
                  </button>
                ) : (
                  <p className="text-sm text-gray-400 mt-2">
                    Create your first{" "}
                    {activeTab === "diaries"
                      ? "diary entry"
                      : activeTab === "tasks"
                      ? "task"
                      : "item"}{" "}
                    to get started
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Floating action buttons */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col space-y-3">
        <button
          onClick={() => setShowNewDiaryModal(true)}
          className="w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110"
          title="New Diary Entry"
        >
          <BookOpen className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={() => setShowNewTaskModal(true)}
          className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110"
          title="New Task"
        >
          <AlarmClockCheck className="w-6 h-6 text-white" />
        </button>
      </div>
      {/* Task Creation Modal */}
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
              {[1, 2, 3].map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => handleTaskPriorityChange(priority)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                    newTask.priority === priority
                      ? priority === 1
                        ? "bg-green-100 border-green-500 text-green-700"
                        : priority === 2
                        ? "bg-yellow-100 border-yellow-500 text-yellow-700"
                        : "bg-red-100 border-red-500 text-red-700"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {priority === 1 ? "Low" : priority === 2 ? "Medium" : "High"}
                </button>
              ))}
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

      {/* Diary Creation Modal */}
      <Modal
        isOpen={showNewDiaryModal}
        onClose={() => setShowNewDiaryModal(false)}
        title={`New Diary Entry - ${new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`}
      >
        <div className="space-y-4">
          <textarea
            value={newDiaryContent}
            onChange={(e) => setNewDiaryContent(e.target.value)}
            placeholder="Title

Write your diary entry here. Use **bold** for bold text and *italic* for italic text."
            className="w-full border border-gray-300 rounded-md px-3 py-3 h-80 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <div className="text-xs text-gray-500">
            First line becomes your title. Use **bold** and *italic* for
            formatting.
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setShowNewDiaryModal(false)}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateDiaryEntry}
              disabled={!newDiaryContent.trim()}
              className="flex-1 bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              Create Entry
            </button>
          </div>
        </div>
      </Modal>

      {/* Diary Edit Modal */}
      <Modal
        isOpen={showEditDiaryModal}
        onClose={() => {
          setShowEditDiaryModal(false);
          setEditingDiary(null);
          setEditDiaryContent("");
        }}
        title={
          editingDiary
            ? `Edit Entry - ${editingDiary.title || "Untitled"}`
            : "Edit Entry"
        }
      >
        <div className="space-y-4">
          <textarea
            value={editDiaryContent}
            onChange={(e) => setEditDiaryContent(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-3 h-80 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <div className="text-xs text-gray-500">
            First line becomes your title. Use **bold** and *italic* for
            formatting.
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => {
                setShowEditDiaryModal(false);
                setEditingDiary(null);
                setEditDiaryContent("");
              }}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEditDiary}
              disabled={!editDiaryContent.trim()}
              className="flex-1 bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* NEW: Schedule Entry Modal */}
      <DateTimePickerModal
        isOpen={showSchedulePicker}
        onClose={() => {
          setShowSchedulePicker(false);
          setEntryToSchedule(null);
        }}
        onSave={handleSaveSchedule}
        onClear={handleClearSchedule}
        currentDateTime={entryToSchedule?.scheduled_date}
        entryTitle={entryToSchedule?.title || "Diary Entry"}
      />
    </>
  );
};

export default FeedView;