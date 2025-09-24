import { Excalidraw } from '@excalidraw/excalidraw'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useMemo, useCallback } from 'react'
import '@excalidraw/excalidraw/index.css'

import { MindmapSidebar } from '../components/MindmapSidebar'
import { useTheme } from '../hooks/useTheme'
import { useAuthStore } from '../stores/auth'
import { useMindmapsStore } from '../stores/mindmaps'

export const Route = createFileRoute('/mindmap')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) throw redirect({ to: '/login' })
  },
  component: MindmapPage,
})

function MindmapPage() {
  const store = useMindmapsStore()
  const { theme } = useTheme()

  // 使用独立的状态选择器避免引用问题
  const files = store.files
  const activeFileId = store.activeFileId
  const updateFileData = store.updateFileData

  // 稳定的activeFile计算
  const activeFile = useMemo(() => {
    return files.find((file) => file.id === activeFileId) || null
  }, [files, activeFileId])

  // 稳定的初始数据计算
  const initialData = useMemo(() => {
    if (!activeFile) return undefined

    const { elements, appState } = activeFile.data

    // 清理 collaborators 字段
    let cleanAppState = {}
    if (appState && typeof appState === 'object') {
      cleanAppState = { ...appState }
      if ('collaborators' in cleanAppState) {
        delete (cleanAppState as { collaborators?: unknown }).collaborators
      }
    }

    return {
      elements: Array.isArray(elements) ? elements : [],
      appState: cleanAppState,
    }
  }, [activeFile])

  // 稳定的UIOptions配置
  const uiOptions = useMemo(
    () => ({
      canvasActions: {
        // 隐藏可能的链接相关功能
        export: {
          saveFileToDisk: true,
          // 不显示分享链接按钮
          onExportToBackend: undefined,
        },
        // 隐藏不必要的功能
        loadScene: true,
        saveToActiveFile: false, // 隐藏保存按钮，因为我们有自动保存
        toggleTheme: true, // 隐藏主题切换，因为我们有自动主题
      },
      welcomeScreen: true, // 隐藏欢迎屏幕
    }),
    [],
  )

  // 稳定的onChange回调
  const handleChange = useCallback(
    (elements: unknown, appState: unknown) => {
      if (!activeFile?.id) return

      try {
        // 清理 collaborators 字段
        let nextAppState = {}
        if (appState && typeof appState === 'object') {
          nextAppState = { ...(appState as Record<string, unknown>) }
          if ('collaborators' in nextAppState) {
            delete (nextAppState as { collaborators?: unknown }).collaborators
          }
        }

        const changeData = {
          fileId: activeFile.id,
          fileName: activeFile.name,
          timestamp: Date.now(),
          elements,
          appState: nextAppState,
        }

        // 打印变动数据，方便后续接口调用
        console.group('📝 思维导图文件变动')
        console.log('文件ID:', changeData.fileId)
        console.log('文件名:', changeData.fileName)
        console.log('变动时间:', new Date(changeData.timestamp).toLocaleString('zh-CN'))
        console.log('元素数量:', Array.isArray(elements) ? elements.length : 0)
        console.log('完整数据:', changeData)
        console.groupEnd()

        updateFileData(activeFile.id, {
          elements,
          appState: nextAppState,
        })
      } catch (error) {
        console.error('保存失败:', error)
      }
    },
    [activeFile?.id, activeFile?.name, updateFileData],
  )

  return (
    <div className="flex gap-6 h-full">
      {/* 侧边栏 */}
      <MindmapSidebar />

      {/* 主内容区域 */}
      <div className="glass-strong rounded-2xl p-3 flex flex-col flex-1 min-h-0">
        <div className="flex-1 min-h-0 w-full overflow-hidden rounded-xl">
          <div className="h-full w-full">
            {activeFile ? (
              <Excalidraw
                key={`mindmap-${activeFile.id}-${theme}`} // 包含主题的稳定key，确保主题变化时重新渲染
                initialData={initialData}
                onChange={handleChange}
                theme={theme}
                UIOptions={uiOptions}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <div className="text-lg mb-2">请选择或创建一个思维导图</div>
                  <div className="text-sm">使用左侧面板管理您的思维导图文件</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
