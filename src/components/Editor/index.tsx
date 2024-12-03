import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { useNotesStore } from '../../store/useNotesStore';
import { ydoc, wsProvider, fragment } from '../../lib/collaboration';
import { createTiptapExtensions } from '../../lib/tiptap';
import { TitleInput } from './TitleInput';
import { EditorPlaceholder } from './EditorPlaceholder';

export default function Editor() {
  const { selectedNoteId, notes, updateNote } = useNotesStore();
  const selectedNote = notes.find((note) => note.id === selectedNoteId);
  const [title, setTitle] = useState('');

  const editor = useEditor({
    extensions: createTiptapExtensions(fragment, ydoc, wsProvider),
  });

  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title);
      editor?.commands.setContent(selectedNote.content);
    }
  }, [selectedNote, editor]);

  if (!selectedNoteId) {
    return <EditorPlaceholder />;
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
      <TitleInput title={title} onChange={handleTitleChange} />
      <EditorContent
        editor={editor}
        className="flex-1 p-4 prose max-w-none overflow-y-auto"
        onBlur={handleContentChange}
      />
    </div>
  );
}