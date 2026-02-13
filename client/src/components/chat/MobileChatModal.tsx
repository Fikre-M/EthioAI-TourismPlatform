import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { ChatInterface } from '@features/chat/components/ChatInterface'
import { Button } from '@components/ui/Button'

interface MobileChatModalProps {
  isOpen: boolean
  onClose: () => void
}

export const MobileChatModal = ({ isOpen, onClose }: MobileChatModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] sm:hidden"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[101] sm:hidden"
          >
            <div className="bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl border-t border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col">
              
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-600 to-yellow-500 text-white rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-xl">🤖</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">AI Guide</h3>
                    <p className="text-xs text-white/80">Your Ethiopia Travel Assistant</p>
                  </div>
                </div>
                
                <Button
                  onClick={onClose}
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 p-0 text-white hover:bg-white/20 rounded-full border-white/20"
                  aria-label="Close chat"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Drag Handle */}
              <div className="flex justify-center py-2 bg-gray-50 dark:bg-gray-800">
                <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>

              {/* Chat Content */}
              <div className="flex-1 overflow-hidden min-h-0">
                <ChatInterface />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}