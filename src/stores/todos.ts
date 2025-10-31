import { v4 as uuidv4 } from 'uuid'
import { create } from 'zustand'

import { createTask, updateTask, getTasks, type task, type taskCreate } from '@/services/task'

export type TodoItem = {
  id: string
  title: string
  completed: boolean
  createdAt: number
  dueDate?: string
  // 新增字段
  projectId?: string | null
  priority: 1 | 2 | 3 | 4 // 1-高 2-中 3-低 4-无
  description?: string
  lastModified: number
  history: TaskHistory[]
}

export type TaskHistory = {
  id: string
  action: 'created' | 'updated' | 'completed' | 'moved'
  timestamp: number
  details: string
}

export type Project = {
  id: string
  name: string
  color: string
  taskCount: number
  category: 'personal' | 'work' | 'study'
}

type TodosState = {
  items: TodoItem[]
  filter: 'all' | 'active' | 'completed'
  selectedItemId: string | null
  sidebarCollapsed: boolean
  // 新增状态
  timeFilter: 'today' | 'tomorrow' | 'week' | 'overdue' | 'no-date'
  projects: Project[]
  expandedProjects: string[]
}

type TodosActions = {
  add: (title: string, dueDate?: string) => void
  toggle: (id: string) => void
  remove: (id: string) => void
  edit: (id: string, title: string) => void
  setFilter: (filter: TodosState['filter']) => void
  clearCompleted: () => void
  // API 相关操作
  syncWithAPI: () => Promise<void>
  addWithAPI: (title: string, dueDate?: string) => Promise<void>
  updateWithAPI: (item: TodoItem) => Promise<void>
  removeWithAPI: (id: string) => Promise<void>
  refreshFromAPI: () => Promise<void> // 手动刷新
  // 新增方法
  setSelectedItem: (id: string | null) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setTimeFilter: (filter: TodosState['timeFilter']) => void
  toggleProjectExpanded: (projectId: string) => void
  addProject: (project: Omit<Project, 'id' | 'taskCount'>) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  moveTaskToProject: (taskId: string, projectId: string | null) => void
}

const STORAGE_KEY = 'workflow_todos_v1'

// 数据映射函数：从TodoItem转换为taskCreate
function todoToTaskCreate(todo: Omit<TodoItem, 'id' | 'createdAt'>): taskCreate {
  return {
    projectId: todo.projectId || null,
    parentId: null,
    title: todo.title,
    description: todo.description || null,
    status: todo.completed ? 'completed' : 'active',
    priority: todo.priority || 4,
    startTime: null,
    dueTime: todo.dueDate ? `${todo.dueDate}T00:00:00Z` : null,
  }
}

// 数据映射函数：从TodoItem转换为task
function todoToTask(todo: TodoItem): task {
  const now = new Date().toISOString()

  return {
    id: todo.id,
    userId: '', // 将由后端填充
    projectId: todo.projectId || null,
    parentId: null,
    title: todo.title || '未命名任务',
    description: todo.description || null,
    status: todo.completed ? 'completed' : 'active',
    priority: todo.priority || 4,
    startTime: null,
    dueTime: todo.dueDate ? `${todo.dueDate}T00:00:00Z` : null,
    completedAt: todo.completed ? now : null,
    createdAt: todo.createdAt ? new Date(todo.createdAt).toISOString() : now,
    updatedAt: todo.lastModified ? new Date(todo.lastModified).toISOString() : now,
  }
}

// 数据映射函数：从task转换为TodoItem
function taskToTodo(task: task): TodoItem {
  // 处理可能为null的字段，提供默认值
  const now = Date.now()
  const createdTime = task.createdAt ? new Date(task.createdAt).getTime() : now
  const updatedTime = task.updatedAt ? new Date(task.updatedAt).getTime() : now

  return {
    id: task.id || uuidv4(),
    title: task.title || '未命名任务',
    completed: task.status === 'completed',
    createdAt: createdTime,
    dueDate: task.dueTime ? task.dueTime.slice(0, 10) : undefined,
    priority: (task.priority as 1 | 2 | 3 | 4) || 4, // 确保类型安全
    description: task.description || undefined,
    lastModified: updatedTime,
    history: [
      {
        id: uuidv4(),
        action: 'created',
        timestamp: createdTime,
        details: `创建任务: ${task.title || '未命名任务'}`,
      },
    ],
  }
}

function loadInitialState(): TodosState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      console.log(parsed, 'parsed')
      // 兼容旧数据格式
      return {
        items: parsed.items || [],
        filter: parsed.filter || 'all',
        selectedItemId: parsed.selectedItemId || null,
        sidebarCollapsed: parsed.sidebarCollapsed || false,
        timeFilter: parsed.timeFilter || 'today',
        projects: parsed.projects || getDefaultProjects(),
        expandedProjects: parsed.expandedProjects || [],
      }
    }
  } catch {
    // 忽略localStorage错误
  }
  return {
    items: [],
    filter: 'all',
    selectedItemId: null,
    sidebarCollapsed: false,
    timeFilter: 'today',
    projects: getDefaultProjects(),
    expandedProjects: [],
  }
}

function getDefaultProjects(): Project[] {
  return [] // 空数组，让用户自己创建项目
}

function save(state: TodosState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // 忽略localStorage错误
  }
}

