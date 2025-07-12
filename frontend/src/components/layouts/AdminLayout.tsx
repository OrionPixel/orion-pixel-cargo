import { ReactNode } from "react";
import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-background to-secondary/20" 
         style={{ 
           background: `linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--secondary) / 0.1) 100%)`,
           minHeight: '100vh'
         }}>
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-6" 
            style={{ 
              backgroundColor: `hsl(var(--background) / 0.8)`,
              backdropFilter: 'blur(10px)'
            }}>
        {children}
      </main>
    </div>
  );
}