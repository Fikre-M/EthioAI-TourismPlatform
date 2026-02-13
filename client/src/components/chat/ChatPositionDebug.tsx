import { useState, useEffect } from 'react'

export const ChatPositionDebug = () => {
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const [chatRect, setChatRect] = useState({ top: 0, left: 0, width: 0, height: 0 })

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    const updateChatRect = () => {
      const chatElement = document.querySelector('[data-testid="floating-chat"]')
      if (chatElement) {
        const rect = chatElement.getBoundingClientRect()
        setChatRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        })
      }
    }

    updateViewport()
    updateChatRect()

    window.addEventListener('resize', updateViewport)
    const interval = setInterval(updateChatRect, 1000)

    return () => {
      window.removeEventListener('resize', updateViewport)
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="fixed top-4 left-4 z-[200] bg-black/80 text-white p-3 rounded-lg text-xs font-mono">
      <div>Viewport: {viewport.width} x {viewport.height}</div>
      <div>Chat: {chatRect.width} x {chatRect.height}</div>
      <div>Position: ({chatRect.left}, {chatRect.top})</div>
      <div>Visible: {chatRect.top >= 0 && chatRect.left >= 0 && 
                     chatRect.top + chatRect.height <= viewport.height && 
                     chatRect.left + chatRect.width <= viewport.width ? '✅' : '❌'}</div>
    </div>
  )
}