import React, { useState, useCallback, useEffect, memo } from 'react';
import { Plus, BookOpen, Edit, Save, X, Trash2, FolderPlus, Grid3X3, List } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { DiaryEntry, FolderType } from '../types';

interface DiaryViewProps {
  diaryEntries: DiaryEntry[];
  folders: FolderType[];
  loading: boolean;
  onNewEntry: (content: string) => void;
  onUpdateEntry?: (id: number, content: string) => void;
  onDeleteEntry?: (id: number) => void;
  onUpdateEntryFolder?: (id: number, folderId: number | null) => void;
}

// Modal component moved outside to prevent recreation
const Modal = memo<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}>(({ isOpen, onClose, title, children, size = 'lg' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>
        <div 
          className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${sizeClasses[size]} sm:w-full`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
});

const DiaryView: React.FC<DiaryViewProps> = ({ 
  diaryEntries, 
  folders,
  loading, 
  onNewEntry,
  onUpdateEntry,
  onDeleteEntry,
  onUpdateEntryFolder
}) => {
  const [currentEntry, setCurrentEntry] = useState('');
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFolderSelect, setShowFolderSelect] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [expandedEntry, setExpandedEntry] = useState<DiaryEntry | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'column'>('grid');

  // Stable callback functions
  const handleSaveEntry = useCallback(() => {
    const trimmed = currentEntry.trim();
    if (trimmed) {
      onNewEntry(trimmed);
      setCurrentEntry('');
      setShowNewEntryModal(false);
    }
  }, [currentEntry, onNewEntry]);

  const handleSaveEdit = useCallback(() => {
    const trimmed = editContent.trim();
    if (onUpdateEntry && editingEntry && trimmed) {
      onUpdateEntry(editingEntry.id, trimmed);
      setShowEditModal(false);
      setEditingEntry(null);
      setEditContent('');
    }
  }, [onUpdateEntry, editingEntry, editContent]);

  const handleShowNewEntryModal = useCallback(() => {
    setCurrentEntry('Title\n\n');
    setShowNewEntryModal(true);
  }, []);

  const handleCancelNewEntry = useCallback(() => {
    setShowNewEntryModal(false);
    setCurrentEntry('');
  }, []);

  const handleEditEntry = useCallback((entry: DiaryEntry) => {
    setEditingEntry(entry);
    const combinedText = entry.title ? `${entry.title}\n${entry.content}` : entry.content;
    setEditContent(combinedText);
    setShowEditModal(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setShowEditModal(false);
    setEditingEntry(null);
    setEditContent('');
  }, []);

  const handleDeleteEntry = useCallback((id: number) => {
    if (onDeleteEntry) {
      onDeleteEntry(id);
      setShowDeleteConfirm(null);
    }
  }, [onDeleteEntry]);

  const handleFolderSelect = useCallback((entryId: number, folderId: number | null) => {
    if (onUpdateEntryFolder) {
      onUpdateEntryFolder(entryId, folderId);
      setShowFolderSelect(null);
    }
  }, [onUpdateEntryFolder]);

  const getCurrentFolder = useCallback((entry: DiaryEntry) => {
    return folders.find(folder => folder.id === (entry as any).folder_id);
  }, [folders]);

  // Stable onChange handlers for MDEditor
  const handleCurrentEntryChange = useCallback((value?: string) => {
    setCurrentEntry(value || '');
  }, []);

  const handleEditContentChange = useCallback((value?: string) => {
    setEditContent(value || '');
  }, []);

  const handleCardClick = useCallback((entry: DiaryEntry, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    setExpandedEntry(entry);
  }, []);

  const handleAddSeparator = useCallback(() => {
    setCurrentEntry(prev => prev + '\n\n---\n\n');
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (showNewEntryModal && currentEntry.trim()) {
          handleSaveEntry();
        } else if (showEditModal && editContent.trim()) {
          handleSaveEdit();
        }
      }
    };

    if (showNewEntryModal || showEditModal) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showNewEntryModal, showEditModal, currentEntry, editContent, handleSaveEntry, handleSaveEdit]);

  return (
    <>
      <style>{`
        .diary-editor .w-md-editor {
          background-color: white;
          border-radius: 0.375rem;
        }
        
        .diary-editor .w-md-editor-text-pre,
        .diary-editor .w-md-editor-text-input {
          color: #374151 !important;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif !important;
          line-height: 1.6 !important;
          font-size: 14px !important;
        }
        
        .diary-editor .w-md-editor-text {
          border-radius: 0 0 0.375rem 0.375rem;
        }
        
        .diary-editor .w-md-editor-bar {
          border-radius: 0.375rem 0.375rem 0 0;
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .diary-content .wmde-markdown {
          background-color: transparent !important;
          color: #374151 !important;
        }
        
        .diary-content .wmde-markdown h1, 
        .diary-content .wmde-markdown h2, 
        .diary-content .wmde-markdown h3 {
          margin-top: 1em;
          margin-bottom: 0.5em;
          color: #1f2937;
        }
        
        .diary-content .wmde-markdown p {
          margin-bottom: 0.75em;
          line-height: 1.6;
        }
        
        .diary-content .wmde-markdown ul, 
        .diary-content .wmde-markdown ol {
          margin-bottom: 0.75em;
        }
        
        .diary-content .wmde-markdown blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          margin: 1em 0;
          font-style: italic;
          color: #6b7280;
          background-color: #f9fafb;
          padding: 1em;
          border-radius: 0 0.375rem 0.375rem 0;
        }
        
        .diary-content .wmde-markdown code {
          background-color: #f3f4f6;
          padding: 0.125em 0.25em;
          border-radius: 0.25rem;
          font-size: 0.875em;
          color: #1f2937;
        }
        
        .diary-content .wmde-markdown pre {
          background-color: #f3f4f6;
          padding: 1em;
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb;
        }

        .folder-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          z-index: 10;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          min-width: 200px;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-5 {
          display: -webkit-box;
          -webkit-line-clamp: 5;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-6 {
          display: -webkit-box;
          -webkit-line-clamp: 6;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      {/* Header with Controls */}
      <div className="w-full px-2">
        <div className="flex items-center justify-between mb-6">
          {/* View Toggle Buttons */}
          <div className="flex items-center space-x-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                <span>Grid</span>
              </button>
              <button
                onClick={() => setViewMode('column')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'column'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
                <span>Column</span>
              </button>
            </div>
          </div>

          {/* New Entry Button */}
          <button
            onClick={handleShowNewEntryModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Entry</span>
          </button>
        </div>

        {/* Entries Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 px-2">
            {diaryEntries.length > 0 ? `Entries (${diaryEntries.length})` : 'Entries'}
          </h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
                : "space-y-4"
            }>
              {diaryEntries.length > 0 ? (
                diaryEntries.slice().reverse().map((entry) => (
                  <div 
                    key={entry.id} 
                    className={`
                      bg-white rounded-lg shadow-sm border border-gray-200 p-8 hover:shadow-lg transition-all cursor-pointer flex flex-col
                      ${viewMode === 'grid' ? 'h-96' : 'min-h-0'}
                    `}
                    onClick={(e) => handleCardClick(entry, e)}
                  >
                    {/* Folder indicator at top */}
                    {getCurrentFolder(entry) && (
                      <div className="flex items-center space-x-2 mb-4">
                        <div 
                          className="w-5 h-5 rounded"
                          style={{ backgroundColor: getCurrentFolder(entry)?.color }}
                        />
                        <span className="text-base text-gray-500">
                          {getCurrentFolder(entry)?.name}
                        </span>
                      </div>
                    )}
                    
                    <div className={`flex-1 mb-6 ${viewMode === 'column' ? 'flex items-start space-x-6' : ''}`}>
                      <div className={viewMode === 'column' ? 'flex-1' : ''}>
                        {/* Show title separately if it exists */}
                        {entry.title && (
                          <div className={`font-semibold text-gray-900 text-xl mb-6 ${
                            viewMode === 'grid' ? 'line-clamp-3' : 'line-clamp-2'
                          }`}>
                            {viewMode === 'grid' && entry.title.length > 120 
                              ? `${entry.title.substring(0, 120)}...` 
                              : entry.title}
                          </div>
                        )}
                        
                        <div className={`text-gray-600 text-lg leading-relaxed ${
                          viewMode === 'grid' ? 'line-clamp-6' : 'line-clamp-3'
                        }`}>
                          {/* Truncate content based on view mode */}
                          {viewMode === 'grid' 
                            ? (entry.content.length > 500 
                                ? `${entry.content.substring(0, 500)}...` 
                                : entry.content)
                            : (entry.content.length > 200 
                                ? `${entry.content.substring(0, 200)}...` 
                                : entry.content)
                          }
                        </div>
                      </div>

                      {viewMode === 'column' && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditEntry(entry)}
                            className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
                            title="Edit entry"
                          >
                            <Edit className="w-6 h-6" />
                          </button>
                          
                          <div className="relative">
                            <button
                              onClick={() => setShowFolderSelect(showFolderSelect === entry.id ? null : entry.id)}
                              className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
                              title="Change folder"
                            >
                              <FolderPlus className="w-6 h-6" />
                            </button>
                            
                            {showFolderSelect === entry.id && (
                              <div className="folder-dropdown">
                                <div className="p-2">
                                  <button
                                    onClick={() => handleFolderSelect(entry.id, null)}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center space-x-2"
                                  >
                                    <div className="w-3 h-3 rounded bg-gray-300" />
                                    <span>No Folder</span>
                                  </button>
                                  {folders.map((folder) => (
                                    <button
                                      key={folder.id}
                                      onClick={() => handleFolderSelect(entry.id, folder.id)}
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
                            onClick={() => setShowDeleteConfirm(entry.id)}
                            className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete entry"
                          >
                            <Trash2 className="w-6 h-6" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className={`flex items-center justify-between border-t pt-4 mt-auto ${viewMode === 'column' ? 'min-w-0' : ''}`}>
                      <div className="text-base text-gray-400">
                        {new Date(entry.created_at).toLocaleString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true,
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      
                      {viewMode === 'grid' && (
                        <div className="flex items-center space-x-2 relative">
                          <button
                            onClick={() => handleEditEntry(entry)}
                            className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
                            title="Edit entry"
                          >
                            <Edit className="w-6 h-6" />
                          </button>
                          
                          <div className="relative">
                            <button
                              onClick={() => setShowFolderSelect(showFolderSelect === entry.id ? null : entry.id)}
                              className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
                              title="Change folder"
                            >
                              <FolderPlus className="w-6 h-6" />
                            </button>
                            
                            {showFolderSelect === entry.id && (
                              <div className="folder-dropdown">
                                <div className="p-2">
                                  <button
                                    onClick={() => handleFolderSelect(entry.id, null)}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center space-x-2"
                                  >
                                    <div className="w-3 h-3 rounded bg-gray-300" />
                                    <span>No Folder</span>
                                  </button>
                                  {folders.map((folder) => (
                                    <button
                                      key={folder.id}
                                      onClick={() => handleFolderSelect(entry.id, folder.id)}
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
                            onClick={() => setShowDeleteConfirm(entry.id)}
                            className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete entry"
                          >
                            <Trash2 className="w-6 h-6" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No entries yet</p>
                  <p className="text-sm text-gray-400 mt-1">Click "New Entry" to start writing your first journal entry</p>
                  <div className="mt-4 text-xs text-gray-400 max-w-md mx-auto">
                    <p className="font-medium mb-2">How to write entries:</p>
                    <div className="text-left space-y-1">
                      <p><strong>First line:</strong> Your entry title</p>
                      <p><strong>Second line onwards:</strong> Your diary content</p>
                      <p><code className="bg-gray-100 px-1 rounded">**bold**</code> for <strong>bold text</strong></p>
                      <p><code className="bg-gray-100 px-1 rounded">*italic*</code> for <em>italic text</em></p>
                      <p><code className="bg-gray-100 px-1 rounded">- item</code> for bullet lists</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Entry Modal */}
      <Modal
        isOpen={showNewEntryModal}
        onClose={handleCancelNewEntry}
        title={`New Entry - ${new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}`}
        size="xl"
      >
        <div className="space-y-4">
          <div className="diary-editor">
            <MDEditor
              value={currentEntry}
              onChange={handleCurrentEntryChange}
              preview="edit"
              hideToolbar={false}
              height={350}
              data-color-mode="light"
            />
          </div>
          
          <div className="text-xs text-gray-500 flex items-center justify-between">
            <span>First line becomes your title. Use Markdown for formatting. Press Ctrl+Enter to save</span>
            <button
              onClick={handleAddSeparator}
              className="text-blue-600 hover:text-blue-800 text-xs"
              title="Add separator"
            >
              Add separator
            </button>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleCancelNewEntry}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEntry}
              disabled={!currentEntry.trim()}
              className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Entry</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Entry Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCancelEdit}
        title={editingEntry ? `Edit Entry - ${editingEntry.title || 'Untitled'}` : 'Edit Entry'}
        size="xl"
      >
        <div className="space-y-4">
          <div className="diary-editor">
            <MDEditor
              value={editContent}
              onChange={handleEditContentChange}
              preview="edit"
              hideToolbar={false}
              height={350}
              data-color-mode="light"
            />
          </div>
          
          <div className="text-xs text-gray-500">
            First line becomes your title. Use Markdown for formatting. Press Ctrl+Enter to save
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleCancelEdit}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={!editContent.trim()}
              className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Expanded Entry Modal */}
      {expandedEntry && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setExpandedEntry(null)}></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {/* Folder indicator */}
                    {getCurrentFolder(expandedEntry) && (
                      <div className="flex items-center space-x-2 mb-3">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: getCurrentFolder(expandedEntry)?.color }}
                        />
                        <span className="text-sm text-gray-500">
                          {getCurrentFolder(expandedEntry)?.name}
                        </span>
                      </div>
                    )}
                    
                    {/* Title */}
                    {expandedEntry.title && (
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        {expandedEntry.title}
                      </h2>
                    )}
                    
                    {/* Date */}
                    <div className="text-sm text-gray-500 mb-4">
                      {new Date(expandedEntry.created_at).toLocaleString('en-US', { 
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true
                      })}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setExpandedEntry(null)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
                      title="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Content */}
                <div className="diary-content prose prose-sm max-w-none text-gray-700 leading-relaxed max-h-96 overflow-y-auto mb-6">
                  <MDEditor.Markdown 
                    source={expandedEntry.content}
                  />
                </div>
                
                {/* Action buttons at bottom */}
                <div className="flex items-center justify-end space-x-2 border-t pt-4">
                  <button
                    onClick={() => {
                      setExpandedEntry(null);
                      handleEditEntry(expandedEntry);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
                    title="Edit entry"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  
                  <div className="relative">
                    <button
                      onClick={() => setShowFolderSelect(showFolderSelect === expandedEntry.id ? null : expandedEntry.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
                      title="Change folder"
                    >
                      <FolderPlus className="w-5 h-5" />
                    </button>
                    
                    {showFolderSelect === expandedEntry.id && (
                      <div className="folder-dropdown">
                        <div className="p-2">
                          <button
                            onClick={() => {
                              handleFolderSelect(expandedEntry.id, null);
                              setExpandedEntry(null);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center space-x-2"
                          >
                            <div className="w-3 h-3 rounded bg-gray-300" />
                            <span>No Folder</span>
                          </button>
                          {folders.map((folder) => (
                            <button
                              key={folder.id}
                              onClick={() => {
                                handleFolderSelect(expandedEntry.id, folder.id);
                                setExpandedEntry(null);
                              }}
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
                    onClick={() => {
                      setExpandedEntry(null);
                      setShowDeleteConfirm(expandedEntry.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Delete entry"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowDeleteConfirm(null)}></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Diary Entry
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this diary entry? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => handleDeleteEntry(showDeleteConfirm)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DiaryView;