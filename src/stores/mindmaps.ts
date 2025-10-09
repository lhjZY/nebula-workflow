import { v4 as uuidv4 } from 'uuid'
import { create } from 'zustand'

import { errorHandler, safeExecute } from '@/lib/error-handler'
import * as mindmapApi from '@/services/mindmap'
import { debounce, isOnline } from '@/services/mindmap'

export type MindmapFile = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  data: {
    elements?: unknown
    appState?: Record<string, unknown>
  }
  // 新增同步状态字段
  syncStatus?: 'synced' | 'syncing' | 'conflict' | 'offline' | 'dirty'
  version?: number
  lastSyncTime?: number
}

type MindmapsState = {
  files: MindmapFile[]
  activeFileId: string | null
}

type MindmapsActions = {
  createFile: (name: string) => string
  deleteFile: (id: string) => void
  renameFile: (id: string, newName: string) => void
  setActiveFile: (id: string) => void
  updateFileData: (
    id: string,
    data: { elements?: unknown; appState?: Record<string, unknown> },
  ) => void

  // 新增同步方法
  syncWithServer: () => Promise<void>
  loadFromServer: (fileId: string) => Promise<void>
  markFileDirty: (fileId: string) => void
  handleSyncConflict: (fileId: string, resolution: 'local' | 'server') => void
  setSyncStatus: (fileId: string, status: MindmapFile['syncStatus']) => void

  // 新增缓存策略方法
  loadWithCache: (fileId: string) => Promise<void>
  preloadFromServer: () => Promise<void>
  getActiveFileWithFallback: () => MindmapFile | null
}

const STORAGE_KEY = 'workflow_mindmaps_v1'

// 创建默认文件
const createDefaultFile = (): MindmapFile => ({
  id: uuidv4(),
  name: '新思维导图',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  data: {
    elements: [],
    appState: undefined,
  },
  syncStatus: 'offline', // 默认离线状态
  version: 1,
  lastSyncTime: 0,
})

// 迁移旧数据
const migrateOldData = (): MindmapFile | null => {
  const oldData = localStorage.getItem('workflow_mindmap_v1')
  if (!oldData) return null

  try {
    const parsed = JSON.parse(oldData)
    if (!parsed || typeof parsed !== 'object') return null

    // 清理旧数据
    localStorage.removeItem('workflow_mindmap_v1')

    return {
      id: uuidv4(),
      name: '迁移的思维导图',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      data: {
        elements: Array.isArray(parsed.elements) ? parsed.elements : [],
        appState: parsed.appState ? { ...parsed.appState } : undefined,
      },
    }
  } catch {
    return null
  }
}

function loadInitialState(): MindmapsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        files: parsed.files || [],
        activeFileId: parsed.activeFileId || null,
      }
    }
  } catch {
    // 忽略localStorage错误
  }

  // 尝试迁移旧数据
  const migratedFile = migrateOldData()
  if (migratedFile) {
    return {
      files: [migratedFile],
      activeFileId: migratedFile.id,
    }
  }

  // 创建默认文件
  const defaultFile = createDefaultFile()
  return {
    files: [defaultFile],
    activeFileId: defaultFile.id,
  }
}

function save(state: MindmapsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // 忽略localStorage错误
  }
}

