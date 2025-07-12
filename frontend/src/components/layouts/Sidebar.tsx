import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useUserTheme } from "@/contexts/UserThemeContext";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import BookingModal from "@/components/modals/BookingModal";
import { NotificationCenter } from "@/components/shared/NotificationCenter";
import {
  Home,
  Package,
  Truck,
  MapPin,
  FileText,
  Users,
  Settings,
  LogOut,
  BarChart3,
  Calendar,
  Building2,
  ChevronLeft,
  ChevronRight,
  Plus,
  CreditCard,
  User,
  Headphones,
  Bell,
  Radar,
  UserPlus
} from "lucide-react";
import type { Booking } from "@shared/schema";

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isExpanded, onToggle }: SidebarProps) {
  const [location] = useLocation();
  const { user, handleLogout } = useAuth();
  const { themeSettings } = useUserTheme();
  const [showBookingModal, setShowBookingModal] = useState(false);

  const { data: bookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    enabled: !!user,
  });

  function getTrialDaysLeft() {
    if (!user || user.subscriptionPlan !== 'trial') return 0;
    
    const trialStartDate = user.trialStartDate ? new Date(user.trialStartDate) : new Date();
    const now = new Date();
    const timeDiff = now.getTime() - trialStartDate.getTime();
    const daysPassed = Math.floor(timeDiff / (1000 * 3600 * 24));
    return Math.max(0, 14 - daysPassed);
  }

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Bookings", href: "/bookings", icon: Package },
    { name: "Contacts", href: "/contacts", icon: Users },
    { name: "Vehicles", href: "/vehicles", icon: Truck },
    { name: "Tracking", href: "/tracking", icon: MapPin },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Team", href: "/team", icon: UserPlus },
    { name: "Agents", href: "/agents", icon: Users },
    { name: "Warehouses", href: "/warehouses", icon: Building2 },
    { name: "Notifications", href: "/notification-center", icon: Bell },
    { name: "GPS Devices", href: "/gps-devices", icon: Radar },
    { name: "Office Accounts", href: "/office-accounts", icon: Building2 },
    { name: "Billing", href: "/billing", icon: CreditCard },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Theme Settings", href: "/user-theme-settings", icon: Settings },
    { name: "Support", href: "/support-tickets", icon: Headphones },
  ];

  const isTrialActive = user?.subscriptionPlan === 'trial' && user?.subscriptionStatus === 'active';
  const trialDaysLeft = getTrialDaysLeft();

  return (
    <>
    <aside className="bg-white shadow-md border-r border-gray-200 h-screen overflow-y-auto">
      <div className="flex flex-col h-full">
        {/* Header with Logo and Toggle */}
        <div className={`flex items-center p-3 border-b border-gray-200 ${isExpanded ? 'justify-between' : 'flex-col gap-2'}`}>
          {isExpanded && (
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
                {themeSettings.logoUrl ? (
                  <img 
                    src={themeSettings.logoUrl} 
                    alt="Company Logo" 
                    className="w-8 h-8 rounded-lg object-contain"
                  />
                ) : (
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: themeSettings.primaryColor }}
                  >
                    <Truck className="h-5 w-5 text-white" />
                  </div>
                )}
                <h1 className="text-lg font-bold text-gray-900">LogiGoFast</h1>
              </div>
            </Link>
          )}
          
          {!isExpanded && (
            <div className="w-full flex justify-center">
              {themeSettings.logoUrl ? (
                <img 
                  src={themeSettings.logoUrl} 
                  alt="Logo" 
                  className="w-8 h-8 rounded-lg object-contain"
                />
              ) : (
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: themeSettings.primaryColor }}
                >
                  <Truck className="h-5 w-5 text-white" />
                </div>
              )}
            </div>
          )}

          <div className={`flex items-center gap-2 ${!isExpanded ? 'w-full justify-center' : ''}`}>
            <NotificationCenter />
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="hover:bg-gray-100 flex-shrink-0"
              title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              {isExpanded ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          {/* Create Booking Button */}
          <div
            onClick={() => setShowBookingModal(true)}
            className="flex items-center px-3 py-3 text-sm font-medium rounded-md cursor-pointer transition-colors text-gray-700 hover:bg-gray-100"
            title={!isExpanded ? "Create Booking" : undefined}
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            {isExpanded && (
              <span className="ml-3 truncate">Create Booking</span>
            )}
          </div>
          
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`
                    flex items-center px-3 py-3 text-sm font-medium rounded-md cursor-pointer transition-colors
                    ${
                      isActive
                        ? "text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                  style={isActive ? { backgroundColor: themeSettings.primaryColor } : {}}
                  title={!isExpanded ? item.name : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {isExpanded && (
                    <span className="ml-3 truncate">{item.name}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Trial Status (only when expanded) */}
        {isExpanded && user && isTrialActive && (
          <div className="px-3 py-2 border-t border-gray-200 flex-shrink-0">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs font-medium text-yellow-800">Trial Plan</p>
              <p className="text-xs text-yellow-600 mt-1">
                {trialDaysLeft} days remaining
              </p>
              <Link href="/billing">
                <Button 
                  size="sm" 
                  className="w-full mt-2 text-xs"
                  style={{ backgroundColor: themeSettings.primaryColor }}
                >
                  Upgrade Plan
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* User Profile & Logout */}
        <div className="px-3 py-3 border-t border-gray-200 flex-shrink-0">
          {isExpanded ? (
            <div className="space-y-2">
              <Link href="/profile">
                <div className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 cursor-pointer">
                  <Settings className="w-4 h-4 mr-3" />
                  Profile Settings
                </div>
              </Link>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 text-sm"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link href="/profile">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full hover:bg-gray-100"
                  title="Profile Settings"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </aside>
    
    {/* Booking Modal */}
    {showBookingModal && (
      <BookingModal 
        isOpen={showBookingModal} 
        onClose={() => {
          console.log('Closing BookingModal from User Sidebar');
          setShowBookingModal(false);
        }} 
      />
    )}
  </>
  );
}