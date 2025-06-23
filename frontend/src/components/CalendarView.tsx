import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, BookOpen } from "lucide-react";
import { Task, DiaryEntry } from "../types";

interface CalendarViewProps {
  tasks: Task[];
  diaryEntries?: DiaryEntry[];
}

const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  diaryEntries = [],
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

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

  // NEW: Get scheduled diary entries for date
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

  // NEW: Get all items (tasks + diary entries) for a date
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

  return (
    <div>
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
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded"
          >
            Today
          </button>
        </div>
      </div>

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

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border-r border-b last:border-r-0 ${
                  day ? "bg-white hover:bg-gray-50" : "bg-gray-50"
                } ${isToday ? "bg-blue-50" : ""}`}
              >
                {day && (
                  <>
                    <div
                      className={`text-sm font-medium mb-2 ${
                        isToday ? "text-blue-600" : "text-gray-900"
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

      {/* Summary at the bottom */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
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
  );
};

export default CalendarView;
