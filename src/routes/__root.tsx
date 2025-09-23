import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Moon, Sun } from 'lucide-react'

import { useTokenValidation } from '../hooks/useAuth'
import { useAuthStore } from '../stores/auth'
import { useTheme } from '../hooks/useTheme'
export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const { isAuthenticated, userEmail, logout } = useAuthStore()
  const { theme, toggleTheme } = useTheme()
  
  // 在应用启动时验证token有效性
  useTokenValidation()
  
  return (
    <div className="h-dvh w-full bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="w-full flex items-center justify-between px-6 py-3">
          <div className="font-semibold tracking-tight">
            <div className="px-4 py-2 rounded-lg">workflow</div>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/" activeProps={{ className: 'underline' }}>
              首页
            </Link>
            <Link to="/todo" activeProps={{ className: 'underline' }}>
              Todo
            </Link>
            <Link to="/mindmap" activeProps={{ className: 'underline' }}>
              思维导图
            </Link>
            
            {/* 主题切换按钮 */}
            <button
              onClick={toggleTheme}
              className="rounded-md p-2 hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label="切换主题"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </button>
            
            {!isAuthenticated ? (
              <Link to="/login" activeProps={{ className: 'underline' }}>
                登录
              </Link>
            ) : (
              <button 
                onClick={logout} 
                className="rounded-md bg-secondary/50 px-3 py-1.5 hover:bg-secondary transition-colors"
              >
                退出 {userEmail?.split('@')[0]}
              </button>
            )}
          </nav>
        </div>
      </header>
      <main className="w-full flex-1 min-h-0 overflow-hidden px-4 py-6 flex flex-col">
        <Outlet />
      </main>
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  )
}


