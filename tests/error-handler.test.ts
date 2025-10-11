import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { errorHandler, RetryHandler, safeExecute, isNetworkError, isVersionConflictError } from '../src/lib/error-handler'

describe('ErrorHandler', () => {
  beforeEach(() => {
    errorHandler.clearErrors()
  })

  it('应该记录错误', () => {
    const error = new Error('测试错误')
    errorHandler.logError('network', '网络错误', error, { context: 'test' })

    const errors = errorHandler.getRecentErrors()
    expect(errors).toHaveLength(1)
    expect(errors[0].type).toBe('network')
    expect(errors[0].message).toBe('网络错误')
    expect(errors[0].originalError).toBe(error)
    expect(errors[0].context).toEqual({ context: 'test' })
  })

  it('应该按类型过滤错误', () => {
    errorHandler.logError('network', '网络错误1')
    errorHandler.logError('sync', '同步错误1')
    errorHandler.logError('network', '网络错误2')

    const networkErrors = errorHandler.getErrorsByType('network')
    expect(networkErrors).toHaveLength(2)
    expect(networkErrors.every(e => e.type === 'network')).toBe(true)
  })

  it('应该限制错误数量', () => {
    // 添加超过100个错误
    for (let i = 0; i < 150; i++) {
      errorHandler.logError('unknown', `错误 ${i}`)
    }

    const errors = errorHandler.getRecentErrors(200)
    expect(errors.length).toBeLessThanOrEqual(100)
  })
})

describe('RetryHandler', () => {
  beforeEach(() => {
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('应该在成功时立即返回结果', async () => {
    const mockOperation = vi.fn().mockResolvedValue('success')
    
    const result = await RetryHandler.withRetry(mockOperation, 3, 100)
    
    expect(result).toBe('success')
    expect(mockOperation).toHaveBeenCalledTimes(1)
  })

  it('应该在失败时进行重试', async () => {
    const mockOperation = vi.fn()
      .mockRejectedValueOnce(new Error('第一次失败'))
      .mockRejectedValueOnce(new Error('第二次失败'))
      .mockResolvedValue('成功')

    const result = await RetryHandler.withRetry(mockOperation, 3, 100)
    
    expect(result).toBe('成功')
    expect(mockOperation).toHaveBeenCalledTimes(3)
  }, 10000)

  it('应该在最大重试次数后抛出错误', async () => {
    const mockOperation = vi.fn().mockRejectedValue(new Error('持续失败'))
    
    await expect(RetryHandler.withRetry(mockOperation, 2, 100)).rejects.toThrow('持续失败')
    
    // 应该调用原始操作 + 2次重试 = 3次
    expect(mockOperation).toHaveBeenCalledTimes(3)
  }, 10000)
})

describe('safeExecute', () => {
  it('应该在成功时返回结果', async () => {
    const operation = vi.fn().mockResolvedValue('成功结果')
    
    const result = await safeExecute(operation, '默认值')
    
    expect(result).toBe('成功结果')
  })

  it('应该在失败时返回默认值', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('操作失败'))
    
    const result = await safeExecute(operation, '默认值')
    
    expect(result).toBe('默认值')
  })

  it('应该在失败时记录错误', async () => {
    // 清空之前的错误记录
    errorHandler.clearErrors()
    
    const operation = vi.fn().mockRejectedValue(new Error('操作失败'))
    
    await safeExecute(operation, '默认值', 'sync', { context: 'test' })
    
    const errors = errorHandler.getRecentErrors()
    expect(errors).toHaveLength(1)
    expect(errors[0].type).toBe('sync')
    expect(errors[0].context).toEqual({ context: 'test' })
  })
})

describe('错误检测函数', () => {
  it('应该识别网络错误', () => {
    expect(isNetworkError(new Error('Failed to fetch'))).toBe(true)
    expect(isNetworkError(new Error('Network Error'))).toBe(true)
    expect(isNetworkError(new Error('ERR_NETWORK'))).toBe(true)
    expect(isNetworkError(new Error('普通错误'))).toBe(false)
  })

  it('应该识别版本冲突错误', () => {
    expect(isVersionConflictError(new Error('version conflict'))).toBe(true)
    expect(isVersionConflictError(new Error('409'))).toBe(true)
    expect(isVersionConflictError(new Error('Conflict'))).toBe(true)
    expect(isVersionConflictError(new Error('普通错误'))).toBe(false)
  })
})