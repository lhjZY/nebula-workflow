import { useState } from 'react'

import { useLogin, useRegister } from '../hooks/useAuth'

import { Button } from '@/components/components/ui/button'
import { Card, CardContent } from '@/components/components/ui/card'
import { Input } from '@/components/components/ui/input'
import { cn } from '@/components/lib/utils'

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isRegister, setIsRegister] = useState(false)

  const loginMutation = useLogin()
  const registerMutation = useRegister()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || submitting) return
    if (isRegister && !name) return
    setSubmitting(true)
    setErrorMsg(null)
    try {
      if (isRegister) {
        await registerMutation.mutateAsync({ email, password, name })
      } else {
        await loginMutation.mutateAsync({ email, password })
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : isRegister ? '注册失败' : '登录失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="mx-auto w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 text-center">
              <h1 className="text-2xl font-bold">{isRegister ? '创建账号' : '登录'}</h1>
              <p className="text-balance text-muted-foreground">
                {isRegister ? '请输入您的信息来创建账号' : '请输入您的邮箱来登录您的账号'}
              </p>
            </div>
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              {isRegister && (
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    姓名
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="请输入您的姓名"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-medium">
                  邮箱
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center">
                  <label htmlFor="password" className="text-sm font-medium">
                    密码
                  </label>
                  {!isRegister && (
                    <a href="#" className="ml-auto text-sm underline">
                      忘记密码？
                    </a>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="请输入密码"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {errorMsg && <div className="text-sm text-destructive">{errorMsg}</div>}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting
                  ? isRegister
                    ? '正在创建账号...'
                    : '正在登录...'
                  : isRegister
                  ? '创建账号'
                  : '登录'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              {isRegister ? (
                <>
                  已有账号？{' '}
                  <button
                    type="button"
                    className="underline font-medium"
                    onClick={() => setIsRegister(false)}
                  >
                    立即登录
                  </button>
                </>
              ) : (
                <>
                  还没有账号？{' '}
                  <button
                    type="button"
                    className="underline font-medium"
                    onClick={() => setIsRegister(true)}
                  >
                    立即注册
                  </button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
