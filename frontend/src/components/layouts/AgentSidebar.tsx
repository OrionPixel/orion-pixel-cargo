import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useUserTheme } from "@/contexts/UserThemeContext";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BookingExportModal from "@/components/modals/BookingExportModal";
import BookingModal from "@/components/modals/BookingModal";
import {
  Truck,
  LayoutDashboard,
  Package,
  MapPin,
  Download,
  X,
  Menu,
  LogOut,
  FileText,
  TrendingUp
} from "lucide-react";
import type { Booking } from "@shared/schema";

export default function AgentSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [location] = useLocation();
  const { user, handleLogout } = useAuth();
  const { themeSettings } = useUserTheme();

  // Fetch bookings for export functionality
  const { data: bookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    enabled: !!user,
  });



  // Agent-specific navigation (simplified)
  const agentNavigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "My Bookings", href: "/bookings", icon: FileText },
    { name: "Track Shipments", href: "/tracking", icon: MapPin },
  ];

  const closeSidebar = () => setIsOpen(false);

  // Daily bookings download function
  const downloadDailyBookings = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/bookings/daily-pdf?date=${today}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to download daily bookings');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `daily-bookings-${today}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading daily bookings:', error);
    }
  };

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
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: themeSettings.primaryColor }}
                >
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">CargoFlow</h1>
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
            {/* Create Booking Button */}
            <div
              onClick={() => setShowBookingModal(true)}
              className="flex items-center px-4 py-3 text-sm font-medium rounded-md cursor-pointer transition-colors text-gray-700 hover:bg-gray-100"
            >
              <Package className="w-5 h-5 mr-3 flex-shrink-0" />
              <span className="truncate">Create Booking</span>
            </div>
            
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

          {/* Quick Actions Section */}
          <div className="px-3 py-3 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
              Quick Actions
            </p>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start text-left hover:bg-gray-50"
                onClick={() => {
                  downloadDailyBookings();
                  setIsOpen(false);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Today's Bookings PDF
              </Button>
              
              <BookingExportModal 
                bookings={bookings || []}
                trigger={
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-left hover:bg-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export Reports
                  </Button>
                }
              />
            </div>
          </div>

          {/* User Profile & Settings */}
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
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-gray-100"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal 
          isOpen={showBookingModal} 
          onClose={() => setShowBookingModal(false)} 
        />
      )}
    </>
  );
}