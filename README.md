# Electric Notes

Electric Notes is a collaborative note-taking application that demonstrates the power of combining ElectricSQL, Yjs, and Postgres for real-time collaborative editing.

## Features

- Real-time collaborative note editing
- Uses Postgres to store yjs documents so scalable to millions of documents
- Uses Electric's scalable sync capabilities for millions of concurrent users
- Battle-tested conflict resolution through Yjs

## Technology Stack

- [ElectricSQL](https://electric-sql.com/) - Provides real-time sync and data consistency
- [Yjs](https://yjs.dev/) - Powers collaborative editing functionality
- PostgreSQL - Database backend for reliable storage and querying
- React - Frontend framework
- TypeScript - Programming language

## Database Schema

The application uses two main tables:

- `notes` - Stores note metadata
  - id
  - title
  - created_at

- `notes_operations` - Stores Yjs operations for collaborative editing

## Implementation Details

The project implements a custom Yjs provider similar to y-websocket in [`src/y-electric/index.ts`](src/y-electric/index.ts). This provider syncs Yjs operations using ElectricSQL's `ShapeStream` class from the [Electric TypeScript client](https://electric-sql.com/docs/api/clients/typescript).

## Contributing

Feel free to contribute to this project!

## License

MIT License - see [LICENSE](LICENSE) for details
