import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, MessageSquare, AlertCircle, Info, CheckCircle, User, Clock, Send, Volume2, VolumeX } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { RealtimeNotificationService } from '@/services/RealtimeNotificationService';

interface Notification {
  notification: {
    id: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    actionUrl?: string;
    relatedId?: number;
    createdAt: string;
  };
  sender?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    role: string;
  };
}

interface Message {
  id: number;
  fromUserId: string;
  toUserId: string;
  subject: string;
  message: string;
  isRead: boolean;
  priority: string;
  relatedTicketId?: number;
  createdAt: string;
  senderName?: string;
  senderEmail?: string;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'notifications' | 'messages'>('notifications');
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isMessageDetailOpen, setIsMessageDetailOpen] = useState(false);
  const [messageForm, setMessageForm] = useState({
    subject: '',
    message: '',
    priority: 'medium'
  });
  
  // Sound notification settings
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('notificationSoundEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const [realtimeService, setRealtimeService] = useState<RealtimeNotificationService | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  console.log('🔔 NotificationCenter: Component rendered with user:', user?.id);
  console.log('🔔 NotificationCenter: User authentication status:', !!user);
  console.log('🔔 NotificationCenter: User role:', user?.role);

  // Initialize Realtime Notification Service
  useEffect(() => {
    if (!user?.id || !user?.role) {
      console.log('🔔 NotificationCenter: User not authenticated, skipping realtime service');
      return;
    }

    console.log('🔔 NotificationCenter: Initializing RealtimeNotificationService for user:', user.id);
    
    // Use singleton pattern to prevent duplicate connections
    const service = RealtimeNotificationService.getInstance(
      user.id,
      user.role,
      queryClient,
      soundEnabled,
      playNotificationSound
    );

    setRealtimeService(service);
    service.connect();

    return () => {
      console.log('🔔 NotificationCenter: Cleaning up RealtimeNotificationService');
      // Don't destroy the service here as it's a singleton
      // Only remove event listeners if needed
    };
  }, [user?.id, user?.role, queryClient]);

  // Update sound settings in realtime service
  useEffect(() => {
    if (realtimeService) {
      realtimeService.setSoundEnabled(soundEnabled);
    }
  }, [soundEnabled, realtimeService]);

  // Fetch notifications (Event-based - no automatic polling)
  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: !!user, // Only fetch when user is authenticated
  });
  
  // Fetch unread notification count (Event-based - no automatic polling)
  const { data: notificationCount = { count: 0 }, refetch: refetchNotificationCount } = useQuery({
    queryKey: ['/api/notifications/unread-count'],
    enabled: !!user, // Only fetch when user is authenticated
    staleTime: 0, // Always consider data stale for real-time updates
  });

  // Fetch messages (Event-based - no automatic polling)
  const { data: messages = [] } = useQuery({
    queryKey: ['/api/messages'],
    enabled: !!user, // Only fetch when user is authenticated
  });
  
  // Fetch unread message count (Event-based - no automatic polling)
  const { data: messageCount = { count: 0 }, refetch: refetchMessageCount } = useQuery({
    queryKey: ['/api/messages/unread-count'],
    enabled: !!user, // Only fetch when user is authenticated
    staleTime: 0, // Always consider data stale for real-time updates
  });

  // Fetch all users for admin to send messages
  const { data: allUsers = [] } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: user?.role === 'admin',
  });

  // Enhanced notification sound with instant playback
  const playNotificationSound = () => {
    if (!soundEnabled) {
      console.log('🔇 Sound disabled, skipping notification sound');
      return;
    }
    
    console.log('🔊 Playing notification sound - enabled:', soundEnabled, 'initialized:', isAudioInitialized);
    
    try {
      // Method 1: Web Audio API (most reliable)
      if (window.AudioContext || (window as any).webkitAudioContext) {
        const audioContext = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Resume if suspended (required by many browsers)
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }
        
        // Create a pleasant two-tone notification beep
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // First tone: 800Hz
        oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
        // Second tone: 600Hz 
        oscillator2.frequency.setValueAtTime(600, audioContext.currentTime + 0.15);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        
        oscillator1.start(audioContext.currentTime);
        oscillator1.stop(audioContext.currentTime + 0.15);
        
        oscillator2.start(audioContext.currentTime + 0.15);
        oscillator2.stop(audioContext.currentTime + 0.4);
        
        console.log('🔊 Web Audio notification sound played successfully');
        return;
      }
      
      // Method 2: HTML Audio fallback with better sound
      playHTMLAudio();
      
    } catch (error) {
      console.log('🔇 Web Audio failed, trying HTML5 audio:', error);
      playHTMLAudio();
    }
  };

  // Pure Server-Sent Events (SSE) notification system - NO API POLLING
  useEffect(() => {
    if (!user?.id || !user?.role) return;

    console.log('🌐 NotificationCenter: Using centralized RealtimeNotificationService for SSE');
    
    // The RealtimeNotificationService is already initialized in the earlier useEffect
    // and handles all SSE connections centrally. No need for duplicate connections.
    
    // Add event listeners to the existing service for notification-specific events
    if (realtimeService) {
      const handleNotificationEvent = (event: any) => {
        console.log('🔔 NotificationCenter: Processing notification via centralized service');
        // Force refresh notifications for real-time bell icon updates
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
        
        // Play notification sound
        if (soundEnabled && isAudioInitialized) {
          playNotificationSound();
        }
      };

      const handleMessageEvent = (event: any) => {
        console.log('💬 NotificationCenter: Processing message via centralized service');
        // Force refresh messages and count for real-time bell icon updates
        queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
        queryClient.invalidateQueries({ queryKey: ['/api/messages/unread-count'] });
        
        // Play notification sound
        if (soundEnabled && isAudioInitialized) {
          playNotificationSound();
        }
      };

      // Register event listeners
      realtimeService.addEventListener('notification', handleNotificationEvent);
      realtimeService.addEventListener('message', handleMessageEvent);
      
      return () => {
        // Remove event listeners
        realtimeService.removeEventListener('notification', handleNotificationEvent);
        realtimeService.removeEventListener('message', handleMessageEvent);
      };
    }
  }, [user?.id, user?.role, realtimeService, soundEnabled, isAudioInitialized, queryClient]);





  const createBeepSound = (audioContext: AudioContext) => {
    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Two-tone notification beep
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      console.log('🔊 Web Audio notification sound played successfully');
    } catch (error) {
      console.log('🔇 Web Audio beep failed:', error);
      playHTMLAudio();
    }
  };

  const playHTMLAudio = () => {
    try {
      // Short beep sound data URL
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXbPl66hVFApGn+DyvmMZA');
      audio.volume = 0.4;
      audio.currentTime = 0;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('🔊 HTML5 Audio notification sound played successfully');
          })
          .catch(error => {
            console.log('🔇 HTML5 Audio failed, trying vibration:', error);
            // Vibration fallback for mobile
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200]);
              console.log('📳 Vibration notification triggered');
            }
          });
      }
    } catch (error) {
      console.log('🔇 All audio methods failed:', error);
    }
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    localStorage.setItem('notificationSoundEnabled', JSON.stringify(!soundEnabled));
    console.log('🔊 Sound enabled:', !soundEnabled);
    
    // Initialize audio on first toggle
    if (!isAudioInitialized && !soundEnabled) {
      initializeAudio();
    }
    
    // Play test sound when enabling
    if (!soundEnabled) {
      playTestSound();
    }
  };

  const playTestSound = () => {
    try {
      // Direct audio play without conditions for test
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXbPl66hVFApGn+DyvmMZA');
      audio.volume = 0.5;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('🔊 Test sound played successfully');
          })
          .catch(error => {
            console.log('🔇 Test sound failed:', error);
            // Try Web Audio API
            tryWebAudioTest();
          });
      }
    } catch (error) {
      console.log('🔇 Test audio creation failed:', error);
      tryWebAudioTest();
    }
  };

  const tryWebAudioTest = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
      
      console.log('🔊 Web Audio test sound played successfully');
    } catch (error) {
      console.log('🔇 Web Audio test failed:', error);
    }
  };

  // Watch for new notifications and play sound + update bell icon
  useEffect(() => {
    const currentNotificationCount = parseInt((notificationCount as any)?.count || '0');
    const currentMessageCount = parseInt((messageCount as any)?.count || '0');
    
    console.log('🔢 Notification Count Debug:', {
      notificationCount,
      messageCount,
      notificationUnread: currentNotificationCount,
      messageUnread: currentMessageCount,
      totalUnreadCount: currentNotificationCount + currentMessageCount
    });
    
    // Play sound if count increased AND sound is enabled (new notification/message received)
    if (soundEnabled && lastNotificationCount >= 0 && currentNotificationCount > lastNotificationCount) {
      console.log('🔔 New notification detected - playing sound');
      playNotificationSound();
    }
    if (soundEnabled && lastMessageCount >= 0 && currentMessageCount > lastMessageCount) {
      console.log('💬 New message detected - playing sound');
      playNotificationSound();
    }
    
    setLastNotificationCount(currentNotificationCount);
    setLastMessageCount(currentMessageCount);
  }, [notificationCount, messageCount, lastNotificationCount, lastMessageCount, soundEnabled]);

  // Initialize audio system
  const initializeAudio = () => {
    try {
      // Initialize Web Audio API context
      if (window.AudioContext || (window as any).webkitAudioContext) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        
        // Resume if suspended
        if (audioContext.state === 'suspended') {
          audioContext.resume().then(() => {
            console.log('🔊 Audio context resumed successfully');
            setIsAudioInitialized(true);
          });
        } else {
          console.log('🔊 Audio context initialized successfully');
          setIsAudioInitialized(true);
        }
      }
    } catch (error) {
      console.log('🔇 Audio initialization failed:', error);
      setIsAudioInitialized(false);
    }
  };

  // Initialize audio on user interaction (auto-enable sound)
  useEffect(() => {
    if (isOpen && !isAudioInitialized) {
      initializeAudio();
    }
  }, [isOpen, isAudioInitialized]);

  // Mark notification as read
  const markNotificationRead = useMutation({
    mutationFn: (id: number) => apiRequest('PUT', `/api/notifications/${id}/mark-read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  // Mark message as read
  const markMessageRead = useMutation({
    mutationFn: (id: number) => apiRequest('PUT', `/api/messages/${id}/mark-read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread-count'] });
    },
  });

  // Mark all notifications as read
  const markAllNotificationsRead = useMutation({
    mutationFn: () => apiRequest('PUT', '/api/notifications/mark-all-read'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      toast({
        title: "Success",
        description: "All notifications marked as read.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark notifications as read.",
        variant: "destructive",
      });
    },
  });

  // Mark all messages as read
  const markAllMessagesRead = useMutation({
    mutationFn: () => apiRequest('PUT', '/api/messages/mark-all-read'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread-count'] });
      toast({
        title: "Success",
        description: "All messages marked as read.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark messages as read.",
        variant: "destructive",
      });
    },
  });

  // Send message
  const sendMessage = useMutation({
    mutationFn: (messageData: any) => apiRequest('POST', '/api/messages', messageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      setIsMessageModalOpen(false);
      setMessageForm({ subject: '', message: '', priority: 'medium' });
      setSelectedRecipient('');
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate total unread count
  const notificationUnread = Number((notificationCount as any)?.count || 0);
  const messageUnread = Number((messageCount as any)?.count || 0);
  const totalUnreadCount = notificationUnread + messageUnread;
  
  console.log('🔢 Notification Count Debug:', {
    notificationCount,
    messageCount,
    notificationUnread,
    messageUnread,
    totalUnreadCount
  });
  
  console.log('🔔 Badge Render Check:', {
    shouldShowBadge: totalUnreadCount > 0,
    totalUnreadCount,
    badgeText: totalUnreadCount > 99 ? '99+' : totalUnreadCount
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'message':
        return 'text-blue-600 bg-blue-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserName = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email || 'Unknown User';
  };

  const getRecipientOptions = () => {
    if (user?.role === 'admin') {
      return ((allUsers as any) || []).filter((u: any) => u.role !== 'admin');
    } else {
      return ((allUsers as any) || []).filter((u: any) => u.role === 'admin');
    }
  };

  const handleSendMessage = () => {
    if (!selectedRecipient || !messageForm.subject || !messageForm.message) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    sendMessage.mutate({
      toUserId: selectedRecipient,
      subject: messageForm.subject,
      message: messageForm.message,
      priority: messageForm.priority,
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div className="notification-badge-wrapper">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => {
                // Audio initialization removed to prevent unwanted alerts
              }}
            >
              <Bell className="h-5 w-5" />
            </Button>
            {totalUnreadCount > 0 && (
              <div className="notification-badge-forced">
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </div>
            )}
          </div>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-2xl max-h-[80vh] [&>button]:hidden">
          <DialogHeader className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="absolute -top-2 -right-2 h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-center justify-between pr-8">
              <DialogTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications & Messages
              </DialogTitle>
              <div className="flex items-center gap-2">
                {/* Sound Toggle Button */}
                <Button
                  onClick={toggleSound}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1"
                  title={soundEnabled ? "Disable notification sounds" : "Enable notification sounds"}
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  {soundEnabled ? "Sound On" : "Sound Off"}
                </Button>
                
                <Button
                  onClick={() => setIsMessageModalOpen(true)}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  New Message
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Tab Navigation */}
            <div className="flex items-center justify-between border-b">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'notifications'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Notifications
                  {((notificationCount as any)?.count || 0) > 0 && (
                    <Badge className="ml-2 bg-red-500 text-white">
                      {(notificationCount as any)?.count || 0}
                    </Badge>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('messages')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'messages'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Messages
                  {((messageCount as any)?.count || 0) > 0 && (
                    <Badge className="ml-2 bg-red-500 text-white">
                      {(messageCount as any)?.count || 0}
                    </Badge>
                  )}
                </button>
              </div>
              
              {/* Mark All as Read Button */}
              <div className="flex items-center gap-2">
                {activeTab === 'notifications' && ((notificationCount as any)?.count || 0) > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAllNotificationsRead.mutate()}
                    disabled={markAllNotificationsRead.isPending}
                    className="flex items-center gap-1 text-xs"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Mark All Read
                  </Button>
                )}
                {activeTab === 'messages' && ((messageCount as any)?.count || 0) > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAllMessagesRead.mutate()}
                    disabled={markAllMessagesRead.isPending}
                    className="flex items-center gap-1 text-xs"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Mark All Read
                  </Button>
                )}
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="h-96">
              {activeTab === 'notifications' && (
                <div className="space-y-3">
                  {((notifications as any) || []).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    ((notifications as any) || []).map((item: Notification) => (
                      <div
                        key={item.notification.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          !item.notification.isRead
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => !item.notification.isRead && markNotificationRead.mutate(item.notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${getNotificationColor(item.notification.type)}`}>
                            {getNotificationIcon(item.notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {item.notification.title}
                              </h4>
                              {!item.notification.isRead && (
                                <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {item.notification.message?.replace(/₹(\d+\.?\d*)/g, (match, amount) => `₹${Math.ceil(Number(amount))}`)}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-2">
                                {item.sender && (
                                  <>
                                    <User className="h-3 w-3" />
                                    <span>{getUserName(item.sender)}</span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {formatDistanceToNow(new Date(item.notification.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'messages' && (
                <div className="space-y-3">
                  {((messages as any) || []).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No messages yet</p>
                    </div>
                  ) : (
                    ((messages as any) || []).map((item: Message) => (
                      <div
                        key={item.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          !item.isRead
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          if (!item.isRead) {
                            markMessageRead.mutate(item.id);
                          }
                          setSelectedMessage(item);
                          setIsMessageDetailOpen(true);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                            <MessageSquare className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {item.subject}
                              </h4>
                              <div className="flex items-center gap-2">
                                <Badge className={getPriorityColor(item.priority)}>
                                  {item.priority}
                                </Badge>
                                {!item.isRead && (
                                  <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {item.message?.replace(/₹(\d+\.?\d*)/g, (match, amount) => `₹${Math.ceil(Number(amount))}`)}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3" />
                                <span>From: {item.senderName || item.senderEmail || 'Unknown'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Message Modal */}
      <Dialog open={isMessageModalOpen} onOpenChange={setIsMessageModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send New Message
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="recipient">Recipient</Label>
              <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {getRecipientOptions().map((recipient: any) => (
                    <SelectItem key={recipient.id} value={recipient.id}>
                      {getUserName(recipient)} ({recipient.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={messageForm.priority} 
                onValueChange={(value) => setMessageForm(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={messageForm.subject}
                onChange={(e) => setMessageForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter message subject"
              />
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={messageForm.message}
                onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Enter your message"
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsMessageModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendMessage} disabled={sendMessage.isPending}>
                <Send className="h-4 w-4 mr-2" />
                {sendMessage.isPending ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Detail Dialog */}
      <Dialog open={isMessageDetailOpen} onOpenChange={setIsMessageDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-lg">{selectedMessage.subject}</h4>
                <Badge className={getPriorityColor(selectedMessage.priority)}>
                  {selectedMessage.priority}
                </Badge>
              </div>
              
              <div className="text-sm text-gray-600">
                <p><span className="font-medium">From:</span> {selectedMessage.senderName || selectedMessage.senderEmail || 'Unknown'} ({selectedMessage.senderEmail})</p>
                <p><span className="font-medium">Date:</span> {new Date(selectedMessage.createdAt).toLocaleString()}</p>
              </div>
              
              <div className="border-t pt-4">
                <h5 className="font-medium mb-2">Message:</h5>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
              
              {selectedMessage.relatedTicketId && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Related Ticket ID:</span> {selectedMessage.relatedTicketId}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Hidden Audio Element for Notification Sound */}
      <audio
        ref={audioRef}
        preload="auto"
        style={{ display: 'none' }}
      >
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXbPl66hVFApGn+DyvmMZA" type="audio/wav" />
      </audio>
    </>
  );
}