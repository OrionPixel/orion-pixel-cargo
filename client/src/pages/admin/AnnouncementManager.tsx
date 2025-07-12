import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Calendar, 
  Target, 
  Megaphone,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  XCircle,
  Info,
  Upload,
  Image,
  X
} from "lucide-react";

interface Announcement {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AnnouncementManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch announcements
  const { data: announcementsData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['/api/announcements'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/announcements');
      const jsonData = await response.json();
      console.log('🔥 PARSED JSON DATA:', jsonData);
      return jsonData;
    },
    staleTime: 0, // Always refetch
    gcTime: 0, // Don't cache
  });

  // Ensure announcements is always an array
  let announcements: Announcement[] = [];
  try {
    if (Array.isArray(announcementsData)) {
      announcements = announcementsData;
    } else if (announcementsData && typeof announcementsData === 'object') {
      // Check if it's wrapped in another property
      announcements = (announcementsData as any).data || (announcementsData as any).announcements || [];
    }
  } catch (e) {
    console.error('Error parsing announcements data:', e);
    announcements = [];
  }
  
  // Debug log for announcement data
  console.log('🔧 ANNOUNCEMENT MANAGER DEBUG:', {
    announcementsData,
    announcementsArray: announcements,
    announcementsLength: announcements.length,
    isLoading,
    isError,
    error,
    rawResponse: JSON.stringify(announcementsData)
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/announcements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/announcements/active'] });
      toast({
        title: "Success",
        description: "Announcement deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete announcement",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest('PUT', `/api/announcements/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/announcements/active'] });
      toast({
        title: "Success",
        description: "Announcement updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update announcement",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusBadge = (announcement: Announcement) => {
    const now = new Date();
    const startDate = new Date(announcement.startDate);
    const endDate = new Date(announcement.endDate);

    if (!announcement.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }

    if (now < startDate) {
      return <Badge style={{ background: 'hsl(var(--accent))' }}>Scheduled</Badge>;
    }

    if (now > endDate) {
      return <Badge variant="destructive">Expired</Badge>;
    }

    return <Badge style={{ background: 'hsl(var(--primary))' }}>Active</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  // Filter announcements
  const filteredAnnouncements = announcements.filter((announcement: Announcement) => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         announcement.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || announcement.type === filterType;
    
    let matchesStatus = true;
    if (filterStatus !== "all") {
      const now = new Date();
      const startDate = new Date(announcement.startDate);
      const endDate = new Date(announcement.endDate);
      
      if (filterStatus === "active") {
        matchesStatus = announcement.isActive && now >= startDate && now <= endDate;
      } else if (filterStatus === "inactive") {
        matchesStatus = !announcement.isActive;
      } else if (filterStatus === "expired") {
        matchesStatus = now > endDate;
      } else if (filterStatus === "scheduled") {
        matchesStatus = now < startDate;
      }
    }

    return matchesSearch && matchesType && matchesStatus;
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcement Manager</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage site-wide announcements for your users
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => refetch()} 
            variant="outline"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Refresh"}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)`,
                  color: 'white'
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Announcement
              </Button>
            </DialogTrigger>
            <CreateAnnouncementPopup />
          </Dialog>
        </div>
      </div>

      {/* Edit Announcement Dialog */}
      <Dialog open={!!editingAnnouncement} onOpenChange={() => setEditingAnnouncement(null)}>
        <EditAnnouncementPopup 
          announcement={editingAnnouncement} 
          onClose={() => setEditingAnnouncement(null)} 
        />
      </Dialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2" style={{ borderColor: `hsl(var(--primary) / 0.2)` }}>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `hsl(var(--primary) / 0.1)` }}>
                <Megaphone className="h-6 w-6" style={{ color: `hsl(var(--primary))` }} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold" style={{ color: `hsl(var(--primary))` }}>
                  {announcements.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2" style={{ borderColor: `hsl(var(--primary) / 0.2)` }}>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `hsl(var(--primary) / 0.1)` }}>
                <CheckCircle className="h-6 w-6" style={{ color: `hsl(var(--primary))` }} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold" style={{ color: `hsl(var(--primary))` }}>
                  {announcements.filter((a: Announcement) => {
                    const now = new Date();
                    const startDate = new Date(a.startDate);
                    const endDate = new Date(a.endDate);
                    return a.isActive && now >= startDate && now <= endDate;
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2" style={{ borderColor: `hsl(var(--primary) / 0.2)` }}>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `hsl(var(--primary) / 0.1)` }}>
                <Clock className="h-6 w-6" style={{ color: `hsl(var(--primary))` }} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold" style={{ color: `hsl(var(--primary))` }}>
                  {announcements.filter((a: Announcement) => {
                    const now = new Date();
                    const startDate = new Date(a.startDate);
                    return now < startDate;
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2" style={{ borderColor: `hsl(var(--primary) / 0.2)` }}>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `hsl(var(--primary) / 0.1)` }}>
                <XCircle className="h-6 w-6" style={{ color: `hsl(var(--primary))` }} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold" style={{ color: `hsl(var(--primary))` }}>
                  {announcements.filter((a: Announcement) => {
                    const now = new Date();
                    const endDate = new Date(a.endDate);
                    return now > endDate;
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-2" style={{ borderColor: `hsl(var(--primary) / 0.1)` }}>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Announcements List */}
      {filteredAnnouncements.length === 0 ? (
        <Card className="border-2" style={{ borderColor: `hsl(var(--primary) / 0.1)` }}>
          <CardContent className="p-8 text-center">
            <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Announcements Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterType !== "all" || filterStatus !== "all" 
                ? "No announcements match your current filters."
                : "Create your first announcement to get started."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAnnouncements.map((announcement: Announcement) => (
            <Card key={announcement.id} className="border-2" style={{ borderColor: `hsl(var(--primary) / 0.1)` }}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getTypeIcon(announcement.type)}
                      <h3 className="text-lg font-semibold">{announcement.title}</h3>
                      {getStatusBadge(announcement)}
                      <Badge variant="outline">Priority {announcement.priority}</Badge>
                    </div>
                    
                    <p className="text-muted-foreground mb-3">{announcement.message}</p>
                    
                    {announcement.imageUrl && (
                      <img 
                        src={announcement.imageUrl} 
                        alt="Announcement" 
                        className="w-32 h-20 object-cover rounded-lg mb-3"
                      />
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(announcement.startDate).toLocaleDateString()} - {new Date(announcement.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Created {new Date(announcement.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingAnnouncement(announcement)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(announcement.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// CreateAnnouncementPopup Component
function CreateAnnouncementPopup() {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'error',
    priority: 1,
    isActive: true,
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16) // 7 days from now
  });
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Image handling functions
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image size should be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error", 
          description: "Please select a valid image file",
          variant: "destructive",
        });
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/upload/announcement-image', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const result = await response.json();
    console.log('📸 Image upload successful:', result);
    return result.imageUrl;
  };

  // Create announcement mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      let imageUrl = null;
      
      // Upload image if selected
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }
      
      return await apiRequest('POST', '/api/announcements', {
        ...data,
        startDate: data.startDate,
        endDate: data.endDate,
        imageUrl
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/announcements/active'] });
      
      // Reset form
      setFormData({
        title: '',
        message: '',
        type: 'info',
        priority: 1,
        isActive: true,
        startDate: '',
        endDate: ''
      });
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: "Success",
        description: "Announcement created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create announcement",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.message || !formData.startDate || !formData.endDate) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(formData);
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" style={{ color: `hsl(var(--primary))` }} />
          Create New Announcement
        </DialogTitle>
        <DialogDescription>
          Create a new announcement that will be displayed to users on the landing page.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter announcement title..."
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium">
              Message <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Enter announcement message..."
              rows={4}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-medium">Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: 'info' | 'warning' | 'success' | 'error') => 
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      Info
                    </div>
                  </SelectItem>
                  <SelectItem value="warning">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      Warning
                    </div>
                  </SelectItem>
                  <SelectItem value="success">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Success
                    </div>
                  </SelectItem>
                  <SelectItem value="error">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      Error
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-medium">Priority</Label>
              <Select 
                value={formData.priority.toString()} 
                onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">High (1)</SelectItem>
                  <SelectItem value="2">Medium (2)</SelectItem>
                  <SelectItem value="3">Low (3)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Announcement Image (Optional)</Label>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            {imagePreview ? (
              <div className="space-y-4">
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleImageRemove}
                    className="absolute top-2 right-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  {selectedImage?.name} ({Math.round((selectedImage?.size || 0) / 1024)} KB)
                </p>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Image className="h-4 w-4 mr-2" />
                    Choose Image
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-sm font-medium">
              Start Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="startDate"
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-sm font-medium">
              End Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label htmlFor="isActive" className="text-sm font-medium">
            Active (announcement will be displayed immediately)
          </Label>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Announcement
              </>
            )}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

// EditAnnouncementPopup Component
function EditAnnouncementPopup({ 
  announcement, 
  onClose 
}: { 
  announcement: Announcement | null;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'error',
    priority: 1,
    isActive: true,
    startDate: '',
    endDate: ''
  });
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form data when announcement changes
  React.useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title,
        message: announcement.message,
        type: announcement.type,
        priority: announcement.priority,
        isActive: announcement.isActive,
        startDate: new Date(announcement.startDate).toISOString().slice(0, 16),
        endDate: new Date(announcement.endDate).toISOString().slice(0, 16)
      });
      setImagePreview(announcement.imageUrl || null);
    }
  }, [announcement]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!announcement) return;
      
      const response = await apiRequest('PUT', `/api/announcements/${announcement.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      onClose();
      
      toast({
        title: "Success",
        description: "Announcement updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update announcement",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/upload/announcement-image', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const result = await response.json();
    console.log('📸 Image upload successful:', result);
    return result.imageUrl;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.message || !formData.startDate || !formData.endDate) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      let imageUrl = announcement?.imageUrl;
      
      if (selectedImage) {
        imageUrl = await handleImageUpload(selectedImage);
      }

      const submissionData = {
        ...formData,
        imageUrl,
        targetAudience: 'all',
        backgroundColor: '#8427d7',
        textColor: '#ffffff',
        showIcon: true
      };

      updateMutation.mutate(submissionData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    }
  };

  if (!announcement) return null;

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader className="space-y-3">
        <DialogTitle className="text-2xl font-bold">Edit Announcement</DialogTitle>
        <DialogDescription>
          Update your announcement details and settings.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="edit-title" className="text-sm font-medium">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-title"
              placeholder="Enter announcement title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-type" className="text-sm font-medium">Type</Label>
            <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="edit-message" className="text-sm font-medium">
            Message <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="edit-message"
            placeholder="Enter your announcement message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            rows={4}
          />
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <Label htmlFor="edit-priority" className="text-sm font-medium">Priority (1-5)</Label>
          <Input
            id="edit-priority"
            type="number"
            min="1"
            max="5"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
          />
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Announcement Image</Label>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {selectedImage ? 'Change Image' : 'Upload Image'}
              </Button>
              {imagePreview && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                  Remove
                </Button>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            
            {imagePreview && (
              <div className="relative w-40 h-24 border rounded-lg overflow-hidden">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="edit-startDate" className="text-sm font-medium">
              Start Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-startDate"
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-endDate" className="text-sm font-medium">
              End Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-endDate"
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id="edit-isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label htmlFor="edit-isActive" className="text-sm font-medium">
            Active (announcement will be displayed immediately)
          </Label>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Update Announcement
              </>
            )}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}