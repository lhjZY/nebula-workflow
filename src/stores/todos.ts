import { create } from 'zustand'

export type TodoItem = {
  id: string
  title: string
  completed: boolean
  createdAt: number
  dueDate?: string
}

type TodosState = {
  items: TodoItem[]
  filter: 'all' | 'active' | 'completed'
}

type TodosActions = {
  add: (title: string, dueDate?: string) => void
  toggle: (id: string) => void
  remove: (id: string) => void
  edit: (id: string, title: string) => void
  setFilter: (filter: TodosState['filter']) => void
  clearCompleted: () => void
}

const STORAGE_KEY = 'workflow_todos_v1'

function loadInitialState(): TodosState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { items: [], filter: 'all' }
}

function save(state: TodosState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

export const useTodosStore = create<TodosState & TodosActions>()((set, get) => ({
  ...loadInitialState(),
  add: (title, dueDate) => {
    const next: TodosState = {
      ...get(),
      items: [
        { id: crypto.randomUUID(), title, completed: false, createdAt: Date.now(), dueDate },
        ...get().items,
      ],
    }
    set(next)
    save(next)
  },
  toggle: (id) => {
    const next: TodosState = {
      ...get(),
      items: get().items.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    }
    set(next)
    save(next)
  },
  remove: (id) => {
    const next: TodosState = { ...get(), items: get().items.filter((t) => t.id !== id) }
    set(next)
    save(next)
  },
  edit: (id, title) => {
    const next: TodosState = {
      ...get(),
      items: get().items.map((t) => (t.id === id ? { ...t, title } : t)),
    }
    set(next)
    save(next)
  },
  setFilter: (filter) => {
    const next: TodosState = { ...get(), filter }
    set(next)
    save(next)
  },
  clearCompleted: () => {
    const next: TodosState = { ...get(), items: get().items.filter((t) => !t.completed) }
    set(next)
    save(next)
  },
}))


