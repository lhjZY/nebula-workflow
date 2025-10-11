import { describe, it, expect, vi, beforeEach } from 'vitest'

import * as mindmapApi from '../src/services/mindmap'

// Mock http module
vi.mock('../src/lib/http', () => ({
  http: vi.fn()
}))

// Mock error handler
vi.mock('../src/lib/error-handler', () => ({
  RetryHandler: {
    withNetworkRetry: vi.fn((operation) => operation())
  },
  errorHandler: {
    logError: vi.fn()
  },
  isNetworkError: vi.fn(() => false),
  isVersionConflictError: vi.fn(() => false)
}))

import { http } from '../src/lib/http'

const mockHttp = vi.mocked(http)

describe('Mindmap API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('数据转换函数', () => {
    it('应该正确转换服务端数据到客户端格式', () => {
      const serverFile: mindmapApi.MindmapServerFile = {
        id: 'test-id',
        name: '测试文件',
        content_json: {
          elements: [],
          appState: { test: true }
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T01:00:00Z',
        version: 1
      }

      const clientFile = mindmapApi.serverToClientFile(serverFile)

      expect(clientFile).toEqual({
        id: 'test-id',
        name: '测试文件',
        createdAt: new Date('2024-01-01T00:00:00Z').getTime(),
        updatedAt: new Date('2024-01-01T01:00:00Z').getTime(),
        data: {
          elements: [],
          appState: { test: true }
        },
        syncStatus: 'synced',
        version: 1,
        lastSyncTime: expect.any(Number)
      })
    })

    it('应该正确转换客户端数据到服务端格式', () => {
      const clientFile: mindmapApi.MindmapFile = {
        id: 'test-id',
        name: '测试文件',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: {
          elements: [{ id: '1', type: 'element' }],
          appState: { zoom: 1.0 }
        },
        version: 2
      }

      const serverRequest = mindmapApi.clientToServerFile(clientFile)

      expect(serverRequest).toEqual({
        name: '测试文件',
        content_json: {
          elements: [{ id: '1', type: 'element' }],
          appState: { zoom: 1.0 }
        },
        version: 2
      })
    })
  })

  describe('API 调用', () => {
    it('应该获取文件列表', async () => {
      const mockResponse = [
        {
          id: 'file1',
          name: '文件1',
          content_json: { elements: [] },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          version: 1
        }
      ]

      mockHttp.mockResolvedValue(mockResponse)

      const result = await mindmapApi.getMindmapFiles()

      expect(mockHttp).toHaveBeenCalledWith('/mindmaps', { method: 'GET' })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('file1')
      expect(result[0].syncStatus).toBe('synced')
    })

    it('应该获取单个文件', async () => {
      const mockResponse = {
        id: 'test-id',
        name: '测试文件',
        content_json: { elements: [] },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        version: 1
      }

      mockHttp.mockResolvedValue(mockResponse)

      const result = await mindmapApi.getMindmapFile('test-id')

      expect(mockHttp).toHaveBeenCalledWith('/mindmaps/test-id', { method: 'GET' })
      expect(result.id).toBe('test-id')
    })

    it('应该创建新文件', async () => {
      const createRequest = {
        name: '新文件',
        content_json: { elements: [] }
      }

      const mockResponse = {
        id: 'new-id',
        name: '新文件',
        content_json: { elements: [] },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        version: 1
      }

      mockHttp.mockResolvedValue(mockResponse)

      const result = await mindmapApi.createMindmapFile(createRequest)

      expect(mockHttp).toHaveBeenCalledWith('/mindmaps', {
        method: 'POST',
        body: createRequest
      })
      expect(result.id).toBe('new-id')
    })

    it('应该更新文件', async () => {
      const updateRequest = {
        name: '更新的文件',
        content_json: { elements: [{ id: '1' }] },
        version: 2
      }

      const mockResponse = {
        id: 'test-id',
        name: '更新的文件',
        content_json: { elements: [{ id: '1' }] },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T01:00:00Z',
        version: 2
      }

      mockHttp.mockResolvedValue(mockResponse)

      const result = await mindmapApi.updateMindmapFile('test-id', updateRequest)

      expect(mockHttp).toHaveBeenCalledWith('/mindmaps/test-id', {
        method: 'PUT',
        body: updateRequest
      })
      expect(result.version).toBe(2)
    })

    it('应该删除文件', async () => {
      mockHttp.mockResolvedValue(undefined)

      await mindmapApi.deleteMindmapFile('test-id')

      expect(mockHttp).toHaveBeenCalledWith('/mindmaps/test-id', { method: 'DELETE' })
    })

    it('应该处理批量同步', async () => {
      const batchRequest = {
        operations: [
          {
            type: 'update' as const,
            id: 'file1',
            data: {
              name: '更新文件1',
              content_json: { elements: [] },
              version: 2
            }
          }
        ]
      }

      const mockResponse = {
        results: [
          {
            type: 'update' as const,
            id: 'file1',
            success: true,
            data: {
              id: 'file1',
              name: '更新文件1',
              content_json: { elements: [] },
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T01:00:00Z',
              version: 2
            }
          }
        ]
      }

      mockHttp.mockResolvedValue(mockResponse)

      const result = await mindmapApi.batchSyncMindmaps(batchRequest)

      expect(mockHttp).toHaveBeenCalledWith('/mindmaps/batch-sync', {
        method: 'POST',
        body: batchRequest
      })
      expect(result.results).toHaveLength(1)
      expect(result.results[0].success).toBe(true)
    })
  })

  describe('工具函数', () => {
    it('应该检测在线状态', () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true
      })

      expect(mindmapApi.isOnline()).toBe(true)

      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      })

      expect(mindmapApi.isOnline()).toBe(false)
    })

    it('应该正确实现防抖', (done) => {
      const mockFn = vi.fn()
      const debouncedFn = mindmapApi.debounce(mockFn, 100)

      // 快速调用多次
      debouncedFn('arg1')
      debouncedFn('arg2')
      debouncedFn('arg3')

      // 立即检查，应该还没有调用
      expect(mockFn).not.toHaveBeenCalled()

      // 等待延迟后检查
      setTimeout(() => {
        expect(mockFn).toHaveBeenCalledTimes(1)
        expect(mockFn).toHaveBeenLastCalledWith('arg3')
        done()
      }, 150)
    })
  })
})