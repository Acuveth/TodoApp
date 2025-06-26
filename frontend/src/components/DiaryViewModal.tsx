import React, { useState } from "react";
import {
  X,
  BookOpen,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  FolderPlus,
  MoreVertical,
  ChevronLeft,
} from "lucide-react";
import { DiaryEntry, FolderType } from "../types";

interface DiaryActionDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onSchedule: () => void;
  onFolderSelect: (folderId: number | null) => void;
  onDelete: () => void;
  isScheduled: boolean;
  folders: FolderType[];
  currentFolderId: number | null;
}

const DiaryActionDropdown: React.FC<DiaryActionDropdownProps> = ({
  isOpen,
  onClose,
  onEdit,
  onSchedule,
  onFolderSelect,
  onDelete,
  isScheduled,
  folders,
  currentFolderId,
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
          <span>Edit Entry</span>
        </button>

        <button
          onClick={() => {
            onSchedule();
            onClose();
          }}
          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
        >
          <Calendar className="w-4 h-4" />
          <span>{isScheduled ? "Reschedule" : "Schedule"}</span>
        </button>

        {/* Folder selection with hover submenu */}
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

        <hr className="my-1 border-gray-600" />

        <button
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 flex items-center space-x-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Entry</span>
        </button>
      </div>
    </>
  );
};

interface DiaryViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: DiaryEntry | null;
  folders: FolderType[];
  onEdit: (entry: DiaryEntry) => void;
  onSchedule: (entry: DiaryEntry) => void;
  onFolderSelect: (entryId: number, folderId: number | null) => void;
  onDelete: (entryId: number) => void;
}

const DiaryViewModal: React.FC<DiaryViewModalProps> = ({
  isOpen,
  onClose,
  entry,
  folders,
  onEdit,
  onSchedule,
  onFolderSelect,
  onDelete,
}) => {
  const [showActionDropdown, setShowActionDropdown] = useState(false);

  if (!isOpen || !entry) return null;

  // Get current folder
  const currentFolder = folders.find(
    (folder) => folder.id === (entry as any).folder_id
  );

  // Format scheduled time
  const formatScheduledTime = (scheduledDate: string) => {
    const date = new Date(scheduledDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) {
      return `Today ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (isTomorrow) {
      return `Tomorrow ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
  };

  // Simple markdown-like formatting for display
  const formatContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br />");
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
                <div className="flex items-center space-x-3 mb-2">
                  <BookOpen className="w-6 h-6 text-purple-400" />
                  <span className="text-lg font-medium text-purple-300">
                    Diary Entry
                  </span>
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
                {entry.title && (
                  <h1 className="text-2xl font-bold text-white mb-2">
                    {entry.title}
                  </h1>
                )}

                {/* Metadata */}
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      Created on{" "}
                      {new Date(entry.created_at).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      at{" "}
                      {new Date(entry.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Schedule indicator */}
                  {entry.is_scheduled && entry.scheduled_date && (
                    <div className="flex items-center space-x-1 text-blue-300">
                      <Calendar className="w-4 h-4" />
                      <span>Scheduled for {formatScheduledTime(entry.scheduled_date)}</span>
                    </div>
                  )}
                </div>
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
                    <DiaryActionDropdown
                      isOpen={true}
                      onClose={() => setShowActionDropdown(false)}
                      onEdit={() => {
                        onEdit(entry);
                        onClose();
                      }}
                      onSchedule={() => {
                        onSchedule(entry);
                        onClose();
                      }}
                      onFolderSelect={(folderId) => {
                        onFolderSelect(entry.id, folderId);
                        setShowActionDropdown(false);
                      }}
                      onDelete={() => {
                        onDelete(entry.id);
                        onClose();
                      }}
                      isScheduled={entry.is_scheduled}
                      folders={folders}
                      currentFolderId={(entry as any).folder_id || null}
                    />
                  )}
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-full text-gray-400 hover:text-gray-300 hover:bg-gray-700 focus:outline-none"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="mb-6">
              <div className="max-h-96 overflow-y-auto">
                <div
                  className="prose prose-lg max-w-none text-gray-300 leading-relaxed prose-invert"
                  dangerouslySetInnerHTML={{
                    __html: formatContent(entry.content),
                  }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-600">
              <div className="text-sm text-gray-400">
                {entry.updated_at !== entry.created_at && (
                  <span>
                    Last updated on{" "}
                    {new Date(entry.updated_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    at{" "}
                    {new Date(entry.updated_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
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

export default DiaryViewModal;