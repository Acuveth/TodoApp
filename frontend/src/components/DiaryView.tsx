import React from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { DiaryEntry } from '../types';

interface DiaryViewProps {
  diaryEntries: DiaryEntry[];
  loading: boolean;
  onNewEntry: () => void;
}

const DiaryView: React.FC<DiaryViewProps> = ({ 
  diaryEntries, 
  loading, 
  onNewEntry 
}) => {
  const getMoodEmoji = (mood: number) => {
    switch (mood) {
      case 1: return '😢';
      case 2: return '😕';
      case 3: return '😐';
      case 4: return '😊';
      case 5: return '😄';
      default: return '😐';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Diary Entries</h2>
          <p className="text-gray-600">{diaryEntries.length} entries</p>
        </div>
        <button 
          onClick={onNewEntry}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Entry</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {diaryEntries.map(entry => (
            <div key={entry.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {entry.title || `Entry for ${new Date(entry.entry_date).toLocaleDateString()}`}
                  </h3>
                  <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                    <span>{new Date(entry.entry_date).toLocaleDateString()}</span>
                    {entry.mood && (
                      <span className="flex items-center space-x-1">
                        <span>Mood:</span>
                        <span className="text-lg">{getMoodEmoji(entry.mood)}</span>
                      </span>
                    )}
                    {entry.weather && (
                      <span>Weather: {entry.weather}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-gray-700 whitespace-pre-wrap">
                {entry.content}
              </div>
            </div>
          ))}
          
          {diaryEntries.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No diary entries yet</p>
              <button 
                onClick={onNewEntry}
                className="text-blue-600 hover:text-blue-800 text-sm mt-2"
              >
                Write your first entry
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiaryView;