// Fixed frontend/src/components/FeedView.tsx - Dark Mode Version

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Plus,
  Calendar as CalendarIcon,
  CheckSquare,
  BookOpen,
  Scroll,
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
  ChevronRight,
  RotateCcw,
  SortAsc,
  SortDesc,
  MoreVertical,
  ChevronLeft,
} from "lucide-react";
import { Task, DiaryEntry, Quest, FolderType, NewTask, NewDiaryEntry, NewQuest } from "../types";
import { Modal, TaskCard, DiaryViewModal, QuestCard, QuestViewModal } from "./";

interface FeedViewProps {
  tasks: Task[];
  diaryEntries: DiaryEntry[];
  quests: Quest[];
  folders: FolderType[];
  loading: boolean;
  onCreateTask: (taskData: any) => Promise<void>;
  onCreateDiaryEntry: (content: string) => Promise<void>;
  onCreateQuest: (questData: any) => Promise<void>;
  onToggleTaskStatus: (task: Task) => Promise<void>;
  onUpdateTask: (taskId: number, updates: any) => Promise<void>;
  onDeleteTask: (taskId: number) => Promise<void>;
  onUpdateDiaryEntry: (id: number, content: string) => Promise<void>;
  onDeleteDiaryEntry: (id: number) => Promise<void>;
  onUpdateDiaryEntryFolder: (
    id: number,
    folderId: number | null
  ) => Promise<void>;
  onUpdateQuest: (questId: number, updates: any) => Promise<void>;
  onDeleteQuest: (questId: number) => Promise<void>;
  onAddQuestParagraph: (questId: number, content: string) => Promise<void>;
  onUpdateQuestParagraph: (questId: number, paragraphId: number, content: string) => Promise<void>;
  onDeleteQuestParagraph: (questId: number, paragraphId: number) => Promise<void>;
  onCreateSubtask?: (parentTaskId: number) => void;
  onScheduleDiaryEntry?: (id: number, scheduledDate: string) => Promise<void>;
  onUnscheduleDiaryEntry?: (id: number) => Promise<void>;
}

type FeedItem = {
  id: string;
  type: "task" | "diary" | "quest";
  data: Task | DiaryEntry | Quest;
  created_at: string;
  due_date?: string;
  scheduled_date?: string;
};

type TabType = "all" | "today" | "diaries" | "tasks" | "quests";

type FilterBy = "priority" | "created_at" | "due_date";
type SortOrder = "asc" | "desc";

interface TaskSort {
  by: FilterBy;
  order: SortOrder;
}