export const useTodosStore = create<TodosState & TodosActions>()((set, get) => ({
  ...loadInitialState(),
  add: (title, dueDate) => {
    const newItem: TodoItem = {
      id: uuidv4(),
      title,
      completed: false,
      createdAt: Date.now(),
      dueDate,
      priority: 4, // 默认无优先级
      description: undefined,
      lastModified: Date.now(),
      history: [
        {
          id: uuidv4(),
          action: 'created',
          timestamp: Date.now(),
          details: `创建任务: ${title}`,
        },
      ],
    }
    const next: TodosState = {
      ...get(),
      items: [newItem, ...get().items],
    }
    set(next)
    save(next)
  },
  toggle: (id) => {
    const item = get().items.find((t) => t.id === id)
    if (!item) return

    const updatedItem = {
      ...item,
      completed: !item.completed,
      lastModified: Date.now(),
      history: [
        ...item.history,
        {
          id: uuidv4(),
          action: 'updated' as const,
          timestamp: Date.now(),
          details: `标记为${!item.completed ? '已完成' : '未完成'}`,
        },
      ],
    }

    const next: TodosState = {
      ...get(),
      items: get().items.map((t) => (t.id === id ? updatedItem : t)),
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
    const item = get().items.find((t) => t.id === id)
    if (!item) return

    const updatedItem = {
      ...item,
      title,
      lastModified: Date.now(),
      history: [
        ...item.history,
        {
          id: uuidv4(),
          action: 'updated' as const,
          timestamp: Date.now(),
          details: `修改标题: ${item.title} → ${title}`,
        },
      ],
    }

    const next: TodosState = {
      ...get(),
      items: get().items.map((t) => (t.id === id ? updatedItem : t)),
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
  // 新增方法实现
  setSelectedItem: (id) => {
    const next: TodosState = { ...get(), selectedItemId: id }
    set(next)
    save(next)
  },
  setSidebarCollapsed: (collapsed) => {
    const next: TodosState = { ...get(), sidebarCollapsed: collapsed }
    set(next)
    save(next)
  },
  setTimeFilter: (timeFilter) => {
    const next: TodosState = { ...get(), timeFilter }
    set(next)
    save(next)
  },
  toggleProjectExpanded: (projectId) => {
    const expandedProjects = get().expandedProjects
    const isExpanded = expandedProjects.includes(projectId)
    const next: TodosState = {
      ...get(),
      expandedProjects: isExpanded
        ? expandedProjects.filter((id) => id !== projectId)
        : [...expandedProjects, projectId],
    }
    set(next)
    save(next)
  },
  addProject: (project) => {
    const newProject: Project = {
      ...project,
      id: uuidv4(),
      taskCount: 0,
    }
    const next: TodosState = {
      ...get(),
      projects: [...get().projects, newProject],
    }
    set(next)
    save(next)
  },
  updateProject: (id, updates) => {
    const next: TodosState = {
      ...get(),
      projects: get().projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }
    set(next)
    save(next)
  },
  deleteProject: (id) => {
    const next: TodosState = {
      ...get(),
      projects: get().projects.filter((p) => p.id !== id),
      items: get().items.map((item) =>
        item.projectId === id ? { ...item, projectId: null } : item,
      ),
    }
    set(next)
    save(next)
  },
  moveTaskToProject: (taskId, projectId) => {
    const item = get().items.find((t) => t.id === taskId)
    if (!item) return

    const updatedItem: TodoItem = {
      ...item,
      projectId: projectId || null,
      lastModified: Date.now(),
      history: [
        ...item.history,
        {
          id: uuidv4(),
          action: 'moved' as const,
          timestamp: Date.now(),
          details: `移动到项目: ${projectId || '无项目'}`,
        },
      ],
    }

    const next: TodosState = {
      ...get(),
      items: get().items.map((t) => (t.id === taskId ? updatedItem : t)),
    }
    set(next)
    save(next)
  },
  // API 相关操作实现
  syncWithAPI: async () => {
    try {
      const tasks = await getTasks()
      if (Array.isArray(tasks)) {
        const todoItems = tasks.map(taskToTodo)
        const next: TodosState = { ...get(), items: todoItems }
        set(next)
        save(next) // 保存到缓存
      }
    } catch (error) {
      console.error('同步数据失败:', error)
    }
  },
  addWithAPI: async (title, dueDate) => {
    try {
      const todoData = {
        title,
        completed: false,
        dueDate,
        priority: 4 as const,
        description: undefined,
        lastModified: Date.now(),
        history: [],
      }
      const taskData = todoToTaskCreate(todoData)
      await createTask(taskData)

      // 创建成功后重新获取最新数据
      await get().syncWithAPI()
    } catch (error) {
      console.error('创建任务失败:', error)
    }
  },
  updateWithAPI: async (item) => {
    try {
      const taskData = todoToTask(item)
      await updateTask(taskData)

      // 更新成功后重新获取最新数据
      await get().syncWithAPI()
    } catch (error) {
      console.error('更新任务失败:', error)
    }
  },
  removeWithAPI: async (id) => {
    try {
      // 注：这里需要根据后端API调整删除接口
      // await deleteTask(id)  // 假设后端有删除接口
      console.log('删除任务 ID:', id) // 使用参数避免 linter 警告

      // 删除成功后重新获取最新数据
      await get().syncWithAPI()
    } catch (error) {
      console.error('删除任务失败:', error)
    }
  },
  refreshFromAPI: async () => {
    // 手动刷新，直接调用同步方法
    await get().syncWithAPI()
  },
}))
