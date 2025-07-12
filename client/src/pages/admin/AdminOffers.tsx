import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  Calendar, 
  Target, 
  Gift,
  MessageSquare,
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter
} from "lucide-react";

interface Offer {
  id: number;
  title: string;
  description: string;
  type: "discount" | "promotion" | "announcement" | "feature";
  status: "active" | "scheduled" | "expired" | "draft";
  targetAudience: "all" | "premium" | "trial" | "inactive";
  discountPercent?: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  createdAt: string;
  usageCount?: number;
  maxUsage?: number;
}

interface Message {
  id: number;
  title: string;
  content: string;
  type: "info" | "warning" | "success" | "urgent";
  targetUsers: "all" | "premium" | "trial" | "inactive";
  isRead: boolean;
  createdAt: string;
  sentBy: string;
}

export default function AdminOffers() {
  const [activeTab, setActiveTab] = useState<"offers" | "messages">("offers");
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch real announcements data from database
  const { data: announcements = [], isLoading: announcementsLoading } = useQuery({
    queryKey: ["/api/announcements"],
    enabled: !!user && user.role === 'admin',
    staleTime: 30000, // Cache for 30 seconds
    refetchInterval: false, // NO automatic polling - pure event-based
  });

  // Fetch real notifications/messages data from database
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: !!user && user.role === 'admin',
    staleTime: 30000, // Cache for 30 seconds
    refetchInterval: false, // NO automatic polling - pure event-based
  });

  // Convert announcements to offers format for consistency
  const realOffers: Offer[] = announcements.map(announcement => ({
    id: announcement.id,
    title: announcement.title,
    description: announcement.message,
    type: announcement.type === "info" ? "announcement" : announcement.type as "discount" | "promotion" | "announcement" | "feature",
    status: announcement.isActive ? "active" : "expired",
    targetAudience: announcement.targetAudience as "all" | "premium" | "trial" | "inactive",
    discountPercent: 0, // Announcements don't have discount
    validFrom: announcement.startDate,
    validTo: announcement.endDate,
    isActive: announcement.isActive,
    createdAt: announcement.createdAt,
    usageCount: 0,
    maxUsage: 0
  }));

  // Convert notifications to messages format
  const realMessages: Message[] = messages.map(notification => ({
    id: notification.id,
    title: notification.title,
    content: notification.message,
    type: notification.type || "info",
    targetUsers: "all", // Default for notifications
    isRead: notification.isRead || false,
    createdAt: notification.createdAt,
    sentBy: "System"
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 border-green-200";
      case "scheduled": return "bg-blue-100 text-blue-800 border-blue-200";
      case "expired": return "bg-red-100 text-red-800 border-red-200";
      case "draft": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "discount": return "bg-purple-100 text-purple-800 border-purple-200";
      case "promotion": return "bg-orange-100 text-orange-800 border-orange-200";
      case "feature": return "bg-blue-100 text-blue-800 border-blue-200";
      case "announcement": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case "info": return "bg-blue-100 text-blue-800 border-blue-200";
      case "warning": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "success": return "bg-green-100 text-green-800 border-green-200";
      case "urgent": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredOffers = realOffers.filter(offer => {
    const statusMatch = filterStatus === "all" || offer.status === filterStatus;
    const typeMatch = filterType === "all" || offer.type === filterType;
    return statusMatch && typeMatch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: `hsl(var(--primary))` }}>
            Announcement Manager
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage promotional offers and user communications
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 rounded-lg p-1" 
           style={{ backgroundColor: `hsl(var(--secondary) / 0.1)` }}>
        <button
          onClick={() => setActiveTab("offers")}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
            activeTab === "offers"
              ? "text-white shadow-md"
              : "text-muted-foreground hover:text-foreground"
          }`}
          style={activeTab === "offers" ? { 
            background: `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)`
          } : {}}
        >
          <Gift className="h-4 w-4 mr-2 inline" />
          Offers & Promotions
        </button>
        <button
          onClick={() => setActiveTab("messages")}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
            activeTab === "messages"
              ? "text-white shadow-md"
              : "text-muted-foreground hover:text-foreground"
          }`}
          style={activeTab === "messages" ? { 
            background: `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)`
          } : {}}
        >
          <MessageSquare className="h-4 w-4 mr-2 inline" />
          User Messages
        </button>
      </div>

      {/* Offers Tab */}
      {activeTab === "offers" && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="discount">Discount</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                  <SelectItem value="feature">Feature</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => setIsOfferModalOpen(true)}
              className="bg-gradient-to-r"
              style={{ 
                background: `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)`,
                color: 'white'
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Offer
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-2" style={{ borderColor: `hsl(var(--primary) / 0.2)` }}>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `hsl(var(--primary) / 0.1)` }}>
                    <Gift className="h-5 w-5" style={{ color: `hsl(var(--primary))` }} />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-muted-foreground">Active Offers</p>
                    <p className="text-2xl font-bold" style={{ color: `hsl(var(--primary))` }}>
                      {realOffers.filter(o => o.status === "active").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2" style={{ borderColor: `hsl(var(--secondary) / 0.3)` }}>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `hsl(var(--secondary) / 0.1)` }}>
                    <Target className="h-5 w-5" style={{ color: `hsl(var(--secondary))` }} />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-muted-foreground">Total Usage</p>
                    <p className="text-2xl font-bold" style={{ color: `hsl(var(--secondary))` }}>
                      {realOffers.reduce((sum, o) => sum + (o.usageCount || 0), 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2" style={{ borderColor: `hsl(var(--accent) / 0.3)` }}>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `hsl(var(--accent) / 0.1)` }}>
                    <Clock className="h-5 w-5" style={{ color: `hsl(var(--accent))` }} />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                    <p className="text-2xl font-bold" style={{ color: `hsl(var(--accent))` }}>
                      {realOffers.filter(o => o.status === "scheduled").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2" style={{ borderColor: `hsl(var(--primary) / 0.2)` }}>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `hsl(var(--primary) / 0.1)` }}>
                    <Users className="h-5 w-5" style={{ color: `hsl(var(--primary))` }} />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-muted-foreground">Avg Discount</p>
                    <p className="text-2xl font-bold" style={{ color: `hsl(var(--primary))` }}>
                      {realOffers.length > 0 ? Math.round(realOffers.reduce((sum, o) => sum + (o.discountPercent || 0), 0) / realOffers.length) : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Offers List */}
          <div className="grid gap-4">
            {filteredOffers.map((offer) => (
              <Card key={offer.id} className="border-2 hover:shadow-md transition-shadow"
                    style={{ borderColor: `hsl(var(--primary) / 0.1)` }}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">{offer.title}</h3>
                        <Badge className={getStatusColor(offer.status)}>
                          {offer.status}
                        </Badge>
                        <Badge className={getTypeColor(offer.type)}>
                          {offer.type}
                        </Badge>
                        {offer.discountPercent && (
                          <Badge style={{ 
                            backgroundColor: `hsl(var(--primary) / 0.1)`,
                            color: `hsl(var(--primary))`,
                            border: `1px solid hsl(var(--primary) / 0.2)`
                          }}>
                            {offer.discountPercent}% OFF
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-3">{offer.description}</p>
                      <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(offer.validFrom).toLocaleDateString()} - {new Date(offer.validTo).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {offer.targetAudience}
                        </div>
                        {offer.usageCount !== undefined && (
                          <div className="flex items-center">
                            <Target className="h-4 w-4 mr-1" />
                            {offer.usageCount}/{offer.maxUsage || '∞'} uses
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === "messages" && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">
                Total Messages: {realMessages.length}
              </div>
            </div>
            <Button
              onClick={() => setIsMessageModalOpen(true)}
              className="bg-gradient-to-r"
              style={{ 
                background: `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)`,
                color: 'white'
              }}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </div>

          {/* Messages List */}
          <div className="grid gap-4">
            {realMessages.map((message) => (
              <Card key={message.id} className="border-2 hover:shadow-md transition-shadow"
                    style={{ borderColor: `hsl(var(--primary) / 0.1)` }}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">{message.title}</h3>
                        <Badge className={getMessageTypeColor(message.type)}>
                          {message.type}
                        </Badge>
                        <Badge style={{ 
                          backgroundColor: `hsl(var(--secondary) / 0.1)`,
                          color: `hsl(var(--secondary))`,
                          border: `1px solid hsl(var(--secondary) / 0.2)`
                        }}>
                          {message.targetUsers}
                        </Badge>
                        {!message.isRead && (
                          <Badge className="bg-red-100 text-red-800 border-red-200">
                            Unread
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-3">{message.content}</p>
                      <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(message.createdAt).toLocaleDateString()} {new Date(message.createdAt).toLocaleTimeString()}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          Sent by: {message.sentBy}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}