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
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Prevent duplicate fetches
      refetchOnReconnect: false,
      staleTime: 10 * 60 * 1000, // 10 minutes cache
      retry: 1, // Reduce retries
      retryDelay: 2000, // Increase delay
      networkMode: 'online',
      // Prevent duplicate requests
      enabled: true,
    },
    mutations: {
      retry: false,
      networkMode: 'online',
    },
  },
});

// SUPER FAST logout - minimal operations, instant redirect
export const performLogout = () => {
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
  
  // Instant redirect with replace (no back button)
  window.location.replace('/');
};
