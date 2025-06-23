import React, { useState, useCallback, useEffect } from "react";
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
} from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
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
}

type FeedItem = {
  id: string;
  type: "task" | "diary";
  data: Task | DiaryEntry;
  created_at: string;
  due_date?: string;
};

type TabType = "all" | "today" | "diaries" | "tasks";

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
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showNewDiaryModal, setShowNewDiaryModal] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showFolderSelect, setShowFolderSelect] = useState<string | null>(null);
  const [editingDiary, setEditingDiary] = useState<DiaryEntry | null>(null);
  const [showEditDiaryModal, setShowEditDiaryModal] = useState(false);
  const [editDiaryContent, setEditDiaryContent] = useState("");

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

  // Combine and sort items by creation time
  const createFeedItems = useCallback((): FeedItem[] => {
    const feedItems: FeedItem[] = [];

    // Add tasks to feed (only root tasks for cleaner feed view)
    tasks
      .filter((task) => !task.parent_task_id) // Only show root tasks
      .forEach((task) => {
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
      });
    });

    // Sort by creation time (newest first)
    return feedItems.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [tasks, diaryEntries]);

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
            return entry.entry_date === today;
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
              <CheckSquare className="w-3 h-3 text-blue-500" />
              <span className="font-medium text-blue-700">Task</span>
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
              <div className="flex items-center space-x-2 mb-2">
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
                    <span className="text-xs text-gray-500">{folder.name}</span>
                  </>
                )}
              </div>

              {entry.title && (
                <h3 className="font-medium text-lg text-gray-900 mb-2">
                  {entry.title}
                </h3>
              )}

              <div className="text-gray-600 mb-2">
                {isExpanded ? (
                  <div className="prose prose-sm max-w-none">
                    <MDEditor.Markdown source={entry.content} />
                  </div>
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

      <div className="max-w-4xl mx-auto">
        {/* Header with tabs */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Activity Feed
          </h1>

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
        </div>

        {/* Action buttons */}
        <div className="flex space-x-3 mb-6">
          <button
            onClick={() => setShowNewTaskModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
          <button
            onClick={() => setShowNewDiaryModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Diary Entry</span>
          </button>
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
                  {activeTab === "today"
                    ? "No items for today"
                    : activeTab === "diaries"
                    ? "No diary entries yet"
                    : activeTab === "tasks"
                    ? "No tasks yet"
                    : "No items yet"}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Create your first{" "}
                  {activeTab === "diaries"
                    ? "diary entry"
                    : activeTab === "tasks"
                    ? "task"
                    : "item"}{" "}
                  to get started
                </p>
              </div>
            )}
          </div>
        )}
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
          <div className="diary-editor">
            <MDEditor
              value={newDiaryContent}
              onChange={(value) => setNewDiaryContent(value || "")}
              preview="edit"
              hideToolbar={false}
              height={350}
              data-color-mode="light"
            />
          </div>

          <div className="text-xs text-gray-500">
            First line becomes your title. Use Markdown for formatting.
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
          <div className="diary-editor">
            <MDEditor
              value={editDiaryContent}
              onChange={(value) => setEditDiaryContent(value || "")}
              preview="edit"
              hideToolbar={false}
              height={350}
              data-color-mode="light"
            />
          </div>

          <div className="text-xs text-gray-500">
            First line becomes your title. Use Markdown for formatting.
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
    </>
  );
};

export default FeedView;
