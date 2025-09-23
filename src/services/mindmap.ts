import { http } from '@/lib/http'
import type { MindmapFile } from '@/stores/mindmaps'
import { RetryHandler, errorHandler, isNetworkError, isVersionConflictError } from '@/lib/error-handler'

export type MindmapServerFile = {
  id: string
  name: string
  content_json: {
    elements?: unknown
    appState?: Record<string, unknown>
  }
  created_at: string
  updated_at: string
  version: number
}

export type MindmapCreateRequest = {
  name: string
  content_json: {
    elements?: unknown
    appState?: Record<string, unknown>
  }
}

export type MindmapUpdateRequest = {
  name: string
  content_json: {
    elements?: unknown
    appState?: Record<string, unknown>
  }
  version: number
}

export type SyncOperation = {
  type: 'create' | 'update' | 'delete'
  id?: string
  temp_id?: string
  data?: MindmapUpdateRequest
}

export type BatchSyncRequest = {
  operations: SyncOperation[]
}

export type BatchSyncResponse = {
  results: Array<{
    type: 'create' | 'update' | 'delete'
    temp_id?: string
    id: string
    success: boolean
    error?: string
    data?: MindmapServerFile
  }>
}

// 数据转换函数：服务端格式 -> 客户端格式
export function serverToClientFile(serverFile: MindmapServerFile): MindmapFile {
  return {
    id: serverFile.id,
    name: serverFile.name,
    createdAt: new Date(serverFile.created_at).getTime(),
    updatedAt: new Date(serverFile.updated_at).getTime(),
    data: serverFile.content_json,
    syncStatus: 'synced',
    version: serverFile.version,
    lastSyncTime: Date.now(),
  }
}

// 数据转换函数：客户端格式 -> 服务端格式
export function clientToServerFile(clientFile: MindmapFile): MindmapUpdateRequest {
  return {
    name: clientFile.name,
    content_json: clientFile.data,
    version: clientFile.version || 1,
  }
}

/**
 * 获取用户的所有思维导图文件列表
 */
export async function getMindmapFiles(): Promise<MindmapFile[]> {
  return RetryHandler.withNetworkRetry(async () => {
    try {
      const response = await http('/mindmaps', { method: 'GET' })
      const serverFiles = Array.isArray(response) ? response : []
      return serverFiles.map(serverToClientFile)
    } catch (error) {
      const err = error as Error
      
      if (isNetworkError(err)) {
        errorHandler.logError('network', '网络连接失败，无法获取文件列表', err)
      } else {
        errorHandler.logError('sync', '获取思维导图文件列表失败', err)
      }
      
      throw err
    }
  }, { operation: 'getMindmapFiles' })
}

/**
 * 获取单个思维导图文件详情
 */
export async function getMindmapFile(id: string): Promise<MindmapFile> {
  return RetryHandler.withNetworkRetry(async () => {
    try {
      const response = await http(`/mindmaps/${id}`, { method: 'GET' })
      return serverToClientFile(response as MindmapServerFile)
    } catch (error) {
      const err = error as Error
      
      if (isNetworkError(err)) {
        errorHandler.logError('network', `网络连接失败，无法获取文件 ${id}`, err)
      } else {
        errorHandler.logError('sync', `获取思维导图文件 ${id} 失败`, err)
      }
      
      throw err
    }
  }, { operation: 'getMindmapFile', fileId: id })
}

/**
 * 创建新的思维导图文件
 */
export async function createMindmapFile(data: MindmapCreateRequest): Promise<MindmapFile> {
  try {
    const response = await http('/mindmaps', {
      method: 'POST',
      body: data,
    })
    return serverToClientFile(response as MindmapServerFile)
  } catch (error) {
    console.error('创建思维导图文件失败:', error)
    throw error
  }
}

/**
 * 更新思维导图文件
 */
export async function updateMindmapFile(id: string, data: MindmapUpdateRequest): Promise<MindmapFile> {
  return RetryHandler.withNetworkRetry(async () => {
    try {
      const response = await http(`/mindmaps/${id}`, {
        method: 'PUT',
        body: data,
      })
      return serverToClientFile(response as MindmapServerFile)
    } catch (error) {
      const err = error as Error
      
      if (isVersionConflictError(err)) {
        errorHandler.logError('sync', `文件 ${id} 版本冲突`, err, { fileId: id, version: data.version })
        throw new Error('VERSION_CONFLICT')
      } else if (isNetworkError(err)) {
        errorHandler.logError('network', `网络连接失败，无法更新文件 ${id}`, err)
      } else {
        errorHandler.logError('sync', `更新思维导图文件 ${id} 失败`, err)
      }
      
      throw err
    }
  }, { operation: 'updateMindmapFile', fileId: id, version: data.version })
}

/**
 * 删除思维导图文件
 */
export async function deleteMindmapFile(id: string): Promise<void> {
  try {
    await http(`/mindmaps/${id}`, { method: 'DELETE' })
  } catch (error) {
    console.error(`删除思维导图文件 ${id} 失败:`, error)
    throw error
  }
}

/**
 * 批量同步操作
 */
export async function batchSyncMindmaps(request: BatchSyncRequest): Promise<BatchSyncResponse> {
  try {
    const response = await http('/mindmaps/batch-sync', {
      method: 'POST',
      body: request,
    })
    return response as BatchSyncResponse
  } catch (error) {
    console.error('批量同步思维导图失败:', error)
    throw error
  }
}

/**
 * 检查网络连接状态
 */
export function isOnline(): boolean {
  return navigator.onLine
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}