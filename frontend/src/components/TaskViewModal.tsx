import React, { useState } from "react";
import {
  X,
  CheckSquare,
  Circle,
  CheckCircle2,
  Flag,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  FolderPlus,
  MoreVertical,
  ChevronLeft,
  Plus,
} from "lucide-react";
import { Task, FolderType } from "../types";

interface TaskActionDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onSchedule: () => void;
  onFolderSelect: (folderId: number | null) => void;
  onDelete: () => void;
  folders: FolderType[];
  currentFolderId: number | null;
  isSubtask: boolean;
}

const TaskActionDropdown: React.FC<TaskActionDropdownProps> = ({
  isOpen,
  onClose,
  onEdit,
  onSchedule,
  onFolderSelect,
  onDelete,
  folders,
  currentFolderId,
  isSubtask,
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
          <Edit2 className="w-4 h-4" />
          <span>Edit Task</span>
        </button>

        <button
          onClick={() => {
            onSchedule();
            onClose();
          }}
          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
        >
          <Calendar className="w-4 h-4" />
          <span>Schedule Task</span>
        </button>

        {/* Only show folder menu for main tasks (not subtasks) */}
        {!isSubtask && (
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
                    currentFolderId === null
                      ? "bg-blue-900 text-blue-300"
                      : "text-gray-300"
                  }`}
                >
                  <div className="w-3 h-3 rounded bg-gray-500" />
                  <span>No Folder</span>
                  {currentFolderId === null && (
                    <span className="ml-auto text-blue-400">✓</span>
                  )}
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => {
                      onFolderSelect(folder.id);
                      onClose();
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 flex items-center space-x-2 ${
                      currentFolderId === folder.id
                        ? "bg-blue-900 text-blue-300"
                        : "text-gray-300"
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: folder.color }}
                    />
                    <span>{folder.name}</span>
                    {currentFolderId === folder.id && (
                      <span className="ml-auto text-blue-400">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <hr className="my-1 border-gray-600" />

        <button
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 flex items-center space-x-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Task</span>
        </button>
      </div>
    </>
  );
};

interface TaskViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  allTasks: Task[];
  folders: FolderType[];
  onToggleStatus: (task: Task) => void;
  onEdit: (task: Task) => void;
  onSchedule: (task: Task) => void;
  onFolderSelect: (taskId: number, folderId: number | null) => void;
  onDelete: (taskId: number) => void;
  onCreateSubtask?: (parentTaskId: number) => void;
}

const TaskViewModal: React.FC<TaskViewModalProps> = ({
  isOpen,
  onClose,
  task,
  allTasks,
  folders,
  onToggleStatus,
  onEdit,
  onSchedule,
  onFolderSelect,
  onDelete,
  onCreateSubtask,
}) => {
  const [showActionDropdown, setShowActionDropdown] = useState(false);

  if (!isOpen || !task) return null;

  // Get current folder
  const currentFolder = folders.find(
    (folder) => folder.id === (task as any).folder_id
  );

  // Calculate subtask progress
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

  // Calculate substep progress
  const completedSubsteps = task.substeps?.filter((s) => s.is_completed).length || 0;
  const totalSubsteps = task.substeps?.length || 0;

  // Overall progress
  const totalItems = totalSubsteps + totalSubtasks;
  const completedItems = completedSubsteps + completedSubtasks;
  const overallProgress = totalItems > 0 ? completedItems / totalItems : 0;

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 3:
        return { text: "text-red-400", bg: "bg-red-900/30", border: "border-red-600/30" };
      case 2:
        return { text: "text-yellow-400", bg: "bg-yellow-900/30", border: "border-yellow-600/30" };
      case 1:
        return { text: "text-green-400", bg: "bg-green-900/30", border: "border-green-600/30" };
      default:
        return { text: "text-gray-400", bg: "bg-gray-700", border: "border-gray-600" };
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
            <CheckCircle2 className="w-6 h-6 text-green-400" />
          </button>
        );
      case "in_progress":
        return (
          <button
            onClick={onClick}
            className="hover:scale-110 transition-transform"
          >
            <Circle className="w-6 h-6 text-blue-400" />
          </button>
        );
      default:
        return (
          <button
            onClick={onClick}
            className="hover:scale-110 transition-transform"
          >
            <Circle className="w-6 h-6 text-gray-500" />
          </button>
        );
    }
  };

  const priorityColors = getPriorityColor(task.priority);

  // Render subtasks recursively
  const renderSubtasks = (parentId: number, level: number = 0): React.ReactElement[] => {
    const directSubtasks = allTasks.filter((t) => t.parent_task_id === parentId);

    return directSubtasks.map((subtask) => {
      const nestedSubtasks = allTasks.filter((t) => t.parent_task_id === subtask.id);
      const hasNested = nestedSubtasks.length > 0;

      return (
        <div key={subtask.id}>
          <div
            className="flex items-start space-x-3 py-2 px-3 rounded-lg hover:bg-gray-700"
            style={{ marginLeft: `${20 * level}px` }}
          >
            {getStatusIcon(subtask.status, () => onToggleStatus(subtask))}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span
                  className={`font-medium ${
                    subtask.status === "completed"
                      ? "line-through text-gray-500"
                      : "text-white"
                  }`}
                >
                  {subtask.title}
                </span>
                <Flag
                  className={`w-4 h-4 ${getPriorityColor(subtask.priority).text}`}
                />
                {subtask.due_date && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-blue-400" />
                    <span className="text-xs text-blue-300">
                      {new Date(subtask.due_date).toLocaleDateString()}{" "}
                      {new Date(subtask.due_date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
              </div>
              {subtask.description && (
                <p className="text-gray-300 mt-1 text-sm">{subtask.description}</p>
              )}
            </div>
          </div>

          {/* Recursively render nested subtasks */}
          {hasNested && renderSubtasks(subtask.id, level + 1)}
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div
            className="absolute inset-0 bg-black opacity-75"
            onClick={onClose}
          ></div>
        </div>
        <div className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-gray-800 px-6 pt-6 pb-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  {getStatusIcon(task.status, () => onToggleStatus(task))}
                  <CheckSquare className="w-6 h-6 text-blue-400" />
                  <span className="text-lg font-medium text-blue-300">Task</span>
                  
                  {/* Priority badge */}
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${priorityColors.bg} ${priorityColors.text} ${priorityColors.border} border`}>
                    <div className="flex items-center space-x-1">
                      <Flag className="w-4 h-4" />
                      <span>
                        {task.priority === 3 ? "High" : task.priority === 2 ? "Medium" : "Low"} Priority
                      </span>
                    </div>
                  </div>

                  {/* Folder indicator */}
                  {currentFolder && (
                    <div className="flex items-center space-x-2 bg-gray-700 px-3 py-1 rounded-full border border-gray-600">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: currentFolder.color }}
                      />
                      <span className="text-sm text-gray-300 font-medium">
                        {currentFolder.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Title */}
                <h1 className={`text-2xl font-bold mb-3 ${
                  task.status === "completed" ? "line-through text-gray-500" : "text-white"
                }`}>
                  {task.title}
                </h1>

                {/* Description */}
                {task.description && (
                  <p className="text-gray-300 mb-4 text-lg leading-relaxed">
                    {task.description}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex items-center space-x-6 text-sm text-gray-400 mb-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      Created on{" "}
                      {new Date(task.created_at).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      at{" "}
                      {new Date(task.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Due date */}
                  {task.due_date && (
                    <div className="flex items-center space-x-1 text-blue-300">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Due {new Date(task.due_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        at{" "}
                        {new Date(task.due_date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}

                  {/* Status */}
                  <div className="flex items-center space-x-1">
                    <span>Status:</span>
                    <span className={`font-medium ${
                      task.status === "completed" ? "text-green-400" :
                      task.status === "in_progress" ? "text-blue-400" : "text-gray-300"
                    }`}>
                      {task.status === "completed" ? "Completed" :
                       task.status === "in_progress" ? "In Progress" : "Pending"}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                {totalItems > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-300">Progress</span>
                      <span className="text-sm text-gray-400">
                        {completedItems}/{totalItems} items completed
                      </span>
                    </div>
                    <div className="bg-gray-600 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          overallProgress === 1 ? "bg-green-400" : "bg-blue-400"
                        }`}
                        style={{ width: `${overallProgress * 100}%` }}
                      />
                    </div>
                    {/* Progress breakdown */}
                    {totalSubsteps > 0 && totalSubtasks > 0 && (
                      <div className="text-xs text-gray-400 mt-1 flex space-x-4">
                        <span>Steps: {completedSubsteps}/{totalSubsteps}</span>
                        <span>Subtasks: {completedSubtasks}/{totalSubtasks}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center space-x-2">
                {/* Action dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowActionDropdown(!showActionDropdown)}
                    className="p-2 text-gray-400 hover:text-gray-300 rounded-full hover:bg-gray-700"
                    title="More actions"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {showActionDropdown && (
                    <TaskActionDropdown
                      isOpen={true}
                      onClose={() => setShowActionDropdown(false)}
                      onEdit={() => {
                        onEdit(task);
                        onClose();
                      }}
                      onSchedule={() => {
                        onSchedule(task);
                        onClose();
                      }}
                      onFolderSelect={(folderId) => {
                        onFolderSelect(task.id, folderId);
                        setShowActionDropdown(false);
                      }}
                      onDelete={() => {
                        onDelete(task.id);
                        onClose();
                      }}
                      folders={folders}
                      currentFolderId={(task as any).folder_id || null}
                      isSubtask={!!task.parent_task_id}
                    />
                  )}
                </div>

                {/* Add subtask button */}
                {onCreateSubtask && (
                  <button
                    onClick={() => {
                      onCreateSubtask(task.id);
                      onClose();
                    }}
                    className="p-2 text-gray-400 hover:text-blue-400 rounded-full hover:bg-blue-900/20"
                    title="Add subtask"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-full text-gray-400 hover:text-gray-300 hover:bg-gray-700 focus:outline-none"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content sections */}
            <div className="space-y-6">
              {/* Substeps section */}
              {totalSubsteps > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                    <CheckSquare className="w-5 h-5 text-blue-400" />
                    <span>Steps ({completedSubsteps}/{totalSubsteps} completed)</span>
                  </h3>
                  <div className="bg-gray-700 rounded-lg p-4 space-y-2">
                    {task.substeps?.map((substep: any) => (
                      <div key={substep.id} className="flex items-center space-x-3 py-1">
                        <input
                          type="checkbox"
                          checked={substep.is_completed}
                          className="rounded border-gray-600 bg-gray-700 w-5 h-5"
                          readOnly
                        />
                        <span
                          className={`text-sm ${
                            substep.is_completed
                              ? "line-through text-gray-500"
                              : "text-gray-300"
                          }`}
                        >
                          {substep.title}
                        </span>
                        {substep.description && (
                          <span className="text-xs text-gray-400">
                            — {substep.description}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtasks section */}
              {hasSubtasks && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                    <CheckSquare className="w-5 h-5 text-green-400" />
                    <span>Subtasks ({completedSubtasks}/{totalSubtasks} completed)</span>
                  </h3>
                  <div className="bg-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto">
                    {renderSubtasks(task.id)}
                  </div>
                </div>
              )}

              {/* Notes section */}
              {task.notes && task.notes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Notes</h3>
                  <div className="bg-gray-700 rounded-lg p-4 space-y-3">
                    {task.notes.map((note: any) => (
                      <div key={note.id} className="border-l-4 border-blue-600 pl-4">
                        <p className="text-gray-300">{note.content}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(note.created_at).toLocaleDateString()} at{" "}
                          {new Date(note.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-600 mt-6">
              <div className="text-sm text-gray-400">
                {task.parent_task_id && (
                  <span className="mr-4">
                    This is a subtask
                  </span>
                )}
                Task ID: {task.id}
              </div>
              
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskViewModal;