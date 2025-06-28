// Fixed frontend/src/components/CalendarView.tsx - Compatible with folder visual indicator fix

import React, { useState, useCallback, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  BookOpen,
  CheckSquare,
  Calendar as CalendarIcon,
  CalendarDays,
  Scroll,
} from "lucide-react";
import { Task, DiaryEntry, Quest, FolderType } from "../types";
import { TaskViewModal, DiaryViewModal, QuestViewModal } from "./";

interface CalendarViewProps {
  tasks: Task[];
  diaryEntries?: DiaryEntry[];
  quests?: Quest[];
  folders: FolderType[];
  onToggleTaskStatus: (task: Task) => Promise<void>;
  onEditTask: (task: Task) => void;
  onScheduleTask: (taskId: number, updates: any) => Promise<void>;
  onUpdateTaskFolder: (
    taskId: number,
    folderId: number | null
  ) => Promise<void>;
  onDeleteTask: (taskId: number) => Promise<void>;
  onCreateSubtask: (parentTaskId: number) => Promise<void>;
  onEditDiary: (entry: DiaryEntry) => void;
  onScheduleDiary: (id: number, scheduledDate: string) => Promise<void>;
  onUpdateDiaryFolder: (id: number, folderId: number | null) => Promise<void>;
  onDeleteDiary: (id: number) => Promise<void>;
  onEditQuest: (quest: Quest) => void;
  onUpdateQuestFolder: (
    questId: number,
    folderId: number | null
  ) => Promise<void>;
  onDeleteQuest: (questId: number) => Promise<void>;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  diaryEntries = [],
  quests = [],
  folders,
  onToggleTaskStatus,
  onEditTask,
  onScheduleTask,
  onUpdateTaskFolder,
  onDeleteTask,
  onCreateSubtask,
  onEditDiary,
  onScheduleDiary,
  onUpdateDiaryFolder,
  onDeleteDiary,
  onEditQuest,
  onUpdateQuestFolder,
  onDeleteQuest,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayDate, setSelectedDayDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"day" | "month">("day");

