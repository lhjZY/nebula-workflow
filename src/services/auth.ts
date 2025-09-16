import { http } from '../lib/http'

export type LoginPayload = { email: string; password: string }
export type RegisterPayload = { email: string; password: string; name: string }
// API响应格式已在http.ts中处理，这里直接定义data部分的类型
export type AuthResponse = { token: string }
export type UserInfo = { email: string; name?: string; id?: string }

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return http('/auth/login', { method: 'POST', body: payload })
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  return http('/auth/register', { method: 'POST', body: payload })
}

export async function info(): Promise<UserInfo> {
  return http('/auth/info', { method: 'GET' })
}
