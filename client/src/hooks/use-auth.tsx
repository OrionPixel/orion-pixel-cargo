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

  // Initialize user state on mount with session persistence
  React.useEffect(() => {
    const checkAuth = async () => {
      console.log('🚨 ROUTING DEBUG:', {
        hasUser: !!currentUser,
        isLoading: isAuthLoading,
        hasCachedUser: !!sessionStorage.getItem('cached_user')
      });

      // Check if we're on landing page - don't auto-authenticate
      if (window.location.pathname === '/') {
        console.log('🏠 Landing page detected - skipping authentication');
        setCurrentUser(null);
        setIsAuthLoading(false);
        return;
      }

      // INSTANT: Check for cached user data first
      const cachedUser = sessionStorage.getItem('cached_user');
      
      if (cachedUser) {
        try {
          const userData = JSON.parse(cachedUser);
          console.log('⚡ INSTANT: Retrieved cached user for immediate access');
          setCurrentUser(userData);
          setIsAuthLoading(false);
          
          // Pre-cache dashboard data for fast loading
          const cachedDashboard = sessionStorage.getItem('cached_dashboard');
          const cachedBookings = sessionStorage.getItem('cached_bookings');
          
          if (cachedDashboard) {
            queryClient.setQueryData(['/api/dashboard/stats'], JSON.parse(cachedDashboard));
          }
          if (cachedBookings) {
            queryClient.setQueryData(['/api/bookings'], JSON.parse(cachedBookings));
            queryClient.setQueryData(['/api/bookings/recent'], JSON.parse(cachedBookings).slice(0, 5));
          }
          
          // REMOVED: Background verification to prevent infinite loops
          // Use cached user immediately without server verification
          return;
        } catch (e) {
          // Clear corrupted cache
          sessionStorage.removeItem('cached_user');
        }
      }

      // No cache, fetch from server
      try {
        const apiUrl = process.env.NODE_ENV === 'development' 
          ? 'http://localhost:8000/api/user' 
          : '/api/user';
        
        const response = await fetch(apiUrl, { 
          credentials: 'include',
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
          }
        });
        
        console.log('🔍 Auth check response:', response.status, response.statusText);
        
        if (response.ok) {
          const userData = await response.json();
          console.log('✅ User authenticated:', userData.email);
          setCurrentUser(userData);
          
          // Cache user data for next reload
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
  }, []); // Empty dependency array to run only once

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      // Use the correct API base URL
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:8000/api/login' 
        : '/api/login';
      
      console.log('🔐 Attempting login to:', apiUrl);
      
      const res = await fetch(apiUrl, {
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
          const baseUrl = process.env.NODE_ENV === 'development' 
            ? 'http://localhost:8000' 
            : '';
          
          // Fetch dashboard stats
          const dashboardRes = await fetch(`${baseUrl}/api/dashboard/stats`, { credentials: 'include' });
          if (dashboardRes.ok) {
            const dashboardData = await dashboardRes.json();
            sessionStorage.setItem('cached_dashboard', JSON.stringify(dashboardData));
            queryClient.setQueryData(['/api/dashboard/stats'], dashboardData);
          }
          
          // Fetch bookings
          const bookingsRes = await fetch(`${baseUrl}/api/bookings`, { credentials: 'include' });
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
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:8000/api/register' 
        : '/api/register';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role || 'transporter',
          officeName: userData.officeName || null,
          phone: userData.phone || null,
          subscriptionPlan: userData.subscriptionPlan || 'starter',
          trialDays: userData.trialDays || 14
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const user = await response.json();
      console.log('✅ User registered successfully');
      
      return user;
    },
    onSuccess: (user: User) => {
      console.log('✅ User registered and logged in automatically');
      
      // Set user state immediately
      setCurrentUser(user);
      
      // Cache user data for session persistence
      sessionStorage.setItem('cached_user', JSON.stringify(user));
      
      // Show success message
      toast({
        title: "Registration successful",
        description: "Welcome! You have been logged in automatically.",
      });
      
      // Redirect to dashboard
      window.location.href = "/dashboard";
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
    console.log('🔓 Zero-lag logout initiated');
    
    // INSTANT: Set logout flag first for Router detection
    sessionStorage.setItem('logout_flag', 'true');
    
    // INSTANT: Set user to null immediately for instant UI update
    setCurrentUser(null);
    setIsLoggingOut(false); // Prevent loading state
    
    // INSTANT: Clear all authentication data immediately  
    sessionStorage.removeItem('cached_user');
    sessionStorage.removeItem('cached_dashboard');
    sessionStorage.removeItem('cached_bookings');
    sessionStorage.removeItem('instant_user');
    
    // INSTANT: Clear query cache
    queryClient.clear();
    
    // INSTANT: Clear user theme storage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('userTheme_')) {
        localStorage.removeItem(key);
      }
    });
    
    // Reset to default theme immediately
    const root = document.documentElement;
    root.style.setProperty('--primary', '272 69% 50%'); // #8427d7
    root.style.setProperty('--secondary', '216 3% 66%'); // #A7A9AC 
    root.style.setProperty('--accent', '210 3% 87%'); // #DCDDDE
    
    console.log('⚡ Zero-lag redirect to landing');
    
    // Force React re-render by triggering state update
    // This will make Router component re-evaluate immediately
    const forceUpdate = () => {
      const event = new CustomEvent('auth-logout', { detail: { timestamp: Date.now() } });
      window.dispatchEvent(event);
    };
    
    // Immediate re-render trigger
    forceUpdate();
    
    // Also trigger location change for wouter
    if (window.location.pathname !== '/') {
      window.history.replaceState(null, '', '/');
    }
    
    // Background server cleanup (fire and forget)
    setTimeout(() => {
      fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {});
    }, 100);
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
  
  // INSTANT: Check for cached user data if no user in context
  if (!context.user && typeof window !== 'undefined') {
    const cachedUser = sessionStorage.getItem('instant_user');
    if (cachedUser) {
      try {
        const parsedUser = JSON.parse(cachedUser);
        console.log('⚡ INSTANT: Retrieved user from cache for immediate access');
        return {
          ...context,
          user: parsedUser,
          isLoading: false
        };
      } catch (error) {
        console.log('❌ Error parsing cached user:', error);
      }
    }
  }
  
  return context;
}