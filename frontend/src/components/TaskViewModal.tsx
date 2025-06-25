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
      <div className="absolute top-8 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-xl min-w-[180px] py-1">
        <button
          onClick={() => {
            onEdit();
            onClose();
          }}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
        >
          <Edit2 className="w-4 h-4" />
          <span>Edit Task</span>
        </button>

        <button
          onClick={() => {
            onSchedule();
            onClose();
          }}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
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
            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FolderPlus className="w-4 h-4" />
                <span>Change Folder</span>
              </div>
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Folder submenu */}
            {showFolderSubmenu && (
              <div className="absolute top-0 right-full ml-1 z-60 bg-white border border-gray-200 rounded-md shadow-xl min-w-[200px] py-1">
                <button
                  onClick={() => {
                    onFolderSelect(null);
                    onClose();
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2 ${
                    currentFolderId === null
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700"
                  }`}
                >
                  <div className="w-3 h-3 rounded bg-gray-300" />
                  <span>No Folder</span>
                  {currentFolderId === null && (
                    <span className="ml-auto text-blue-600">✓</span>
                  )}
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => {
                      onFolderSelect(folder.id);
                      onClose();
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2 ${
                      currentFolderId === folder.id
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700"
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: folder.color }}
                    />
                    <span>{folder.name}</span>
                    {currentFolderId === folder.id && (
                      <span className="ml-auto text-blue-600">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <hr className="my-1" />

        <button
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
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
        return { text: "text-red-600", bg: "bg-red-100", border: "border-red-200" };
      case 2:
        return { text: "text-yellow-600", bg: "bg-yellow-100", border: "border-yellow-200" };
      case 1:
        return { text: "text-green-600", bg: "bg-green-100", border: "border-green-200" };
      default:
        return { text: "text-gray-600", bg: "bg-gray-100", border: "border-gray-200" };
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
            <CheckCircle2 className="w-6 h-6 text-green-500" />
          </button>
        );
      case "in_progress":
        return (
          <button
            onClick={onClick}
            className="hover:scale-110 transition-transform"
          >
            <Circle className="w-6 h-6 text-blue-500" />
          </button>
        );
      default:
        return (
          <button
            onClick={onClick}
            className="hover:scale-110 transition-transform"
          >
            <Circle className="w-6 h-6 text-gray-400" />
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
            className="flex items-start space-x-3 py-2 px-3 rounded-lg hover:bg-gray-50"
            style={{ marginLeft: `${20 * level}px` }}
          >
            {getStatusIcon(subtask.status, () => onToggleStatus(subtask))}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span
                  className={`font-medium ${
                    subtask.status === "completed"
                      ? "line-through text-gray-500"
                      : "text-gray-900"
                  }`}
                >
                  {subtask.title}
                </span>
                <Flag
                  className={`w-4 h-4 ${getPriorityColor(subtask.priority).text.replace('text-', 'text-').replace('-600', '-500')}`}
                />
                {subtask.due_date && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-blue-500" />
                    <span className="text-xs text-blue-600">
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
                <p className="text-gray-600 mt-1 text-sm">{subtask.description}</p>
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
            className="absolute inset-0 bg-gray-500 opacity-75"
            onClick={onClose}
          ></div>
        </div>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-6 pt-6 pb-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  {getStatusIcon(task.status, () => onToggleStatus(task))}
                  <CheckSquare className="w-6 h-6 text-blue-500" />
                  <span className="text-lg font-medium text-blue-700">Task</span>
                  
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
                    <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded-full border">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: currentFolder.color }}
                      />
                      <span className="text-sm text-gray-700 font-medium">
                        {currentFolder.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Title */}
                <h1 className={`text-2xl font-bold mb-3 ${
                  task.status === "completed" ? "line-through text-gray-500" : "text-gray-900"
                }`}>
                  {task.title}
                </h1>

                {/* Description */}
                {task.description && (
                  <p className="text-gray-600 mb-4 text-lg leading-relaxed">
                    {task.description}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
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
                    <div className="flex items-center space-x-1 text-blue-600">
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
                      task.status === "completed" ? "text-green-600" :
                      task.status === "in_progress" ? "text-blue-600" : "text-gray-600"
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
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm text-gray-500">
                        {completedItems}/{totalItems} items completed
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          overallProgress === 1 ? "bg-green-500" : "bg-blue-500"
                        }`}
                        style={{ width: `${overallProgress * 100}%` }}
                      />
                    </div>
                    {/* Progress breakdown */}
                    {totalSubsteps > 0 && totalSubtasks > 0 && (
                      <div className="text-xs text-gray-500 mt-1 flex space-x-4">
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
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
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
                    className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50"
                    title="Add subtask"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none"
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <CheckSquare className="w-5 h-5 text-blue-500" />
                    <span>Steps ({completedSubsteps}/{totalSubsteps} completed)</span>
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {task.substeps?.map((substep: any) => (
                      <div key={substep.id} className="flex items-center space-x-3 py-1">
                        <input
                          type="checkbox"
                          checked={substep.is_completed}
                          className="rounded border-gray-300 w-5 h-5"
                          readOnly
                        />
                        <span
                          className={`text-sm ${
                            substep.is_completed
                              ? "line-through text-gray-500"
                              : "text-gray-700"
                          }`}
                        >
                          {substep.title}
                        </span>
                        {substep.description && (
                          <span className="text-xs text-gray-500">
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <CheckSquare className="w-5 h-5 text-green-500" />
                    <span>Subtasks ({completedSubtasks}/{totalSubtasks} completed)</span>
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    {renderSubtasks(task.id)}
                  </div>
                </div>
              )}

              {/* Notes section */}
              {task.notes && task.notes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {task.notes.map((note: any) => (
                      <div key={note.id} className="border-l-4 border-blue-200 pl-4">
                        <p className="text-gray-700">{note.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
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
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
              <div className="text-sm text-gray-500">
                {task.parent_task_id && (
                  <span className="mr-4">
                    This is a subtask
                  </span>
                )}
                Task ID: {task.id}
              </div>
              
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
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