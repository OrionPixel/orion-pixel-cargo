import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationCenter } from "@/components/shared/NotificationCenter";
import {
  Shield,
  Users,
  Package,
  Truck,
  BarChart3,
  Settings,
  Palette,
  HeadphonesIcon,
  FileText,
  Database,
  Activity,
  Menu,
  X,
  LogOut,
  Home,
  MessageSquare
} from "lucide-react";

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user, handleLogout } = useAuth();

  const adminNavigation = [
    { 
      name: "Overview", 
      href: "/admin", 
      icon: Home,
      description: "Dashboard overview"
    },
    { 
      name: "User Management", 
      href: "/admin/users", 
      icon: Users,
      description: "Manage all users"
    },
    { 
      name: "Bookings", 
      href: "/admin/bookings", 
      icon: Package,
      description: "View all bookings"
    },
    { 
      name: "Vehicles", 
      href: "/admin/vehicles", 
      icon: Truck,
      description: "Fleet management"
    },
    { 
      name: "Analytics", 
      href: "/admin/analytics", 
      icon: BarChart3,
      description: "Platform insights"
    },
    { 
      name: "Support Tickets", 
      href: "/admin/support", 
      icon: HeadphonesIcon,
      description: "Customer support"
    },
    { 
      name: "Contact Submissions", 
      href: "/admin/contact-submissions", 
      icon: MessageSquare,
      description: "Website contact forms"
    },
    { 
      name: "Reports", 
      href: "/admin/reports", 
      icon: FileText,
      description: "Generate reports"
    },
    { 
      name: "System Settings", 
      href: "/admin/settings", 
      icon: Settings,
      description: "Platform configuration"
    },
    { 
      name: "Theme Settings", 
      href: "/admin/theme-settings", 
      icon: Palette,
      description: "Customize appearance"
    },
    { 
      name: "Database", 
      href: "/admin/database", 
      icon: Database,
      description: "Database management"
    },
    { 
      name: "Activity Logs", 
      href: "/admin/logs", 
      icon: Activity,
      description: "System activity"
    }
  ];

  const isActive = (href: string) => {
    if (href === "/admin") {
      return location === "/admin";
    }
    return location.startsWith(href);
  };

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50 bg-white shadow-md"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-80 backdrop-blur-md border-r shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          backgroundColor: `hsl(var(--background) / 0.9)`,
          borderColor: `hsl(var(--primary) / 0.2)`,
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b" style={{ borderColor: `hsl(var(--primary) / 0.2)` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                  style={{ 
                    background: `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 50%, hsl(var(--secondary)) 100%)` 
                  }}
                >
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 
                    className="text-lg font-bold" 
                    style={{ color: `hsl(var(--foreground))` }}
                  >
                    CargoFlow
                  </h2>
                  <p 
                    className="text-sm" 
                    style={{ color: `hsl(var(--muted-foreground))` }}
                  >
                    Admin Panel
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <NotificationCenter />
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={closeSidebar}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {adminNavigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={active ? "default" : "ghost"}
                    className="w-full justify-start p-3 h-auto transition-all duration-200"
                    style={{
                      backgroundColor: active 
                        ? `hsl(var(--primary) / 0.1)` 
                        : 'transparent',
                      color: active 
                        ? `hsl(var(--primary))` 
                        : `hsl(var(--muted-foreground))`,
                      borderLeft: active 
                        ? `3px solid hsl(var(--accent))` 
                        : 'none',
                      borderRight: active 
                        ? `1px solid hsl(var(--secondary) / 0.3)` 
                        : 'none'
                    }}
                    onClick={closeSidebar}
                  >
                    <Icon 
                      className="h-5 w-5 mr-3" 
                      style={{
                        color: active 
                          ? `hsl(var(--primary))` 
                          : `hsl(var(--muted-foreground))`
                      }}
                    />
                    <div className="text-left">
                      <div 
                        className="font-medium"
                        style={{
                          color: active 
                            ? `hsl(var(--primary))` 
                            : `hsl(var(--foreground))`
                        }}
                      >
                        {item.name}
                      </div>
                      <div 
                        className="text-xs"
                        style={{
                          color: active 
                            ? `hsl(var(--primary) / 0.8)` 
                            : `hsl(var(--muted-foreground))`
                        }}
                      >
                        {item.description}
                      </div>
                    </div>
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-primary-200">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary-50">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-text-secondary truncate">{user?.email}</p>
                <p className="text-xs text-primary-600 font-medium">Administrator</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              className="w-full mt-3 justify-start text-accent-600 hover:text-accent-700 hover:bg-accent-100"
              onClick={() => handleLogout()}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}