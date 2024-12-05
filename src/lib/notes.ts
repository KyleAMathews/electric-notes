import { proxy, useSnapshot, subscribe } from 'valtio'
import { useShape, getShapeStream } from '@electric-sql/react'
import { useMemo } from 'react'
import { matchStream, matchBy } from './stream-utils'

interface Note {
  id: number
  title: string
  created_at: string
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
    
    return electricNotes.map(note => ({
      ...note,
      ...(updates.get(note.id)?.value || {}),
      error: errors.get(note.id)
    }))
  }, [electricNotes, updates, errors, isLoading])

  return { 
    notes: combinedNotes, 
    isLoading, 
    error: electricError 
  }
}

const updateNote = async (id: number, update: Partial<Note>) => {
  // Create new Maps to trigger reactivity
  optimisticStore.updates = new Map(optimisticStore.updates)
  optimisticStore.errors = new Map(optimisticStore.errors)
  
  optimisticStore.errors.delete(id)
  
  // Store update with timestamp
  const timestamp = Date.now()
  optimisticStore.updates.set(id, {
    value: {
      ...optimisticStore.updates.get(id)?.value,
      ...update
    },
    timestamp
  })

  if ('title' in update) {
    try {
      const [updateResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/v1/note/${id}/title`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: update.title })
        }),
        // Wait for the change to be streamed back from Electric
        matchStream(
          getShapeStream<Note>({url: new URL("/shape-proxy/notes", import.meta.env.VITE_API_URL).toString()}) as ShapeStream<Row<unknown>>,
          ['update'],
          matchBy('title', update.title)
        )
      ])

      if (!updateResponse.ok) {
        throw new Error('Failed to update note')
      }

      // Only remove the optimistic update if this was the last update made
      optimisticStore.updates = new Map(optimisticStore.updates)
      const currentUpdate = optimisticStore.updates.get(id)
      if (currentUpdate?.timestamp === timestamp) {
        optimisticStore.updates.delete(id)
      }
    } catch (err) {
      // Only handle the error if this was the last update made
      optimisticStore.updates = new Map(optimisticStore.updates)
      optimisticStore.errors = new Map(optimisticStore.errors)
      const currentUpdate = optimisticStore.updates.get(id)
      if (currentUpdate?.timestamp === timestamp) {
        optimisticStore.updates.delete(id)
        optimisticStore.errors.set(id, err instanceof Error ? err.message : 'Failed to update note')
      }
    }
  }
}

export { useNotes, updateNote, optimisticStore, type Note }
