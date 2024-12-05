import { proxy, useSnapshot, subscribe } from 'valtio'
import { useShape, getShapeStream } from '@electric-sql/react'
import { useMemo } from 'react'
import { matchStream, matchBy } from './stream-utils'

interface Note {
  id: number
  title: string
  created_at: string
  active_users?: Array<{ userId: string; lastActive: number }>
}

interface OptimisticUpdate {
  value: Partial<Note>
  timestamp: number
}

const optimisticStore = proxy({
  updates: new Map<number, OptimisticUpdate>(),
  errors: new Map<number, string>()
})

const useNotes = () => {
  const { data: electricNotes, isLoading, error: electricError } = useShape<Note>({
    url: new URL("/shape-proxy/notes", import.meta.env.VITE_API_URL).toString(),
  })

  const { updates, errors } = useSnapshot(optimisticStore)

  const combinedNotes = useMemo(() => {
    if (isLoading || !electricNotes) return []
    return electricNotes.map(note => {
      const update = updates.get(note.id)
      const error = errors.get(note.id)
      return {
        ...note,
        ...(update?.value || {}),
        error
      }
    })
  }, [electricNotes, updates, errors, isLoading])

  return {
    notes: combinedNotes,
    isLoading,
    error: electricError
  }
}

async function updateNote(id: number, update: Partial<Note>) {
  const timestamp = Date.now()
  optimisticStore.updates.set(id, { value: update, timestamp })
  optimisticStore.errors.delete(id)

  try {
    const response = await fetch(
      new URL(`/v1/note/${id}`, import.meta.env.VITE_API_URL).toString(),
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(update),
      }
    )

    if (!response.ok) {
      throw new Error('Failed to update note')
    }

    // Only clear the update if it hasn't been superseded
    const currentUpdate = optimisticStore.updates.get(id)
    if (currentUpdate?.timestamp === timestamp) {
      optimisticStore.updates.delete(id)
    }
  } catch (error) {
    console.error('Error updating note:', error)
    optimisticStore.errors.set(id, 'Failed to save')
  }
}

export { useNotes, updateNote, optimisticStore, type Note }
