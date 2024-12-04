import { create } from 'zustand';
import { Note } from '../types/note';

console.trace()

interface NotesState {
  notes: Note[];
  searchQuery: string;
  addNote: () => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  setSearchQuery: (query: string) => void;
}

export const useNotesStore = create<NotesState>((set) => ({
  notes: [],
  searchQuery: '',

  addNote: () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: 'Untitled Note',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      notes: [newNote, ...state.notes],
    }));

    // Navigate to the new note using the route path
    window.history.pushState({}, '', `/note/${newNote.id}`);
  },

  updateNote: (id, updates) => {
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id
          ? { ...note, ...updates, updatedAt: new Date() }
          : note
      ),
    }));
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },
}));
