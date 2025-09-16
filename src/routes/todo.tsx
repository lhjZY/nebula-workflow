import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '../stores/auth'
import { useTodosStore } from '../stores/todos'
import { Sidebar } from '../components/Sidebar'
import { TodoList } from '../components/TodoList'
import { TaskDetail } from '../components/TaskDetail'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'

export const Route = createFileRoute('/todo')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) throw redirect({ to: '/login' })
  },
  component: TodoPage,
})

function TodoPage() {
  const { selectedItemId, sidebarCollapsed, syncWithAPI, setSidebarCollapsed } = useTodosStore()
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [showMobileDetail, setShowMobileDetail] = useState(false)

  // 初始化时同步API数据
  useEffect(() => {
    syncWithAPI()
  }, [])

  // 检测屏幕尺寸
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setSidebarCollapsed(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 移动端选中任务时显示详情
  useEffect(() => {
    if (isMobile && selectedItemId) {
      setShowMobileDetail(true)
    }
  }, [selectedItemId, isMobile])

  // 电脑端布局
  if (!isMobile) {
    return (
      <div className="h-screen p-4 bg-gradient-to-br from-slate-900 to-slate-900">
        <div className="h-full grid grid-cols-12 gap-4">
          {/* 侧边栏 */}
          <div className={`
            transition-all duration-300 ease-in-out
            ${sidebarCollapsed ? 'col-span-1' : 'col-span-3'}
            lg:${sidebarCollapsed ? 'col-span-1' : 'col-span-3'}
            md:${sidebarCollapsed ? 'col-span-1' : 'col-span-4'}
          `}>
            <Sidebar />
          </div>

          {/* 任务列表 */}
          <div className={`
            transition-all duration-300 ease-in-out
            ${sidebarCollapsed 
              ? selectedItemId ? 'col-span-7' : 'col-span-11'
              : selectedItemId ? 'col-span-5' : 'col-span-9'
            }
            lg:${sidebarCollapsed 
              ? selectedItemId ? 'col-span-7' : 'col-span-11'
              : selectedItemId ? 'col-span-5' : 'col-span-9'
            }
            md:${sidebarCollapsed 
              ? selectedItemId ? 'col-span-7' : 'col-span-11'
              : selectedItemId ? 'col-span-4' : 'col-span-8'
            }
          `}>
            <TodoList />
          </div>

          {/* 任务详情 */}
          {selectedItemId && (
            <div className={`
              transition-all duration-300 ease-in-out
              ${sidebarCollapsed ? 'col-span-4' : 'col-span-4'}
              lg:${sidebarCollapsed ? 'col-span-4' : 'col-span-4'}
              md:${sidebarCollapsed ? 'col-span-4' : 'col-span-4'}
            `}>
              <TaskDetail taskId={selectedItemId} />
            </div>
          )}
        </div>
      </div>
    )
  }

  // 移动端布局
  return (
    <div className="h-screen  relative">
      {/* 背景壁纸 */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
      />
      {/* 内容层 */}
      <div className="relative z-10 h-full">
        {/* 移动端顶部导航栏 */}
        <div className="glass-strong p-4 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMobileSidebar(true)}
            className="glass rounded-lg p-2 hover:glass-strong transition-all duration-200"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">任务管理</h1>
        </div>
        
        {selectedItemId && (
          <button
            onClick={() => setShowMobileDetail(true)}
            className="glass rounded-lg px-3 py-2 hover:glass-strong transition-all duration-200 text-sm text-white"
          >
            查看详情
          </button>
        )}
      </div>

      {/* 移动端主内容区域 */}
      <div className="h-[calc(100vh-4rem)] p-4">
        {!showMobileDetail ? (
          <TodoList className="h-full" />
        ) : (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">任务详情</h2>
              <button
                onClick={() => setShowMobileDetail(false)}
                className="glass rounded-lg p-2 hover:glass-strong transition-all duration-200"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <TaskDetail taskId={selectedItemId} />
            </div>
          </div>
        )}
      </div>

      {/* 移动端侧边栏覆盖层 */}
      {showMobileSidebar && (
        <>
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setShowMobileSidebar(false)}
          />
          
          {/* 侧边栏 */}
          <div className="fixed left-0 top-0 h-full w-80 z-50 p-4">
            <div className="h-full relative">
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="absolute top-4 right-4 z-10 glass rounded-lg p-2 hover:glass-strong transition-all duration-200"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <Sidebar />
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  )
}


