import { Calendar, Flag } from 'lucide-react'
import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { useTodosStore, type TodoItem } from '../stores/todos'

import { Button } from '@/components/components/ui/button'
import { Checkbox } from '@/components/components/ui/checkbox'
import { Calendar as CalendarUI } from '@/components/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/components/ui/popover'

interface TaskDetailProps {
  taskId: string | null
}

const PRIORITY_OPTIONS = [
  { value: 1, label: '高优先级', color: '#ef4444' },
  { value: 2, label: '中优先级', color: '#f59e0b' },
  { value: 3, label: '低优先级', color: '#10b981' },
  { value: 4, label: '无优先级', color: '#6b7280' },
] as const

export function TaskDetail({ taskId }: TaskDetailProps) {
  const { items, updateWithAPI } = useTodosStore()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isPriorityOpen, setIsPriorityOpen] = useState(false)

  const task = items.find((item) => item.id === taskId)

  // 当切换任务时，同步本地状态
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
    }
  }, [taskId, task?.title, task?.description])

  if (!taskId || !task) {
    return (
      <div className="glass-strong rounded-2xl p-6 h-full flex flex-col items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="w-16 h-16 glass rounded-full flex items-center justify-center mb-4">
            <Flag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium mb-2 text-foreground">选择一个任务</h3>
          <p className="text-sm">点击左侧任务列表中的任意任务查看详情</p>
        </div>
      </div>
    )
  }

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
  }

  const handleTitleBlur = async () => {
    if (title.trim() && title !== task.title) {
      const updatedItem: TodoItem = {
        ...task,
        title: title.trim(),
        lastModified: Date.now(),
        history: [
          ...task.history,
          {
            id: uuidv4(),
            action: 'updated',
            timestamp: Date.now(),
            details: `修改标题: ${task.title} → ${title.trim()}`,
          },
        ],
      }
      await updateWithAPI(updatedItem)
    }
  }

  const handleDescriptionBlur = async () => {
    if (description !== (task.description || '')) {
      const updatedItem: TodoItem = {
        ...task,
        description: description.trim() || undefined,
        lastModified: Date.now(),
        history: [
          ...task.history,
          {
            id: uuidv4(),
            action: 'updated',
            timestamp: Date.now(),
            details: '修改任务详情',
          },
        ],
      }
      await updateWithAPI(updatedItem)
    }
  }

  const handleToggleComplete = async (checked: boolean) => {
    const updatedItem: TodoItem = {
      ...task,
      completed: checked,
      lastModified: Date.now(),
      history: [
        ...task.history,
        {
          id: uuidv4(),
          action: 'updated',
          timestamp: Date.now(),
          details: `标记为${checked ? '已完成' : '未完成'}`,
        },
      ],
    }
    await updateWithAPI(updatedItem)
  }

  const handleDateSelect = async (date: Date | undefined) => {
    const dueDate = date ? date.toISOString().slice(0, 10) : undefined
    const updatedItem: TodoItem = {
      ...task,
      dueDate,
      lastModified: Date.now(),
      history: [
        ...task.history,
        {
          id: uuidv4(),
          action: 'updated',
          timestamp: Date.now(),
          details: dueDate ? `设置截止日期: ${dueDate}` : '清除截止日期',
        },
      ],
    }
    await updateWithAPI(updatedItem)
    setIsCalendarOpen(false)
  }

  const handlePriorityChange = async (priority: 1 | 2 | 3 | 4) => {
    const updatedItem: TodoItem = {
      ...task,
      priority,
      lastModified: Date.now(),
      history: [
        ...task.history,
        {
          id: uuidv4(),
          action: 'updated',
          timestamp: Date.now(),
          details: `修改优先级: ${PRIORITY_OPTIONS.find((p) => p.value === priority)?.label}`,
        },
      ],
    }
    await updateWithAPI(updatedItem)
    setIsPriorityOpen(false)
  }

  const selectedDate = task.dueDate ? new Date(task.dueDate) : undefined
  const currentPriority = PRIORITY_OPTIONS.find((p) => p.value === task.priority)

  return (
    <div className="glass-strong rounded-2xl p-6 h-full flex flex-col">
      {/* 工具栏 */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        {/* 左侧：完成状态 + 日期 */}
        <div className="flex items-center gap-3">
          <Checkbox
            checked={task.completed}
            onCheckedChange={handleToggleComplete}
            aria-label="标记任务完成"
          />

          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                className="rounded-md p-2 hover:bg-accent hover:text-accent-foreground transition-colors"
                aria-label="设置截止日期"
              >
                <Calendar className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <CalendarUI mode="single" selected={selectedDate} onSelect={handleDateSelect} />
              <div className="flex justify-between gap-2 p-3 border-t">
                <Button variant="outline" size="sm" onClick={() => handleDateSelect(undefined)}>
                  清除日期
                </Button>
                <Button size="sm" onClick={() => setIsCalendarOpen(false)}>
                  确定选择
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {task.dueDate && <span className="text-sm text-muted-foreground">{task.dueDate}</span>}
        </div>

        {/* 右侧：优先级 */}
        <Popover open={isPriorityOpen} onOpenChange={setIsPriorityOpen}>
          <PopoverTrigger asChild>
            <button
              className="rounded-md px-3 py-1.5 flex items-center gap-2 hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
              style={{ color: currentPriority?.color }}
              aria-label="设置优先级"
            >
              <Flag className="h-4 w-4" />
              {currentPriority?.label}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-2">
            <div className="flex flex-col gap-1">
              {PRIORITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handlePriorityChange(option.value)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm"
                  style={{ color: option.color }}
                >
                  <Flag className="h-4 w-4" />
                  {option.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* 任务标题 */}
      <input
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        onBlur={handleTitleBlur}
        className="w-full text-2xl font-semibold bg-transparent border-none outline-none mb-4 text-foreground placeholder:text-muted-foreground"
        placeholder="任务标题..."
      />

      {/* Markdown 详情输入 */}
      <div className="flex-1 min-h-0">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleDescriptionBlur}
          className="w-full h-full bg-transparent border border-border rounded-lg p-4 outline-none focus:ring-2 focus:ring-ring resize-none text-foreground placeholder:text-muted-foreground"
          placeholder="任务详情（支持 Markdown）..."
        />
      </div>
    </div>
  )
}
