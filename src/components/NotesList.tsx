import React from 'react';
import { useNotesStore } from '../store/useNotesStore';

export default function NotesList() {
  const { notes, selectedNoteId, selectNote, searchQuery } = useNotesStore();

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto">
      {filteredNotes.map((note) => (
        <button
          key={note.id}
          onClick={() => selectNote(note.id)}
          className={`w-full text-left p-4 border-b border-gray-200 hover:bg-gray-100 transition-colors ${
            selectedNoteId === note.id ? 'bg-gray-100' : ''
          }`}
        >
          <h3 className="font-medium truncate">{note.title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(note.updatedAt).toLocaleDateString()}
          </p>
        </button>
      ))}
    </div>
  );
}