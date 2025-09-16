import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { LiquidGlassContainer} from '@tinymomentum/liquid-glass-react'; // 暂时注释，类型声明问题

import { useTokenValidation } from '../hooks/useAuth'
import { useAuthStore } from '../stores/auth'
import '@tinymomentum/liquid-glass-react/dist/components/LiquidGlassBase.css'; // 暂时注释，文件不存在
export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const { isAuthenticated, userEmail, logout } = useAuthStore()
  
  // 在应用启动时验证token有效性
  useTokenValidation()
  return (
    <div className="h-dvh w-full dark:text-neutral-100 flex flex-col" style={{ backgroundColor: '#21283B' }}>
      <header className="sticky top-0 z-10 backdrop-saturate-150" style={{ backgroundColor: '#87CEEB' }}>
        <div className=" w-full flex items-center justify-between rounded-b-xl px-6 py-3">
          <div className="font-semibold tracking-tight">
            <div className="bg-clip-text text-transparent px-4 py-2 rounded-lg">
              <LiquidGlassContainer
              width={120}
              height={60}
              borderRadius={28}
              innerShadowColor="#000000"
              innerShadowBlur={11}
              innerShadowSpread={-13}
              glassTintColor="rgba(255, 255, 255, 0)"
              glassTintOpacity={0}
              frostBlurRadius={0}
              noiseFrequency={0.008}
              noiseStrength={77}
              > 
              <div style={{ color: 'white' }}>workflow</div>
              </LiquidGlassContainer>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-sm ">
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


