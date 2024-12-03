import { create } from 'zustand';
import { Note } from '../types/note';

interface NotesState {
  notes: Note[];
  selectedNoteId: string | null;
  searchQuery: string;
  addNote: () => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  selectNote: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
}

export const useNotesStore = create<NotesState>((set) => ({
  notes: [],
  selectedNoteId: null,
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
      selectedNoteId: newNote.id,
    }));
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

  selectNote: (id) => {
    set({ selectedNoteId: id });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },
}));