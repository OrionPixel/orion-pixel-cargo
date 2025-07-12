/**
 * Professional Real-time Notification Service
 * WebSocket-based event-driven notification system
 * Designed for Replit environment compatibility
 */

import { QueryClient } from '@tanstack/react-query';

interface SSEEvent {
  type: string;
  data: any;
  timestamp: string;
}

class RealtimeNotificationService {
  private static instance: RealtimeNotificationService | null = null;
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnected = false;
  private userId: string;
  private userRole: string;
  private queryClient: QueryClient;
  private soundEnabled: boolean;
  private playSound: () => void;
  private eventListeners: Map<string, Set<(event: SSEEvent) => void>> = new Map();

  constructor(
    userId: string,
    userRole: string,
    queryClient: QueryClient,
    soundEnabled: boolean = true,
    playSound: () => void = () => {}
  ) {
    this.userId = userId;
    this.userRole = userRole;
    this.queryClient = queryClient;
    this.soundEnabled = soundEnabled;
    this.playSound = playSound;
  }

  // Singleton pattern to prevent multiple instances
  static getInstance(
    userId: string,
    userRole: string,
    queryClient: QueryClient,
    soundEnabled: boolean = true,
    playSound: () => void = () => {}
  ): RealtimeNotificationService {
    // Check if we have an existing instance for the same user
    if (RealtimeNotificationService.instance && 
        RealtimeNotificationService.instance.userId === userId) {
      console.log('🔌 WebSocket: Reusing existing instance for user:', userId);
      return RealtimeNotificationService.instance;
    }
    
    // If we have an existing instance for a different user, destroy it first
    if (RealtimeNotificationService.instance) {
      console.log('🔌 WebSocket: Destroying existing instance for different user');
      RealtimeNotificationService.instance.destroy();
    }
    
    // Create new instance
    console.log('🔌 WebSocket: Creating new instance for user:', userId);
    RealtimeNotificationService.instance = new RealtimeNotificationService(
      userId,
      userRole,
      queryClient,
      soundEnabled,
      playSound
    );
    
    return RealtimeNotificationService.instance;
  }

  connect(): void {
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('🔌 WebSocket: Already connected and ready, skipping connection');
      return;
    }
    
    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      console.log('🔌 WebSocket: Connection already in progress, skipping');
      return;
    }

    console.log('🔌 WebSocket: Connecting to EventHub for user:', this.userId);
    
    try {
      // Close existing connection if any
      if (this.ws) {
        console.log('🔌 WebSocket: Closing existing connection before creating new one');
        this.ws.close();
        this.ws = null;
        this.isConnected = false;
      }
      
      // Use WebSocket connection to EventHub
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws?userId=${this.userId}&role=${this.userRole}`;
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket: Connected to EventHub successfully');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data: SSEEvent = JSON.parse(event.data);
          console.log('📨 WebSocket Event:', data.type, data);
          
          this.handleEvent(data);
        } catch (error) {
          console.error('❌ WebSocket: Message parse error:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket: Connection error:', error);
        this.isConnected = false;
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket: Connection closed:', event.code, event.reason);
        this.isConnected = false;
        
        if (event.code !== 1000) { // Not a normal closure
          this.handleReconnect();
        }
      };

    } catch (error) {
      console.error('❌ WebSocket: Initialization failed:', error);
    }
  }

  private handleEvent(event: SSEEvent): void {
    // Handle different event types
    switch (event.type) {
      case 'connected':
        console.log('🔗 SSE: Connection confirmed');
        break;
        
      case 'ping':
        console.log('🏓 SSE: Keepalive ping received');
        break;
        
      case 'booking':
        console.log('📦 SSE: Booking update received');
        this.handleBookingEvent(event);
        break;
        
      case 'notification':
        console.log('🔔 SSE: Notification update received');
        this.handleNotificationEvent(event);
        break;
        
      case 'dashboard':
        console.log('📊 SSE: Dashboard update received');
        this.handleDashboardEvent(event);
        break;
        
      default:
        console.log('❓ SSE: Unknown event type:', event.type);
    }

    // Notify all registered listeners
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('❌ SSE: Listener error:', error);
        }
      });
    }
  }

  private handleBookingEvent(event: SSEEvent): void {
    // Invalidate booking-related queries
    this.queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
    this.queryClient.invalidateQueries({ queryKey: ['/api/bookings/recent'] });
    this.queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
  }

  private handleNotificationEvent(event: SSEEvent): void {
    // Invalidate notification queries
    this.queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    this.queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    
    // Play notification sound if enabled
    if (this.soundEnabled) {
      this.playSound();
    }
  }

  private handleDashboardEvent(event: SSEEvent): void {
    // Invalidate dashboard queries
    this.queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    this.queryClient.invalidateQueries({ queryKey: ['/api/bookings/recent'] });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      console.log(`🔄 SSE: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.log('❌ SSE: Max reconnection attempts reached');
    }
  }

  // Register event listeners
  addEventListener(eventType: string, listener: (event: SSEEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener);
  }

  // Remove event listeners
  removeEventListener(eventType: string, listener: (event: SSEEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  destroy(): void {
    console.log('🔌 SSE: Destroying connection');
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnected = false;
    this.eventListeners.clear();
    
    // Reset singleton instance
    RealtimeNotificationService.instance = null;
  }

  isConnectedToServer(): boolean {
    return this.isConnected;
  }
}

export { RealtimeNotificationService };