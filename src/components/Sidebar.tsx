import React, { useState } from "react";
import { Plus, Search, Loader2, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button, Dialog, Heading, Modal } from "react-aria-components";
// import { useNotesStore } from '../store/useNotesStore';
import NotesList from "./NotesList";

export default function Sidebar() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  // const { addNote, searchQuery, setSearchQuery } = useNotesStore();

  const createNewNote = async () => {
    setIsCreating(true);
    try {
      const response = await fetch(
        new URL("/v1/note", import.meta.env.VITE_API_URL),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: "Untitled Note" }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create note");
      }

      const note = await response.json();
      navigate({ to: "/note/$noteId", params: { noteId: note.id } });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to create note",
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 h-screen flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={createNewNote}
          disabled={isCreating}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Plus size={20} />
          )}
          <span>{isCreating ? "Creating..." : "New Note"}</span>
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

      {error && (
        <Modal isDismissable isOpen onOpenChange={() => setError(null)}>
          <Dialog className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <div className="flex justify-between items-start mb-4">
              <Heading
                slot="title"
                className="text-lg font-semibold text-gray-900"
              >
                Error Creating Note
              </Heading>
              <Button
                onPress={() => setError(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </Button>
            </div>
            <p className="text-gray-600">{error}</p>
            <div className="mt-6 flex justify-end">
              <Button
                onPress={() => setError(null)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </Button>
            </div>
          </Dialog>
        </Modal>
      )}
    </div>
  );
}
