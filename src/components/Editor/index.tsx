import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { useParams, useRouter } from "@tanstack/react-router";
import * as Y from "yjs";
import { createTiptapExtensions } from "../../lib/tiptap";
import { TitleInput } from "./TitleInput";
import { Awareness } from "y-protocols/awareness";
import { ElectricProvider } from "../../y-electric";
import * as random from "lib0/random";
import { useNotes, updateNote } from "../../lib/notes";
import "./editor.css";

// Map to cache ElectricProvider instances per noteId
const eProviderCache = new Map<string, ElectricProvider>();

function getProvider(noteId: string) {
  let eProvider = eProviderCache.get(noteId);

  if (!eProvider) {
    const ydoc = new Y.Doc();
    const awareness = new Awareness(ydoc);
    eProvider = new ElectricProvider(
      new URL(`/shape-proxy`, import.meta.env.VITE_API_URL).href,
      noteId,
      ydoc,
      {
        connect: true,
        awareness,
      },
    );
    eProviderCache.set(noteId, eProvider);
  }

  return eProvider;
}

function ActualEditor({ noteId }: { noteId: string }) {
  console.log({ noteId });
  const eProvider = getProvider(noteId);
  const { notes, isLoading } = useNotes();
  console.log({ eProvider });

  const note = notes.find((note) => note.id === parseInt(noteId, 10));

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTitle = e.target.value;
    // Fire and forget - errors will be handled by the optimistic store
    updateNote(parseInt(noteId, 10), { title: newTitle }).catch(console.error);
  };

  const handleContentChange = () => {
    console.log(`handleContentChange`);
  };

  const editor = useEditor({
    // enableContentCheck: true,
    extensions: createTiptapExtensions(eProvider),
  });

  if (isLoading || !note) {
    return ``;
  }

  return (
    <div className="flex-1 flex flex-col ml-10 lg:ml-0 border-l lg:border-0 border-grey bg-white">
      <TitleInput
        title={note.title}
        onChange={handleTitleChange}
        error={note.error}
      />
      <EditorContent
        editor={editor}
        className="flex-1 prose max-w-none p-4"
        onChange={handleContentChange}
      />
    </div>
  );
}

export default function Editor() {
  const { noteId } = useParams({ from: "/note/$noteId" });
  const router = useRouter();

  useEffect(() => {
    router.invalidate();
  }, [noteId]);

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-50">
      <ActualEditor key={noteId} noteId={noteId} />
    </div>
  );
}
