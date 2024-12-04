import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { useParams } from '@tanstack/react-router';
// import { useNotesStore } from '../../store/useNotesStore';
import * as Y from "yjs";
import { createTiptapExtensions } from '../../lib/tiptap';
import { TitleInput } from './TitleInput';
import { Awareness } from "y-protocols/awareness"
import { ElectricProvider } from '../../y-electric';
import * as random from "lib0/random"

// Map to cache ElectricProvider instances per noteId
const eProviderCache = new Map<string, ElectricProvider>();

const usercolors = [
  { color: `#30bced`, light: `#30bced33` },
  { color: `#6eeb83`, light: `#6eeb8333` },
  { color: `#ffbc42`, light: `#ffbc4233` },
  { color: `#ecd444`, light: `#ecd44433` },
  { color: `#ee6352`, light: `#ee635233` },
  { color: `#9ac2c9`, light: `#9ac2c933` },
]

const userColor = usercolors[random.uint32() % usercolors.length]

export default function Editor() {
  // const { notes, updateNote } = useNotesStore();
  const { noteId } = useParams({ from: '/note/$noteId' });
  let selectedNote
  // const selectedNote = notes.find((note) => note.id === noteId);
  const [title, setTitle] = useState('');

  // Check if an ElectricProvider instance exists for the current noteId
  let eProvider = eProviderCache.get(noteId);
  let awareness: Awareness | undefined;

  if (!eProvider) {
    const ydoc = new Y.Doc()
    awareness = new Awareness(ydoc)
    eProvider = new ElectricProvider(new URL(`/shape-proxy`, window?.location.origin).href,
      noteId,
      ydoc,
      {
        connect: true,
        awareness,
      });
    awareness?.setLocalStateField(`user`, {
      name: userColor.color,
      color: userColor.color,
      colorLight: userColor.light,
    })
    eProviderCache.set(noteId, eProvider);
  } else {
    awareness = eProvider.awareness;
  }

  const editor = useEditor({
    enableContentCheck: true,
    extensions: createTiptapExtensions(eProvider),
  });

  useEffect(() => {
    // if (selectedNote) {
    //   setTitle(selectedNote.title);
    //   editor?.commands.setContent(selectedNote.content);
    // }
  }, [selectedNote, editor]);

  // if (!selectedNote) {
  //   return null;
  // }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    // setTitle(newTitle);
    // updateNote(noteId, { title: newTitle });
    console.log(`handleTitleChange`)
  };

  const handleContentChange = () => {
    console.log(`handleContentChange`)
    // if (editor) {
    //   updateNote(noteId, { content: editor.getHTML() });
    // }
  };

  return (
    <div className="flex-1 flex flex-col h-screen">
      <TitleInput title={title} onChange={handleTitleChange} />
      <EditorContent
        editor={editor}
        className="flex-1 prose max-w-none p-4"
        onChange={handleContentChange}
      />
    </div>
  );
}
