import { createLazyFileRoute } from '@tanstack/react-router'
import { EditorPlaceholder } from '../components/Editor/EditorPlaceholder'

export const Route = createLazyFileRoute('/')({
  component: Index,
})

function Index() {
  return <EditorPlaceholder />
}
