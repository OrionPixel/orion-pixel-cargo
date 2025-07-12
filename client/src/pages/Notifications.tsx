import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserTheme } from '@/contexts/UserThemeContext';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Bell, 
  BellRing, 
  Check, 
  Truck, 
  Package, 
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle,
  Search,
  Settings,
  Filter,
  MoreVertical,
  Trash2,
  Archive
} from 'lucide-react';
interface Notification {
  id: number;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
  relatedId?: number;
  senderUserId?: string;
}

function Notifications() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const { themeSettings } = useUserTheme();
  const { user } = useAuth();

  const { data: notificationData = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/notifications'],
    staleTime: 30000,
    refetchInterval: false, // NO automatic polling - pure event-based
    enabled: !!user,
  });

  // Map the nested API response to flat notification objects - safely handle the data
  const notifications = Array.isArray(notificationData) ? notificationData.map(item => {
    if (item && item.notification) {
      return {
        ...item.notification,
        sender: item.sender
      };
    }
    return item; // fallback if data structure is different
  }) : [];

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });



  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete notification');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  const getNotificationIcon = (type: string) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case 'pickup_scheduled':
        return <Clock className={`${iconClass} text-primary`} />;
      case 'picked_up':
        return <Package className={`${iconClass} text-secondary`} />;
      case 'in_transit':
        return <Truck className={`${iconClass} text-primary`} />;
      case 'out_for_delivery':
        return <MapPin className={`${iconClass} text-accent`} />;
      case 'delivered':
        return <CheckCircle className={`${iconClass} text-green-600`} />;
      case 'delayed':
        return <AlertTriangle className={`${iconClass} text-yellow-600`} />;
      case 'exception':
        return <AlertTriangle className={`${iconClass} text-red-600`} />;
      default:
        return <Bell className={`${iconClass} text-gray-600`} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'delivered':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950';
      case 'delayed':
      case 'exception':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
      case 'in_transit':
      case 'out_for_delivery':
        return 'border-primary/20 bg-primary/10';
      default:
        return 'border-border bg-card';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const title = notification.title || '';
    const message = notification.message || '';
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (activeTab === 'unread') return !notification.isRead;
    if (activeTab === 'messages') return notification.type === 'message';
    if (activeTab === 'system') return notification.type !== 'message';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const totalCount = notifications.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with your shipment and system notifications
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Notifications</p>
                <p className="text-2xl font-bold text-primary">{totalCount}</p>
              </div>
              <Bell className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-secondary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold text-secondary">{unreadCount}</p>
              </div>
              <BellRing className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today</p>
                <p className="text-2xl font-bold text-accent">
                  {notifications.filter(n => 
                    n.createdAt && new Date(n.createdAt).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Messages</p>
                <p className="text-2xl font-bold text-green-600">
                  {notifications.filter(n => n.type === 'message').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border-primary/20">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-primary">
              <BellRing className="h-5 w-5" />
              All Notifications
              {unreadCount > 0 && (
                <Badge className="bg-primary text-primary-foreground">
                  {unreadCount} new
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              {unreadCount > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    notifications
                      .filter(n => !n.isRead)
                      .forEach(n => markAsReadMutation.mutate(n.id));
                  }}
                >
                  Mark all as read
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-border/50">
              <TabsList className="grid w-full grid-cols-4 bg-transparent h-auto rounded-none">
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                >
                  All ({totalCount})
                </TabsTrigger>
                <TabsTrigger 
                  value="unread"
                  className="data-[state=active]:bg-secondary/10 data-[state=active]:text-secondary"
                >
                  Unread ({unreadCount})
                </TabsTrigger>
                <TabsTrigger 
                  value="messages"
                  className="data-[state=active]:bg-accent/10 data-[state=active]:text-accent"
                >
                  Messages ({notifications.filter(n => n.type === 'message').length})
                </TabsTrigger>
                <TabsTrigger 
                  value="system"
                  className="data-[state=active]:bg-red-500/10 data-[state=active]:text-red-600"
                >
                  System ({notifications.filter(n => n.type !== 'message').length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              <ScrollArea className="h-[calc(100vh-400px)]">
                {isLoading ? (
                  <div className="space-y-3 p-4">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-muted rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredNotifications.length > 0 ? (
                  <div className="divide-y divide-border">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 transition-colors hover:bg-muted/50 ${
                          notification.isRead 
                            ? 'bg-background' 
                            : getNotificationColor(notification.type)
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h4 className={`text-sm font-medium ${
                                notification.isRead ? 'text-muted-foreground' : 'text-foreground'
                              }`}>
                                {notification.title}
                              </h4>
                              
                              <div className="flex items-center gap-2">
                                {!notification.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-primary hover:text-primary/80"
                                    onClick={() => markAsReadMutation.mutate(notification.id)}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                  onClick={() => deleteNotificationMutation.mutate(notification.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <p className={`text-sm mt-1 ${
                              notification.isRead ? 'text-muted-foreground' : 'text-foreground'
                            }`}>
                              {notification.message?.replace(/₹(\d+\.?\d*)/g, (_match: string, amount: string) => `₹${Math.ceil(Number(amount))}`)}
                            </p>
                            
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-xs text-muted-foreground">
                                {notification.createdAt ? new Date(notification.createdAt).toLocaleString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'Unknown date'}
                              </span>
                              
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline" 
                                  className="text-xs"
                                >
                                  {(notification.type || 'unknown').replace('_', ' ').toUpperCase()}
                                </Badge>
                                
                                {notification.senderUserId && (
                                  <Badge 
                                    variant="secondary" 
                                    className="text-xs bg-accent/10 text-accent"
                                  >
                                    From {notification.senderUserId === 'admin-001' ? 'Admin' : 'User'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No notifications found
                    </h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      {activeTab === 'unread' 
                        ? "You're all caught up! No unread notifications." 
                        : searchTerm
                        ? `No notifications match "${searchTerm}"`
                        : "Notifications will appear here when available"
                      }
                    </p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default Notifications;