// Enhanced Diary Action Dropdown Component with Folder Submenu
const DiaryActionDropdown: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onSchedule: () => void;
  onFolderSelect: (folderId: number | null) => void;
  onDelete: () => void;
  isScheduled: boolean;
  folders: FolderType[];
  currentFolderId: number | null;
}> = ({ 
  isOpen, 
  onClose, 
  onEdit, 
  onSchedule, 
  onFolderSelect, 
  onDelete, 
  isScheduled, 
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
      <div className="absolute top-8 right-0 z-50 bg-gray-800 border border-gray-600 rounded-md shadow-xl min-w-[180px] py-1">
        <button
          onClick={() => {
            onEdit();
            onClose();
          }}
          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
        >
          <Edit className="w-4 h-4" />
          <span>Edit Entry</span>
        </button>
        
        <button
          onClick={() => {
            onSchedule();
            onClose();
          }}
          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
        >
          <CalendarIcon className="w-4 h-4" />
          <span>{isScheduled ? "Reschedule" : "Schedule"}</span>
        </button>
        
        {/* Folder selection with hover submenu */}
        <div 
          className="relative"
          onMouseEnter={() => setShowFolderSubmenu(true)}
          onMouseLeave={() => setShowFolderSubmenu(false)}
        >
          <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FolderPlus className="w-4 h-4" />
              <span>Change Folder</span>
            </div>
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          {/* Folder submenu */}
          {showFolderSubmenu && (
            <div className="absolute top-0 right-full ml-1 z-60 bg-gray-800 border border-gray-600 rounded-md shadow-xl min-w-[200px] py-1">
              <button
                onClick={() => {
                  onFolderSelect(null);
                  onClose();
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 flex items-center space-x-2 ${
                  currentFolderId === null ? 'bg-blue-900 text-blue-300' : 'text-gray-300'
                }`}
              >
                <div className="w-3 h-3 rounded bg-gray-500" />
                <span>No Folder</span>
                {currentFolderId === null && <span className="ml-auto text-blue-400">✓</span>}
              </button>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => {
                    onFolderSelect(folder.id);
                    onClose();
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 flex items-center space-x-2 ${
                    currentFolderId === folder.id ? 'bg-blue-900 text-blue-300' : 'text-gray-300'
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: folder.color }}
                  />
                  <span>{folder.name}</span>
                  {currentFolderId === folder.id && <span className="ml-auto text-blue-400">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <hr className="my-1 border-gray-600" />
        
        <button
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 flex items-center space-x-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Entry</span>
        </button>
      </div>
    </>
  );
};

// Filter Dropdown Component
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
            ? "bg-blue-900 border-blue-600 text-blue-300" 
            : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
        }`}
      >
        {icon && <span className="text-gray-400">{icon}</span>}
        <span>{selectedOption?.label || label}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen && (
        <div className="absolute top-8 left-0 z-10 bg-gray-800 border border-gray-600 rounded-md shadow-lg min-w-[160px]">
          <div className="p-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-700 flex items-center space-x-2 ${
                  value === option.value ? "bg-blue-900 text-blue-300" : "text-gray-300"
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

// Date/Time Picker Modal for Diary Scheduling
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
            className="absolute inset-0 bg-black opacity-75"
            onClick={onClose}
          ></div>
        </div>
        <div className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
          <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-white">
                Schedule Diary Entry
              </h3>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-300 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-3">
                Schedule "{entryTitle}" to appear on the calendar
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full border border-gray-600 bg-gray-700 text-white rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full border border-gray-600 bg-gray-700 text-white rounded-md px-3 py-2"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              {currentDateTime && onClear && (
                <button
                  onClick={handleClear}
                  className="flex-1 border border-gray-600 text-gray-300 py-2 rounded-md hover:bg-gray-700"
                >
                  Unschedule
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 border border-gray-600 text-gray-300 py-2 rounded-md hover:bg-gray-700"
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
  quests,
  folders,
  loading,
  onCreateTask,
  onCreateDiaryEntry,
  onCreateQuest,
  onToggleTaskStatus,
  onUpdateTask,
  onDeleteTask,
  onUpdateDiaryEntry,
  onDeleteDiaryEntry,
  onUpdateDiaryEntryFolder,
  onUpdateQuest,
  onDeleteQuest,
  onAddQuestParagraph,
  onUpdateQuestParagraph,
  onDeleteQuestParagraph,
  onCreateSubtask,
  onScheduleDiaryEntry,
  onUnscheduleDiaryEntry,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showNewDiaryModal, setShowNewDiaryModal] = useState(false);
  const [showNewQuestModal, setShowNewQuestModal] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showFolderSelect, setShowFolderSelect] = useState<string | null>(null);
  const [editingDiary, setEditingDiary] = useState<DiaryEntry | null>(null);
  const [showEditDiaryModal, setShowEditDiaryModal] = useState(false);
  const [editDiaryContent, setEditDiaryContent] = useState("");

  // Quest modal states
  const [showQuestViewModal, setShowQuestViewModal] = useState(false);
  const [viewingQuest, setViewingQuest] = useState<Quest | null>(null);

  // Simplified Filter State
  const [taskSort, setTaskSort] = useState<TaskSort>({
    by: "created_at",
    order: "desc",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Scheduling state
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [entryToSchedule, setEntryToSchedule] = useState<DiaryEntry | null>(
    null
  );

  // Dropdown states
  const [showActionDropdown, setShowActionDropdown] = useState<string | null>(null);

  // Diary view modal state
  const [showDiaryViewModal, setShowDiaryViewModal] = useState(false);
  const [viewingDiary, setViewingDiary] = useState<DiaryEntry | null>(null);

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

  // Quest creation state
  const [newQuest, setNewQuest] = useState<NewQuest>({
    title: "",
    paragraphs: [],
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFolderSelect || showActionDropdown) {
        const target = event.target as Element;
        if (target && !target.closest('.folder-dropdown-container') && !target.closest('.action-dropdown-container')) {
          setShowFolderSelect(null);
          setShowActionDropdown(null);
        }
      }
    };

    if (showFolderSelect || showActionDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showFolderSelect, showActionDropdown]);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  // Helper functions for sorting only
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

  // Helper function to get folder by ID
  const getFolderById = useCallback((folderId: number | null | undefined): FolderType | null => {
    if (!folderId || !folders || folders.length === 0) return null;
    return folders.find(folder => folder.id === folderId) || null;
  }, [folders]);

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

    // Add quests to feed
    quests.forEach((quest) => {
      feedItems.push({
        id: `quest-${quest.id}`,
        type: "quest",
        data: quest,
        created_at: quest.created_at,
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
  }, [tasks, diaryEntries, quests, activeTab, sortTasks]);

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
      case "quests":
        return allItems.filter((item) => item.type === "quest");
      default:
        return allItems;
    }
  }, [createFeedItems, activeTab, today]);

  // Simplified filter options
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

  // Helper function to format scheduled time
  const formatScheduledTime = (scheduledDate: string) => {
    const date = new Date(scheduledDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    if (isToday) {
      return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isTomorrow) {
      return `Tomorrow ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
  };

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

  // Quest handlers
  const handleQuestTitleChange = useCallback((value: string) => {
    setNewQuest((prev) => ({ ...prev, title: value.slice(0, 200) }));
  }, []);

  const handleCreateQuest = async () => {
    try {
      if (!newQuest.title.trim()) return;

      const questData = {
        title: newQuest.title.trim(),
        folder_id: null,
        paragraphs: [],
      };

      await onCreateQuest(questData);

      setNewQuest({
        title: "",
        paragraphs: [],
      });
      setShowNewQuestModal(false);
    } catch (error) {
      console.error("Error creating quest:", error);
    }
  };

  // Handle quest viewing
  const handleViewQuest = (quest: Quest) => {
    setViewingQuest(quest);
    setShowQuestViewModal(true);
  };

  // Handle diary viewing
  const handleViewDiary = (entry: DiaryEntry) => {
    setViewingDiary(entry);
    setShowDiaryViewModal(true);
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

  // Handle folder assignment for diary entries
  const handleFolderSelect = async (
    itemId: string,
    folderId: number | null
  ) => {
    try {
      const [type, id] = itemId.split("-");
      if (type === "diary") {
        await onUpdateDiaryEntryFolder(parseInt(id), folderId);
      } else if (type === "task") {
        await onUpdateTask(parseInt(id), { folder_id: folderId });
      } else if (type === "quest") {
        await onUpdateQuest(parseInt(id), { folder_id: folderId });
      }
      setShowFolderSelect(null);
    } catch (error) {
      console.error("Error updating folder:", error);
    }
  };

  // Handle folder assignment for diary modal
  const handleDiaryFolderSelect = async (
    entryId: number,
    folderId: number | null
  ) => {
    try {
      await onUpdateDiaryEntryFolder(entryId, folderId);
    } catch (error) {
      console.error("Error updating diary folder:", error);
    }
  };

  // Handle folder assignment for quest modal
  const handleQuestFolderSelect = async (
    questId: number,
    folderId: number | null
  ) => {
    try {
      await onUpdateQuest(questId, { folder_id: folderId });
    } catch (error) {
      console.error("Error updating quest folder:", error);
    }
  };

  // Diary scheduling handlers
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
        return "text-red-400";
      case 2:
        return "text-yellow-400";
      case 1:
        return "text-green-400";
      default:
        return "text-gray-400";
    }
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
      
      // FIXED: Always get folder regardless of current filter state
      const currentFolder = getFolderById(task.folder_id);
  
      return (
        <div key={item.id} className="space-y-2">
          {/* Feed context header - ALWAYS show if task has folder */}
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <div className="flex items-center space-x-2">
              {/* FIXED: Always show folder indicator if task has folder */}
              {currentFolder && (
                <div className="flex items-center space-x-1">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: currentFolder.color }}
                  />
                  <span className="text-xs text-gray-300 font-medium">
                    {currentFolder.name}
                  </span>
                </div>
              )}
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
  
          {/* FIXED: Always apply folder styling if task has folder */}
          <div 
            className="bg-gray-800 rounded-lg shadow-sm border border-gray-600 hover:shadow-md transition-all cursor-pointer"
            style={currentFolder ? {
              borderLeft: `4px solid ${currentFolder.color}`,
              backgroundColor: `${currentFolder.color}08`,
            } : {}}
          >
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
              folders={folders}
            />
          </div>
        </div>
      );
    } else if (item.type === "quest") {
      const quest = item.data as Quest;
      
      // FIXED: Always get folder regardless of current filter state
      const currentFolder = getFolderById(quest.folder_id);
  
      return (
        <div key={item.id} className="space-y-2">
          {/* Feed context header - ALWAYS show if quest has folder */}
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <div className="flex items-center space-x-2">
              {/* FIXED: Always show folder indicator if quest has folder */}
              {currentFolder && (
                <div className="flex items-center space-x-1">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: currentFolder.color }}
                  />
                  <span className="text-xs text-gray-300 font-medium">
                    {currentFolder.name}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>
                {new Date(quest.created_at).toLocaleDateString()}{" "}
                {new Date(quest.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
  
          {/* FIXED: Always apply folder styling if quest has folder */}
          <div 
            className="bg-gray-800 rounded-lg shadow-sm border border-gray-600 hover:shadow-md transition-all cursor-pointer"
            style={currentFolder ? {
              borderLeft: `4px solid ${currentFolder.color}`,
              backgroundColor: `${currentFolder.color}08`,
            } : {}}
            onClick={() => handleViewQuest(quest)}
          >
            <QuestCard
              quest={quest}
              folders={folders}
              onUpdateQuest={onUpdateQuest}
              onDeleteQuest={onDeleteQuest}
              onAddParagraph={onAddQuestParagraph}
              onUpdateParagraph={onUpdateQuestParagraph}
              onDeleteParagraph={onDeleteQuestParagraph}
            />
          </div>
        </div>
      );
    } else {
      const entry = item.data as DiaryEntry;
      
      // FIXED: Always get folder regardless of current filter state
      const currentFolder = getFolderById((entry as any).folder_id);
  
      return (
        <div key={item.id} className="space-y-2">
          {/* Feed context header - ALWAYS show if entry has folder */}
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <div className="flex items-center space-x-2">
              {/* FIXED: Always show folder indicator if entry has folder */}
              {currentFolder && (
                <div className="flex items-center space-x-1">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: currentFolder.color }}
                  />
                  <span className="text-xs text-gray-300 font-medium">
                    {currentFolder.name}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-1">
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

          <div
            className="bg-gray-800 rounded-lg shadow-sm border border-gray-600 hover:shadow-md transition-all cursor-pointer"
            style={currentFolder ? {
              borderLeft: `4px solid ${currentFolder.color}`,
              backgroundColor: `${currentFolder.color}08`,
            } : {}}
            onClick={() => handleViewDiary(entry)}
          >
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium text-purple-300">
                        Diary Entry
                      </span>
                      {/* FIXED: Always show folder indicator if entry has folder */}
                      {currentFolder && (
                        <div className="flex items-center space-x-2 bg-gray-700/80 backdrop-blur-sm px-2 py-1 rounded-full border border-gray-600">
                          <div
                            className="w-3 h-3 rounded-full border border-gray-500 shadow-sm"
                            style={{ backgroundColor: currentFolder.color }}
                          />
                          <span className="text-xs text-gray-300 font-medium">
                            {currentFolder.name}
                          </span>
                        </div>
                      )}
                    </div>
    
                    {/* Schedule indicator and action dropdown in top right */}
                    <div className="flex items-center space-x-2">
                      {/* Scheduling indicator */}
                      {entry.is_scheduled && entry.scheduled_date && (
                        <div className="flex items-center space-x-1 text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded-full">
                          <Clock className="w-3 h-3" />
                          <span>{formatScheduledTime(entry.scheduled_date)}</span>
                        </div>
                      )}
    
                      {/* Action dropdown */}
                      <div className="relative action-dropdown-container">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowActionDropdown(
                              showActionDropdown === item.id ? null : item.id
                            );
                          }}
                          className="p-1 text-gray-400 hover:text-gray-300 rounded"
                          title="More actions"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
    
                        {showActionDropdown === item.id && (
                          <DiaryActionDropdown
                            isOpen={true}
                            onClose={() => setShowActionDropdown(null)}
                            onEdit={() => handleEditDiary(entry)}
                            onSchedule={() => handleScheduleEntry(entry)}
                            onFolderSelect={(folderId) => handleFolderSelect(item.id, folderId)}
                            onDelete={() => onDeleteDiaryEntry(entry.id)}
                            isScheduled={entry.is_scheduled}
                            folders={folders}
                            currentFolderId={(entry as any).folder_id || null}
                          />
                        )}
                      </div>
                    </div>
                  </div>
    
                  {entry.title && (
                    <h3 className="font-medium text-lg text-white mb-2">
                      {entry.title}
                    </h3>
                  )}
    
                  <div className="text-gray-300 mb-2">
                    {isExpanded ? (
                      <div
                        className="prose prose-sm max-w-none prose-invert"
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
                </div>
              </div>
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
    { id: "quests", label: "Quests", icon: Scroll },
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
          <div className="flex space-x-1 bg-gray-700 rounded-lg p-1">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-gray-800 text-white shadow-sm"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Simplified Sort Controls for Tasks Tab */}
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
                    className="px-3 py-1.5 border border-gray-600 rounded text-gray-300 hover:text-white hover:bg-gray-700 flex items-center space-x-1"
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
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
                  ) : activeTab === "quests" ? (
                    <Scroll className="w-12 h-12 mx-auto" />
                  ) : (
                    <Clock className="w-12 h-12 mx-auto" />
                  )}
                </div>
                <p className="text-gray-400">
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
                        : activeTab === "quests"
                        ? "No quests yet"
                        : "No items yet"}
                    </>
                  )}
                </p>
                {isCustomSort ? (
                  <button
                    onClick={resetSort}
                    className="text-blue-400 hover:text-blue-300 text-sm mt-2"
                  >
                    Reset sorting
                  </button>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">
                    Create your first{" "}
                    {activeTab === "diaries"
                      ? "diary entry"
                      : activeTab === "tasks"
                      ? "task"
                      : activeTab === "quests"
                      ? "quest"
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
          onClick={() => setShowNewQuestModal(true)}
          className="w-14 h-14 rounded-full bg-orange-600 hover:bg-orange-700 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110"
          title="New Quest"
        >
          <Scroll className="w-6 h-6 text-white" />
        </button>
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
            className="w-full border border-gray-600 bg-gray-700 text-white rounded-md px-3 py-2"
          />
          <textarea
            placeholder="Description (optional)"
            value={newTask.description}
            onChange={(e) => handleTaskDescriptionChange(e.target.value)}
            className="w-full border border-gray-600 bg-gray-700 text-white rounded-md px-3 py-2 h-24"
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
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
                        ? "bg-green-900 border-green-500 text-green-300"
                        : priority === 2
                        ? "bg-yellow-900 border-yellow-500 text-yellow-300"
                        : "bg-red-900 border-red-500 text-red-300"
                      : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
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
            className="w-full border border-gray-600 bg-gray-700 text-white rounded-md px-3 py-2"
          />
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={newTask.is_calendar_event}
              onChange={(e) => handleTaskCalendarEventChange(e.target.checked)}
              className="rounded border-gray-600 bg-gray-700"
            />
            <span className="text-sm text-gray-300">Add to Google Calendar</span>
          </label>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowNewTaskModal(false)}
              className="flex-1 border border-gray-600 text-gray-300 py-2 rounded-md hover:bg-gray-700"
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

      {/* Quest Creation Modal */}
      <Modal
        isOpen={showNewQuestModal}
        onClose={() => setShowNewQuestModal(false)}
        title="Create New Quest"
      >
        <div className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Quest title (max 200 characters)"
              value={newQuest.title}
              onChange={(e) => handleQuestTitleChange(e.target.value)}
              className="w-full border border-gray-600 bg-gray-700 text-white rounded-md px-3 py-2"
              maxLength={200}
            />
            <p className="text-xs text-gray-400 mt-1">
              {newQuest.title.length}/200 characters
            </p>
          </div>

          <div className="text-xs text-gray-400">
            You can add paragraphs to your quest after creating it.
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setShowNewQuestModal(false)}
              className="flex-1 border border-gray-600 text-gray-300 py-2 rounded-md hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateQuest}
              disabled={!newQuest.title.trim() || newQuest.title.length > 200}
              className="flex-1 bg-orange-600 text-white py-2 rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              Create Quest
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
            className="w-full border border-gray-600 bg-gray-700 text-white rounded-md px-3 py-3 h-80 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <div className="text-xs text-gray-400">
            First line becomes your title. Use **bold** and *italic* for
            formatting.
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setShowNewDiaryModal(false)}
              className="flex-1 border border-gray-600 text-gray-300 py-2 rounded-md hover:bg-gray-700"
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
            className="w-full border border-gray-600 bg-gray-700 text-white rounded-md px-3 py-3 h-80 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <div className="text-xs text-gray-400">
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
              className="flex-1 border border-gray-600 text-gray-300 py-2 rounded-md hover:bg-gray-700"
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

      {/* Schedule Entry Modal */}
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

      {/* Diary View Modal */}
      <DiaryViewModal
        isOpen={showDiaryViewModal}
        onClose={() => {
          setShowDiaryViewModal(false);
          setViewingDiary(null);
        }}
        entry={viewingDiary}
        folders={folders}
        onEdit={handleEditDiary}
        onSchedule={handleScheduleEntry}
        onFolderSelect={handleDiaryFolderSelect}
        onDelete={onDeleteDiaryEntry}
      />

      {/* Quest View Modal */}
      <QuestViewModal
        isOpen={showQuestViewModal}
        onClose={() => {
          setShowQuestViewModal(false);
          setViewingQuest(null);
        }}
        quest={viewingQuest}
        folders={folders}
        onEdit={() => {}} // Quest editing is handled inline in the modal
        onFolderSelect={handleQuestFolderSelect}
        onDelete={onDeleteQuest}
        onAddParagraph={onAddQuestParagraph}
        onUpdateParagraph={onUpdateQuestParagraph}
        onDeleteParagraph={onDeleteQuestParagraph}
      />
    </>
  );
};

export default FeedView;