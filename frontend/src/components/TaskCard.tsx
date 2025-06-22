import React from "react";
import {
  Clock,
  ChevronRight,
  ChevronDown,
  Circle,
  CheckCircle2,
  Flag,
  Plus,
  ChevronLeft,
} from "lucide-react";
import { Task } from "../types";

interface TaskCardProps {
  task: Task;
  isExpanded: boolean;
  onToggleExpansion: (taskId: number) => void;
  onToggleStatus: (task: Task) => void;
  onCreateSubtask?: (parentTaskId: number) => void;
  onIndentTask?: (taskId: number, direction: "left" | "right") => void;
  allTasks: Task[]; // All tasks for calculating hierarchy
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isExpanded,
  onToggleExpansion,
  onToggleStatus,
  onCreateSubtask,
  onIndentTask,
  allTasks = [],
}) => {
  // Calculate substep progress (traditional substeps)
  const completedSubsteps =
    task.substeps?.filter((s) => s.is_completed).length || 0;
  const totalSubsteps = task.substeps?.length || 0;

  // Calculate subtask progress (child tasks)
  const subtasks = allTasks.filter((t) => t.parent_task_id === task.id);
  const completedSubtasks = subtasks.filter(
    (t) => t.status === "completed"
  ).length;
  const totalSubtasks = subtasks.length;
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

  // Indentation styling
  const indentStyle = {
    marginLeft: `${task.indent_level * 24}px`,
  };

  // Hierarchy visual indicator
  const showVerticalLine = task.indent_level > 0;

  return (
    <div className="relative">
      {/* Hierarchy visual line */}
      {showVerticalLine && (
        <div
          className="absolute left-0 top-0 bottom-0 border-l-2 border-gray-200"
          style={{ marginLeft: `${(task.indent_level - 1) * 24 + 11}px` }}
        />
      )}

      <div
        className="bg-white rounded-lg shadow-sm border border-gray-200 mb-3 hover:shadow-md transition-shadow"
        style={indentStyle}
      >
        <div className="p-4">
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
                  <p className="text-gray-600 text-sm mt-1">
                    {task.description}
                  </p>
                )}

                {/* Progress bar */}
                {totalItems > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <div className="bg-gray-200 rounded-full h-2 flex-1">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            overallProgress === 1
                              ? "bg-green-500"
                              : "bg-blue-500"
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
                    {completedSubtasks > 0 &&
                      ` (${completedSubtasks} completed)`}
                  </div>
                )}

                {/* Due date */}
                {task.due_date && (
                  <div className="flex items-center space-x-1 mt-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(task.due_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-1">
              {/* Indent controls */}
              {onIndentTask && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onIndentTask(task.id, "left")}
                    disabled={task.indent_level === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                    title="Move left (outdent)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onIndentTask(task.id, "right")}
                    disabled={task.indent_level >= 5} // Max 5 levels
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                    title="Move right (indent)"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Add subtask button */}
              {onCreateSubtask && (
                <button
                  onClick={() => onCreateSubtask(task.id)}
                  className="p-1 text-gray-400 hover:text-blue-600 rounded"
                  title="Add subtask"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}

              {/* Expand/collapse button */}
              {(totalSubsteps > 0 || hasSubtasks) && (
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

        {/* Expanded content for substeps */}
        {isExpanded && task.substeps && task.substeps.length > 0 && (
          <div className="border-t border-gray-100 p-4 bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-2">Steps</h4>
            <div className="space-y-2">
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

        {/* Expanded content for child tasks */}
        {isExpanded && hasSubtasks && (
          <div className="border-t border-gray-100 p-4 bg-blue-50">
            <h4 className="font-medium text-gray-900 mb-2">Subtasks</h4>
            <div className="text-sm text-gray-600">
              {subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center space-x-2 py-1"
                >
                  <div
                    className={`w-3 h-3 rounded-full ${
                      subtask.status === "completed"
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                  <span
                    className={
                      subtask.status === "completed"
                        ? "line-through text-gray-500"
                        : "text-gray-700"
                    }
                  >
                    {subtask.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