  // Modal states for task, diary, and quest popups
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedDiary, setSelectedDiary] = useState<DiaryEntry | null>(null);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);

  // ADDED: Optimized folder lookup with memoization (same as FeedView fix)
  const folderMap = useMemo(() => {
    const map = new Map<number, FolderType>();
    folders.forEach(folder => map.set(folder.id, folder));
    return map;
  }, [folders]);

  const getFolderById = useCallback((id: number | null | undefined): FolderType | null => {
    if (!id) return null;
    return folderMap.get(id) || null;
  }, [folderMap]);

  // ADDED: Unified folder ID accessor (same as FeedView fix)
  const getFolderId = useCallback((entity: any): number | null => {
    return entity?.folder_id || null;
  }, []);

  // ADDED: Folder styling calculator (same as FeedView fix)
  const getFolderStyling = useCallback((folderId: number | null) => {
    const folder = getFolderById(folderId);
    if (!folder) {
      return {
        folderData: null,
        folderStyle: {},
        className: "",
      };
    }

    return {
      folderData: folder,
      folderStyle: {
        borderLeft: `4px solid ${folder.color}`,
        backgroundColor: `${folder.color}08`,
      },
      className: "has-folder",
    };
  }, [getFolderById]);

  // FIXED: Proper date comparison functions
  const isSameDate = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const getDateString = (date: Date): string => {
    // Use local date string in YYYY-MM-DD format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  // FIXED: Proper date comparison for tasks
  const getTasksForDate = (date: Date) => {
    if (!date) return [];
    const dateStr = getDateString(date);

    return tasks.filter((task) => {
      if (!task.due_date || task.parent_task_id) return false;

      // Parse the task due date and compare dates properly
      const taskDate = new Date(task.due_date);
      const taskDateStr = getDateString(taskDate);

      return taskDateStr === dateStr;
    });
  };

  // FIXED: Proper date comparison for diary entries
  const getDiaryEntriesForDate = (date: Date) => {
    if (!date) return [];
    const dateStr = getDateString(date);

    return diaryEntries.filter((entry) => {
      if (!entry.is_scheduled || !entry.scheduled_date) return false;

      // Parse the scheduled date and compare dates properly
      const scheduledDate = new Date(entry.scheduled_date);
      const scheduledDateStr = getDateString(scheduledDate);

      return scheduledDateStr === dateStr;
    });
  };

  // FIXED: Proper date comparison for quests
  const getQuestsForDate = (date: Date) => {
    if (!date) return [];
    const dateStr = getDateString(date);

    return quests.filter((quest) => {
      if (!quest.created_at) return false;

      // Parse the creation date and compare dates properly
      const createdDate = new Date(quest.created_at);
      const createdDateStr = getDateString(createdDate);

      return createdDateStr === dateStr;
    });
  };

  const getItemsForDate = (date: Date) => {
    const tasksForDay = getTasksForDate(date);
    const diaryEntriesForDay = getDiaryEntriesForDate(date);
    const questsForDay = getQuestsForDate(date);

    return [
      ...tasksForDay.map((task) => ({ type: "task" as const, item: task })),
      ...diaryEntriesForDay.map((entry) => ({
        type: "diary" as const,
        item: entry,
      })),
      ...questsForDay.map((quest) => ({
        type: "quest" as const,
        item: quest,
      })),
    ];
  };

  // Navigation functions for selected day
  const navigateDay = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDayDate);
    if (direction === "prev") {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDayDate(newDate);
  };

  // Get formatted date string for selected day
  const getFormattedDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDate(date, today)) {
      return "Today";
    } else if (isSameDate(date, tomorrow)) {
      return "Tomorrow";
    } else if (isSameDate(date, yesterday)) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  // Handle item clicks - show appropriate modals
  const handleTaskClick = (task: Task, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent calendar cell click
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleDiaryClick = (entry: DiaryEntry, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent calendar cell click
    setSelectedDiary(entry);
    setShowDiaryModal(true);
  };

  const handleQuestClick = (quest: Quest, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent calendar cell click
    setSelectedQuest(quest);
    setShowQuestModal(true);
  };

  // Modal handlers
  const handleTaskModalClose = () => {
    setShowTaskModal(false);
    setSelectedTask(null);
  };

  const handleDiaryModalClose = () => {
    setShowDiaryModal(false);
    setSelectedDiary(null);
  };

  const handleQuestModalClose = () => {
    setShowQuestModal(false);
    setSelectedQuest(null);
  };

  // Task modal action handlers
  const handleTaskEdit = (task: Task) => {
    onEditTask(task);
    handleTaskModalClose();
  };

  const handleTaskSchedule = (task: Task) => {
    // This would open a scheduling modal - for now just close the view modal
    handleTaskModalClose();
  };

  const handleTaskFolderChange = (taskId: number, folderId: number | null) => {
    onUpdateTaskFolder(taskId, folderId);
  };

  const handleTaskDelete = (taskId: number) => {
    onDeleteTask(taskId);
    handleTaskModalClose();
  };

  // Diary modal action handlers
  const handleDiaryEdit = (entry: DiaryEntry) => {
    onEditDiary(entry);
    handleDiaryModalClose();
  };

  const handleDiarySchedule = (entry: DiaryEntry) => {
    // This would open a scheduling modal - for now just close the view modal
    handleDiaryModalClose();
  };

  const handleDiaryFolderChange = (
    entryId: number,
    folderId: number | null
  ) => {
    onUpdateDiaryFolder(entryId, folderId);
  };

  const handleDiaryDelete = (entryId: number) => {
    onDeleteDiary(entryId);
    handleDiaryModalClose();
  };

  // Quest modal action handlers
  const handleQuestEdit = (quest: Quest) => {
    onEditQuest(quest);
    handleQuestModalClose();
  };

  const handleQuestFolderChange = (
    questId: number,
    folderId: number | null
  ) => {
    onUpdateQuestFolder(questId, folderId);
  };

  const handleQuestDelete = (questId: number) => {
    onDeleteQuest(questId);
    handleQuestModalClose();
  };

  // Render individual item in day feed
  const renderDayFeedItem = (item: {
    type: "task" | "diary" | "quest";
    item: Task | DiaryEntry | Quest;
  }) => {
    if (item.type === "task") {
      const task = item.item as Task;
      
      // FIXED: Use optimized folder styling function
      const taskFolderId = getFolderId(task);
      const { folderData } = getFolderStyling(taskFolderId);

      return (
        <div
          key={`task-${task.id}`}
          className="flex items-center space-x-4 p-4 bg-blue-900/20 rounded-lg border border-blue-600/30 hover:bg-blue-900/30 transition-colors cursor-pointer"
          onClick={(e) => handleTaskClick(task, e)}
        >
          <div
            className={`w-3 h-3 rounded-full ${
              task.status === "completed" ? "bg-green-400" : "bg-blue-400"
            }`}
          />
          <CheckSquare className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h4
                className={`font-medium text-lg ${
                  task.status === "completed"
                    ? "line-through text-gray-500"
                    : "text-white"
                }`}
              >
                {task.title}
              </h4>
              {folderData && (
                <span
                  className="inline-block px-2 py-1 text-xs font-medium rounded-full text-white"
                  style={{ backgroundColor: folderData.color }}
                >
                  {folderData.name}
                </span>
              )}
            </div>
            {task.due_date && (
              <p className="text-sm text-blue-300 font-medium">
                {new Date(task.due_date).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
            )}
            {task.description && (
              <p className="text-sm text-gray-300 mt-2">{task.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleTaskStatus(task);
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                task.status === "completed"
                  ? "bg-green-900/30 text-green-300 hover:bg-green-900/50"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {task.status === "completed" ? "✓ Done" : "Mark Done"}
            </button>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                task.priority === 3
                  ? "bg-red-900/30 text-red-300"
                  : task.priority === 2
                  ? "bg-yellow-900/30 text-yellow-300"
                  : "bg-green-900/30 text-green-300"
              }`}
            >
              {task.priority === 3
                ? "High"
                : task.priority === 2
                ? "Medium"
                : "Low"}
            </div>
          </div>
        </div>
      );
    } else if (item.type === "quest") {
      const quest = item.item as Quest;
      
      // FIXED: Use optimized folder styling function
      const questFolderId = getFolderId(quest);
      const { folderData } = getFolderStyling(questFolderId);
      
      // Safe access to quest properties with fallbacks
      const questParagraphs = quest.paragraphs || [];
      const questTitle = quest.title || "Untitled Quest";

      return (
        <div
          key={`quest-${quest.id}`}
          className="flex items-center space-x-4 p-4 bg-orange-900/20 rounded-lg border border-orange-600/30 hover:bg-orange-900/30 transition-colors cursor-pointer"
          onClick={(e) => handleQuestClick(quest, e)}
        >
          <div className="w-3 h-3 rounded-full bg-orange-400" />
          <Scroll className="w-5 h-5 text-orange-400 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-lg text-white">{questTitle}</h4>
              {folderData && (
                <span
                  className="inline-block px-2 py-1 text-xs font-medium rounded-full text-white"
                  style={{ backgroundColor: folderData.color }}
                >
                  {folderData.name}
                </span>
              )}
            </div>
            <p className="text-sm text-orange-300 font-medium">
              📝 {questParagraphs.length} paragraph
              {questParagraphs.length !== 1 ? "s" : ""}
            </p>
            {questParagraphs.length > 0 && (
              <p className="text-sm text-gray-300 mt-2">
                {questParagraphs[0].content.length > 100
                  ? `${questParagraphs[0].content.substring(0, 100)}...`
                  : questParagraphs[0].content}
              </p>
            )}
          </div>
        </div>
      );
    } else {
      const entry = item.item as DiaryEntry;
      
      // FIXED: Use optimized folder styling function
      const diaryFolderId = getFolderId(entry);
      const { folderData } = getFolderStyling(diaryFolderId);

      return (
        <div
          key={`diary-${entry.id}`}
          className="flex items-center space-x-4 p-4 bg-purple-900/20 rounded-lg border border-purple-600/30 hover:bg-purple-900/30 transition-colors cursor-pointer"
          onClick={(e) => handleDiaryClick(entry, e)}
        >
          <div className="w-3 h-3 rounded-full bg-purple-400" />
          <BookOpen className="w-5 h-5 text-purple-400 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-lg text-white">
                {entry.title || "Diary Entry"}
              </h4>
              {folderData && (
                <span
                  className="inline-block px-2 py-1 text-xs font-medium rounded-full text-white"
                  style={{ backgroundColor: folderData.color }}
                >
                  {folderData.name}
                </span>
              )}
            </div>
            {entry.scheduled_date && (
              <p className="text-sm text-purple-300 font-medium">
                {new Date(entry.scheduled_date).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
            )}
            <p className="text-sm text-gray-300 mt-2">
              {entry.content.length > 150
                ? `${entry.content.substring(0, 150)}...`
                : entry.content}
            </p>
          </div>
        </div>
      );
    }
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const selectedDayItems = getItemsForDate(selectedDayDate);

  // Tab component
  const TabButton = ({
    id,
    label,
    icon: Icon,
  }: {
    id: "day" | "month";
    label: string;
    icon: any;
  }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        activeTab === id
          ? "bg-gray-800 text-white shadow-sm"
          : "text-gray-300 hover:text-white"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="h-full">
      {/* Tab Navigation */}
      <div className="flex flex-row justify-between">
        <div className="flex space-x-1 bg-gray-700 rounded-lg p-1 mb-6 w-fit">
          <TabButton id="day" label="Day View" icon={Clock} />
          <TabButton id="month" label="Month View" icon={CalendarIcon} />
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "day" ? (
        /* Day View Tab */
        <div className="bg-gray-800 rounded-lg shadow border border-gray-600 p-6 h-full">
          {/* Day Navigation Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateDay("prev")}
                className="p-3 hover:bg-gray-700 rounded-full transition-colors"
                title="Previous day"
              >
                <ChevronLeft className="w-6 h-6 text-gray-300" />
              </button>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white">
                  {getFormattedDate(selectedDayDate)}
                </h1>
                <p className="text-lg text-gray-400">
                  {selectedDayDate.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={() => navigateDay("next")}
                className="p-3 hover:bg-gray-700 rounded-full transition-colors"
                title="Next day"
              >
                <ChevronRight className="w-6 h-6 text-gray-300" />
              </button>
            </div>

            <button
              onClick={() => setSelectedDayDate(new Date())}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-gray-300 shadow-sm rounded-md text-sm transition-colors font-medium hover:text-white hover:bg-gray-600"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Go to Today</span>
            </button>
          </div>

          {/* Day Content */}
          <div className="space-y-6">
            {selectedDayItems.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">
                    {selectedDayItems.length} item
                    {selectedDayItems.length !== 1 ? "s" : ""} scheduled
                  </h2>
                  <div className="flex items-center space-x-3 text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-blue-400 rounded"></div>
                      <span>Tasks</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-purple-400 rounded"></div>
                      <span>Diary Entries</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-orange-400 rounded"></div>
                      <span>Quests</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {selectedDayItems
                    .sort((a, b) => {
                      // Sort by time if available, then by type priority
                      const aTime =
                        a.type === "task"
                          ? (a.item as Task).due_date
                          : a.type === "diary"
                          ? (a.item as DiaryEntry).scheduled_date
                          : (a.item as Quest).created_at;
                      const bTime =
                        b.type === "task"
                          ? (b.item as Task).due_date
                          : b.type === "diary"
                          ? (b.item as DiaryEntry).scheduled_date
                          : (b.item as Quest).created_at;

                      if (aTime && bTime) {
                        return (
                          new Date(aTime).getTime() - new Date(bTime).getTime()
                        );
                      }
                      return 0;
                    })
                    .map(renderDayFeedItem)}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <CalendarIcon className="w-16 h-16 text-gray-500 mx-auto mb-6" />
                <h2 className="text-xl font-semibold text-white mb-3">
                  No items scheduled
                </h2>
                <p className="text-gray-400 text-lg">
                  {isSameDate(selectedDayDate, new Date())
                    ? "No tasks, diary entries, or quests scheduled for today"
                    : `No items scheduled for ${getFormattedDate(
                        selectedDayDate
                      ).toLowerCase()}`}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Month View Tab */
        <div className="space-y-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() =>
                  setCurrentDate(
                    new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth() - 1
                    )
                  )
                }
                className="p-2 hover:bg-gray-700 rounded text-gray-300"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold text-white">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={() =>
                  setCurrentDate(
                    new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth() + 1
                    )
                  )
                }
                className="p-2 hover:bg-gray-700 rounded text-gray-300"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center space-x-4">
              {/* Legend */}
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-400 rounded"></div>
                  <span className="text-gray-300">Tasks</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-purple-400 rounded"></div>
                  <span className="text-gray-300">Diary Entries</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-orange-400 rounded"></div>
                  <span className="text-gray-300">Quests</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setCurrentDate(new Date());
                  setSelectedDayDate(new Date());
                }}
                className="px-3 py-1 text-sm bg-blue-900 text-blue-300 rounded"
              >
                Today
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-gray-800 rounded-lg shadow border border-gray-600">
            <div className="grid grid-cols-7 gap-0 border-b border-gray-600">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="p-3 text-center font-medium text-gray-300 border-r border-gray-600 last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0">
              {days.map((day, index) => {
                const itemsForDay = day ? getItemsForDate(day) : [];
                const isToday = day && isSameDate(day, new Date());
                const isSelected = day && isSameDate(day, selectedDayDate);

                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border-r border-b border-gray-600 last:border-r-0 cursor-pointer transition-colors ${
                      day ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-700"
                    } ${isToday ? "bg-blue-900/20" : ""} ${
                      isSelected
                        ? "bg-yellow-900/20 ring-2 ring-yellow-600"
                        : ""
                    }`}
                    onClick={() => {
                      if (day) {
                        setSelectedDayDate(day);
                        setActiveTab("day"); // Switch to day view when clicking a date
                      }
                    }}
                  >
                    {day && (
                      <>
                        <div
                          className={`text-sm font-medium mb-2 ${
                            isToday
                              ? "text-blue-300"
                              : isSelected
                              ? "text-yellow-300"
                              : "text-white"
                          }`}
                        >
                          {day.getDate()}
                        </div>
                        <div className="space-y-1">
                          {itemsForDay
                            .slice(0, 3)
                            .map((calendarItem, itemIndex) => {
                              if (calendarItem.type === "task") {
                                const task = calendarItem.item as Task;
                                return (
                                  <div
                                    key={`task-${task.id}`}
                                    className={`text-xs p-1 rounded truncate flex items-center space-x-1 cursor-pointer ${
                                      task.status === "completed"
                                        ? "bg-green-900/30 text-green-300 line-through"
                                        : "bg-blue-900/30 text-blue-300 hover:bg-blue-900/50"
                                    }`}
                                    title={`Task: ${task.title}`}
                                    onClick={(e) => handleTaskClick(task, e)}
                                  >
                                    <Clock className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">
                                      {task.title}
                                    </span>
                                  </div>
                                );
                              } else if (calendarItem.type === "quest") {
                                const quest = calendarItem.item as Quest;
                                return (
                                  <div
                                    key={`quest-${quest.id}`}
                                    className="text-xs p-1 rounded truncate flex items-center space-x-1 bg-orange-900/30 text-orange-300 hover:bg-orange-900/50 cursor-pointer"
                                    title={`Quest: ${quest.title}`}
                                    onClick={(e) => handleQuestClick(quest, e)}
                                  >
                                    <Scroll className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">
                                      {quest.title}
                                    </span>
                                  </div>
                                );
                              } else {
                                const entry = calendarItem.item as DiaryEntry;
                                return (
                                  <div
                                    key={`diary-${entry.id}`}
                                    className="text-xs p-1 rounded truncate flex items-center space-x-1 bg-purple-900/30 text-purple-300 hover:bg-purple-900/50 cursor-pointer"
                                    title={`Diary: ${
                                      entry.title || "Untitled"
                                    }`}
                                    onClick={(e) => handleDiaryClick(entry, e)}
                                  >
                                    <BookOpen className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">
                                      {entry.title || "Diary Entry"}
                                    </span>
                                  </div>
                                );
                              }
                            })}
                          {itemsForDay.length > 3 && (
                            <div className="text-xs text-gray-400 text-center">
                              +{itemsForDay.length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-600">
              <h3 className="font-medium text-white mb-2">This Month</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Tasks:</span>
                  <span className="font-medium text-white">
                    {
                      tasks.filter((task) => {
                        if (!task.due_date || task.parent_task_id) return false; // Exclude subtasks
                        const taskDate = new Date(task.due_date);
                        return (
                          taskDate.getMonth() === currentDate.getMonth() &&
                          taskDate.getFullYear() === currentDate.getFullYear()
                        );
                      }).length
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Scheduled Entries:</span>
                  <span className="font-medium text-white">
                    {
                      diaryEntries.filter((entry) => {
                        if (!entry.scheduled_date || !entry.is_scheduled)
                          return false;
                        const entryDate = new Date(entry.scheduled_date);
                        return (
                          entryDate.getMonth() === currentDate.getMonth() &&
                          entryDate.getFullYear() === currentDate.getFullYear()
                        );
                      }).length
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Quests Created:</span>
                  <span className="font-medium text-white">
                    {
                      quests.filter((quest) => {
                        const questDate = new Date(quest.created_at);
                        return (
                          questDate.getMonth() === currentDate.getMonth() &&
                          questDate.getFullYear() === currentDate.getFullYear()
                        );
                      }).length
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-600">
              <h3 className="font-medium text-white mb-2">
                Completed This Month
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Tasks:</span>
                  <span className="font-medium text-green-400">
                    {
                      tasks.filter((task) => {
                        if (
                          !task.due_date ||
                          task.status !== "completed" ||
                          task.parent_task_id
                        )
                          return false; // Exclude subtasks
                        const taskDate = new Date(task.due_date);
                        return (
                          taskDate.getMonth() === currentDate.getMonth() &&
                          taskDate.getFullYear() === currentDate.getFullYear()
                        );
                      }).length
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Completion Rate:</span>
                  <span className="font-medium text-white">
                    {(() => {
                      const monthTasks = tasks.filter((task) => {
                        if (!task.due_date || task.parent_task_id) return false; // Exclude subtasks
                        const taskDate = new Date(task.due_date);
                        return (
                          taskDate.getMonth() === currentDate.getMonth() &&
                          taskDate.getFullYear() === currentDate.getFullYear()
                        );
                      });
                      const completedTasks = monthTasks.filter(
                        (task) => task.status === "completed"
                      );
                      const rate =
                        monthTasks.length > 0
                          ? Math.round(
                              (completedTasks.length / monthTasks.length) * 100
                            )
                          : 0;
                      return `${rate}%`;
                    })()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-600">
              <h3 className="font-medium text-white mb-2">Upcoming</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Next 7 Days:</span>
                  <span className="font-medium text-white">
                    {(() => {
                      const nextWeek = new Date();
                      nextWeek.setDate(nextWeek.getDate() + 7);
                      const today = new Date();

                      const upcomingTasks = tasks.filter((task) => {
                        if (!task.due_date || task.parent_task_id) return false; // Exclude subtasks
                        const taskDate = new Date(task.due_date);
                        return taskDate >= today && taskDate <= nextWeek;
                      });

                      const upcomingEntries = diaryEntries.filter((entry) => {
                        if (!entry.scheduled_date || !entry.is_scheduled)
                          return false;
                        const entryDate = new Date(entry.scheduled_date);
                        return entryDate >= today && entryDate <= nextWeek;
                      });

                      return upcomingTasks.length + upcomingEntries.length;
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Overdue Tasks:</span>
                  <span className="font-medium text-red-400">
                    {
                      tasks.filter((task) => {
                        if (
                          !task.due_date ||
                          task.status === "completed" ||
                          task.parent_task_id
                        )
                          return false; // Exclude subtasks
                        const taskDate = new Date(task.due_date);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return taskDate < today;
                      }).length
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task View Modal */}
      {selectedTask && (
        <TaskViewModal
          isOpen={showTaskModal}
          onClose={handleTaskModalClose}
          task={selectedTask}
          allTasks={tasks}
          folders={folders}
          onToggleStatus={onToggleTaskStatus}
          onEdit={handleTaskEdit}
          onSchedule={handleTaskSchedule}
          onFolderSelect={handleTaskFolderChange}
          onDelete={handleTaskDelete}
          onCreateSubtask={onCreateSubtask}
        />
      )}

      {/* Diary View Modal */}
      {selectedDiary && (
        <DiaryViewModal
          isOpen={showDiaryModal}
          onClose={handleDiaryModalClose}
          entry={selectedDiary}
          folders={folders}
          onEdit={handleDiaryEdit}
          onSchedule={handleDiarySchedule}
          onFolderSelect={handleDiaryFolderChange}
          onDelete={handleDiaryDelete}
        />
      )}

      {/* Quest View Modal */}
      {selectedQuest && (
        <QuestViewModal
          isOpen={showQuestModal}
          onClose={handleQuestModalClose}
          quest={selectedQuest}
          folders={folders}
          onEdit={handleQuestEdit}
          onFolderSelect={handleQuestFolderChange}
          onDelete={handleQuestDelete}
          onAddParagraph={() => {}} // Handled in the modal
          onUpdateParagraph={() => {}} // Handled in the modal
          onDeleteParagraph={() => {}} // Handled in the modal
        />
      )}
    </div>
  );
};

export default CalendarView;