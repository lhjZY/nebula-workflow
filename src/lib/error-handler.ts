export type ErrorType = 'network' | 'sync' | 'storage' | 'unknown'

export interface AppError {
  type: ErrorType
  message: string
  originalError?: Error
  timestamp: number
  context?: Record<string, unknown>
}

export class ErrorHandler {
  private static instance: ErrorHandler
  private errors: AppError[] = []
  private listeners: ((error: AppError) => void)[] = []

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * 记录错误
   */
  logError(type: ErrorType, message: string, originalError?: Error, context?: Record<string, unknown>) {
    const error: AppError = {
      type,
      message,
      originalError,
      timestamp: Date.now(),
      context,
    }

    this.errors.push(error)
    
    // 保持错误日志数量在合理范围内
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-50)
    }

    // 通知监听器
    this.listeners.forEach(listener => listener(error))

    // 控制台输出
    console.error(`[${type.toUpperCase()}] ${message}`, originalError, context)
  }

  /**
   * 添加错误监听器
   */
  addListener(listener: (error: AppError) => void) {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * 获取最近的错误
   */
  getRecentErrors(limit = 10): AppError[] {
    return this.errors.slice(-limit)
  }

  /**
   * 获取指定类型的错误
   */
  getErrorsByType(type: ErrorType): AppError[] {
    return this.errors.filter(error => error.type === type)
  }

  /**
   * 清空错误日志
   */
  clearErrors() {
    this.errors = []
  }
}

/**
 * 全局错误处理器实例
 */
export const errorHandler = ErrorHandler.getInstance()

/**
 * 重试机制
 */
export class RetryHandler {
  /**
   * 指数退避重试
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        if (attempt === maxRetries) {
          errorHandler.logError(
            'network',
            `操作失败，已重试 ${maxRetries} 次`,
            lastError,
            { maxRetries, attempt }
          )
          throw lastError
        }

        // 计算延迟时间（指数退避）
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
        
        console.log(`操作失败，${delay}ms 后进行第 ${attempt + 1} 次重试`, error)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError!
  }

  /**
   * 网络错误专用重试
   */
  static async withNetworkRetry<T>(
    operation: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> {
    return this.withRetry(
      operation,
      3, // 最多重试3次
      1000, // 基础延迟1秒
      5000 // 最大延迟5秒
    ).catch(error => {
      errorHandler.logError('network', '网络操作最终失败', error, context)
      throw error
    })
  }
}

/**
 * 安全执行函数，捕获并处理错误
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  fallback?: T,
  errorType: ErrorType = 'unknown',
  context?: Record<string, unknown>
): Promise<T | undefined> {
  try {
    return await operation()
  } catch (error) {
    errorHandler.logError(
      errorType,
      '操作执行失败',
      error as Error,
      context
    )
    return fallback
  }
}

/**
 * 检查是否为网络错误
 */
export function isNetworkError(error: Error): boolean {
  return (
    error.message.includes('Failed to fetch') ||
    error.message.includes('Network Error') ||
    error.message.includes('ERR_NETWORK') ||
    error.message.includes('ERR_INTERNET_DISCONNECTED')
  )
}

/**
 * 检查是否为版本冲突错误
 */
export function isVersionConflictError(error: Error): boolean {
  return (
    error.message.includes('version conflict') ||
    error.message.includes('409') ||
    error.message.includes('Conflict')
  )
}