import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import { useAuthStore } from '../stores/auth'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const { isAuthenticated, userEmail, logout } = useAuthStore()
  return (
    <div className="h-dvh w-full bg-[radial-gradient(1200px_600px_at_70%_-20%,rgba(99,102,241,0.25),transparent),radial-gradient(800px_400px_at_10%_10%,rgba(56,189,248,0.25),transparent)] text-neutral-900 dark:text-neutral-100 flex flex-col">
      <header className="sticky top-0 z-10 backdrop-saturate-150">
        <div className="glass glass-surface w-full flex items-center justify-between rounded-b-xl px-6 py-3">
          <div className="font-semibold tracking-tight">workflow</div>
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
            {!isAuthenticated ? (
              <Link to="/login" activeProps={{ className: 'underline' }}>
                登录
              </Link>
            ) : (
              <button onClick={logout} className="rounded-md bg-black/10 px-2 py-1 hover:bg-black/20">
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


