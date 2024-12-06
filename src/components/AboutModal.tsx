import React from 'react'
import {
  Button,
  Dialog,
  DialogTrigger,
  Heading,
  Modal
} from 'react-aria-components'

interface AboutModalProps {
  trigger?: React.ReactNode;
}

export function AboutModal({ trigger }: AboutModalProps) {
  return (
    <DialogTrigger>
      {trigger ?? <Button>About</Button>}
      <Modal isDismissable>
        <Dialog className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
          <div className="flex justify-between items-start mb-6">
            <Heading slot="title" className="text-xl font-semibold text-gray-900">
              About Electric Notes
            </Heading>
          </div>
          <div className="text-gray-600 space-y-4">
            <p>Welcome to Electric Notes, a collaborative note-taking app powered by <a href="https://electric-sql.com/" className="text-blue-600 hover:underline">ElectricSQL</a>.</p>
            <p>Notes demonstrates our <a href="https://yjs.dev/" className="text-blue-600 hover:underline">Yjs</a> integration. By combining Yjs's powerful collaborative editing capabilities with Postgres and Electric, you get the best of both worlds:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Postgres provides rock-solid storage that can handle millions of documents with powerful querying capabilities</li>
              <li>Electric provides real-time sync that scales to millions of concurrent users while keeping your data consistent</li>
              <li>Yjs handles the collaborative editing with battle-tested conflict resolution</li>
            </ul>

            <Heading className='text-lg font-semibold text-gray-900 mt-4'>Database Schema</Heading>
            <ul className="list-disc pl-5 space-y-2">
              <li><code className="bg-gray-100 px-2 py-0.5 rounded">notes</code> - Stores basic note metadata (id, title, created_at)</li>
              <li><code className="bg-gray-100 px-2 py-0.5 rounded">notes_operations</code> - Stores Yjs operations for each note, enabling collaborative editing</li>
            </ul>

            <Heading className='text-xl font-semibold text-gray-900 mt-6'>Real-time sync</Heading>
            <ul className="list-disc pl-5 space-y-2">
              <li><a href="https://github.com/KyleAMathews/electric-notes/blob/main/src/y-electric/index.ts" className="text-blue-600 hover:underline">y-electric.ts</a> provides a standard Yjs provider similar to y-websocket. Internally it syncs Yjs operations on notes using the standard <code>ShapeStream</code> class from the <a href="https://electric-sql.com/docs/api/clients/typescript" className="text-blue-600 hover:underline">Electric Typescript client</a></li>
            </ul>

            <div className="mt-6 flex justify-end">
              <Button
                slot="close"
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </Button>
            </div>
          </div>
        </Dialog>
      </Modal>
    </DialogTrigger>
  )
}
