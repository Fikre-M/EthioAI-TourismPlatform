import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { FloatingChatbot } from '@components/chat/FloatingChatbot'
// import { ChatPositionDebug } from '@components/chat/ChatPositionDebug' // Uncomment for debugging

export interface MainLayoutProps {
  children?: React.ReactNode
  showSidebar?: boolean
  showMobileNav?: boolean
  showFooter?: boolean
  showFloatingChat?: boolean
}

export const MainLayout = ({ 
  children, 
  showSidebar = false,
  showMobileNav = true,
  showFooter = true,
  showFloatingChat = true
}: MainLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden max-w-full">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex flex-1 min-w-0 overflow-hidden">
        {/* Sidebar (optional) */}
        {showSidebar && (
          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
          />
        )}

        {/* Page Content */}
        <main className={`flex-1 ${showMobileNav ? 'pb-14 sm:pb-16 lg:pb-0' : ''} min-w-0 overflow-x-hidden`}>
          <div className="w-full min-w-0 overflow-x-hidden">
            {children || <Outlet />}
          </div>
        </main>
      </div>

      {/* Footer */}
      {showFooter && <Footer />}

      {/* Mobile Navigation */}
      {showMobileNav && <MobileNav />}

      {/* Floating AI Chatbot */}
      {showFloatingChat && <FloatingChatbot />}

      {/* Debug Component - Uncomment to debug positioning */}
      {/* {showFloatingChat && <ChatPositionDebug />} */}
    </div>
  )
}

export default MainLayout
