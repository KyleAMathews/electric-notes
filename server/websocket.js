import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as syncProtocol from 'y-protocols/sync';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import * as map from 'lib0/map';

const messageSync = 0;
const messageAwareness = 1;

export function createWebSocketServer(port) {
  const wss = new WebSocketServer({ port });
  const docs = new Map();
  const awarenesses = new Map();
  const encoder = encoding.createEncoder();
  const decoder = decoding.createDecoder(new Uint8Array(0));

  wss.on('connection', (ws) => {
    let doc = null;
    let awareness = null;

    ws.on('message', (message) => {
      const m = new Uint8Array(message);
      const messageType = m[0];
      
      switch (messageType) {
        case messageSync: {
          if (!doc) {
            doc = new Y.Doc();
            const docName = 'notes-app';
            docs.set(docName, doc);
            awareness = new awarenessProtocol.Awareness(doc);
            awarenesses.set(docName, awareness);
          }
          
          const encoder = encoding.createEncoder();
          const decoder = decoding.createDecoder(m.slice(1));
          const messageType = decoding.readVarUint(decoder);
          
          syncProtocol.readSyncMessage(decoder, encoder, doc, ws);
          
          if (encoding.length(encoder) > 1) {
            ws.send(encoding.toUint8Array(encoder));
          }
          break;
        }
        case messageAwareness: {
          if (awareness) {
            awarenessProtocol.applyAwarenessUpdate(
              awareness,
              decoding.createDecoder(m.slice(1)),
              ws
            );
          }
          break;
        }
      }
    });

    ws.on('close', () => {
      if (awareness) {
        awarenessProtocol.removeAwarenessStates(
          awareness,
          [awareness.clientID],
          'connection closed'
        );
      }
    });
  });

  console.log(`WebSocket server running on port ${port}`);
  return wss;
}