import React from "react";
import { Link, rootRouteId, useSearch, useParams } from "@tanstack/react-router";
import { useNotes } from '../lib/notes';

export default function NotesList() {
  const { notes, isLoading } = useNotes();
  const params = useParams({ strict: false });
  const search = useSearch({ from: rootRouteId })
  const { noteId } = params;
  let filteredNotes = notes

  if (search.q && search.q !== ``) {
    filteredNotes = notes.filter(note => note.title?.toLowerCase().includes(search.q.toLowerCase()))
  }

  filteredNotes = filteredNotes.sort((a, b) => a.id > b.id ? 1 : -1)

  if (isLoading) {
    return ``
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {filteredNotes.map((note) => (
        <Link
          key={note.id}
          to="/note/$noteId"
          params={{ noteId: note.id.toString() }}
          className={`block w-full text-left p-4 border-b border-gray-200 hover:bg-gray-100 transition-colors ${noteId === note.id.toString() ? "bg-gray-100" : ""
            }`}
        >
          <div className="font-medium">
            {note.title}
            {note.error && (
              <span className="text-red-500 text-sm ml-2">Error: {note.error}</span>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {new Date(note.created_at).toLocaleDateString()}
          </div>
        </Link>
      ))}
    </div>
  );
}
