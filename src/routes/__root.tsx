import { createRootRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Moon, Sun, ListTodo, Brain, LogIn, User } from 'lucide-react'
import { useState } from 'react'

import { Popover, PopoverTrigger, PopoverContent } from '@/components/components/ui/popover'
import { Button } from '@/components/components/ui/button'
import { useTokenValidation } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { useAuthStore } from '../stores/auth'
export const Route = createRootRoute({
  beforeLoad: ({ location }: { location: { pathname: string } }) => {
    // 根路径重定向到 /todo
    if (location.pathname === '/') {
      const { isAuthenticated } = useAuthStore.getState()
      if (!isAuthenticated) {
        throw redirect({ to: '/login' })
      }
      throw redirect({ to: '/todo' })
    }
  },
  component: RootComponent,
})

function RootComponent() {
  const { isAuthenticated, userEmail, logout } = useAuthStore()
  const { theme, toggleTheme } = useTheme()
  const [avatarError, setAvatarError] = useState(false)

  // 在应用启动时验证token有效性
  useTokenValidation()

  return (
    <div className="h-dvh w-full bg-background text-foreground flex">
      <header className="sticky bg-card/80 backdrop-blur-sm border-b py-5 border-border">
        <div className="w-full flex flex-col items-center justify-between px-2 py-3">
          <nav className="flex flex-col items-center gap-4 text-sm">
            {!isAuthenticated ? (
              <Link
                to="/login"
                aria-label="登录"
                title="登录"
                className="rounded-md p-2 hover:bg-accent hover:text-accent-foreground transition-colors"
                activeProps={{ className: 'underline' }}
              >
                <LogIn className="h-4 w-4" />
              </Link>
            ) : (
              <Popover>
                <PopoverTrigger
                  aria-label="用户菜单"
                  className="rounded-full p-0 outline-none focus:outline-none"
                >
                  {avatarError ? (
                    <div className="h-8 w-8 rounded-full border flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                  ) : (
                    <img
                      src="/src/avatar.jpg"
                      alt="用户头像"
                      className="h-8 w-8 rounded-full object-cover border"
                      onError={() => setAvatarError(true)}
                    />
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-40 p-2">
                  <div className="flex flex-col gap-2">
                    <Button variant="ghost" className="justify-start" onClick={logout}>
                      退出登录
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            <Link
              to="/todo"
              aria-label="待办"
              title="待办"
              className="rounded-md p-2 hover:bg-accent hover:text-accent-foreground transition-colors"
              activeProps={{ className: 'underline' }}
            >
              <ListTodo className="h-4 w-4" />
            </Link>

            <Link
              to="/mindmap"
              aria-label="思维导图"
              title="思维导图"
              className="rounded-md p-2 hover:bg-accent hover:text-accent-foreground transition-colors"
              activeProps={{ className: 'underline' }}
            >
              <Brain className="h-4 w-4" />
            </Link>

            <button
              onClick={toggleTheme}
              className="rounded-md p-2 hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label="切换主题"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          </nav>
        </div>
      </header>
      <main className="w-full flex-1 min-h-0 overflow-hidden px-2 flex flex-col">
        <Outlet />
      </main>
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  )
}
