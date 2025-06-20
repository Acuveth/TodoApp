import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar as CalendarIcon, 
  CheckSquare, 
  Plus, 
  Folder, 
  BookOpen, 
  AlertCircle
} from 'lucide-react';

// Component imports
import { Modal, TaskCard, CalendarView, DiaryView } from './components';

// Type and API imports
import { 
  Task, 
  FolderType, 
  DiaryEntry, 
  NewTask, 
  NewFolder
} from './types';
import { api } from './utils';

function TodoApp() {
  const [currentView, setCurrentView] = useState('tasks');
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [expandedTasks, setExpandedTasks] = useState(new Set<number>());
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Form states
  const [newTask, setNewTask] = useState<NewTask>({ 
    title: '', 
    description: '', 
    priority: 1, 
    due_date: '',
    is_calendar_event: false 
  });
  const [newFolder, setNewFolder] = useState<NewFolder>({ 
    name: '', 
    color: '#3B82F6' 
  });

  // Data loading functions
  const loadFolders = useCallback(async () => {
    try {
      const foldersData = await api.getFolders();
      setFolders(foldersData);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const tasksData = await api.getTasks(selectedFolder?.id || null);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedFolder?.id]);

  const loadDiaryEntries = useCallback(async () => {
    setLoading(true);
    try {
      const entriesData = await api.getDiaryEntries(
        selectedDate ? selectedDate.toISOString().split('T')[0] : undefined,
        selectedFolder?.id
      );
      setDiaryEntries(entriesData);
    } catch (error) {
      console.error('Error loading diary entries:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedFolder?.id]);

  // Initial connection and data loading
  useEffect(() => {
    const testConnection = async () => {
      try {
        await api.healthCheck();
        setBackendStatus('connected');
        loadFolders();
      } catch (error) {
        setBackendStatus('error');
        console.error('Backend connection failed:', error);
      }
    };
    testConnection();
  }, [loadFolders]);

  useEffect(() => {
    if (backendStatus === 'connected') {
      if (currentView === 'tasks') {
        loadTasks();
      } else if (currentView === 'diary') {
        loadDiaryEntries();
      }
    }
  }, [currentView, selectedFolder, selectedDate, backendStatus, loadTasks, loadDiaryEntries]);

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

  // Folder handlers
  const handleFolderNameChange = useCallback((value: string) => {
    setNewFolder((prev: NewFolder) => ({ ...prev, name: value }));
  }, []);

  const handleFolderColorChange = useCallback((value: string) => {
    setNewFolder((prev: NewFolder) => ({ ...prev, color: value }));
  }, []);

  // Create handlers
  const handleCreateTask = async () => {
    try {
      const taskData = {
        ...newTask,
        folder_id: selectedFolder?.id || null,
        due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : null
      };
      await api.createTask(taskData);
      setNewTask({ title: '', description: '', priority: 1, due_date: '', is_calendar_event: false });
      setShowNewTaskModal(false);
      loadTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleCreateFolder = async () => {
    try {
      await api.createFolder(newFolder);
      setNewFolder({ name: '', color: '#3B82F6' });
      setShowNewFolderModal(false);
      loadFolders();
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const handleCreateDiaryEntry = async (content: string) => {
    try {
      const entryData = {
        entry_date: new Date().toISOString().split('T')[0], // Today's date
        title: '', // No title needed
        content: content,
        mood: undefined, // No mood
        weather: '', // No weather
        folder_id: selectedFolder?.id || null
      };
      await api.createDiaryEntry(entryData);
      loadDiaryEntries();
    } catch (error) {
      console.error('Error creating diary entry:', error);
    }
  };

  const handleUpdateDiaryEntry = async (id: number, content: string) => {
    try {
      // You'll need to add this API endpoint
      await api.updateDiaryEntry(id, { content });
      loadDiaryEntries();
    } catch (error) {
      console.error('Error updating diary entry:', error);
    }
  };

  // Task actions
  const toggleTaskStatus = async (task: Task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await api.updateTask(task.id, { status: newStatus });
      loadTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      // For now, update locally if API fails
      setTasks((prev: Task[]) => prev.map((t: Task) => 
        t.id === task.id ? { ...t, status: task.status === 'completed' ? 'pending' : 'completed' } : t
      ));
    }
  };

  const toggleTaskExpansion = useCallback((taskId: number) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  }, [expandedTasks]);

  // Connection status component
  const ConnectionStatus = () => {
    if (backendStatus === 'checking') {
      return (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-700 mr-2"></div>
            Connecting to backend...
          </div>
        </div>
      );
    }

    if (backendStatus === 'error') {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            Backend connection failed. Make sure FastAPI is running on http://localhost:8000
          </div>
        </div>
      );
    }

    return (
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        <div className="flex items-center">
          <CheckSquare className="w-4 h-4 mr-2" />
          Connected to backend successfully!
        </div>
      </div>
    );
  };

  // Sidebar component
  const Sidebar = () => (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Todo App</h1>
      </div>
      
      <nav className="flex-1 p-4">
        <div className="space-y-2 mb-6">
          <button
            onClick={() => setCurrentView('tasks')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left ${
              currentView === 'tasks' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            <span>Tasks</span>
          </button>
          
          <button
            onClick={() => setCurrentView('calendar')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left ${
              currentView === 'calendar' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <CalendarIcon className="w-5 h-5" />
            <span>Calendar</span>
          </button>
          
          <button
            onClick={() => setCurrentView('diary')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left ${
              currentView === 'diary' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>Diary</span>
          </button>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Folders</h3>
            <button 
              onClick={() => setShowNewFolderModal(true)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-1">
            <button
              onClick={() => setSelectedFolder(null)}
              className={`w-full flex items-center space-x-2 px-2 py-1 rounded text-left text-sm ${
                selectedFolder === null ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
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
                  selectedFolder?.id === folder.id ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: folder.color }}
                />
                <span>{folder.name}</span>
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
      case 'calendar':
        return <CalendarView tasks={tasks} />;
      case 'diary':
        return (
          <DiaryView 
            diaryEntries={diaryEntries}
            loading={loading}
            onNewEntry={handleCreateDiaryEntry}
            onUpdateEntry={handleUpdateDiaryEntry}
          />
        );
      default:
        return (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedFolder ? selectedFolder.name : 'All Tasks'}
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
              <div className="space-y-3">
                {tasks.map((task: Task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task}
                    isExpanded={expandedTasks.has(task.id)}
                    onToggleExpansion={toggleTaskExpansion}
                    onToggleStatus={toggleTaskStatus}
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

  if (backendStatus === 'checking') {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to backend...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        <ConnectionStatus />
        
        {backendStatus === 'connected' ? (
          renderCurrentView()
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-500">Please start the backend server to use the app</p>
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
          <select
            value={newTask.priority}
            onChange={(e) => handleTaskPriorityChange(parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value={1}>Low Priority</option>
            <option value={2}>Medium Priority</option>
            <option value={3}>High Priority</option>
          </select>
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

      {/* Folder Modal */}
      <Modal 
        isOpen={showNewFolderModal} 
        onClose={() => setShowNewFolderModal(false)}
        title="Create New Folder"
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Folder name"
            value={newFolder.name}
            onChange={(e) => handleFolderNameChange(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
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
              onClick={handleCreateFolder}
              disabled={!newFolder.name}
              className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Create Folder
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default TodoApp;