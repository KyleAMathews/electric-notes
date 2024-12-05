const API_BASE_URL = import.meta.env.VITE_API_URL;

export async function updateNoteTitle(noteId: string, title: string) {
  const response = await fetch(`${API_BASE_URL}/v1/note/${noteId}/title`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    throw new Error('Failed to update note title');
  }

  return response.json();
}

export async function sendHeartbeat(noteId: string, userId: string) {
  console.log(`sending heartbeat`, {noteId, userId})
  const response = await fetch(`${API_BASE_URL}/v1/note/${noteId}/heartbeat`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    throw new Error('Failed to send heartbeat');
  }

  return response.json();
}
