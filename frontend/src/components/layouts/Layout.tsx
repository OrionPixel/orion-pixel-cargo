import { ReactNode, useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { useUserTheme } from "@/contexts/UserThemeContext";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const { themeSettings } = useUserTheme();

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
      {/* Sidebar - always visible but with dynamic width */}
      <div className={`transition-all duration-300 ease-in-out ${
        sidebarExpanded ? 'w-64' : 'w-16'
      } flex-shrink-0`}>
        <Sidebar 
          isExpanded={sidebarExpanded} 
          onToggle={() => setSidebarExpanded(!sidebarExpanded)} 
        />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}