// Production API Configuration
export const API_CONFIG = {
  // Auto-detect environment and set appropriate base URL
  baseURL: (() => {
    // Production environment detection
    if (process.env.NODE_ENV === 'production') {
      // Check if we're on Render
      if (window.location.hostname.includes('onrender.com')) {
        return `https://${window.location.hostname}`;
      }
      // Check if we're on Replit
      if (window.location.hostname.includes('replit.dev') || window.location.hostname.includes('replit.co')) {
        return `https://${window.location.hostname}`;
      }
      // Fallback to current origin
      return window.location.origin;
    }
    // Development - connect to backend on port 8000
    return 'http://localhost:8000';
  })(),
  
  // WebSocket configuration
  websocket: {
    url: (() => {
      if (process.env.NODE_ENV === 'development') {
        return 'ws://localhost:8000';
      }
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}`;
    })(),
    options: {
      transports: ['polling', 'websocket'], // Polling first for better compatibility
      upgrade: true,
      timeout: 20000,
      forceNew: false,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      maxReconnectionDelay: 5000,
      randomizationFactor: 0.5
    }
  },
  
  // API request configuration
  request: {
    timeout: 30000, // 30 seconds for production
    retries: 3,
    retryDelay: 1000,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    credentials: 'include' as RequestCredentials
  }
};

// Helper function to make API requests with proper configuration
export async function makeAPIRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  
  const config: RequestInit = {
    ...API_CONFIG.request,
    ...options,
    headers: {
      ...API_CONFIG.request.headers,
      ...options.headers
    }
  };
  
  console.log('🌐 Making API request to:', url);
  
  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ API request successful');
    return data;
  } catch (error) {
    console.error('🔥 API request error:', error);
    throw error;
  }
}

// WebSocket connection helper
export function createWebSocketConnection(userId: string, role: string) {
  const wsUrl = `${API_CONFIG.websocket.url}/socket.io/?userId=${userId}&role=${role}`;
  console.log('🔌 Creating WebSocket connection to:', wsUrl);
  
  return wsUrl;
}

// Environment detection utilities
export const ENV = {
  isProduction: process.env.NODE_ENV === 'production',
  isRender: window.location.hostname.includes('onrender.com'),
  isReplit: window.location.hostname.includes('replit.dev') || window.location.hostname.includes('replit.co'),
  isDevelopment: process.env.NODE_ENV === 'development',
  domain: window.location.hostname,
  protocol: window.location.protocol,
  origin: window.location.origin
};

console.log('🔧 API Configuration initialized:', {
  baseURL: API_CONFIG.baseURL,
  websocketURL: API_CONFIG.websocket.url,
  environment: ENV
});