import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Placeholder from '@tiptap/extension-placeholder';
import { useNotesStore } from '../store/useNotesStore';
import { ydoc, wsProvider, fragment } from '../lib/collaboration';

export default function Editor() {
  const { selectedNoteId, notes, updateNote } = useNotesStore();
  const selectedNote = notes.find((note) => note.id === selectedNoteId);
  const [title, setTitle] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Collaboration.configure({
        fragment,
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider: wsProvider,
        user: {
          name: 'User ' + Math.floor(Math.random() * 100),
          color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
    ],
  });

  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title);
      editor?.commands.setContent(selectedNote.content);
    }
  }, [selectedNote, editor]);

  if (!selectedNoteId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select or create a note to start editing
      </div>
    );
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    updateNote(selectedNoteId, { title: newTitle });
  };

  const handleContentChange = () => {
    if (editor && selectedNoteId) {
      updateNote(selectedNoteId, { content: editor.getHTML() });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen">
      <input
        type="text"
        value={title}
        onChange={handleTitleChange}
        className="text-3xl font-bold p-4 border-b border-gray-200 focus:outline-none"
        placeholder="Note title"
      />
      <EditorContent
        editor={editor}
        className="flex-1 p-4 prose max-w-none overflow-y-auto"
        onBlur={handleContentChange}
      />
    </div>
  );
}