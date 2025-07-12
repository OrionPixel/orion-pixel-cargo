import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './use-auth';
import { queryClient } from '../lib/queryClient';

interface EventHubEvent {
  type: 'notification' | 'message' | 'booking' | 'vehicle' | 'gps' | 'dashboard' | 'connected';
  action?: 'new' | 'update';
  data?: any;
  message?: string;
  userId?: string;
}

interface EventHubHookOptions {
  onNotification?: (notification: any) => void;
  onMessage?: (message: any) => void;
}

export function useEventHub({ onNotification, onMessage }: EventHubHookOptions = {}) {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  console.log('🔧 useEventHub hook called with user:', user?.id, user?.role);

  const connect = useCallback(() => {
    console.log('🔧 EventHub connect function called with user:', user?.id);
    if (!user?.id) {
      console.log('❌ EventHub: No user ID found, skipping connection');
      return;
    }

    // Prevent multiple connections
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('⚠️ EventHub: Connection already exists or connecting, skipping');
      return;
    }

    // Clear any existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      let host = window.location.host;
      
      // Ensure host is not undefined or invalid
      if (!host || host === 'undefined' || host === 'null') {
        console.warn('⚠️ EventHub: Invalid host detected, using fallback');
        host = 'localhost:8000';
      }
      
      const wsUrl = `${protocol}//${host}/events?userId=${user.id}&role=${user.role || 'user'}`;
      
      console.log('🔗 EventHub: Attempting connection to:', wsUrl);
      console.log('👤 EventHub: User ID:', user.id, 'Role:', user.role);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔗 EventHub connected successfully!');
        console.log('📡 WebSocket readyState:', ws.readyState);
        // Clear reconnect timeout on successful connection
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      ws.onmessage = (event) => {
        try {
          const eventData: EventHubEvent = JSON.parse(event.data);
          handleEvent(eventData);
        } catch (error) {
          console.error('EventHub message parse error:', error);
        }
      };

      ws.onclose = () => {
        console.log('❌ EventHub disconnected');
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          if (user?.id) {
            connect();
          }
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('EventHub error:', error);
      };

    } catch (error) {
      console.error('EventHub connection error:', error);
    }
  }, [user?.id, user?.role]);

  const handleEvent = useCallback((event: EventHubEvent) => {
    console.log('📨 EventHub event received:', event);

    switch (event.type) {
      case 'connected':
        console.log('✅ EventHub connection confirmed');
        break;

      case 'notification':
        if (event.action === 'new') {
          // Invalidate notifications queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
          queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
          console.log('🔔 New notification received - cache invalidated');
          // Call callback if provided
          if (onNotification) {
            onNotification(event.data);
          }
        }
        break;

      case 'message':
        if (event.action === 'new') {
          // Invalidate messages queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
          queryClient.invalidateQueries({ queryKey: ['/api/messages/unread-count'] });
          console.log('💬 New message received - cache invalidated');
          // Call callback if provided
          if (onMessage) {
            onMessage(event.data);
          }
        }
        break;

      case 'booking':
        if (event.action === 'update') {
          // Invalidate booking queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
          queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
          console.log('📦 Booking updated - cache invalidated');
        }
        break;

      case 'vehicle':
        if (event.action === 'update') {
          // Invalidate vehicle queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
          console.log('🚛 Vehicle updated - cache invalidated');
        }
        break;

      case 'gps':
        if (event.action === 'update') {
          // Invalidate GPS tracking queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['/api/live-tracking'] });
          console.log('📍 GPS updated - cache invalidated');
        }
        break;

      case 'dashboard':
        if (event.action === 'update') {
          // Invalidate dashboard analytics
          queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
          console.log('📊 Dashboard updated - cache invalidated');
        }
        break;

      default:
        console.log('Unknown event type:', event.type);
    }
  }, [onNotification, onMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Connect when user is available, disconnect when user logs out
  useEffect(() => {
    console.log('🔧 EventHub useEffect triggered with user ID:', user?.id);
    if (user?.id) {
      console.log('✅ EventHub: User found, calling connect()');
      connect();
    } else {
      console.log('❌ EventHub: No user, calling disconnect()');
      disconnect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [user?.id, connect, disconnect]);

  // Return connection status
  const isConnected = wsRef.current?.readyState === WebSocket.OPEN;

  return {
    isConnected,
    connect,
    disconnect
  };
}