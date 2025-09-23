import { Calendar, ChevronDown, ChevronRight, Clock, Filter, Plus } from 'lucide-react'
import { useState } from 'react'

import { useTodosStore, type Project } from '../stores/todos'

const TIME_FILTERS = [
  { key: 'today', label: '今天', icon: Calendar },
  { key: 'tomorrow', label: '明天', icon: Calendar },
  { key: 'week', label: '最近七天', icon: Calendar },
  { key: 'overdue', label: '过期任务', icon: Clock },
  { key: 'no-date', label: '无截止日期', icon: Filter },
] as const

const PROJECT_CATEGORIES = {
  personal: { label: '个人事务', color: '#3b82f6' },
  work: { label: '工作任务', color: '#10b981' },
  study: { label: '学习计划', color: '#f59e0b' },
} as const

export function Sidebar() {
  const {
    timeFilter,
    projects,
    expandedProjects,
    sidebarCollapsed,
    items,
    setTimeFilter,
    toggleProjectExpanded,
    addProject,
    setSidebarCollapsed,
  } = useTodosStore()

  const [showAddProject, setShowAddProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectCategory, setNewProjectCategory] = useState<'personal' | 'work' | 'study'>(
    'personal',
  )

  // 计算各时间过滤器的任务数量
  const getTaskCountByTimeFilter = (filter: typeof timeFilter) => {
    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    switch (filter) {
      case 'today':
        return items.filter((item) => !item.completed && item.dueDate === today).length
      case 'tomorrow':
        return items.filter((item) => !item.completed && item.dueDate === tomorrow).length
      case 'week':
        return items.filter((item) => !item.completed && item.dueDate && item.dueDate <= weekLater)
          .length
      case 'overdue':
        return items.filter((item) => !item.completed && item.dueDate && item.dueDate < today)
          .length
      case 'no-date':
        return items.filter((item) => !item.completed && !item.dueDate).length
      default:
        return 0
    }
  }

  // 计算项目任务数量
  const getProjectTaskCount = (projectId: string) => {
    return items.filter((item) => !item.completed && item.projectId === projectId).length
  }

  // 按分类分组项目
  const groupedProjects = projects.reduce((acc, project) => {
    if (!acc[project.category]) acc[project.category] = []
    acc[project.category].push(project)
    return acc
  }, {} as Record<string, Project[]>)

  const handleAddProject = () => {
    if (!newProjectName.trim()) return

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316']
    const color = colors[Math.floor(Math.random() * colors.length)]

    addProject({
      name: newProjectName.trim(),
      color,
      category: newProjectCategory,
    })

    setNewProjectName('')
    setShowAddProject(false)
  }

  if (sidebarCollapsed) {
    return (
      <div className="glass-strong rounded-2xl h-full flex flex-col items-center p-4 w-16">
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="glass rounded-lg p-2 hover:glass-strong transition-all duration-200"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="flex flex-col gap-2 mt-4">
          {TIME_FILTERS.map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTimeFilter(key)}
              className={`
                glass rounded-lg p-2 hover:glass-strong transition-all duration-200
                ${timeFilter === key ? 'glass-strong border-primary/50 bg-primary/20' : ''}
              `}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="glass-strong rounded-2xl h-full flex flex-col p-4 w-80">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">导航</h2>
        <button
          onClick={() => setSidebarCollapsed(true)}
          className="glass rounded-lg p-2 hover:glass-strong transition-all duration-200"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* 时间过滤器 */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
          时间筛选
        </h3>
        <div className="space-y-2">
          {TIME_FILTERS.map(({ key, label, icon: Icon }) => {
            const count = getTaskCountByTimeFilter(key)
            return (
              <button
                key={key}
                onClick={() => setTimeFilter(key)}
                className={`
                  glass rounded-xl px-4 py-3 mb-2 w-full 
                  hover:glass-strong transition-all duration-200
                  text-sm font-medium flex items-center justify-between
                  backdrop-blur-2xl backdrop-saturate-150
                  ${
                    timeFilter === key
                      ? 'glass-strong border-primary/50 bg-primary/20 text-primary font-bold shadow-[0_0_20px_rgba(var(--primary),0.3)]'
                      : 'text-foreground/90'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </div>
                {count > 0 && (
                  <span
                    className={`
                    px-2 py-0.5 rounded-full text-xs font-medium
                    ${timeFilter === key ? 'bg-primary/50' : 'bg-muted'}
                  `}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 项目菜单 */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            项目
          </h3>
          <button
            onClick={() => setShowAddProject(!showAddProject)}
            className="glass rounded-lg p-1.5 hover:glass-strong transition-all duration-200"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* 添加项目表单 */}
        {showAddProject && (
          <div className="glass rounded-lg p-3 mb-3 border border-border">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="项目名称"
              className="w-full bg-transparent text-sm outline-none mb-2 text-foreground placeholder:text-muted-foreground"
              onKeyDown={(e) => e.key === 'Enter' && handleAddProject()}
            />
            <select
              value={newProjectCategory}
              onChange={(e) =>
                setNewProjectCategory(e.target.value as 'personal' | 'work' | 'study')
              }
              className="w-full bg-background/50 rounded text-sm p-1 mb-2 text-foreground border border-border"
            >
              {Object.entries(PROJECT_CATEGORIES).map(([key, { label }]) => (
                <option key={key} value={key} className="bg-background">
                  {label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleAddProject}
                className="glass rounded text-xs px-2 py-1 hover:glass-strong transition-all duration-200 flex-1"
              >
                添加
              </button>
              <button
                onClick={() => {
                  setShowAddProject(false)
                  setNewProjectName('')
                }}
                className="glass rounded text-xs px-2 py-1 hover:glass-strong transition-all duration-200 flex-1"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 项目列表或空状态提示 */}
        {projects.length === 0 ? (
          <div className="glass rounded-lg p-4 text-center">
            <div className="text-muted-foreground text-sm mb-2">暂无项目</div>
            <div className="text-xs text-muted-foreground">点击上方 + 号创建你的第一个项目</div>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(PROJECT_CATEGORIES).map(([categoryKey, { label, color }]) => {
              const categoryProjects = groupedProjects[categoryKey] || []
              if (categoryProjects.length === 0) return null
              const isExpanded = expandedProjects.includes(categoryKey)

              return (
                <div key={categoryKey}>
                  <button
                    onClick={() => toggleProjectExpanded(categoryKey)}
                    className="glass rounded-lg px-3 py-2 mb-3 w-full text-left
                      text-xs font-semibold uppercase tracking-wider
                      text-muted-foreground border-border backdrop-blur-xl
                      hover:glass-strong transition-all duration-200
                      flex items-center justify-between"
                    style={{ borderLeftColor: color, borderLeftWidth: '2px' }}
                  >
                    <span>{label}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="space-y-1 ml-2">
                      {categoryProjects.map((project) => {
                        const taskCount = getProjectTaskCount(project.id)
                        return (
                          <button
                            key={project.id}
                            className="glass rounded-lg px-3 py-2 mb-2 w-full text-left
                              hover:glass-strong transition-all duration-200
                              cursor-pointer group border-l-2 border-transparent
                              hover:border-l-primary text-sm flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: project.color }}
                              />
                              <span className="text-foreground/90">{project.name}</span>
                            </div>
                            {taskCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted">
                                {taskCount}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
