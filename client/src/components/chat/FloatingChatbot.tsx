import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react'
import { ChatInterface } from '@features/chat/components/ChatInterface'
import { MobileChatModal } from './MobileChatModal'
import { useChat } from '@hooks/useChat'
import { Button } from '@components/ui/Button'

interface FloatingChatbotProps {
  className?: string
}

export const FloatingChatbot = ({ className = '' }: FloatingChatbotProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const dragRef = useRef<HTMLDivElement>(null)
  const { messages } = useChat()

  // Check if mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640) // sm breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Get unread message count (messages after last user interaction)
  const unreadCount = messages.filter(msg => 
    msg.role === 'assistant' && 
    new Date(msg.timestamp).getTime() > Date.now() - 300000 // Last 5 minutes
  ).length

  // Handle dragging for desktop
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || isMobile) return
      
      const rect = dragRef.current?.getBoundingClientRect()
      if (!rect) return

      // Keep within viewport bounds
      const maxX = window.innerWidth - rect.width
      const maxY = window.innerHeight - rect.height
      
      setPosition({
        x: Math.max(0, Math.min(maxX, e.clientX - rect.width / 2)),
        y: Math.max(0, Math.min(maxY, e.clientY - rect.height / 2))
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging && !isMobile) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isMobile])

  const toggleChat = () => {
    if (isOpen) {
      setIsOpen(false)
      setIsMinimized(false)
    } else {
      setIsOpen(true)
      setIsMinimized(false)
    }
  }

  const minimizeChat = () => {
    setIsMinimized(true)
  }

  const maximizeChat = () => {
    setIsMinimized(false)
  }

  const closeChat = () => {
    setIsOpen(false)
    setIsMinimized(false)
  }

  // Mobile version
  if (isMobile) {
    return (
      <div className={`fixed z-[100] ${className}`}>
        {/* Mobile Chat Button */}
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="fixed bottom-20 right-4 z-[100]" // Above mobile nav
            >
              <Button
                onClick={toggleChat}
                className="relative h-14 w-14 rounded-full bg-gradient-to-r from-green-600 to-yellow-500 hover:from-green-700 hover:to-yellow-600 shadow-lg hover:shadow-xl transition-all duration-300 group"
                aria-label="Open AI Chat Assistant"
              >
                <MessageCircle className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
                
                {/* Unread Badge */}
                {unreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.div>
                )}
                
                {/* Pulse Animation */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-600 to-yellow-500 animate-ping opacity-20" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Modal */}
        <MobileChatModal isOpen={isOpen} onClose={closeChat} />
      </div>
    )
  }

  // Desktop version
  return (
    <div className={`fixed z-[100] ${className}`}>
      {/* Desktop Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-[100]"
          >
            <Button
              onClick={toggleChat}
              className="relative h-16 w-16 rounded-full bg-gradient-to-r from-green-600 to-yellow-500 hover:from-green-700 hover:to-yellow-600 shadow-lg hover:shadow-xl transition-all duration-300 group"
              aria-label="Open AI Chat Assistant"
            >
              <MessageCircle className="h-8 w-8 text-white group-hover:scale-110 transition-transform" />
              
              {/* Unread Badge */}
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.div>
              )}
              
              {/* Pulse Animation */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-600 to-yellow-500 animate-ping opacity-20" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dragRef}
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            style={{
              x: position.x,
              y: position.y,
            }}
            className={`fixed z-[100] ${
              isMinimized 
                ? 'bottom-6 right-6' 
                : 'bottom-6 right-6'
            }`}
          >
            <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 ${
              isMinimized 
                ? 'w-80 h-16' 
                : 'w-96 h-[600px] lg:w-[420px] lg:h-[650px]'
            }`}>
              
              {/* Header */}
              <div 
                className="flex items-center justify-between p-4 bg-gradient-to-r from-green-600 to-yellow-500 text-white cursor-move select-none"
                onMouseDown={() => !isMinimized && setIsDragging(true)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-xl">🤖</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">AI Guide</h3>
                    <p className="text-xs text-white/80">Your Ethiopia Travel Assistant</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!isMinimized && (
                    <Button
                      onClick={minimizeChat}
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full border-white/20"
                      aria-label="Minimize chat"
                    >
                      <Minimize2 className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {isMinimized && (
                    <Button
                      onClick={maximizeChat}
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full border-white/20"
                      aria-label="Maximize chat"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button
                    onClick={closeChat}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full border-white/20"
                    aria-label="Close chat"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Chat Content */}
              {!isMinimized && (
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-hidden">
                    <ChatInterface />
                  </div>
                </div>
              )}

              {/* Minimized State */}
              {isMinimized && (
                <div className="flex items-center justify-center h-full px-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    Chat minimized - Click to expand
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}