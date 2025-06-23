import React, { useState, useEffect } from "react";
import {
  Clock,
  ChevronRight,
  ChevronDown,
  Circle,
  CheckCircle2,
  Flag,
  Plus,
  Eye,
  EyeOff,
} from "lucide-react";
import { Task } from "../types";

interface TaskCardProps {
  task: Task;
  isExpanded: boolean;
  onToggleExpansion: (taskId: number) => void;
  onToggleStatus: (task: Task) => void;
  onCreateSubtask?: (parentTaskId: number) => void;
  allTasks: Task[]; // All tasks for calculating hierarchy
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isExpanded,
  onToggleExpansion,
  onToggleStatus,
  onCreateSubtask,
  allTasks = [],
}) => {
  // Hidden subtasks state with localStorage persistence
  const [hiddenSubtasks, setHiddenSubtasks] = useState<Set<number>>(() => {
    try {
      const stored = localStorage.getItem("hiddenSubtasks");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Save to localStorage whenever hiddenSubtasks changes
  useEffect(() => {
    try {
      localStorage.setItem(
        "hiddenSubtasks",
        JSON.stringify(Array.from(hiddenSubtasks))
      );
    } catch (error) {
      console.error("Failed to save hidden subtasks to localStorage:", error);
    }
  }, [hiddenSubtasks]);

  const toggleSubtaskVisibility = (taskId: number) => {
    setHiddenSubtasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const areSubtasksHidden = hiddenSubtasks.has(task.id);

  // Calculate substep progress (traditional substeps)
  const completedSubsteps =
    task.substeps?.filter((s) => s.is_completed).length || 0;
  const totalSubsteps = task.substeps?.length || 0;

  // Calculate subtask progress (child tasks) - recursively
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

  // Overall progress calculation
  const totalItems = totalSubsteps + totalSubtasks;
  const completedItems = completedSubsteps + completedSubtasks;
  const overallProgress = totalItems > 0 ? completedItems / totalItems : 0;

  // Auto-completion suggestion
  const shouldAutoComplete =
    hasSubtasks &&
    completedSubtasks === totalSubtasks &&
    totalSubtasks > 0 &&
    task.status !== "completed";

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

  const getStatusIcon = (status: string, onClick?: () => void) => {
    switch (status) {
      case "completed":
        return (
          <button
            onClick={onClick}
            className="hover:scale-110 transition-transform"
          >
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </button>
        );
      case "in_progress":
        return (
          <button
            onClick={onClick}
            className="hover:scale-110 transition-transform"
          >
            <Circle className="w-5 h-5 text-blue-500" />
          </button>
        );
      default:
        return (
          <button
            onClick={onClick}
            className="hover:scale-110 transition-transform"
          >
            <Circle className="w-5 h-5 text-gray-400" />
          </button>
        );
    }
  };

  // Recursive subtask renderer
  const renderSubtasks = (
    parentId: number,
    level: number = 0
  ): React.ReactElement[] => {
    const directSubtasks = allTasks.filter(
      (t) => t.parent_task_id === parentId
    );

    return directSubtasks.map((subtask) => {
      const nestedSubtasks = allTasks.filter(
        (t) => t.parent_task_id === subtask.id
      );
      const hasNested = nestedSubtasks.length > 0;

      return (
        <div key={subtask.id}>
          <div
            className="flex items-start space-x-2 mt-2 "
            style={{ marginLeft: `${24 * (level + 1)}px` }} // Indent based on nesting level
          >
            {getStatusIcon(subtask.status, () => onToggleStatus(subtask))}
            <div className="flex-1 ">
              <div className="flex items-center space-x-2 ">
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
                  className={`w-4 h-4 ${getPriorityColor(subtask.priority)}`}
                />
              </div>
              {subtask.description && (
                <p className="text-gray-600 mt-1">{subtask.description}</p>
              )}
              {subtask.due_date && (
                <div className="flex items-center space-x-1 mt-1 text-gray-500">
                  <Clock className="w-2 h-2" />
                  <span className="text-xs">
                    {new Date(subtask.due_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            {/* Add subtask button for nested subtasks */}
            {onCreateSubtask && (
              <button
                onClick={() => onCreateSubtask(subtask.id)}
                className="p-1 text-gray-400 hover:text-blue-600 rounded"
                title="Add subtask"
              >
                <Plus className="w-6 h-6" />
              </button>
            )}
          </div>
          {/* Recursively render nested subtasks */}
          {hasNested && renderSubtasks(subtask.id, level + 1)}
        </div>
      );
    });
  };

  // Indentation styling
  const indentStyle = {
    marginLeft: `${task.indent_level * 24}px`,
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
      style={indentStyle}
    >
      <div className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {getStatusIcon(task.status, () => onToggleStatus(task))}

            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3
                  className={`font-medium cursor-pointer ${
                    task.status === "completed"
                      ? "line-through text-gray-500"
                      : "text-gray-900"
                  } ${shouldAutoComplete ? "text-green-600" : ""}`}
                  onClick={() => onToggleExpansion(task.id)}
                >
                  {task.title}
                </h3>
                <Flag
                  className={`w-4 h-4 ${getPriorityColor(task.priority)}`}
                />

                {/* Auto-completion indicator */}
                {shouldAutoComplete && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    Ready to complete
                  </span>
                )}
              </div>

              {task.description && (
                <p className="text-gray-600 mt-1">{task.description}</p>
              )}

              {/* Progress bar */}
              {totalItems > 0 && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="bg-gray-200 rounded-full h-2 flex-1">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          overallProgress === 1 ? "bg-green-500" : "bg-blue-500"
                        }`}
                        style={{ width: `${overallProgress * 100}%` }}
                      />
                    </div>
                    <span>
                      {completedItems}/{totalItems}
                    </span>
                  </div>

                  {/* Progress breakdown */}
                  {totalSubsteps > 0 && totalSubtasks > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Steps: {completedSubsteps}/{totalSubsteps}, Subtasks:{" "}
                      {completedSubtasks}/{totalSubtasks}
                    </div>
                  )}
                </div>
              )}

              {/* Subtask indicator */}
              {hasSubtasks && (
                <div className="mt-2 text-sm text-gray-600">
                  📁 {totalSubtasks} subtask{totalSubtasks !== 1 ? "s" : ""}
                  {completedSubtasks > 0 && ` (${completedSubtasks} completed)`}
                  {areSubtasksHidden && " (hidden)"}
                </div>
              )}

              {/* Due date */}
              {task.due_date && (
                <div className="flex items-center space-x-1 mt-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(task.due_date).toLocaleDateString()}</span>
                </div>
              )}

              {/* Recursively render all subtasks - only if not hidden */}
              {hasSubtasks && !areSubtasksHidden && (
                <div className="mt-1">{renderSubtasks(task.id)}</div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-1">
            {/* Hide/Show subtasks button */}
            {hasSubtasks && (
              <button
                onClick={() => toggleSubtaskVisibility(task.id)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                title={areSubtasksHidden ? "Show subtasks" : "Hide subtasks"}
              >
                {areSubtasksHidden ? (
                  <EyeOff className="w-6 h-6" />
                ) : (
                  <Eye className="w-6 h-6" />
                )}
              </button>
            )}

            {/* Add subtask button */}
            {onCreateSubtask && (
              <button
                onClick={() => onCreateSubtask(task.id)}
                className="p-1 text-gray-400 hover:text-blue-600 rounded"
                title="Add subtask"
              >
                <Plus className="w-6 h-6" />
              </button>
            )}

            {/* Expand/collapse button - only show if there are traditional substeps */}
            {totalSubsteps > 0 && (
              <button onClick={() => onToggleExpansion(task.id)}>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded content for traditional substeps only */}
      {isExpanded && task.substeps && task.substeps.length > 0 && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <h4 className="font-medium text-gray-900">Steps</h4>
          <div className="space-y-1">
            {task.substeps.map((substep: any) => (
              <div key={substep.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={substep.is_completed}
                  className="rounded border-gray-300"
                  readOnly
                />
                <span
                  className={
                    substep.is_completed
                      ? "line-through text-gray-500"
                      : "text-gray-700"
                  }
                >
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

export default TaskCard;
