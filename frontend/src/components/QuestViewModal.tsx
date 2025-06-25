// Create frontend/src/components/QuestViewModal.tsx

import React, { useState } from "react";
import {
  X,
  Scroll,
  Edit2,
  Trash2,
  FolderPlus,
  MoreVertical,
  ChevronLeft,
  Plus,
  Save,
  Clock,
} from "lucide-react";
import { Quest, QuestParagraph, FolderType } from "../types";

interface QuestActionDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onFolderSelect: (folderId: number | null) => void;
  onDelete: () => void;
  folders: FolderType[];
  currentFolderId: number | null;
}

const QuestActionDropdown: React.FC<QuestActionDropdownProps> = ({
  isOpen,
  onClose,
  onEdit,
  onFolderSelect,
  onDelete,
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
      <div className="absolute top-8 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-xl min-w-[180px] py-1">
        <button
          onClick={() => {
            onEdit();
            onClose();
          }}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
        >
          <Edit2 className="w-4 h-4" />
          <span>Edit Quest</span>
        </button>

        {/* Folder selection with hover submenu */}
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
              {(folders || []).map((folder) => (
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

        <hr className="my-1" />

        <button
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Quest</span>
        </button>
      </div>
    </>
  );
};

interface QuestViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  quest: Quest | null;
  folders: FolderType[];
  onEdit: (quest: Quest) => void;
  onFolderSelect: (questId: number, folderId: number | null) => void;
  onDelete: (questId: number) => void;
  onAddParagraph: (questId: number, content: string) => void;
  onUpdateParagraph: (questId: number, paragraphId: number, content: string) => void;
  onDeleteParagraph: (questId: number, paragraphId: number) => void;
}

const QuestViewModal: React.FC<QuestViewModalProps> = ({
  isOpen,
  onClose,
  quest,
  folders,
  onEdit,
  onFolderSelect,
  onDelete,
  onAddParagraph,
  onUpdateParagraph,
  onDeleteParagraph,
}) => {
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const [editingParagraphId, setEditingParagraphId] = useState<number | null>(null);
  const [editingParagraphContent, setEditingParagraphContent] = useState("");
  const [newParagraphContent, setNewParagraphContent] = useState("");

  if (!isOpen || !quest) return null;

  // Safe access to quest properties with fallbacks
  const questParagraphs = quest.paragraphs || [];
  const questTitle = quest.title || "Untitled Quest";
  const questCreatedAt = quest.created_at || new Date().toISOString();
  const questUpdatedAt = quest.updated_at || questCreatedAt;

  // Get current folder
  const currentFolder = (folders || []).find(
    (folder) => folder.id === quest.folder_id
  );

  const handleEditParagraph = (paragraph: QuestParagraph) => {
    setEditingParagraphId(paragraph.id);
    setEditingParagraphContent(paragraph.content);
  };

  const handleSaveParagraph = () => {
    if (editingParagraphId && editingParagraphContent.trim()) {
      onUpdateParagraph(quest.id, editingParagraphId, editingParagraphContent.trim());
      setEditingParagraphId(null);
      setEditingParagraphContent("");
    }
  };

  const handleCancelEditParagraph = () => {
    setEditingParagraphId(null);
    setEditingParagraphContent("");
  };

  const handleAddParagraph = () => {
    if (newParagraphContent.trim()) {
      onAddParagraph(quest.id, newParagraphContent.trim());
      setNewParagraphContent("");
    }
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
                <div className="flex items-center space-x-3 mb-2">
                  <Scroll className="w-6 h-6 text-orange-500" />
                  <span className="text-lg font-medium text-orange-700">
                    Quest
                  </span>
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
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {questTitle}
                </h1>

                {/* Metadata */}
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      Created on{" "}
                      {new Date(questCreatedAt).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      at{" "}
                      {new Date(questCreatedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <span>📝 {questParagraphs.length} paragraph{questParagraphs.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>
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
                    <QuestActionDropdown
                      isOpen={true}
                      onClose={() => setShowActionDropdown(false)}
                      onEdit={() => {
                        onEdit(quest);
                        onClose();
                      }}
                      onFolderSelect={(folderId) => {
                        onFolderSelect(quest.id, folderId);
                        setShowActionDropdown(false);
                      }}
                      onDelete={() => {
                        onDelete(quest.id);
                        onClose();
                      }}
                      folders={folders || []}
                      currentFolderId={quest.folder_id || null}
                    />
                  )}
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Paragraphs</h3>
              
              {questParagraphs.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {questParagraphs
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((paragraph, index) => (
                      <div key={paragraph.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">
                            Paragraph {index + 1}
                          </span>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleEditParagraph(paragraph)}
                              className="p-1 text-gray-400 hover:text-orange-600 rounded"
                              title="Edit paragraph"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteParagraph(quest.id, paragraph.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                              title="Delete paragraph"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {editingParagraphId === paragraph.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editingParagraphContent}
                              onChange={(e) => setEditingParagraphContent(e.target.value)}
                              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                              rows={4}
                            />
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={handleSaveParagraph}
                                disabled={!editingParagraphContent.trim()}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelEditParagraph}
                                className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {paragraph.content}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Scroll className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No paragraphs yet. Add your first paragraph below.</p>
                </div>
              )}

              {/* Add new paragraph section */}
              <div className="mt-6 bg-orange-50 rounded-lg p-4 border border-orange-200">
                <h4 className="font-medium text-gray-900 mb-3">Add New Paragraph</h4>
                <textarea
                  value={newParagraphContent}
                  onChange={(e) => setNewParagraphContent(e.target.value)}
                  placeholder="Write your new paragraph here..."
                  className="w-full border border-orange-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  rows={4}
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={handleAddParagraph}
                    disabled={!newParagraphContent.trim()}
                    className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Paragraph</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                {questUpdatedAt !== questCreatedAt && (
                  <span>
                    Last updated on{" "}
                    {new Date(questUpdatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    at{" "}
                    {new Date(questUpdatedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
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

export default QuestViewModal;