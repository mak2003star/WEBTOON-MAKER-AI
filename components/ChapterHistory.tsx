import React from 'react';
import type { Chapter } from '../types';

interface ChapterHistoryProps {
  chapters: Chapter[];
  onSelect: (chapterId: string) => void;
  onDelete: (chapterId: string) => void;
}

const ChapterHistory: React.FC<ChapterHistoryProps> = ({ chapters, onSelect, onDelete }) => {
  if (chapters.length === 0) {
    return (
        <div className="bg-gray-800/50 rounded-lg p-6 shadow-md border border-gray-700">
          <h2 className="text-2xl font-semibold mb-2 text-gray-200">Chapter History</h2>
          <p className="text-sm text-gray-400">You haven't saved any chapters yet.</p>
        </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 shadow-md border border-gray-700">
      <h2 className="text-2xl font-semibold mb-4 text-gray-200">Chapter History</h2>
      <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {chapters.map((chapter) => (
          <li key={chapter.id} className="group flex items-center justify-between p-2 rounded-md bg-gray-700/50 hover:bg-gray-700 transition-colors">
            <button onClick={() => onSelect(chapter.id)} className="flex items-center gap-3 text-left w-full">
              {chapter.panels.length > 0 && (
                <img src={chapter.panels[0].imageUrl} alt={chapter.title} className="w-16 h-12 object-cover rounded-md flex-shrink-0" />
              )}
              <span className="font-medium text-gray-200 group-hover:text-white truncate">{chapter.title}</span>
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); onDelete(chapter.id); }} 
                className="ml-2 p-1.5 rounded-full text-gray-400 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Delete chapter ${chapter.title}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChapterHistory;