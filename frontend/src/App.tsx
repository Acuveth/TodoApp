import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckSquare, 
  Plus, 
  Folder, 
  BookOpen, 
  Clock, 
  ChevronRight,
  ChevronDown,
  Circle,
  CheckCircle2,
  Flag,
  AlertCircle,
  X
} from 'lucide-react';

// Type definitions
interface Task {
  id: number;
  title: string;
  description?: string;
  priority: number;
  status: string;
  due_date?: string;
  is_calendar_event: boolean;
  created_at: string;
  substeps?: TaskSubstep[];
  notes?: TaskNote[];
}

interface TaskSubstep {
  id: number;
  title: string;
  description?: string;
  is_completed: boolean;
  order_index: number;
  created_at: string;
}

interface TaskNote {
  id: number;
  content: string;
  created_at: string;
}

interface FolderType {
  id: number;
  name: string;
  color: string;
  parent_folder_id?: number;
  created_at: string;
}

interface DiaryEntry {
  id: number;
  entry_date: string;
  title?: string;
  content: string;
  mood?: number;
  weather?: string;
  created_at: string;
}

// API configuration
const API_BASE_URL = 'http://localhost:8000';

const api = {
  healthCheck: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },
  getTasks: async (folderId: number | null = null) => {
    const url = folderId 
      ? `${API_BASE_URL}/api/tasks?folder_id=${folderId}`
      : `${API_BASE_URL}/api/tasks`;
    const response = await fetch(url);
    return response.json();
  },
  createTask: async (taskData: any) => {
    const response = await fetch(`${API_BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    });
    return response.json();
  },
  getFolders: async () => {
    const response = await fetch(`${API_BASE_URL}/api/folders`);
    return response.json();
  },
  createFolder: async (folderData: any) => {
    const response = await fetch(`${API_BASE_URL}/api/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(folderData),
    });
    return response.json();
  },
};

function TodoApp() {
  const [currentView, setCurrentView] = useState('tasks');
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedTasks, setExpandedTasks] = useState(new Set<number>());
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 1 });
  const [newFolder, setNewFolder] = useState({ name: '', color: '#3B82F6' });

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
  }, []);

  useEffect(() => {
    if (backendStatus === 'connected') {
      if (currentView === 'tasks') {
        loadTasks();
      }
    }
  }, [currentView, selectedFolder, backendStatus]);

  const loadFolders = async () => {
    try {
      const foldersData = await api.getFolders();
      setFolders(foldersData);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const tasksData = await api.getTasks(selectedFolder?.id || null);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    try {
      await api.createTask({
        ...newTask,
        folder_id: selectedFolder?.id || null
      });
      setNewTask({ title: '', description: '', priority: 1 });
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

  const toggleTaskExpansion = (taskId: number) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 3: return 'text-red-500';
      case 2: return 'text-yellow-500';
      case 1: return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in_progress': return <Circle className="w-5 h-5 text-blue-500" />;
      default: return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

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

  const TaskCard = ({ task }: { task: Task }) => {
    const isExpanded = expandedTasks.has(task.id);
    const completedSubsteps = task.substeps?.filter(s => s.is_completed).length || 0;
    const totalSubsteps = task.substeps?.length || 0;
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-3 hover:shadow-md transition-shadow">
        <div 
          className="p-4 cursor-pointer"
          onClick={() => toggleTaskExpansion(task.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {getStatusIcon(task.status)}
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {task.title}
                  </h3>
                  <Flag className={`w-4 h-4 ${getPriorityColor(task.priority)}`} />
                </div>
                
                {task.description && (
                  <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                )}
                
                {totalSubsteps > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <div className="bg-gray-200 rounded-full h-2 flex-1">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${(completedSubsteps / totalSubsteps) * 100}%` }}
                        />
                      </div>
                      <span>{completedSubsteps}/{totalSubsteps}</span>
                    </div>
                  </div>
                )}
                
                {task.due_date && (
                  <div className="flex items-center space-x-1 mt-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(task.due_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {totalSubsteps > 0 && (
                isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>
        
        {isExpanded && task.substeps && task.substeps.length > 0 && (
          <div className="border-t border-gray-100 p-4 bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-2">Subtasks</h4>
            <div className="space-y-2">
              {task.substeps.map(substep => (
                <div key={substep.id} className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={substep.is_completed}
                    className="rounded border-gray-300"
                    readOnly
                  />
                  <span className={substep.is_completed ? 'line-through text-gray-500' : 'text-gray-700'}>
                    {substep.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const Modal = ({ isOpen, onClose, title, children }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
  }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  };

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
            <Calendar className="w-5 h-5" />
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
            
            {folders.map(folder => (
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
      <div className="flex-1 p-6">
        <ConnectionStatus />
        
        {backendStatus === 'connected' ? (
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
                {tasks.map(task => (
                  <TaskCard key={task.id} task={task} />
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
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-500">Please start the backend server to use the app</p>
          </div>
        )}
      </div>

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
            onChange={(e) => setNewTask({...newTask, title: e.target.value})}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
          <textarea
            placeholder="Description (optional)"
            value={newTask.description}
            onChange={(e) => setNewTask({...newTask, description: e.target.value})}
            className="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
          />
          <select
            value={newTask.priority}
            onChange={(e) => setNewTask({...newTask, priority: parseInt(e.target.value)})}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value={1}>Low Priority</option>
            <option value={2}>Medium Priority</option>
            <option value={3}>High Priority</option>
          </select>
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
            onChange={(e) => setNewFolder({...newFolder, name: e.target.value})}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
          <input
            type="color"
            value={newFolder.color}
            onChange={(e) => setNewFolder({...newFolder, color: e.target.value})}
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