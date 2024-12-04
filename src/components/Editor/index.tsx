import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { useParams } from '@tanstack/react-router';
import { useNotesStore } from '../../store/useNotesStore';
import * as Y from "yjs";
import { createTiptapExtensions } from '../../lib/tiptap';
import { TitleInput } from './TitleInput';

const ydoc = new Y.Doc();
let network: ElectricProvider | undefined;
let awareness: Awareness | undefined;

export default function Editor() {
  const { notes, updateNote } = useNotesStore();
  const { noteId } = useParams({ from: '/note/$noteId' });
  const selectedNote = notes.find((note) => note.id === noteId);
  const [title, setTitle] = useState('');

  const editor = useEditor({
    enableContentCheck: true,
    extensions: createTiptapExtensions(ydoc, wsProvider),
  });

  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title);
      editor?.commands.setContent(selectedNote.content);
    }
  }, [selectedNote, editor]);

  if (!selectedNote) {
    return null;
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    updateNote(noteId, { title: newTitle });
  };

  const handleContentChange = () => {
    if (editor) {
      updateNote(noteId, { content: editor.getHTML() });
    }
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
