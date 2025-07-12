import { ReactNode, useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { useUserTheme } from "@/contexts/UserThemeContext";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Package, Menu, X } from "lucide-react";


interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const { themeSettings } = useUserTheme();
  const { user } = useAuth();

  // Load saved sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarExpanded');
    if (savedState !== null) {
      const isExpanded = JSON.parse(savedState);
      setSidebarExpanded(isExpanded);
    }
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarExpanded', JSON.stringify(sidebarExpanded));
  }, [sidebarExpanded]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarExpanded && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarExpanded(false)}
        />
      )}

      {/* Sidebar - responsive with mobile overlay */}
      <div className={`
        transition-all duration-300 ease-in-out flex-shrink-0 h-screen
        ${sidebarExpanded 
          ? 'w-60 md:w-64 fixed lg:relative translate-x-0 z-50 lg:z-auto' 
          : 'w-0 lg:w-16 fixed lg:relative -translate-x-full lg:translate-x-0 z-1 lg:z-auto'
        }
        lg:flex
      `}>
        <Sidebar 
          isExpanded={sidebarExpanded} 
          onToggle={() => setSidebarExpanded(!sidebarExpanded)} 
        />
      </div>



      {/* Main content area with mobile-responsive design */}
      <div className="flex-1 flex flex-col overflow-hidden main-content-area">
        {/* Mobile hamburger menu - floating */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="p-2 bg-white shadow-md border"
          >
            {sidebarExpanded ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>



        {/* Main content with mobile-responsive spacing */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="px-3 md:px-6 py-4 md:py-8 pb-16 md:pb-20 min-h-0">
            <div className="max-w-full overflow-hidden">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Footer Bar - Fixed position responsive to sidebar */}
      <footer 
        className="fixed bottom-0 right-0 bg-white border-t border-gray-200 shadow-lg py-2 md:py-3 px-3 md:px-6 z-30" 
        style={{ 
          left: sidebarExpanded ? (window.innerWidth >= 1024 ? '256px' : '0px') : (window.innerWidth >= 1024 ? '64px' : '0px'),
          transition: 'left 300ms ease-in-out'
        }}
      >
        <div className="text-center text-xs md:text-sm text-gray-600">
          <span className="opacity-50">Powered by </span>
          <span className="font-semibold text-primary">LogiGoFast</span>
          <span className="opacity-50 hidden sm:inline"> | Operated by </span>
          <span className="font-semibold text-primary hidden sm:inline">
            {user?.officeName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
          </span>
          <span className="opacity-50"> | © 2025</span>
        </div>
      </footer>
    </div>
  );
}