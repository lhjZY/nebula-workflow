import { useState, useEffect } from 'react'

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => {
      console.log('网络连接恢复')
      setIsOnline(true)
      
      // 网络恢复时触发同步
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('network-restored')
        window.dispatchEvent(event)
      }
    }

    const handleOffline = () => {
      console.log('网络连接断开')
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}