export const useMindmapsStore = create<MindmapsState & MindmapsActions>()((set, get) => ({
  ...loadInitialState(),

  createFile: (name: string) => {
    const newFile: MindmapFile = {
      id: uuidv4(),
      name: name.trim() || '新思维导图',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      data: {
        elements: [],
        appState: undefined,
      },
      syncStatus: 'offline', // 默认离线状态
      version: 1,
      lastSyncTime: 0,
    }

    const next: MindmapsState = {
      files: [...get().files, newFile],
      activeFileId: newFile.id,
    }
    set(next)
    save(next)

    return newFile.id
  },

  deleteFile: (id: string) => {
    const state = get()
    const newFiles = state.files.filter((file) => file.id !== id)
    let newActiveFileId = state.activeFileId

    // 如果删除的是当前文件，选择另一个文件
    if (state.activeFileId === id) {
      newActiveFileId = newFiles.length > 0 ? newFiles[0].id : null
    }

    const next: MindmapsState = {
      files: newFiles,
      activeFileId: newActiveFileId,
    }
    set(next)
    save(next)
  },

  renameFile: (id: string, newName: string) => {
    const next: MindmapsState = {
      ...get(),
      files: get().files.map((file) =>
        file.id === id
          ? { ...file, name: newName.trim() || '未命名', updatedAt: Date.now() }
          : file,
      ),
    }
    set(next)
    save(next)
  },

  setActiveFile: (id: string) => {
    const { files } = get()
    const fileExists = files.some((file) => file.id === id)
    if (fileExists) {
      const next: MindmapsState = { ...get(), activeFileId: id }
      set(next)
      save(next)
    }
  },

  updateFileData: (
    id: string,
    data: { elements?: unknown; appState?: Record<string, unknown> },
  ) => {
    const next: MindmapsState = {
      ...get(),
      files: get().files.map((file) =>
        file.id === id
          ? {
              ...file,
              data: { ...data },
              updatedAt: Date.now(),
              syncStatus: 'dirty', // 标记为需要同步
            }
          : file,
      ),
    }
    set(next)
    save(next)

    // 触发自动同步
    triggerAutoSync()
  },

  // 同步方法的实现
  syncWithServer: async () => {
    const state = get()
    const dirtyFiles = state.files.filter((file) => file.syncStatus === 'dirty')

    if (!isOnline() || dirtyFiles.length === 0) {
      return
    }

    // 标记正在同步
    dirtyFiles.forEach((file) => {
      get().setSyncStatus(file.id, 'syncing')
    })

    const operations: mindmapApi.SyncOperation[] = dirtyFiles.map((file) => ({
      type: 'update',
      id: file.id,
      data: mindmapApi.clientToServerFile(file),
    }))

    const syncResult = await safeExecute(
      () => mindmapApi.batchSyncMindmaps({ operations }),
      undefined,
      'sync',
      { fileCount: dirtyFiles.length, fileIds: dirtyFiles.map((f) => f.id) },
    )

    if (syncResult) {
      // 处理同步结果
      syncResult.results.forEach((result) => {
        if (result.success && result.data) {
          const updatedFile = mindmapApi.serverToClientFile(result.data)
          const next: MindmapsState = {
            ...get(),
            files: get().files.map((file) => (file.id === result.id ? updatedFile : file)),
          }
          set(next)
        } else {
          // 同步失败，恢复为 dirty 状态
          get().setSyncStatus(result.id, 'dirty')
          if (result.error) {
            errorHandler.logError(
              'sync',
              `文件 ${result.id} 同步失败: ${result.error}`,
              undefined,
              {
                fileId: result.id,
                errorMessage: result.error,
              },
            )
          }
        }
      })
      save(get())
    } else {
      // 批量同步失败，恢复所有文件为 dirty 状态
      dirtyFiles.forEach((file) => {
        get().setSyncStatus(file.id, 'dirty')
      })
    }
  },

  loadFromServer: async (fileId: string) => {
    if (!isOnline()) {
      console.warn('离线状态，无法从服务端加载文件')
      return
    }

    get().setSyncStatus(fileId, 'syncing')

    const serverFile = await safeExecute(
      () => mindmapApi.getMindmapFile(fileId),
      undefined,
      'sync',
      { operation: 'loadFromServer', fileId },
    )

    if (serverFile) {
      const next: MindmapsState = {
        ...get(),
        files: get().files.map((file) => (file.id === fileId ? serverFile : file)),
      }
      set(next)
      save(next)
    } else {
      get().setSyncStatus(fileId, 'offline')
    }
  },

  markFileDirty: (fileId: string) => {
    const next: MindmapsState = {
      ...get(),
      files: get().files.map((file) =>
        file.id === fileId ? { ...file, syncStatus: 'dirty' } : file,
      ),
    }
    set(next)
    save(next)
  },

  handleSyncConflict: (fileId: string, resolution: 'local' | 'server') => {
    const state = get()
    const file = state.files.find((f) => f.id === fileId)
    if (!file) return

    if (resolution === 'server') {
      // 优先使用服务端版本
      get().loadFromServer(fileId)
    } else {
      // 优先使用本地版本，强制同步
      get().setSyncStatus(fileId, 'dirty')
      get().syncWithServer()
    }
  },

  setSyncStatus: (fileId: string, status: MindmapFile['syncStatus']) => {
    const next: MindmapsState = {
      ...get(),
      files: get().files.map((file) =>
        file.id === fileId ? { ...file, syncStatus: status } : file,
      ),
    }
    set(next)
    save(next)
  },

  // 智能缓存策略方法
  loadWithCache: async (fileId: string) => {
    const state = get()
    const localFile = state.files.find((f) => f.id === fileId)

    // 第一层：内存优先 - 如果已有数据直接返回
    if (localFile) {
      console.log('从内存缓存加载文件:', fileId)

      // 后台检查更新（仅在在线时）
      if (isOnline() && localFile.syncStatus !== 'syncing') {
        setTimeout(() => {
          get()
            .loadFromServer(fileId)
            .catch(() => {
              // 静默失败，不影响用户体验
            })
        }, 100)
      }
      return
    }

    // 第二层：从服务端加载
    if (isOnline()) {
      console.log('从服务端加载文件:', fileId)
      await get().loadFromServer(fileId)
    } else {
      console.warn('离线状态，无法加载文件:', fileId)
    }
  },

  preloadFromServer: async () => {
    if (!isOnline()) {
      console.log('离线状态，跳过预加载')
      return
    }

    try {
      console.log('开始预加载文件列表')
      const serverFiles = await mindmapApi.getMindmapFiles()

      const next: MindmapsState = {
        files: serverFiles,
        activeFileId: get().activeFileId || serverFiles[0]?.id || null,
      }

      set(next)
      save(next)
      console.log(`预加载完成，共 ${serverFiles.length} 个文件`)
    } catch (error) {
      console.error('预加载失败:', error)
    }
  },

  getActiveFileWithFallback: () => {
    const state = get()
    if (!state.activeFileId) return null

    const activeFile = state.files.find((f) => f.id === state.activeFileId)
    if (activeFile) return activeFile

    // 如果活动文件不存在，返回第一个文件
    return state.files[0] || null
  },
}))

// 创建防抖同步函数
const debouncedSync = debounce(() => {
  useMindmapsStore.getState().syncWithServer()
}, 2000)

// 监听数据变化，自动同步
const triggerAutoSync = () => {
  if (isOnline()) {
    debouncedSync()
  }
}

export { triggerAutoSync }

// 网络状态监听和自动恢复同步
if (typeof window !== 'undefined') {
  window.addEventListener('network-restored', () => {
    console.log('网络恢复，开始自动同步')

    const store = useMindmapsStore.getState()
    const dirtyFiles = store.files.filter((f) => f.syncStatus === 'dirty')

    if (dirtyFiles.length > 0) {
      console.log(`发现 ${dirtyFiles.length} 个未同步文件，开始同步`)
      store.syncWithServer()
    }

    // 预加载服务端数据
    store.preloadFromServer()
  })
}
