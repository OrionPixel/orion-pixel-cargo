import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useUserTheme } from "@/contexts/UserThemeContext";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import newLogo from "@assets/logo 3_1751824580233.png";

import {
  LayoutDashboard,
  MapPin,
  X,
  Menu,
  LogOut,
  FileText,
  TrendingUp,
  Clock,
  Calendar,
  Download
} from "lucide-react";
import type { Booking } from "@shared/schema";

export default function AgentSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location] = useLocation();
  const { user, handleLogout } = useAuth();
  const { themeSettings } = useUserTheme();


  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);



  // Agent-specific navigation (simplified)
  const agentNavigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "My Bookings", href: "/bookings", icon: FileText },
    { name: "Track Shipments", href: "/tracking", icon: MapPin },
  ];

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50"
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
        className={`
          w-64 bg-white shadow-md border-r border-gray-200 h-full
          fixed left-0 top-0 z-40 transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:z-auto lg:transform-none
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200">
            <Link href="/" onClick={closeSidebar}>
              <div className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: themeSettings.primaryColor }}
                >
                  <img 
                    src={newLogo}
                    alt="Logo"
                    className="w-5 h-5 object-contain" 
                  />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">LogiGoFast</h1>
                  <p className="text-xs text-gray-500">Agent Portal</p>
                </div>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={closeSidebar}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-2 py-3 space-y-2">
            {agentNavigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href} onClick={closeSidebar}>
                  <div
                    className={`
                      flex items-center px-4 py-3 text-sm font-medium rounded-md cursor-pointer transition-colors
                      ${
                        isActive
                          ? "text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }
                    `}
                    style={isActive ? { backgroundColor: themeSettings.primaryColor } : {}}
                  >
                    <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Realtime Watch & Calendar Card */}
          <div className="px-3 py-3 border-t border-gray-200">
            <Card className="w-full shadow-lg">
              <CardContent className="p-4 space-y-4">
                {/* Realtime Watch */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="h-4 w-4 mr-2" style={{ color: themeSettings.primaryColor }} />
                    <span className="text-sm font-medium text-gray-700">Live Time</span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: themeSettings.primaryColor }}>
                    {currentTime.toLocaleTimeString('en-IN', { 
                      hour12: true,
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {currentTime.toLocaleDateString('en-IN', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>


              </CardContent>
            </Card>
          </div>

          {/* Commission Rate Display */}
          {(user as any)?.commissionRate && (
            <div className="px-3 py-3 border-t border-gray-200">
              <div 
                className="p-3 rounded-lg"
                style={{ 
                  backgroundColor: `${themeSettings.primaryColor}15`, 
                  borderColor: `${themeSettings.primaryColor}40` 
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" style={{ color: themeSettings.primaryColor }} />
                    <div>
                      <p className="text-xs font-medium text-gray-700">Commission Rate</p>
                      <p className="text-lg font-bold" style={{ color: themeSettings.primaryColor }}>
                        {(user as any).commissionRate}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}





          {/* User Profile */}
          <div className="border-t border-gray-200 p-3">
            {/* User Info */}
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs">
                    Agent
                  </Badge>
                  {user?.officeName && (
                    <p className="text-xs text-gray-500 truncate">
                      {user.officeName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="border-t border-gray-200 p-3 mt-auto">
            <Button
              variant="ghost"
              className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}