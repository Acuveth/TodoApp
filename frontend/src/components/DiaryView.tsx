import React, { useState, useRef } from 'react';
import { Plus, BookOpen, Edit, Save, X } from 'lucide-react';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSaveEntry = () => {
    if (currentEntry.trim()) {
      onNewEntry(currentEntry.trim());
      setCurrentEntry('');
      // Clear and refocus the textarea
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handleEditEntry = (entry: DiaryEntry) => {
    setEditingId(entry.id);
    setEditContent(entry.content);
  };

  const handleSaveEdit = (id: number) => {
    if (onUpdateEntry && editContent.trim()) {
      onUpdateEntry(id, editContent.trim());
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
      handleSaveEntry();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Daily Journal</h2>
        
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
            <button
              onClick={handleSaveEntry}
              disabled={!currentEntry.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Save Entry</span>
            </button>
          </div>
          
          <textarea
            ref={textareaRef}
            value={currentEntry}
            onChange={(e) => setCurrentEntry(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What's on your mind today? (Ctrl+Enter to save)"
            className="w-full h-32 border border-gray-300 rounded-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            autoFocus
          />
          
          <div className="mt-2 text-xs text-gray-500">
            Press Ctrl+Enter to save your entry
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Previous Entries</h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {diaryEntries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-900">
                        {formatDate(entry.entry_date)}
                      </h4>
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
                    
                    {editingId === entry.id ? (
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full h-24 border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        autoFocus
                      />
                    ) : (
                      <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {entry.content}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-xs text-gray-400 mt-4">
                  {new Date(entry.created_at).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </div>
              </div>
            ))}
            
            {diaryEntries.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No entries yet</p>
                <p className="text-sm text-gray-400 mt-1">Start writing your first journal entry above</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiaryView;