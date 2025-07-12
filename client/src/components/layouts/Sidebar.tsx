import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Home, 
  Package, 
  Truck, 
  Users, 
  Settings, 
  LogOut, 
  Bell, 
  MessageSquare, 
  FileText, 
  BarChart3, 
  Calendar,
  Download,
  Smartphone
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUserTheme } from "@/contexts/UserThemeContext";

import BookingModal from "@/components/modals/BookingModal";
import { NotificationCenter } from "@/components/shared/NotificationCenter";
import newLogo from "@assets/logo 3_1751824580233.png";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  User,
  Headphones,
  Radar,
  UserPlus,
  DollarSign,
  Crown,
  Building2
} from "lucide-react";
import type { Booking } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

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

  // Fetch real subscription data for trial days
  const { data: subscription } = useQuery({
    queryKey: ["/api/subscription"],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Calculate real trial days from API data
  const getTrialDaysLeft = () => {
    if (!user?.trialEndDate) return 0;
    
    const today = new Date();
    const trialEnd = new Date(user.trialEndDate);
    
    const diffTime = trialEnd.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Bookings", href: "/bookings", icon: Package },
    { name: "Clients", href: "/contacts", icon: Users },
    { name: "Vehicles", href: "/vehicles", icon: Truck },
    { name: "Tracking", href: "/tracking", icon: MessageSquare },
    { name: "Financial Reports", href: "/financial-reports", icon: DollarSign },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Team", href: "/team", icon: UserPlus },
    { name: "Agents", href: "/agents", icon: Users },
    { name: "Warehouses", href: "/warehouses", icon: Building2 },
    { name: "Notifications", href: "/notification-center", icon: Bell },
    { name: "GPS Devices", href: "/gps-devices", icon: Radar },
    { name: "Office Accounts", href: "/office-accounts", icon: Building2 },
    { name: "Plans", href: "/billing", icon: Crown },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Theme Settings", href: "/user-theme-settings", icon: Settings },
    { name: "Support", href: "/support-tickets", icon: Headphones },
  ];

  const isTrialActive = user?.subscriptionStatus === 'trial';
  const trialDaysLeft = getTrialDaysLeft();

  // Debug logging for sidebar trial days
  console.log(`🔲 SIDEBAR TRIAL DEBUG:`, {
    userSubscriptionStatus: user?.subscriptionStatus,
    userTrialEndDate: user?.trialEndDate,
    trialDaysLeft,
    isTrialActive,
    subscription: subscription
  });

  return (
    <>
    <aside className={`bg-white shadow-lg border-r border-gray-200 h-screen overflow-y-auto transition-all duration-300 ${
      isExpanded ? 'w-60 md:w-64 max-w-[240px] md:max-w-[256px]' : 'w-16'
    }`}>
      <div className="flex flex-col h-full">
        {/* Header with Logo and Toggle - Mobile Optimized */}
        <div className={`flex items-center border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white ${
          isExpanded ? 'px-3 md:px-6 py-3 md:py-4 justify-between' : 'px-2 py-4 flex-col gap-2'
        }`}>
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
                    className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: themeSettings.primaryColor }}
                  >
                    <img 
                      src={newLogo}
                      alt="Logo"
                      className="w-5 h-5 object-contain" 
                    />
                  </div>
                )}
                <h1 className="text-base md:text-lg font-bold text-gray-900 truncate sidebar-logo-text">LogiGoFast</h1>
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
                  className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: themeSettings.primaryColor }}
                >
                  <img 
                    src={newLogo}
                    alt="Logo"
                    className="w-5 h-5 object-contain" 
                  />
                </div>
              )}
            </div>
          )}

          {!isExpanded ? (
            <div className="w-full flex flex-col items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="hover:bg-gray-100 flex-shrink-0"
                title="Expand Sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <NotificationCenter />
            </div>
          ) : (
            <div className="flex items-center gap-1 max-w-[60px] overflow-hidden">
              <div className="hidden sm:block">
                <NotificationCenter />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="hover:bg-gray-100 flex-shrink-0 w-7 h-7 md:w-8 md:h-8 touch-manipulation sidebar-collapse-button"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Navigation Menu - Tailwind UI Style */}
        <nav className={`flex-1 py-6 space-y-2 overflow-y-auto ${isExpanded ? 'px-4' : 'px-2'}`}>
          {/* Create Booking Button - Primary Action */}
          <div
            onClick={() => setShowBookingModal(true)}
            className={`flex items-center text-sm font-semibold rounded-lg cursor-pointer ${
              isExpanded ? 'px-4 py-3' : 'px-2 py-3 justify-center'
            }`}
            style={{ 
              backgroundColor: themeSettings.secondaryColor,
              color: 'white'
            }}
            title={!isExpanded ? "Create Booking" : undefined}
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            {isExpanded && (
              <span className="ml-3 truncate">Create Booking</span>
            )}
          </div>
          
          {/* Navigation Divider */}
          {isExpanded && <div className="border-t border-gray-200 my-4"></div>}
          
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`
                    flex items-center text-sm font-medium rounded-lg cursor-pointer transition-all duration-200 group
                    ${isExpanded ? 'px-4 py-3' : 'px-2 py-3 justify-center'}
                    ${
                      isActive
                        ? "text-white shadow-md"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }
                  `}
                  style={isActive ? { backgroundColor: themeSettings.primaryColor } : {}}
                  title={!isExpanded ? item.name : undefined}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  {isExpanded && (
                    <span className="ml-3 truncate">{item.name}</span>
                  )}
                  {isActive && isExpanded && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full opacity-75"></div>
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
                  style={{ 
                    backgroundColor: themeSettings.primaryColor,
                    color: 'white',
                    border: 'none'
                  }}
                >
                  Upgrade Plan
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* User Profile & Logout */}
        <div className={`border-t border-gray-200 flex-shrink-0 ${
          isExpanded ? 'px-3 py-3' : 'px-2 py-3'
        }`}>
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
            <div className="space-y-2 flex flex-col items-center">
              <Link href="/profile">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-12 h-10 flex items-center justify-center hover:bg-gray-100 p-1"
                  title="Profile Settings"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
              

              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-12 h-10 flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
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