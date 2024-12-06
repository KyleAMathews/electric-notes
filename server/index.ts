import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { Resource } from "sst";
import { neon } from "@neondatabase/serverless";

// Validation schemas
const noteOperationSchema = z.object({
  note_id: z.string(),
  op: z.string(),
  clientId: z.string().optional(),
});

const updateNoteTitleSchema = z.object({
  title: z.string(),
});

// Create the main app
const app = new Hono();

// Add CORS middleware
app.use("*", cors());

app.get("/", (c) => {
  console.log(`Resource`, Resource);
  return c.text("Hello Cloudflare Workers!");
});

async function proxyToElectric(request, table) {
  const originUrl = new URL(`${Resource.ElectricUrl.url}v1/shape`);

  const url = new URL(request.url);
  url.searchParams.forEach((value, key) => {
    originUrl.searchParams.set(key, value);
  });

  originUrl.searchParams.set(`token`, Resource.electricInfo.token);
  originUrl.searchParams.set(`database_id`, Resource.electricInfo.database_id);

  originUrl.searchParams.set(`table`, table);

  // Create a copy of the original headers to include in the fetch to the upstream.
  const requestClone = new Request(request);
  const headersClone = new Headers(requestClone.headers);

  console.log(`Fetching shape from Admin Electric: ${originUrl.toString()}`);

  const response = await fetch(originUrl.toString(), {
    headers: headersClone,
    cf: { cacheEverything: true },
  });

  return response;
}

// Shape proxy endpoints
app.get("/shape-proxy/notes-operations", async (c) => {
  return proxyToElectric(c.req.raw, "notes_operations");
});
app.get("/shape-proxy/notes", async (c) => {
  return proxyToElectric(c.req.raw, "notes");
});

app.get("/shape-proxy/awareness", async (c) => {
  return proxyToElectric(c.req.raw, "ydoc_awareness");
});

// Note operations endpoint with validation
app.post(
  "/v1/note-operation",
  zValidator("json", noteOperationSchema),
  async (c) => {
    const sql = neon(Resource.databaseUriLink.pooledUrl);
    try {
      const { note_id, op, clientId } = c.req.valid("json");

      if (!clientId) {
        // Save regular operation
        await sql`
          INSERT INTO notes_operations (note_id, op)
          VALUES (${note_id}, decode(${op}, 'base64'))
        `;
      } else {
        // Save awareness operation
        await sql`
          INSERT INTO ydoc_awareness (note_id, clientId, op)
          VALUES (${note_id}, ${clientId}, decode(${op}, 'base64'))
          ON CONFLICT (clientId, note_id)
          DO UPDATE SET op = decode(${op}, 'base64')
        `;
      }

      return c.json({}, 200);
    } catch (error) {
      console.error("Error saving operation:", error);
      return c.json(
        { error: error instanceof Error ? error.message : "Unknown error" },
        400,
      );
    }
  },
);

// Create new note endpoint with validation
app.post("/v1/note", async (c) => {
  console.log(`Resource`, Resource, Resource.databaseUriLink?.pooledUrl);
  const sql = neon(Resource.databaseUriLink.pooledUrl);
  console.log(1);
  try {
    console.log(2);
    // Insert new note with empty title
    const [note] = await sql`
      INSERT INTO notes (title)
      VALUES ('Untitled')
      RETURNING id, title, created_at
    `;

    console.log(3, note);
    return c.json(note, 201);
  } catch (error) {
    console.log(4);
    console.error("Error creating note:", error);
    return c.json({ error: "Failed to create note" }, 400);
  } finally {
    //  await sql.end();
  }
});

// Update note title endpoint
app.patch(
  "/v1/note/:id/title",
  zValidator("json", updateNoteTitleSchema),
  async (c) => {
    const { id } = c.req.param();
    const { title } = c.req.valid("json");
    const sql = neon(Resource.databaseUriLink.pooledUrl);

    try {
      const [note] = await sql`
      UPDATE notes
      SET title = ${title}
      WHERE id = ${id}
      RETURNING id, title, created_at
    `;

      if (!note) {
        return c.json({ error: "Note not found" }, 404);
      }

      return c.json(note);
    } catch (error) {
      console.error("Error updating note title:", error);
      return c.json({ error: "Failed to update note title" }, 400);
    } finally {
      // await sql.end();
    }
  },
);

export default app;
