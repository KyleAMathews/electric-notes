import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Awareness } from 'y-protocols/awareness';
import { getWebSocketUrl } from '../config/websocket';

export const ydoc = new Y.Doc();
export const fragment = ydoc.getXmlFragment('notes');

const awareness = new Awareness(ydoc);
awareness.setLocalStateField('user', {
  name: `User ${Math.floor(Math.random() * 100)}`,
  color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
  clientId: Math.floor(Math.random() * 100000),
});

export const wsProvider = new WebsocketProvider(getWebSocketUrl(), 'notes-app', ydoc, { awareness });