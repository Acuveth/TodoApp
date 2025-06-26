// Redesigned frontend/src/components/QuestCard.tsx

import React, { useState } from "react";
import {
  Scroll,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  MoreVertical,
  FolderPlus,
  ChevronLeft,
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
      <div className="absolute top-8 right-0 z-50 bg-gray-800 border border-gray-600 rounded-md shadow-xl min-w-[180px] py-1">
        <button
          onClick={() => {
            onEdit();
            onClose();
          }}
          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
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
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2 ${
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
              {(folders || []).map((folder) => (
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
          <span>Delete Quest</span>
        </button>
      </div>
    </>
  );
};

interface QuestCardProps {
  quest: Quest;
  folders: FolderType[];
  onUpdateQuest: (questId: number, updates: any) => void;
  onDeleteQuest: (questId: number) => void;
  onAddParagraph: (questId: number, content: string) => void;
  onUpdateParagraph: (
    questId: number,
    paragraphId: number,
    content: string
  ) => void;
  onDeleteParagraph: (questId: number, paragraphId: number) => void;
}

const QuestCard: React.FC<QuestCardProps> = ({
  quest,
  folders,
  onUpdateQuest,
  onDeleteQuest,
  onAddParagraph,
  onUpdateParagraph,
  onDeleteParagraph,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(quest.title);
  const [editingParagraphId, setEditingParagraphId] = useState<number | null>(
    null
  );
  const [editingParagraphContent, setEditingParagraphContent] = useState("");
  const [newParagraphContent, setNewParagraphContent] = useState("");
  const [showAddParagraph, setShowAddParagraph] = useState(false);
  const [showActionDropdown, setShowActionDropdown] = useState(false);

  // Safe access to quest properties with fallbacks
  const questParagraphs = quest.paragraphs || [];
  const questTitle = quest.title || "Untitled Quest";
  const currentFolder = (folders || []).find(
    (folder) => folder.id === quest.folder_id
  );

  const handleSaveTitle = () => {
    if (editingTitle.trim() && editingTitle.length <= 200) {
      onUpdateQuest(quest.id, { title: editingTitle.trim() });
      setIsEditingTitle(false);
    }
  };

  const handleCancelEditTitle = () => {
    setEditingTitle(questTitle);
    setIsEditingTitle(false);
  };

  const handleEditParagraph = (paragraph: QuestParagraph) => {
    setEditingParagraphId(paragraph.id);
    setEditingParagraphContent(paragraph.content);
  };

  const handleSaveParagraph = () => {
    if (editingParagraphId && editingParagraphContent.trim()) {
      onUpdateParagraph(
        quest.id,
        editingParagraphId,
        editingParagraphContent.trim()
      );
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
      setShowAddParagraph(false);
    }
  };

  const handleFolderSelect = (folderId: number | null) => {
    onUpdateQuest(quest.id, { folder_id: folderId });
  };

  return (
    <div
      className="bg-gray-800  rounded-lg shadow-sm border-2 border-gray-600 hover:shadow-md transition-shadow"
      style={
        currentFolder
          ? {
              borderLeft: `4px solid ${currentFolder.color}`,
              backgroundColor: `${currentFolder.color}08`,
            }
          : {}
      }
    >
      <div className="p-4">
        {/* Header with Quest indicator and folder */}
        <div className="flex items-center space-x-2 mb-3">
          <Scroll className="w-5 h-5 text-orange-400" />
          <span className="text-sm font-medium text-orange-300">Quest</span>
          {/* Folder indicator */}
          {currentFolder && (
            <div className="flex items-center space-x-2 bg-gray-700/80 backdrop-blur-sm px-2 py-1 rounded-full border border-gray-600">
              <div
                className="w-3 h-3 rounded-full border border-gray-500 shadow-sm"
                style={{ backgroundColor: currentFolder.color }}
              />
              <span className="text-xs text-gray-300 font-medium">
                {currentFolder.name}
              </span>
            </div>
          )}
        </div>

        {/* Title with action buttons */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {/* Title */}
            {isEditingTitle ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) =>
                    setEditingTitle(e.target.value.slice(0, 200))
                  }
                  className="w-full text-lg font-medium border border-orange-600 bg-gray-700 text-white rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  maxLength={200}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveTitle();
                    } else if (e.key === "Escape") {
                      handleCancelEditTitle();
                    }
                  }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {editingTitle.length}/200 characters
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveTitle}
                      disabled={
                        !editingTitle.trim() || editingTitle.length > 200
                      }
                      className="p-1 text-green-400 hover:text-green-300 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEditTitle}
                      className="p-1 text-gray-400 hover:text-gray-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <h3 className="text-lg font-medium text-white">{questTitle}</h3>
            )}

            {/* Paragraph count and creation date */}
            <div className="mt-1 text-sm text-gray-400">
              📝 {questParagraphs.length} paragraph
              {questParagraphs.length !== 1 ? "s" : ""}
              <span className="text-xs text-gray-400 ml-2">
                Created {new Date(quest.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-1 ml-4">
            {/* Add paragraph button */}
            <button
              onClick={() => setShowAddParagraph(!showAddParagraph)}
              className="p-2 text-gray-400 hover:text-gray-200 rounded-full"
              title="Add paragraph"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Action dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowActionDropdown(!showActionDropdown)}
                className="p-1 text-gray-400 hover:text-gray-200 rounded"
                title="More actions"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showActionDropdown && (
                <QuestActionDropdown
                  isOpen={true}
                  onClose={() => setShowActionDropdown(false)}
                  onEdit={() => setIsEditingTitle(true)}
                  onFolderSelect={handleFolderSelect}
                  onDelete={() => onDeleteQuest(quest.id)}
                  folders={folders || []}
                  currentFolderId={quest.folder_id || null}
                />
              )}
            </div>
          </div>
        </div>

        {/* Add new paragraph section - always visible when active */}
        {showAddParagraph && (
          <div className="mb-4 bg-gray-800 rounded-lg p-3 border border-gray-600">
            <textarea
              value={newParagraphContent}
              onChange={(e) => setNewParagraphContent(e.target.value)}
              placeholder="Write your new paragraph here..."
              className="w-full rounded px-3 py-2 border border-gray-600  bg-gray-800 resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex justify-end mt-2 space-x-2">
              <button
                onClick={() => {
                  setShowAddParagraph(false);
                  setNewParagraphContent("");
                }}
                className="px-3 py-1 text-white hover:text-orange-500 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAddParagraph}
                disabled={!newParagraphContent.trim()}
                className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Add Paragraph
              </button>
            </div>
          </div>
        )}

        {/* Paragraphs - always visible */}
        <div className="space-y-3">
          {questParagraphs
            .sort((a, b) => a.order_index - b.order_index)
            .map((paragraph, index) => (
              <div
                key={paragraph.id}
                className="bg-gray-700 rounded-lg p-3 border border-gray-600"
              >
                {editingParagraphId === paragraph.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editingParagraphContent}
                      onChange={(e) =>
                        setEditingParagraphContent(e.target.value)
                      }
                      className="w-full border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                      rows={3}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          handleCancelEditParagraph();
                        }
                      }}
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={handleCancelEditParagraph}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleSaveParagraph}
                        disabled={!editingParagraphContent.trim()}
                        className="p-1 text-green-400 hover:text-green-300 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-white leading-relaxed whitespace-pre-wrap">
                        {paragraph.content}
                      </p>
                    </div>
                    <div className="flex space-x-1 ml-3">
                      <button
                        onClick={() => handleEditParagraph(paragraph)}
                        className="p-1 text-gray-400 hover:text-orange-400 rounded"
                        title="Edit paragraph"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          onDeleteParagraph(quest.id, paragraph.id)
                        }
                        className="p-1 text-gray-400 hover:text-red-400 rounded"
                        title="Delete paragraph"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

          {/* Empty state */}
          {questParagraphs.length === 0 && !showAddParagraph && (
            <div className="text-center py-6 text-gray-500">
              <Scroll className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No paragraphs yet</p>
              <button
                onClick={() => setShowAddParagraph(true)}
                className="text-sm text-orange-600 hover:text-orange-700 mt-1"
              >
                Add your first paragraph
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestCard;
