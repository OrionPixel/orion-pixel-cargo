import { ReactNode, useEffect } from "react";
import AdminSidebar from "./AdminSidebar";
import { useQuery } from "@tanstack/react-query";


interface AdminLayoutProps {
  children: ReactNode;
}

// Admin Theme Hook - Isolated for Admin Dashboard Only
function useAdminTheme() {
  const { data: adminTheme } = useQuery({
    queryKey: ["/api/admin/theme-settings"],
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (adminTheme && 'primaryColor' in adminTheme && 'secondaryColor' in adminTheme && 'accentColor' in adminTheme) {
      // Apply admin theme only to admin dashboard scope
      const adminRoot = document.querySelector('.admin-dashboard-scope') as HTMLElement;
      if (adminRoot) {
        const hslPrimary = hexToHsl(adminTheme.primaryColor as string);
        const hslSecondary = hexToHsl(adminTheme.secondaryColor as string);
        const hslAccent = hexToHsl(adminTheme.accentColor as string);

        adminRoot.style.setProperty('--admin-primary', hslPrimary);
        adminRoot.style.setProperty('--admin-secondary', hslSecondary);
        adminRoot.style.setProperty('--admin-accent', hslAccent);
      }
    }
  }, [adminTheme]);

  return adminTheme;
}

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  useAdminTheme();

  return (
    <div className="admin-dashboard-scope flex h-screen" 
         style={{ 
           background: `linear-gradient(135deg, #ffffff 0%, var(--admin-secondary, #e7a293) / 0.1 100%)`,
           minHeight: '100vh',
           '--primary': 'var(--admin-primary, 203 64% 50%)',
           '--secondary': 'var(--admin-secondary, 11 64% 74%)',
           '--accent': 'var(--admin-accent, 69 63% 63%)',
         } as any}>
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-6" 
            style={{ 
              backgroundColor: `rgba(255, 255, 255, 0.8)`,
              backdropFilter: 'blur(10px)'
            }}>
        {children}
      </main>
    </div>
  );
}