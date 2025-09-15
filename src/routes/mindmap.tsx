import { Excalidraw } from '@excalidraw/excalidraw'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useMemo } from 'react'
import '@excalidraw/excalidraw/index.css'

import { useAuthStore } from '../stores/auth'




type PersistedScene = {
  elements?: unknown
  appState?: Record<string, unknown>
}

const STORAGE_KEY = 'workflow_mindmap_v1'

function loadInitialScene(): PersistedScene | undefined {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return undefined
  try {
    const parsed = JSON.parse(raw) as PersistedScene
    if (!parsed || typeof parsed !== 'object') return undefined
    const scene: PersistedScene = {
      elements: Array.isArray((parsed as any).elements) ? (parsed as any).elements : [],
      appState: parsed.appState ? { ...parsed.appState } : undefined,
    }
    if (scene.appState && 'collaborators' in scene.appState) {
      delete (scene.appState as { collaborators?: unknown }).collaborators
    }
    return scene
  } catch {
    return undefined
  }
}

export const Route = createFileRoute('/mindmap')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) throw redirect({ to: '/login' })
  },
  component: MindmapPage,
})

function MindmapPage() {
  const initialData = useMemo(() => loadInitialScene(), [])

  return (
    <div className="glass-strong rounded-2xl p-3 flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 w-full overflow-hidden rounded-xl">
        <div className="h-full w-full">
          <Excalidraw
            initialData={initialData as any}
            onChange={(elements, appState) => {
              try {
                const nextAppState = appState ? { ...(appState as any) } : undefined
                if (nextAppState && 'collaborators' in nextAppState) {
                  delete (nextAppState as { collaborators?: unknown }).collaborators
                }
                const data: PersistedScene = { elements, appState: nextAppState }
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
              } catch {
                /* noop */
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}


