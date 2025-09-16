import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import * as AuthService from '../services/auth'
import { useAuthStore } from '../stores/auth'

export function useLogin() {
  const navigate = useNavigate()
  const storeLogin = useAuthStore((s) => s.login)

  return useMutation({
    mutationFn: AuthService.login,
    onSuccess: (data, variables) => {
      storeLogin(variables.email, data.token)
      navigate({ to: '/todo' })
    },
  })
}

export function useRegister() {
  const navigate = useNavigate()
  const storeLogin = useAuthStore((s) => s.login)

  return useMutation({
    mutationFn: AuthService.register,
    onSuccess: (data, variables) => {
      storeLogin(variables.email, data.token)
      navigate({ to: '/todo' })
    },
  })
}

export function useTokenValidation() {
  const navigate = useNavigate()
  const { isAuthenticated, token, logout } = useAuthStore()

  const query = useQuery({
    queryKey: ['auth', 'validate', token],
    queryFn: AuthService.info,
    enabled: isAuthenticated && !!token, // 只有在已认证且有token时才执行
    retry: false, // 不重试，避免多次无效请求
    staleTime: 5 * 60 * 1000, // 5分钟内不重新验证
  })

  // 处理token验证失败的情况
  useEffect(() => {
    if (query.isError && isAuthenticated) {
      // token验证失败，清空认证状态并跳转到登录页
      logout()
      navigate({ to: '/login' })
    }
  }, [query.isError, isAuthenticated, logout, navigate])

  return query
}


