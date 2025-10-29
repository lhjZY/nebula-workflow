import { CalendarDays, Plus, Search, Check } from 'lucide-react'
import { useState, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { useTodosStore, type TodoItem } from '../stores/todos'

import { Button } from '@/components/components/ui/button'
import { Calendar } from '@/components/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/components/ui/popover'

interface TodoListProps {
  className?: string
}

export function TodoList({ className }: TodoListProps) {
  const {
    items,
    filter,
    timeFilter,
    selectedItemId,
    projects,
    setFilter,
    clearCompleted,
    addWithAPI,
    updateWithAPI,
    setSelectedItem,
  } = useTodosStore()
  console.log('TodoList - items:', items)
  console.log('TodoList - filter:', filter, 'timeFilter:', timeFilter)

  const [title, setTitle] = useState('')
  const [due, setDue] = useState<Date | undefined>(undefined)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // 获取过滤后的任务列表
  const filteredItems = useMemo(() => {
    let result = items
    console.log('开始过滤，原始数据:', result)

    // 按状态过滤
    if (filter === 'active') result = result.filter((t) => !t.completed)
    if (filter === 'completed') result = result.filter((t) => t.completed)
    console.log('状态过滤后:', result, 'filter:', filter)

    // 按时间过滤
    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    console.log('时间参数:', { today, tomorrow, weekLater, timeFilter })

    switch (timeFilter) {
      case 'today': {
        const todayTasks = result.filter((item) => item.dueDate === today)
        // 如果没有今天的任务，显示所有没有日期的任务
        result = todayTasks.length > 0 ? todayTasks : result.filter((item) => !item.dueDate)
        break
      }
      case 'tomorrow':
        result = result.filter((item) => item.dueDate === tomorrow)
        break
      case 'week':
        result = result.filter((item) => item.dueDate && item.dueDate <= weekLater)
        break
      case 'overdue':
        result = result.filter((item) => item.dueDate && item.dueDate < today)
        break
      case 'no-date':
        result = result.filter((item) => !item.dueDate)
        break
      default:
        // 默认情况下显示所有任务，不进行时间过滤
        break
    }
    console.log('时间过滤后:', result, 'timeFilter:', timeFilter)

    // 按搜索词过滤
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(term) ||
          (item.description && item.description.toLowerCase().includes(term)),
      )
    }

    // 按优先级排序：高优先级在前，相同优先级按创建时间倒序
    return result.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority
      }
      return b.createdAt - a.createdAt
    })
  }, [items, filter, timeFilter, searchTerm])

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const v = title.trim()
    if (!v) return

    const dueDate = due ? due.toISOString().slice(0, 10) : undefined
    await addWithAPI(v, dueDate)

    setTitle('')
    setDue(undefined)
  }

  const onToggle = async (id: string) => {
    const item = items.find((t) => t.id === id)
    if (!item) return

    const updatedItem: TodoItem = {
      ...item,
      completed: !item.completed,
      lastModified: Date.now(),
      history: [
        ...item.history,
        {
          id: uuidv4(),
          action: 'updated',
          timestamp: Date.now(),
          details: `标记为${!item.completed ? '已完成' : '未完成'}`,
        },
      ],
    }
    await updateWithAPI(updatedItem)
  }

  const onEdit = async (id: string, newTitle: string) => {
    const item = items.find((t) => t.id === id)
    if (!item) return

    const updatedItem: TodoItem = {
      ...item,
      title: newTitle,
      lastModified: Date.now(),
      history: [
        ...item.history,
        {
          id: uuidv4(),
          action: 'updated',
          timestamp: Date.now(),
          details: `修改标题: ${item.title} → ${newTitle}`,
        },
      ],
    }
    await updateWithAPI(updatedItem)
  }

  const handleItemClick = (item: TodoItem) => {
    setSelectedItem(item.id === selectedItemId ? null : item.id)
  }

  const getProjectInfo = (projectId: string | null | undefined) => {
    if (!projectId) return null
    return projects.find((p) => p.id === projectId)
  }

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false
    const today = new Date().toISOString().slice(0, 10)
    return dueDate < today
  }

  return (
    <div className={`glass-strong rounded-2xl p-6 h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">任务列表</h2>
        <div className="text-sm text-muted-foreground">{filteredItems.length} 个任务</div>
      </div>

      {/* 搜索框 */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="搜索任务..."
          className="w-full pl-10 pr-4 py-2 rounded-xl glass-strong outline-none ring-1 ring-border 
                     focus:ring-2 focus:ring-ring backdrop-blur-xl backdrop-saturate-150
                     placeholder:text-muted-foreground text-foreground"
        />
      </div>

      {/* 添加任务表单 */}
      <form onSubmit={onAdd} className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="添加新任务..."
            className="w-full rounded-xl glass-strong px-4 py-3 pr-11 outline-none ring-1 ring-border 
                       focus:ring-2 focus:ring-ring backdrop-blur-xl backdrop-saturate-150
                       placeholder:text-muted-foreground text-foreground transition-all duration-200"
          />
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 
                           hover:glass transition-all duration-200 backdrop-blur-sm"
              >
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <Calendar mode="single" selected={due} onSelect={setDue} />
              <div className="flex justify-between gap-2 p-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDue(undefined)
                    setIsCalendarOpen(false)
                  }}
                >
                  清除日期
                </Button>
                <Button size="sm" onClick={() => setIsCalendarOpen(false)}>
                  确定选择
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <button
          type="submit"
          className="glass rounded-xl px-4 py-2 text-foreground hover:glass-strong 
                     transition-all duration-200 backdrop-blur-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          添加
        </button>
      </form>

      {/* 过滤器按钮 */}
      <div className="flex items-center gap-2 text-sm mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-md px-3 py-1.5 transition-all duration-200 ${
            filter === 'all'
              ? 'glass-strong text-foreground border border-primary/50'
              : 'glass hover:glass-strong text-muted-foreground'
          }`}
        >
          全部
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`rounded-md px-3 py-1.5 transition-all duration-200 ${
            filter === 'active'
              ? 'glass-strong text-foreground border border-primary/50'
              : 'glass hover:glass-strong text-muted-foreground'
          }`}
        >
          进行中
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`rounded-md px-3 py-1.5 transition-all duration-200 ${
            filter === 'completed'
              ? 'glass-strong text-foreground border border-primary/50'
              : 'glass hover:glass-strong text-muted-foreground'
          }`}
        >
          已完成
        </button>
        <div className="ml-auto" />
        <button
          onClick={clearCompleted}
          className="rounded-md glass px-3 py-1.5 hover:glass-strong text-muted-foreground transition-all duration-200"
        >
          清除已完成
        </button>
      </div>

      {/* 任务列表 */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <div className="w-12 h-12 glass rounded-full flex items-center justify-center mb-3">
              <Check className="w-6 h-6" />
            </div>
            <p className="text-sm">{searchTerm ? '没有找到匹配的任务' : '暂无任务'}</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const project = getProjectInfo(item.projectId)
            const isSelected = item.id === selectedItemId
            const overdue = isOverdue(item.dueDate)

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`
                  glass rounded-xl p-3 hover:glass-strong transition-all duration-200
                  cursor-pointer border-l-2 backdrop-blur-2xl backdrop-saturate-150
                  ${
                    isSelected
                      ? 'glass-strong border-l-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.2)]'
                      : 'border-l-transparent hover:border-l-primary/50'
                  }
                  ${item.completed ? 'opacity-60' : ''}
                  ${overdue && !item.completed ? 'border-l-destructive bg-destructive/5' : ''}
                `}
              >
                <div className="flex items-start gap-3">
                  {/* 复选框 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggle(item.id)
                    }}
                    className={`
                      mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center
                      transition-all duration-200
                      ${
                        item.completed
                          ? 'bg-green-500 border-green-500'
                          : 'border-border hover:border-foreground/60'
                      }
                    `}
                  >
                    {item.completed && <Check className="w-3 h-3 text-white" />}
                  </button>

                  {/* 任务内容 */}
                  <div className="flex-1 min-w-0">
                    <input
                      value={item.title}
                      onChange={(e) => {
                        e.stopPropagation()
                        onEdit(item.id, e.target.value)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`
                        w-full bg-transparent outline-none font-medium
                        ${item.completed ? 'line-through opacity-60' : ''} text-foreground
                      `}
                    />

                    {/* 任务元信息 */}
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      {/* 项目标签 */}
                      {project && (
                        <span
                          className="px-2 py-0.5 rounded-full flex items-center gap-1"
                          style={{
                            backgroundColor: `${project.color}20`,
                            color: project.color,
                            border: `1px solid ${project.color}40`,
                          }}
                        >
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                          {project.name}
                        </span>
                      )}

                      {/* 截止日期 */}
                      {item.dueDate && (
                        <span
                          className={`
                          px-2 py-0.5 rounded-full flex items-center gap-1
                          ${
                            overdue && !item.completed
                              ? 'bg-destructive/20 text-destructive-foreground border border-destructive/30'
                              : 'text-muted-foreground border border-border'
                          }
                        `}
                        >
                          <CalendarDays className="w-3 h-3" />
                          {item.dueDate}
                          {overdue && !item.completed && ' (逾期)'}
                        </span>
                      )}

                      {/* 优先级指示器 */}
                      {item.priority < 4 && (
                        <span className="px-2 py-0.5 rounded-full text-muted-foreground border border-border">
                          优先级: {item.priority === 1 ? '高' : item.priority === 2 ? '中' : '低'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
