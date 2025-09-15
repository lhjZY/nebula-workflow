import { createFileRoute, redirect } from '@tanstack/react-router'
import { CalendarDays } from 'lucide-react'
import { useState, useMemo } from 'react'

import { useAuthStore } from '../stores/auth'
import { useTodosStore } from '../stores/todos'

import { Calendar } from '@/components/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/components/ui/popover'

export const Route = createFileRoute('/todo')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) throw redirect({ to: '/login' })
  },
  component: TodoPage,
})

function TodoPage() {
  const { items, filter, add, toggle, remove, edit, setFilter, clearCompleted } = useTodosStore()
  const [title, setTitle] = useState('')
  const [due, setDue] = useState<Date | undefined>(undefined)
  const filtered = useMemo(() => {
    if (filter === 'active') return items.filter((t) => !t.completed)
    if (filter === 'completed') return items.filter((t) => t.completed)
    return items
  }, [items, filter])

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const v = title.trim()
    if (!v) return
    add(v, due ? due.toISOString().slice(0, 10) : undefined)
    setTitle('')
    setDue(undefined)
  }

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-xl font-semibold">Todo</h2>
      <form onSubmit={onAdd} className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="添加待办..."
            className="w-full rounded-xl bg-white/40 dark:bg-white/10 px-4 py-3 pr-11 outline-none ring-1 ring-white/40 focus:ring-2 focus:ring-indigo-400 glass-strong"
          />
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 hover:bg-black/10">
                <CalendarDays className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <Calendar
                mode="single"
                selected={due}
                onSelect={setDue}
              />
            </PopoverContent>
          </Popover>
        </div>
        <button className="rounded-xl bg-black/80 px-4 py-2 text-white hover:bg-black">添加</button>
      </form>

      <div className="mt-4 flex items-center gap-2 text-sm">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-md px-2 py-1 ${filter === 'all' ? 'bg-black/60 text-white' : 'bg-black/10'}`}
        >
          全部
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`rounded-md px-2 py-1 ${filter === 'active' ? 'bg-black/60 text-white' : 'bg-black/10'}`}
        >
          未完成
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`rounded-md px-2 py-1 ${filter === 'completed' ? 'bg-black/60 text-white' : 'bg-black/10'}`}
        >
          已完成
        </button>
        <div className="ml-auto" />
        <button onClick={clearCompleted} className="rounded-md bg-black/10 px-2 py-1 hover:bg-black/20">
          清除已完成
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {filtered.map((t) => (
          <li key={t.id} className="flex items-center gap-3 rounded-xl glass p-3">
            <input type="checkbox" checked={t.completed} onChange={() => toggle(t.id)} />
            <input
              value={t.title}
              onChange={(e) => edit(t.id, e.target.value)}
              className={`flex-1 bg-transparent outline-none ${t.completed ? 'line-through opacity-60' : ''}`}
            />
            {t.dueDate && (
              <span className="text-xs text-neutral-600 dark:text-neutral-300">{t.dueDate}</span>
            )}
            <button onClick={() => remove(t.id)} className="rounded-md bg-black/10 px-2 py-1 hover:bg-black/20">
              删除
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}


