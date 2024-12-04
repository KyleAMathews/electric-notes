import { createLazyFileRoute } from '@tanstack/react-router'
import Editor from '../components/Editor'

export const Route = createLazyFileRoute('/note/$noteId')({
  component: Note,
})

function Note() {
  return <Editor />
}
