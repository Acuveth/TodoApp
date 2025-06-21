import React, { useState, useCallback } from 'react';
import { Plus, BookOpen, Edit, Save, X } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { DiaryEntry } from '../types';

interface DiaryViewProps {
  diaryEntries: DiaryEntry[];
  loading: boolean;
  onNewEntry: (content: string) => void;
  onUpdateEntry?: (id: number, content: string) => void;
}

const DiaryView: React.FC<DiaryViewProps> = ({ 
  diaryEntries, 
  loading, 
  onNewEntry,
  onUpdateEntry
}) => {
  const [currentEntry, setCurrentEntry] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showNewEntryEditor, setShowNewEntryEditor] = useState(false);

  const handleSaveEntry = useCallback(() => {
    if (currentEntry.trim()) {
      onNewEntry(currentEntry.trim()); // Just pass the full text to parent
      setCurrentEntry('');
      setShowNewEntryEditor(false);
    }
  }, [currentEntry, onNewEntry]);

  const handleShowEditor = () => {
    setShowNewEntryEditor(true);
    setCurrentEntry('My Diary Title\n\nStart writing your diary entry here...');
  };

  const handleCancelNewEntry = () => {
    setShowNewEntryEditor(false);
    setCurrentEntry('');
  };

  const handleEditEntry = (entry: DiaryEntry) => {
    setEditingId(entry.id);
    // Combine title and content for editing
    const combinedText = entry.title ? `${entry.title}\n${entry.content}` : entry.content;
    setEditContent(combinedText);
  };

  const handleSaveEdit = (id: number) => {
    if (onUpdateEntry && editContent.trim()) {
      onUpdateEntry(id, editContent.trim()); // Just pass the full text to parent
    }
    setEditingId(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (showNewEntryEditor) {
        handleSaveEntry();
      }
    }
  };

  const formatDate = (dateString: string, createdAt: string) => {
    const date = new Date(dateString);
    const created = new Date(createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateLabel = '';
    if (date.toDateString() === today.toDateString()) {
      dateLabel = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateLabel = 'Yesterday';
    } else {
      dateLabel = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }

    const timeLabel = created.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    return `${dateLabel} at ${timeLabel}`;
  };

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

        .entry-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #e5e7eb;
        }
      `}</style>
      
      <div className="max-w-4xl mx-auto">
        {/* Header with Add Entry Button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Daily Journal</h2>
          {!showNewEntryEditor && (
            <button
              onClick={handleShowEditor}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Entry</span>
            </button>
          )}
        </div>

        {/* New Entry Editor */}
        {showNewEntryEditor && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCancelNewEntry}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEntry}
                    disabled={!currentEntry.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Entry</span>
                  </button>
                </div>
              </div>
              
              <div className="diary-editor" onKeyDown={handleKeyDown}>
                <MDEditor
                  value={currentEntry}
                  onChange={(val) => setCurrentEntry(val || '')}
                  preview="edit"
                  hideToolbar={false}
                  height={250}
                  data-color-mode="light"
                />
              </div>
              
              <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                <span>First line becomes your title. Use Markdown for formatting. Press Ctrl+Enter to save</span>
                <button
                  onClick={() => setCurrentEntry(currentEntry + '\n\n---\n\n')}
                  className="text-blue-600 hover:text-blue-800 text-xs"
                  title="Add separator"
                >
                  Add separator
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Previous Entries Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {diaryEntries.length > 0 ? `Entries (${diaryEntries.length})` : 'Entries'}
          </h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {diaryEntries.length > 0 ? (
                diaryEntries.map((entry) => (
                  <div key={entry.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            {entry.title && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {formatDate(entry.entry_date, entry.created_at)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {editingId === entry.id ? (
                              <>
                                <button
                                  onClick={() => handleSaveEdit(entry.id)}
                                  disabled={!editContent.trim()}
                                  className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                                  title="Save changes"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                  title="Cancel editing"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleEditEntry(entry)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                                title="Edit entry"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Show title separately if it exists */}
                        {entry.title && !editingId && (
                          <div className="entry-title">
                            {entry.title}
                          </div>
                        )}
                        
                        {editingId === entry.id ? (
                          <div className="diary-editor">
                            <MDEditor
                              value={editContent}
                              onChange={(val) => setEditContent(val || '')}
                              preview="edit"
                              height={200}
                              data-color-mode="light"
                            />
                          </div>
                        ) : (
                          <div className="diary-content prose prose-sm max-w-none text-gray-700 leading-relaxed">
                            <MDEditor.Markdown 
                              source={entry.content}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-400 mt-4">
                      Created: {new Date(entry.created_at).toLocaleString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true,
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
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
    </>
  );
};

export default DiaryView;