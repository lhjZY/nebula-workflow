import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { useMindmapsStore } from '../src/stores/mindmaps'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    })
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock crypto.randomUUID
Object.defineProperty(crypto, 'randomUUID', {
  value: vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9))
})

// Mock API services
vi.mock('../src/services/mindmap', () => ({
  getMindmapFiles: vi.fn(),
  getMindmapFile: vi.fn(),
  createMindmapFile: vi.fn(),
  updateMindmapFile: vi.fn(),
  deleteMindmapFile: vi.fn(),
  batchSyncMindmaps: vi.fn(),
  isOnline: vi.fn(() => true),
  debounce: vi.fn((fn) => fn),
  serverToClientFile: vi.fn(),
  clientToServerFile: vi.fn()
}))

// Mock error handler
vi.mock('../src/lib/error-handler', () => ({
  errorHandler: {
    logError: vi.fn()
  },
  safeExecute: vi.fn((operation) => operation())
}))

describe('MindmapsStore', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    
    // 重置 store 状态
    useMindmapsStore.setState({
      files: [],
      activeFileId: null
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('基础操作', () => {
    it('应该创建新文件', () => {
      const store = useMindmapsStore.getState()
      const fileId = store.createFile('测试文件')

      const updatedStore = useMindmapsStore.getState()
      
      expect(updatedStore.files).toHaveLength(1)
      expect(updatedStore.files[0].id).toBe(fileId)
      expect(updatedStore.files[0].name).toBe('测试文件')
      expect(updatedStore.files[0].syncStatus).toBe('offline')
      expect(updatedStore.activeFileId).toBe(fileId)
    })

    it('应该处理空文件名', () => {
      const store = useMindmapsStore.getState()
      store.createFile('')

      const updatedStore = useMindmapsStore.getState()
      expect(updatedStore.files[0].name).toBe('新思维导图')
    })

    it('应该删除文件', () => {
      const store = useMindmapsStore.getState()
      const fileId1 = store.createFile('文件1')
      const fileId2 = store.createFile('文件2')

      // 删除第一个文件
      store.deleteFile(fileId1)

      const updatedStore = useMindmapsStore.getState()
      expect(updatedStore.files).toHaveLength(1)
      expect(updatedStore.files[0].id).toBe(fileId2)
      expect(updatedStore.activeFileId).toBe(fileId2)
    })

    it('应该在删除当前活动文件时切换到其他文件', () => {
      const store = useMindmapsStore.getState()
      const fileId1 = store.createFile('文件1')
      const fileId2 = store.createFile('文件2')

      // 设置第一个文件为活动文件
      store.setActiveFile(fileId1)
      
      // 删除活动文件
      store.deleteFile(fileId1)

      const updatedStore = useMindmapsStore.getState()
      expect(updatedStore.activeFileId).toBe(fileId2)
    })

    it('应该重命名文件', () => {
      const store = useMindmapsStore.getState()
      const fileId = store.createFile('原始名称')

      store.renameFile(fileId, '新名称')

      const updatedStore = useMindmapsStore.getState()
      expect(updatedStore.files[0].name).toBe('新名称')
      expect(updatedStore.files[0].updatedAt).toBeGreaterThan(0)
    })

    it('应该设置活动文件', () => {
      const store = useMindmapsStore.getState()
      const fileId1 = store.createFile('文件1')
      store.createFile('文件2')

      store.setActiveFile(fileId1)

      const updatedStore = useMindmapsStore.getState()
      expect(updatedStore.activeFileId).toBe(fileId1)
    })

    it('应该更新文件数据并标记为dirty', () => {
      const store = useMindmapsStore.getState()
      const fileId = store.createFile('测试文件')

      const newData = {
        elements: [{ id: '1', type: 'rectangle' }],
        appState: { zoom: 1.5 }
      }

      store.updateFileData(fileId, newData)

      const updatedStore = useMindmapsStore.getState()
      const file = updatedStore.files[0]
      
      expect(file.data).toEqual(newData)
      expect(file.syncStatus).toBe('dirty')
      expect(file.updatedAt).toBeGreaterThan(0)
    })
  })

  describe('同步状态管理', () => {
    it('应该设置同步状态', () => {
      const store = useMindmapsStore.getState()
      const fileId = store.createFile('测试文件')

      store.setSyncStatus(fileId, 'syncing')

      const updatedStore = useMindmapsStore.getState()
      expect(updatedStore.files[0].syncStatus).toBe('syncing')
    })

    it('应该标记文件为dirty', () => {
      const store = useMindmapsStore.getState()
      const fileId = store.createFile('测试文件')

      store.markFileDirty(fileId)

      const updatedStore = useMindmapsStore.getState()
      expect(updatedStore.files[0].syncStatus).toBe('dirty')
    })
  })

  describe('缓存策略', () => {
    it('应该返回活动文件', () => {
      const store = useMindmapsStore.getState()
      const fileId = store.createFile('测试文件')

      const activeFile = store.getActiveFileWithFallback()
      
      expect(activeFile?.id).toBe(fileId)
    })

    it('应该在没有活动文件时返回第一个文件', () => {
      const store = useMindmapsStore.getState()
      const fileId1 = store.createFile('文件1')
      store.createFile('文件2')

      // 清除活动文件ID
      useMindmapsStore.setState({ ...useMindmapsStore.getState(), activeFileId: null })

      const activeFile = store.getActiveFileWithFallback()
      
      expect(activeFile?.id).toBe(fileId1)
    })

    it('应该在没有文件时返回null', () => {
      const store = useMindmapsStore.getState()
      
      const activeFile = store.getActiveFileWithFallback()
      
      expect(activeFile).toBeNull()
    })
  })

  describe('本地存储', () => {
    it('应该保存状态到localStorage', () => {
      const store = useMindmapsStore.getState()
      store.createFile('测试文件')

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'workflow_mindmaps_v1',
        expect.stringContaining('测试文件')
      )
    })

    it.skip('应该从 localStorage 加载状态', () => {
      // Skip this test for now
    })
  })

  describe('边界情况', () => {
    it('应该处理不存在的文件ID', () => {
      const store = useMindmapsStore.getState()
      
      // 尝试操作不存在的文件
      expect(() => store.deleteFile('non-existent')).not.toThrow()
      expect(() => store.renameFile('non-existent', '新名称')).not.toThrow()
      expect(() => store.setActiveFile('non-existent')).not.toThrow()
      expect(() => store.updateFileData('non-existent', {})).not.toThrow()
    })

    it('应该处理localStorage错误', () => {
      // Mock localStorage error
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded')
      })

      const store = useMindmapsStore.getState()
      
      // 创建文件应该成功，即使保存失败
      expect(() => store.createFile('测试文件')).not.toThrow()
    })
  })
})