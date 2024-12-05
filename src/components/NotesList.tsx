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
          <div className="font-medium flex items-center justify-between">
            <div>
              {note.title}
              {note.error && (
                <span className="text-red-500 text-sm ml-2">Error: {note.error}</span>
              )}
            </div>
            {note.active_users && note.active_users.length > 0 && (
              <div className="flex -space-x-3 items-center">
                {note.active_users.slice(0, 3).map((user) => (
                  <div
                    key={user.userId}
                    className="text-xl bg-white rounded-full p-0.5"
                    title={`User ${user.userId}`}
                  >
                    {user.userId}
                  </div>
                ))}
                {note.active_users.length > 3 && (
                  <span className="ml-2 text-sm text-gray-500">
                    +{note.active_users.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="text-sm text-gray-500 flex items-center justify-between">
            <span>{new Date(note.created_at).toLocaleDateString()}</span>
            {note.active_users && note.active_users.length > 0 && (
              <span className="text-gray-500">
                {note.active_users.length} active {note.active_users.length === 1 ? 'user' : 'users'}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
