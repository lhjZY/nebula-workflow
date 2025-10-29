import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
type ThemeMode = 'system' | 'light' | 'dark'

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getActualTheme(themeMode: ThemeMode): Theme {
  if (themeMode === 'system') {
    return getSystemTheme()
  }
  return themeMode
}

export function useTheme() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    // 从localStorage读取保存的主题模式，默认为system
    const savedThemeMode = localStorage.getItem('themeMode') as ThemeMode
    return savedThemeMode || 'system'
  })

  // 直接计算实际主题，消除冗余状态
  const actualTheme = getActualTheme(themeMode)

  useEffect(() => {
    const updateTheme = () => {
      const newTheme = getActualTheme(themeMode)
      const root = document.documentElement

      // 移除之前的主题类
      root.classList.remove('light', 'dark')

      // 添加当前主题类
      root.classList.add(newTheme)
    }

    updateTheme()

    // 保存到localStorage
    localStorage.setItem('themeMode', themeMode)

    // 如果是系统主题，监听系统主题变化
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', updateTheme)

      return () => {
        mediaQuery.removeEventListener('change', updateTheme)
      }
    }
  }, [themeMode])

  const setTheme = (newThemeMode: ThemeMode) => {
    setThemeMode(newThemeMode)
  }

  const toggleTheme = () => {
    setThemeMode((prev) => {
      // 简化为双态切换，消除system导致的混淆
      const current = prev === 'system' ? getSystemTheme() : prev
      return current === 'light' ? 'dark' : 'light'
    })
  }

  return {
    theme: actualTheme,
    themeMode,
    setTheme,
    toggleTheme,
  }
}
