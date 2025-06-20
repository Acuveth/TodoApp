import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Task } from '../types';

interface CalendarViewProps {
  tasks: Task[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks }) => {
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
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => 
      task.due_date && task.due_date.startsWith(dateStr)
    );
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={() => setCurrentDate(new Date())}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded"
        >
          Today
        </button>
      </div>

      <div className="bg-white rounded-lg shadow border">
        <div className="grid grid-cols-7 gap-0 border-b">
          {dayNames.map(day => (
            <div key={day} className="p-3 text-center font-medium text-gray-600 border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0">
          {days.map((day, index) => {
            const tasksForDay = day ? getTasksForDate(day) : [];
            const isToday = day && day.toDateString() === new Date().toDateString();
            
            return (
              <div 
                key={index} 
                className={`min-h-[100px] p-2 border-r border-b last:border-r-0 ${
                  day ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                } ${isToday ? 'bg-blue-50' : ''}`}
              >
                {day && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {tasksForDay.slice(0, 2).map(task => (
                        <div 
                          key={task.id}
                          className={`text-xs p-1 rounded truncate ${
                            task.status === 'completed' 
                              ? 'bg-green-100 text-green-800 line-through' 
                              : 'bg-blue-100 text-blue-800'
                          }`}
                          title={task.title}
                        >
                          {task.title}
                        </div>
                      ))}
                      {tasksForDay.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{tasksForDay.length - 2} more
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
    </div>
  );
};

export default CalendarView;