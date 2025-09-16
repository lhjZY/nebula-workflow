import { useAuthStore } from '../stores/auth'

type HttpOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: unknown
}

const jsonHeaders = { 'Content-Type': 'application/json' }
const BASE_URL = '/api/v1'

// 通用的items字段处理函数
function processItemsResponse(data: unknown): unknown {
  // 如果响应包含items字段，则提取items数组
  if (data && typeof data === 'object' && 'items' in data && Array.isArray((data as Record<string, unknown>).items)) {
    return (data as Record<string, unknown>).items
  }
  // 兼容直接返回数组的格式
  if (Array.isArray(data)) {
    return data
  }
  // 其他情况直接返回原数据
  return data
}

export async function http(path: string, options: HttpOptions = {}) {
  const state = useAuthStore.getState()
  const headers: Record<string, string> = {
    ...(options.headers || {}),
  }
  if (options.body && !headers['Content-Type']) {
    Object.assign(headers, jsonHeaders)
  }
  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`
  }

  const url = path.startsWith('/') ? `${BASE_URL}${path}` : `${BASE_URL}/${path}`
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const contentType = res.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  
  if (!res.ok) {
    const errorText = isJson ? 
      await res.json().then(data => data.message || `HTTP ${res.status}`).catch(() => `HTTP ${res.status}`) :
      await res.text().catch(() => `HTTP ${res.status}`)
    throw new Error(errorText)
  }

  if (isJson) {
    const responseData = await res.json()
    // 处理 {code, data, message} 格式的响应
    if (responseData && typeof responseData === 'object' && 'data' in responseData) {
      if (responseData.code !== 0 && responseData.code !== 200) {
        throw new Error(responseData.message || '请求失败')
      }
      return processItemsResponse(responseData.data)
    }
    return processItemsResponse(responseData)
  }
  return res.text()
}


