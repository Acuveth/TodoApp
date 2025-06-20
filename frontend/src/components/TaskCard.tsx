import React from 'react';
import { 
  Clock, 
  ChevronRight,
  ChevronDown,
  Circle,
  CheckCircle2,
  Flag
} from 'lucide-react';
import { Task, TaskSubstep } from '../types';

interface TaskCardProps {
  task: Task;
  isExpanded: boolean;
  onToggleExpansion: (taskId: number) => void;
  onToggleStatus: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  isExpanded, 
  onToggleExpansion, 
  onToggleStatus 
}) => {
  const completedSubsteps = task.substeps?.filter((s: TaskSubstep) => s.is_completed).length || 0;
  const totalSubsteps = task.substeps?.length || 0;

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 3: return 'text-red-500';
      case 2: return 'text-yellow-500';
      case 1: return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string, onClick?: () => void) => {
    switch (status) {
      case 'completed': 
        return (
          <button onClick={onClick} className="hover:scale-110 transition-transform">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </button>
        );
      case 'in_progress': 
        return (
          <button onClick={onClick} className="hover:scale-110 transition-transform">
            <Circle className="w-5 h-5 text-blue-500" />
          </button>
        );
      default: 
        return (
          <button onClick={onClick} className="hover:scale-110 transition-transform">
            <Circle className="w-5 h-5 text-gray-400" />
          </button>
        );
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-3 hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {getStatusIcon(task.status, () => onToggleStatus(task))}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 
                  className={`font-medium cursor-pointer ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}
                  onClick={() => onToggleExpansion(task.id)}
                >
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
              <button onClick={() => onToggleExpansion(task.id)}>
                {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {isExpanded && task.substeps && task.substeps.length > 0 && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-2">Subtasks</h4>
          <div className="space-y-2">
            {task.substeps.map((substep: TaskSubstep) => (
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

export default TaskCard;