import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, BookOpen, CheckSquare, Calendar as CalendarIcon, CalendarDays } from "lucide-react";
import { Task, DiaryEntry, FolderType } from "../types";

interface CalendarViewProps {
  tasks: Task[];
  diaryEntries?: DiaryEntry[];
  folders: FolderType[];
  onToggleTaskStatus: (task: Task) => Promise<void>;
  onEditTask: (task: Task) => void;
  onScheduleTask: (taskId: number, updates: any) => Promise<void>;
  onUpdateTaskFolder: (taskId: number, folderId: number | null) => Promise<void>;
  onDeleteTask: (taskId: number) => Promise<void>;
  onCreateSubtask: (parentTaskId: number) => Promise<void>;
  onEditDiary: (entry: DiaryEntry) => void;
  onScheduleDiary: (id: number, scheduledDate: string) => Promise<void>;
  onUpdateDiaryFolder: (id: number, folderId: number | null) => Promise<void>;
  onDeleteDiary: (id: number) => Promise<void>;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  diaryEntries = [],
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
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayDate, setSelectedDayDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"day" | "month">("day");

  // Helper function to get folder by ID
  const getFolderById = (folderId: number | null | undefined) => {
    if (!folderId) return null;
    return folders.find(folder => folder.id === folderId) || null;
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

  const getTasksForDate = (date: Date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split("T")[0];
    return tasks.filter(
      (task) => task.due_date && task.due_date.startsWith(dateStr)
    );
  };

  const getDiaryEntriesForDate = (date: Date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split("T")[0];
    return diaryEntries.filter(
      (entry) =>
        entry.is_scheduled &&
        entry.scheduled_date &&
        entry.scheduled_date.startsWith(dateStr)
    );
  };

  const getItemsForDate = (date: Date) => {
    const tasksForDay = getTasksForDate(date);
    const diaryEntriesForDay = getDiaryEntriesForDate(date);

    return [
      ...tasksForDay.map((task) => ({ type: "task" as const, item: task })),
      ...diaryEntriesForDay.map((entry) => ({
        type: "diary" as const,
        item: entry,
      })),
    ];
  };

  // Navigation functions for selected day
  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDayDate);
    if (direction === 'prev') {
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

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else if (date.toDateString() === yesterday.toDateString()) {
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

  // Render individual item in day feed
  const renderDayFeedItem = (item: { type: "task" | "diary"; item: Task | DiaryEntry }) => {
    if (item.type === "task") {
      const task = item.item as Task;
      const folder = getFolderById((task as any).folder_id);
      
      return (
        <div key={`task-${task.id}`} className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
          <div className={`w-3 h-3 rounded-full ${task.status === "completed" ? "bg-green-500" : "bg-blue-500"}`} />
          <CheckSquare className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h4 className={`font-medium text-lg ${task.status === "completed" ? "line-through text-gray-500" : "text-gray-900"}`}>
                {task.title}
              </h4>
              {folder && (
                <span 
                  className="inline-block px-2 py-1 text-xs font-medium rounded-full text-white"
                  style={{ backgroundColor: folder.color }}
                >
                  {folder.name}
                </span>
              )}
            </div>
            {task.due_date && (
              <p className="text-sm text-blue-600 font-medium">
                {new Date(task.due_date).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
            )}
            {task.description && (
              <p className="text-sm text-gray-600 mt-2">{task.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleTaskStatus(task)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                task.status === "completed" 
                  ? "bg-green-100 text-green-700 hover:bg-green-200" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {task.status === "completed" ? "✓ Done" : "Mark Done"}
            </button>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              task.priority === 3 ? "bg-red-100 text-red-700" :
              task.priority === 2 ? "bg-yellow-100 text-yellow-700" :
              "bg-green-100 text-green-700"
            }`}>
              {task.priority === 3 ? "High" : task.priority === 2 ? "Medium" : "Low"}
            </div>
          </div>
        </div>
      );
    } else {
      const entry = item.item as DiaryEntry;
      const folder = getFolderById((entry as any).folder_id);
      
      return (
        <div key={`diary-${entry.id}`} className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <BookOpen className="w-5 h-5 text-purple-600 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-lg text-gray-900">{entry.title || "Diary Entry"}</h4>
              {folder && (
                <span 
                  className="inline-block px-2 py-1 text-xs font-medium rounded-full text-white"
                  style={{ backgroundColor: folder.color }}
                >
                  {folder.name}
                </span>
              )}
            </div>
            {entry.scheduled_date && (
              <p className="text-sm text-purple-600 font-medium">
                {new Date(entry.scheduled_date).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
            )}
            <p className="text-sm text-gray-600 mt-2">
              {entry.content.length > 150 ? `${entry.content.substring(0, 150)}...` : entry.content}
            </p>
          </div>
        </div>
      );
    }
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const selectedDayItems = getItemsForDate(selectedDayDate);

  // Tab component
  const TabButton = ({ id, label, icon: Icon }: { id: "day" | "month", label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        activeTab === id
          ? "bg-white text-gray-900 shadow-sm"
          : "text-gray-600 hover:text-gray-900"
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
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
          <TabButton id="day" label="Day View" icon={Clock} />
          <TabButton id="month" label="Month View" icon={CalendarIcon} />
        </div>
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">

        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "day" ? (
        /* Day View Tab */
        <div className="bg-white rounded-lg shadow border p-6 h-full">
          {/* Day Navigation Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateDay('prev')}
                className="p-3 hover:bg-gray-100 rounded-full transition-colors"
                title="Previous day"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  {getFormattedDate(selectedDayDate)}
                </h1>
                <p className="text-lg text-gray-500">
                  {selectedDayDate.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={() => navigateDay('next')}
                className="p-3 hover:bg-gray-100 rounded-full transition-colors"
                title="Next day"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            
            <button
            onClick={() => setSelectedDayDate(new Date())}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 shadow-sm rounded-md text-sm transition-colors font-medium hover:text-gray-900 hover:bg-white"
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
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedDayItems.length} item{selectedDayItems.length !== 1 ? 's' : ''} scheduled
                  </h2>
                  <div className="flex items-center space-x-3 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span>Tasks</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-purple-500 rounded"></div>
                      <span>Diary Entries</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {selectedDayItems
                    .sort((a, b) => {
                      // Sort by time if available
                      const aTime = a.type === "task" ? (a.item as Task).due_date : (a.item as DiaryEntry).scheduled_date;
                      const bTime = b.type === "task" ? (b.item as Task).due_date : (b.item as DiaryEntry).scheduled_date;
                      
                      if (aTime && bTime) {
                        return new Date(aTime).getTime() - new Date(bTime).getTime();
                      }
                      return 0;
                    })
                    .map(renderDayFeedItem)}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <h2 className="text-xl font-semibold text-gray-900 mb-3">No items scheduled</h2>
                <p className="text-gray-500 text-lg">
                  {selectedDayDate.toDateString() === new Date().toDateString() 
                    ? "No tasks or diary entries scheduled for today"
                    : `No tasks or diary entries scheduled for ${getFormattedDate(selectedDayDate).toLowerCase()}`
                  }
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
                    new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
                  )
                }
                className="p-2 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={() =>
                  setCurrentDate(
                    new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
                  )
                }
                className="p-2 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center space-x-4">
              {/* Legend */}
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Tasks</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-purple-500 rounded"></div>
                  <span>Diary Entries</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setCurrentDate(new Date());
                  setSelectedDayDate(new Date());
                }}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded"
              >
                Today
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-lg shadow border">
            <div className="grid grid-cols-7 gap-0 border-b">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="p-3 text-center font-medium text-gray-600 border-r last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0">
              {days.map((day, index) => {
                const itemsForDay = day ? getItemsForDate(day) : [];
                const isToday =
                  day && day.toDateString() === new Date().toDateString();
                const isSelected =
                  day && day.toDateString() === selectedDayDate.toDateString();

                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border-r border-b last:border-r-0 cursor-pointer transition-colors ${
                      day ? "bg-white hover:bg-gray-50" : "bg-gray-50"
                    } ${isToday ? "bg-blue-50" : ""} ${isSelected ? "bg-yellow-50 ring-2 ring-yellow-300" : ""}`}
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
                            isToday ? "text-blue-600" : 
                            isSelected ? "text-yellow-600" : "text-gray-900"
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
                                    className={`text-xs p-1 rounded truncate flex items-center space-x-1 ${
                                      task.status === "completed"
                                        ? "bg-green-100 text-green-800 line-through"
                                        : "bg-blue-100 text-blue-800"
                                    }`}
                                    title={`Task: ${task.title}`}
                                  >
                                    <Clock className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{task.title}</span>
                                  </div>
                                );
                              } else {
                                const entry = calendarItem.item as DiaryEntry;
                                return (
                                  <div
                                    key={`diary-${entry.id}`}
                                    className="text-xs p-1 rounded truncate flex items-center space-x-1 bg-purple-100 text-purple-800"
                                    title={`Diary: ${entry.title || "Untitled"}`}
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
                            <div className="text-xs text-gray-500 text-center">
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
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="font-medium text-gray-900 mb-2">This Month</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Tasks:</span>
                  <span className="font-medium">
                    {
                      tasks.filter((task) => {
                        if (!task.due_date) return false;
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
                  <span>Scheduled Entries:</span>
                  <span className="font-medium">
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
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="font-medium text-gray-900 mb-2">
                Completed This Month
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Tasks:</span>
                  <span className="font-medium text-green-600">
                    {
                      tasks.filter((task) => {
                        if (!task.due_date || task.status !== "completed")
                          return false;
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
                  <span>Completion Rate:</span>
                  <span className="font-medium">
                    {(() => {
                      const monthTasks = tasks.filter((task) => {
                        if (!task.due_date) return false;
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

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="font-medium text-gray-900 mb-2">Upcoming</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Next 7 Days:</span>
                  <span className="font-medium">
                    {(() => {
                      const nextWeek = new Date();
                      nextWeek.setDate(nextWeek.getDate() + 7);
                      const today = new Date();

                      const upcomingTasks = tasks.filter((task) => {
                        if (!task.due_date) return false;
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
                  <span>Overdue Tasks:</span>
                  <span className="font-medium text-red-600">
                    {
                      tasks.filter((task) => {
                        if (!task.due_date || task.status === "completed")
                          return false;
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
    </div>
  );
};

export default CalendarView;