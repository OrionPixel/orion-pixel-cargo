import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

import { ThemeProvider } from "./contexts/ThemeContext";
import { ThemeSystemProvider } from "./contexts/ThemeSystemContext";
import { UserThemeProvider } from "./contexts/UserThemeContext";
import { SuperAdminThemeProvider } from "./contexts/SuperAdminThemeContext";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import About from "@/pages/About";
import Features from "@/pages/Features";
import PricingNew from "@/pages/PricingNew";
import Contact from "@/pages/Contact";
import SignIn from "@/pages/SignIn";
import Register from "@/pages/Register";
import SignUp from "@/pages/SignUp";
import AdminLogin from "@/pages/admin-login";
import Dashboard from "@/pages/Dashboard";
import Bookings from "@/pages/Bookings";
import Tracking from "@/pages/Tracking";
import Vehicles from "@/pages/Vehicles";
import Warehouses from "@/pages/Warehouses";
import Reports from "@/pages/Reports";
import Billing from "@/pages/Billing";
import BillingPage from "@/pages/BillingPage";
import OfficeAccounts from "@/pages/OfficeAccounts";
import OfficePortal from "@/pages/OfficePortal";
import Admin from "@/pages/Admin";
import AdminRoutes from "@/components/layouts/AdminRoutes";
import Team from "@/pages/Team";
import Agents from "@/pages/Agents";
import SupportTickets from "@/pages/SupportTickets";
import ThemeSettings from "@/pages/ThemeSettings";
import UserThemeSettings from "@/pages/UserThemeSettings";
import NotificationCenter from "@/components/shared/NotificationCenter";
import { GPSDeviceManager } from "@/components/tracking/GPSDeviceManager";
import GPSDevices from "@/pages/GPSDevices";
import Layout from "@/components/layouts/Layout";
import AdminLayout from "@/components/layouts/AdminLayout";
import AgentLayout from "@/components/layouts/AgentLayout";

import Profile from "@/pages/Profile";
import Notifications from "@/pages/Notifications";
import Contacts from "@/pages/Contacts";
import FinancialReports from "@/pages/FinancialReports";
import React from "react";

function Router() {
  const { user, isLoading } = useAuth();
  const [forceRefresh, setForceRefresh] = React.useState(0);
  
  // Listen for logout events and navigation changes
  React.useEffect(() => {
    const handleAuthLogout = (event) => {
      console.log('🔄 Auth logout event detected - forcing instant router refresh');
      setForceRefresh(prev => prev + 1);
    };
    
    const handlePopstate = () => {
      console.log('🔄 Popstate event detected - forcing router refresh');
      setForceRefresh(prev => prev + 1);
    };
    
    window.addEventListener('auth-logout', handleAuthLogout);
    window.addEventListener('popstate', handlePopstate);
    
    return () => {
      window.removeEventListener('auth-logout', handleAuthLogout);
      window.removeEventListener('popstate', handlePopstate);
    };
  }, []);
  
  // Check for logout flag - instant redirect
  const isLoggedOut = sessionStorage.getItem('logout_flag') === 'true';
  
  console.log('🚨 ROUTING DEBUG:', { 
    hasUser: !!user, 
    isLoading, 
    isLoggedOut,
    forceRefresh,
    hasCachedUser: !!sessionStorage.getItem('cached_user')
  });
  
  // INSTANT: If logged out flag is set, show landing immediately
  if (isLoggedOut || (!user && !isLoading)) {
    // Clear logout flag after use
    if (isLoggedOut) {
      sessionStorage.removeItem('logout_flag');
    }
    
    return (
      <SuperAdminThemeProvider>
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/about" component={About} />
          <Route path="/features" component={Features} />
          <Route path="/pricing" component={PricingNew} />
          <Route path="/contact" component={Contact} />
          <Route path="/sign-in" component={SignIn} />
          <Route path="/register" component={Register} />
          <Route path="/signup" component={SignUp} />
          <Route path="/admin-login" component={AdminLogin} />
          <Route path="/login" component={SignIn} />
          <Route path="/signin" component={SignIn} />
          <Route component={Landing} />
        </Switch>
      </SuperAdminThemeProvider>
    );
  }
  
  // Show minimal loading only when actually loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Show unauthenticated routes when no user
  if (!user) {
    return (
      <SuperAdminThemeProvider>
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/about" component={About} />
          <Route path="/features" component={Features} />
          <Route path="/pricing" component={PricingNew} />
          <Route path="/contact" component={Contact} />
          <Route path="/sign-in" component={SignIn} />
          <Route path="/register" component={Register} />
          <Route path="/signup" component={SignUp} />

          <Route path="/admin-login" component={AdminLogin} />
          <Route path="/login" component={SignIn} />
          <Route path="/signin" component={SignIn} />
          <Route component={Landing} />
        </Switch>
      </SuperAdminThemeProvider>
    );
  }

  // Admin users get admin layout with SuperAdminTheme
  if (user.role === 'admin' || user.email === 'admin@logigofast.com') {
    return (
      <SuperAdminThemeProvider>
        <AdminRoutes />
      </SuperAdminThemeProvider>
    );
  }

  // Office users get agent portal with inherited UserTheme
  if (user.role === 'office') {
    return (
      <UserThemeProvider>
        <AgentLayout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />

            <Route path="/bookings" component={Bookings} />
            <Route path="/tracking" component={Tracking} />
            <Route component={Dashboard} />
          </Switch>
        </AgentLayout>
      </UserThemeProvider>
    );
  }

  // Regular users get user dashboard
  return (
    <UserThemeProvider>
      <Layout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />

          <Route path="/bookings" component={Bookings} />
          <Route path="/contacts" component={Contacts} />
          <Route path="/tracking" component={Tracking} />
          <Route path="/vehicles" component={Vehicles} />
          <Route path="/warehouses" component={Warehouses} />
          <Route path="/team" component={Team} />
          <Route path="/agents" component={Agents} />
          <Route path="/support-tickets" component={SupportTickets} />
          <Route path="/notification-center" component={Notifications} />
          <Route path="/gps-devices" component={GPSDevices} />
          <Route path="/reports" component={Reports} />
          <Route path="/financial-reports" component={FinancialReports} />
          <Route path="/billing" component={Billing} />
          <Route path="/office-accounts" component={OfficeAccounts} />
          <Route path="/settings/billing" component={BillingPage} />
          <Route path="/settings/theme" component={UserThemeSettings} />
          <Route path="/user-theme-settings" component={UserThemeSettings} />
          <Route path="/profile" component={Profile} />
          <Route path="/not-found" component={() => <div>Page not found</div>} />
          <Route component={Dashboard} />
        </Switch>
      </Layout>
    </UserThemeProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeSystemProvider>
        <AuthProvider>
          <ThemeProvider>
            <div className="min-h-screen bg-background">
              <Router />
              <Toaster />
            </div>
          </ThemeProvider>
        </AuthProvider>
      </ThemeSystemProvider>
    </QueryClientProvider>
  );
}

export default App;
