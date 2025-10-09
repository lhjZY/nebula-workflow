import {
  Calendar,
  Clock,
  Edit3,
  Trash2,
  Copy,
  Move,
  Check,
  X,
  Tag,
  Flag,
  History,
} from 'lucide-react'
import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { useTodosStore, type TodoItem } from '../stores/todos'

import { Button } from '@/components/components/ui/button'

interface TaskDetailProps {
  taskId: string | null
}

const PRIORITY_LABELS = {
  1: { label: '高优先级', color: '#ef4444', icon: Flag },
  2: { label: '中优先级', color: '#f59e0b', icon: Flag },
  3: { label: '低优先级', color: '#10b981', icon: Flag },
  4: { label: '无优先级', color: '#6b7280', icon: Tag },
} as const

export function TaskDetail({ taskId }: TaskDetailProps) {
  const { items, projects, updateWithAPI, remove, moveTaskToProject, add } = useTodosStore()

  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [showMoveDialog, setShowMoveDialog] = useState(false)

  const task = items.find((item) => item.id === taskId)
  const project = task?.projectId ? projects.find((p) => p.id === task.projectId) : null

  if (!taskId || !task) {
    return (
      <div className="glass-strong rounded-2xl p-6 h-full flex flex-col items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="w-16 h-16 glass rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium mb-2 text-foreground">选择一个任务</h3>
          <p className="text-sm">点击左侧任务列表中的任意任务查看详情</p>
        </div>
      </div>
    )
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatActionTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    return `${days}天前`
  }

  const handleEdit = async () => {
    if (isEditing) {
      // 保存编辑
      const updatedTask: TodoItem = {
        ...task,
        title: editTitle.trim() || task.title,
        description: editDescription.trim() || task.description,
        lastModified: Date.now(),
        history: [
          ...task.history,
          {
            id: uuidv4(),
            action: 'updated',
            timestamp: Date.now(),
            details: `编辑任务信息`,
          },
        ],
      }
      await updateWithAPI(updatedTask)
      setIsEditing(false)
    } else {
      // 进入编辑模式
      setEditTitle(task.title)
      setEditDescription(task.description || '')
      setIsEditing(true)
    }
  }

  const handleDelete = () => {
    if (confirm('确定要删除这个任务吗？')) {
      remove(task.id)
    }
  }

  const handleCopy = () => {
    add(task.title + ' (副本)', task.dueDate)
  }

  const handleMove = (projectId: string | null) => {
    moveTaskToProject(task.id, projectId)
    setShowMoveDialog(false)
  }

  const priorityInfo = PRIORITY_LABELS[task.priority]

  return (
    <div className="glass-strong rounded-2xl p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          {isEditing ? (
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full text-xl font-semibold bg-transparent border-b border-border 
                         outline-none focus:border-ring pb-2 text-foreground"
              autoFocus
            />
          ) : (
            <h2
              className={`text-xl font-semibold mb-2 ${
                task.completed ? 'line-through opacity-60' : ''
              } text-foreground`}
            >
              {task.title}
            </h2>
          )}

          {/* 状态指示器 */}
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`
              px-2 py-1 rounded-full text-xs font-medium
              ${
                task.completed
                  ? 'bg-green-500/20 text-green-100 border border-green-400/30'
                  : 'bg-orange-500/20 text-orange-100 border border-orange-400/30'
              }
            `}
            >
              {task.completed ? '已完成' : '进行中'}
            </span>

            {priorityInfo && (
              <span
                className="px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1"
                style={{
                  backgroundColor: `${priorityInfo.color}20`,
                  borderColor: `${priorityInfo.color}50`,
                  color: 'currentColor',
                }}
              >
                <priorityInfo.icon className="w-3 h-3" />
                {priorityInfo.label}
              </span>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <button
            onClick={handleEdit}
            className={`
              glass rounded-md px-3 py-2 hover:glass-strong transition-all duration-200
              text-sm font-medium border border-border backdrop-blur-lg
              ${isEditing ? 'bg-green-500/20 border-green-400/50' : ''}
            `}
          >
            {isEditing ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
          </button>

          {isEditing && (
            <button
              onClick={() => setIsEditing(false)}
              className="glass rounded-md px-3 py-2 hover:glass-strong transition-all duration-200
                         text-sm font-medium border border-border backdrop-blur-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 基本信息 */}
      <div className="space-y-4 mb-6">
        {/* 描述 */}
        <div className="glass rounded-lg p-4 border border-border backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-2">
            <Edit3 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">描述</span>
          </div>
          {isEditing ? (
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="添加任务描述..."
              className="w-full bg-transparent border border-border rounded p-2 text-sm 
                         outline-none focus:border-ring text-foreground placeholder:text-muted-foreground resize-none"
              rows={3}
            />
          ) : (
            <p className="text-sm text-foreground">{task.description || '暂无描述'}</p>
          )}
        </div>

        {/* 时间信息 */}
        <div className="glass rounded-lg p-4 border border-border backdrop-blur-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">创建时间</span>
              </div>
              <span className="text-sm text-muted-foreground">{formatDate(task.createdAt)}</span>
            </div>

            {task.dueDate && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">截止日期</span>
                </div>
                <span className="text-sm text-muted-foreground">{task.dueDate}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">最后修改</span>
              </div>
              <span className="text-sm text-muted-foreground">{formatDate(task.lastModified)}</span>
            </div>
          </div>
        </div>

        {/* 项目信息 */}
        <div className="glass rounded-lg p-4 border border-border backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">所属项目</span>
            </div>
            <div className="flex items-center gap-2">
              {project ? (
                <>
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="text-sm text-foreground">{project.name}</span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">无项目</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 操作按钮组 */}
      <div className="space-y-3 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleCopy}
            className="glass rounded-md px-3 py-2 hover:glass-strong transition-all duration-200
                       text-sm font-medium border border-border backdrop-blur-lg
                       flex items-center justify-center gap-2"
          >
            <Copy className="w-4 h-4" />
            复制任务
          </button>

          <button
            onClick={() => setShowMoveDialog(true)}
            className="glass rounded-md px-3 py-2 hover:glass-strong transition-all duration-200
                       text-sm font-medium border border-border backdrop-blur-lg
                       flex items-center justify-center gap-2"
          >
            <Move className="w-4 h-4" />
            移动项目
          </button>
        </div>

        <button
          onClick={handleDelete}
          className="w-full glass rounded-md px-3 py-2 hover:bg-destructive/20 hover:border-destructive/50
                     transition-all duration-200 text-destructive border-destructive/30 border
                     flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          删除任务
        </button>
      </div>

      {/* 历史记录 */}
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">操作历史</span>
        </div>

        <div className="space-y-2 overflow-y-auto max-h-60">
          {task.history.map((record) => (
            <div
              key={record.id}
              className="glass rounded-md p-3 text-xs border-l-2 border-border backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-foreground capitalize">
                  {record.action === 'created' && '创建'}
                  {record.action === 'updated' && '更新'}
                  {record.action === 'completed' && '完成'}
                  {record.action === 'moved' && '移动'}
                </span>
                <span className="text-muted-foreground">{formatActionTime(record.timestamp)}</span>
              </div>
              <p className="text-muted-foreground">{record.details}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 移动项目对话框 */}
      {showMoveDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-strong rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-foreground">移动到项目</h3>

            <div className="space-y-2 mb-4">
              <button
                onClick={() => handleMove(null)}
                className="w-full text-left glass rounded-lg px-3 py-2 hover:glass-strong 
                           transition-all duration-200 text-sm"
              >
                无项目
              </button>

              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleMove(project.id)}
                  className="w-full text-left glass rounded-lg px-3 py-2 hover:glass-strong 
                             transition-all duration-200 text-sm flex items-center gap-2"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  {project.name}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMoveDialog(false)}
                className="flex-1"
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
