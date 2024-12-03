import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Placeholder from '@tiptap/extension-placeholder';
import { Extensions } from '@tiptap/react';
import * as Y from 'yjs';

export function createTiptapExtensions(
  fragment: Y.XmlFragment,
  document: Y.Doc,
  provider: any
): Extensions {
  return [
    StarterKit.configure({
      history: false, // Important: Disable history as we're using collaboration
    }),
    Collaboration.configure({
      fragment,
      document,
    }),
    CollaborationCursor.configure({
      provider: provider,
      user: {
        name: `User ${Math.floor(Math.random() * 100)}`,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      },
    }),
    Placeholder.configure({
      placeholder: 'Start writing...',
    }),
  ];
}