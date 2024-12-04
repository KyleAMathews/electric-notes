import React from 'react';
import { Plus, Search } from 'lucide-react';
// import { useNotesStore } from '../store/useNotesStore';
import NotesList from './NotesList';

export default function Sidebar() {
  // const { addNote, searchQuery, setSearchQuery } = useNotesStore();

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 h-screen flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={() => console.log(`click`)}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus size={20} />
          <span>New Note</span>
        </button>
      </div>

      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Search notes..."
            value={`hi`}
            onChange={() => console.log(`changing...`)}
            // onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
      </div>

      <NotesList />
    </div>
  );
}
