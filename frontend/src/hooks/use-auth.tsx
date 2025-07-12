import React, { createContext, useContext, useState, ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, performLogout } from "@/lib/queryClient";
import type { User } from "@shared/schema";

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  error: Error | null;
  loginMutation: any;
  handleLogout: () => void;
  registerMutation: any;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Initialize user state on mount with instant cache check
  React.useEffect(() => {
    const checkAuth = async () => {
      // Check if logout flag is set - prevent any authentication
      const logoutFlag = sessionStorage.getItem('logout_flag') || localStorage.getItem('logout_flag');
      if (logoutFlag) {
        sessionStorage.removeItem('logout_flag');
        localStorage.removeItem('logout_flag');
        setCurrentUser(null);
        setIsAuthLoading(false);
        return;
      }

      // Check cached user first for instant loading (millisecond-level performance)
      const cachedUser = sessionStorage.getItem('cached_user');
      if (cachedUser) {
        try {
          const userData = JSON.parse(cachedUser);
          setCurrentUser(userData);
          setIsAuthLoading(false);
          
          // Pre-cache dashboard data for millisecond loading
          const cachedDashboard = sessionStorage.getItem('cached_dashboard');
          const cachedBookings = sessionStorage.getItem('cached_bookings');
          
          if (cachedDashboard) {
            queryClient.setQueryData(['/api/dashboard/stats'], JSON.parse(cachedDashboard));
          }
          if (cachedBookings) {
            queryClient.setQueryData(['/api/bookings'], JSON.parse(cachedBookings));
            queryClient.setQueryData(['/api/bookings/recent'], JSON.parse(cachedBookings).slice(0, 5));
          }
          
          return; // Don't fetch from server if cache exists
        } catch (e) {
          sessionStorage.removeItem('cached_user');
          sessionStorage.removeItem('cached_dashboard');
          sessionStorage.removeItem('cached_bookings');
        }
      }

      // Check if we're on landing page - don't auto-authenticate
      if (window.location.pathname === '/') {
        setCurrentUser(null);
        setIsAuthLoading(false);
        return;
      }

      // Only fetch from server if no cache
      try {
        const response = await fetch('/api/user', { 
          credentials: 'include',
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        console.log('🔍 Auth check response:', response.status, response.statusText);
        
        if (response.ok) {
          const userData = await response.json();
          console.log('✅ User authenticated:', userData.email);
          setCurrentUser(userData);
          // Cache user data for instant loading
          sessionStorage.setItem('cached_user', JSON.stringify(userData));
        } else {
          console.log('❌ Auth check failed:', response.status);
          setCurrentUser(null);
          sessionStorage.removeItem('cached_user');
        }
      } catch (error) {
        console.error('❌ Auth check error:', error);
        setCurrentUser(null);
        sessionStorage.removeItem('cached_user');
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Login failed");
      }
      
      return await res.json();
    },
    onSuccess: (user: User) => {
      // Instantly set user state for immediate routing
      setCurrentUser(user);
      
      // Cache user data for instant loading on refresh
      sessionStorage.setItem('cached_user', JSON.stringify(user));
      
      // Pre-fetch and cache critical data immediately after login
      const prefetchData = async () => {
        try {
          // Fetch dashboard stats
          const dashboardRes = await fetch('/api/dashboard/stats', { credentials: 'include' });
          if (dashboardRes.ok) {
            const dashboardData = await dashboardRes.json();
            sessionStorage.setItem('cached_dashboard', JSON.stringify(dashboardData));
            queryClient.setQueryData(['/api/dashboard/stats'], dashboardData);
          }
          
          // Fetch bookings
          const bookingsRes = await fetch('/api/bookings', { credentials: 'include' });
          if (bookingsRes.ok) {
            const bookingsData = await bookingsRes.json();
            sessionStorage.setItem('cached_bookings', JSON.stringify(bookingsData));
            queryClient.setQueryData(['/api/bookings'], bookingsData);
            queryClient.setQueryData(['/api/bookings/recent'], bookingsData.slice(0, 5));
          }
        } catch (e) {
          console.log('Pre-fetch failed, will load on demand');
        }
      };
      
      // Run prefetch in background
      setTimeout(prefetchData, 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      // Create temporary user immediately for instant loading
      const tempUser: User = {
        id: 'temp-' + Date.now(),
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'transporter',
        officeName: null,
        gstNumber: null,
        phone: null,
        profileImageUrl: null,
        subscriptionPlan: 'professional',
        subscriptionStatus: 'trial',
        trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      // Set user immediately for instant loading
      setCurrentUser(tempUser);
      console.log('⚡ INSTANT: Temp user set for immediate loading');

      // Cache temp user data
      sessionStorage.setItem('cached_user', JSON.stringify(tempUser));
      sessionStorage.setItem('tempUserId', tempUser.id);

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
        credentials: "include",
      });
      
      if (!res.ok) {
        // Revert temp user on error
        setCurrentUser(null);
        sessionStorage.removeItem('cached_user');
        sessionStorage.removeItem('tempUserId');
        const errorData = await res.json();
        throw new Error(errorData.message || "Registration failed");
      }
      
      const realUser = await res.json();
      
      // Update with real user data (without disrupting UI)
      setCurrentUser(realUser);
      sessionStorage.setItem('cached_user', JSON.stringify(realUser));
      sessionStorage.setItem('tempUserId', realUser.id);
      
      return realUser;
    },
    onSuccess: (user: User) => {
      console.log('✅ Registration complete, user already set for instant loading');
      
      // Pre-populate empty dashboard data for new users
      const emptyDashboardData = {
        totalBookings: 0,
        totalRevenue: 0,
        activeShipments: 0,
        totalVehicles: 0
      };
      sessionStorage.setItem('cached_dashboard', JSON.stringify(emptyDashboardData));
      queryClient.setQueryData(['/api/dashboard/stats'], emptyDashboardData);
      
      // Pre-populate empty arrays
      const emptyArrays: any[] = [];
      sessionStorage.setItem('cached_bookings', JSON.stringify(emptyArrays));
      queryClient.setQueryData(['/api/bookings'], emptyArrays);
      queryClient.setQueryData(['/api/bookings/recent'], emptyArrays);
      queryClient.setQueryData(['/api/vehicles'], emptyArrays);
      queryClient.setQueryData(['/api/notifications'], emptyArrays);
      queryClient.setQueryData(['/api/messages'], emptyArrays);
      
      // Pre-populate theme settings to prevent blank page
      const defaultTheme = {
        id: 1,
        userId: user.id,
        primaryColor: "#3094d1",
        secondaryColor: "#e7a293", 
        accentColor: "#cbdc65",
        theme: "system",
        logoUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      queryClient.setQueryData(['/api/user/theme-settings'], defaultTheme);
      localStorage.setItem(`userTheme_${user.id}`, JSON.stringify(defaultTheme));
      
      console.log('⚡ All data pre-populated for instant dashboard loading');
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    console.log('⚡ MILLISECOND logout');
    
    // Preserve Remember Me credentials before clearing localStorage
    const savedCredentials = localStorage.getItem('savedCredentials');
    console.log('📋 Preserving credentials during logout:', savedCredentials ? 'YES' : 'NO');
    
    // Immediately clear user state - this triggers instant UI change
    setCurrentUser(null);
    setIsAuthLoading(false);
    
    // Clear caches instantly
    queryClient.clear();
    sessionStorage.removeItem('cached_user'); // Remove cached user specifically
    sessionStorage.clear();
    localStorage.clear();
    
    // Restore Remember Me credentials after clearing
    if (savedCredentials) {
      localStorage.setItem('savedCredentials', savedCredentials);
      console.log('📋 Remember Me credentials restored after logout');
    }
    
    // NO PAGE RELOAD - React will instantly show landing page
    console.log('⚡ User state cleared - React routing handles the rest');
  };

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        isLoading: isAuthLoading,
        isLoggingOut,
        error: null,
        loginMutation,
        handleLogout,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}