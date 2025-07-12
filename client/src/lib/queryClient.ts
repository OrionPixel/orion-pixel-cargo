import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Removed global logout state for simplicity

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      "Cache-Control": "no-cache",
      "Accept": "application/json",
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    mode: "cors",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Check if logout is in progress - prevent all queries
    const logoutInitiated = localStorage.getItem('logout_initiated');
    if (logoutInitiated) {
      throw new Error('Logout in progress - query cancelled');
    }

    const startTime = performance.now();
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      mode: "cors",
      headers: {
        "Cache-Control": "no-cache",
        "Accept": "application/json",
      },
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    const data = await res.json();
    
    const endTime = performance.now();
    console.log(`✅ Request completed in ${(endTime - startTime).toFixed(2)}ms for ${queryKey[0]}`);
    
    return data;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false, // NO automatic polling
      refetchOnWindowFocus: false, // NO refetch on window focus
      refetchOnMount: false, // Disable for instant navigation using cache
      refetchOnReconnect: true, // Enable reconnect refetch for network recovery
      refetchIntervalInBackground: false, // NO background polling
      staleTime: 2 * 60 * 1000, // 2 minutes - faster updates
      gcTime: 10 * 60 * 1000, // 10 minutes - aggressive cache cleanup
      retry: 2, // Reduced retries for faster loading
      retryDelay: attemptIndex => Math.min(500 * 2 ** attemptIndex, 15000),
      networkMode: 'online',
    },
    mutations: {
      retry: 1, // Reduced mutation retries for speed
      retryDelay: 500,
      networkMode: 'online',
    },
  },
});

// Admin Dashboard Performance Optimization
export const preWarmAdminData = async () => {
  const adminQueries = [
    '/api/admin/bookings',
    '/api/admin/users',
    '/api/admin/vehicles',
    '/api/admin-comprehensive-analytics',
    '/api/admin/theme-settings',
    '/api/admin/support-tickets',
    '/api/admin/contact-submissions'
  ];

  // Pre-fetch admin data for instant navigation
  console.log('🚀 Pre-warming admin dashboard data...');
  const startTime = performance.now();
  
  await Promise.allSettled(
    adminQueries.map(queryKey => 
      queryClient.prefetchQuery({
        queryKey: [queryKey],
        staleTime: 3 * 60 * 1000, // 3 minutes cache
      })
    )
  );
  
  const endTime = performance.now();
  console.log(`✅ Admin data pre-warmed in ${(endTime - startTime).toFixed(2)}ms`);
};

// Navigation optimization: Pre-warm critical page data
export const preWarmPageData = async (userId: string) => {
  const criticalQueries = [
    '/api/dashboard/stats',
    '/api/bookings/recent',
    '/api/vehicles',
    '/api/user/theme-settings'
  ];

  // Pre-fetch critical data for instant navigation
  await Promise.allSettled(
    criticalQueries.map(queryKey => 
      queryClient.prefetchQuery({
        queryKey: [queryKey],
        staleTime: 15 * 60 * 1000, // 15 minutes
      })
    )
  );
};

// Page navigation with instant cached data
export const ensureNavigationCache = (queryKey: string) => {
  const cached = queryClient.getQueryData([queryKey]);
  if (cached) {
    // Return cached data immediately for instant navigation
    return cached;
  }
  // Only fetch if no cache exists
  return null;
};

// SUPER FAST logout - minimal operations, instant redirect
export const performLogout = (skipRedirect = false) => {
  console.log('🚀 SUPER FAST logout starting');
  
  // Set logout flag immediately
  sessionStorage.setItem('logout_flag', 'true');
  localStorage.setItem('logout_flag', 'true');
  
  // Clear all cache storage immediately
  queryClient.clear();
  
  // Clear all sessionStorage cache entries
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith('cache_')) {
      sessionStorage.removeItem(key);
    }
  });
  
  // Clear all user theme localStorage entries
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('userTheme_')) {
      localStorage.removeItem(key);
    }
  });
  
  // Reset CSS variables to default Super Admin theme
  const root = document.documentElement;
  root.style.setProperty('--primary', '272 69% 50%'); // #8427d7
  root.style.setProperty('--secondary', '216 3% 66%'); // #A7A9AC 
  root.style.setProperty('--accent', '210 3% 87%'); // #DCDDDE
  
  console.log('🎨 Theme reset to Super Admin default on logout');
  
  // Only redirect if not called from handleLogout
  if (!skipRedirect) {
    window.location.replace('/');
  }
};
