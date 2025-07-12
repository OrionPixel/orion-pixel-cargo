import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Calendar, 
  Edit3, 
  Save, 
  X, 
  Upload,
  Camera,
  Shield,
  Crown,
  CheckCircle,
  FileText,
  CreditCard,
  Globe,
  MessageSquare,
  Plus,
  Clock,
  AlertCircle,
  Trash2
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  officeName?: string;
  address?: string;
  gstNumber?: string;
  city?: string;
  state?: string;
  role: string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  createdAt: string;
  profileImageUrl?: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
}

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);

  // Fetch user profile - only if user is authenticated
  const { data: profile, isLoading } = useQuery({
    queryKey: ['/api/user/profile'],
    staleTime: 300000, // 5 minutes
    enabled: !!user, // Only run if user is authenticated
  });

  // Fetch support tickets - only if user is authenticated
  const { data: supportTickets } = useQuery({
    queryKey: ['/api/support-tickets'],
    staleTime: 60000, // 1 minute
    enabled: !!user, // Only run if user is authenticated
  });

  // Form state for editing
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    officeName: '',
    address: '',
    gstNumber: '',
    city: '',
    state: ''
  });

  // New ticket form state
  const [newTicket, setNewTicket] = useState({
    subject: '',
    message: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  });

  // Initialize form when profile data loads
  React.useEffect(() => {
    if (profile) {
      console.log('📝 Profile data loaded:', profile);
      const newFormData = {
        firstName: (profile as UserProfile)?.firstName || '',
        lastName: (profile as UserProfile)?.lastName || '',
        email: (profile as UserProfile)?.email || '',
        phone: (profile as UserProfile)?.phone || '',
        officeName: (profile as UserProfile)?.officeName || '',
        address: (profile as UserProfile)?.address || '',
        gstNumber: (profile as UserProfile)?.gstNumber || '',
        city: (profile as UserProfile)?.city || '',
        state: (profile as UserProfile)?.state || ''
      };
      console.log('📝 Setting form data:', newFormData);
      setEditForm(newFormData);
    }
  }, [profile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (formData: typeof editForm) => {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: async (updatedProfile) => {
      console.log('✅ Profile update successful:', updatedProfile);
      
      // Immediately update the React Query cache with fresh data
      queryClient.setQueryData(['/api/user/profile'], updatedProfile);
      
      // Update local form state immediately 
      setEditForm({
        firstName: updatedProfile.firstName || '',
        lastName: updatedProfile.lastName || '',
        email: updatedProfile.email || '',
        phone: updatedProfile.phone || '',
        officeName: updatedProfile.officeName || '',
        address: updatedProfile.address || '',
        gstNumber: updatedProfile.gstNumber || '',
        city: updatedProfile.city || '',
        state: updatedProfile.state || ''
      });
      
      // Invalidate queries to ensure fresh data on next fetch
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Upload profile image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('profileImage', file);
      
      const response = await fetch('/api/user/profile/image', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload image');
      }
      
      return response.json();
    },
    onSuccess: async (data) => {
      console.log('✅ Profile image update successful:', data);
      
      // Fetch updated profile data from server
      const updatedProfile = await queryClient.fetchQuery({
        queryKey: ['/api/user/profile'],
        queryFn: () => fetch('/api/user/profile').then(res => res.json()),
        staleTime: 0
      });
      
      console.log('🔄 Updated profile with new image:', updatedProfile);
      
      // Update React Query cache immediately
      queryClient.setQueryData(['/api/user/profile'], updatedProfile);
      
      setProfileImageFile(null);
      setProfileImagePreview(null);
      toast({
        title: "Image Updated",
        description: "Your profile image has been updated successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed", 
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Create support ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: typeof newTicket) => {
      const response = await fetch('/api/support-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create ticket');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support-tickets'] });
      setNewTicket({ subject: '', message: '', priority: 'medium' });
      setShowNewTicketForm(false);
      toast({
        title: "Ticket Created",
        description: "Your support ticket has been submitted successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Ticket",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form to original values
      setEditForm({
        firstName: (profile as UserProfile)?.firstName || '',
        lastName: (profile as UserProfile)?.lastName || '',
        email: (profile as UserProfile)?.email || '',
        phone: (profile as UserProfile)?.phone || '',
        officeName: (profile as UserProfile)?.officeName || '',
        address: (profile as UserProfile)?.address || '',
        gstNumber: (profile as UserProfile)?.gstNumber || '',
        city: (profile as UserProfile)?.city || '',
        state: (profile as UserProfile)?.state || ''
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    console.log('💾 Attempting to save form data:', editForm);
    updateProfileMutation.mutate(editForm);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = () => {
    if (profileImageFile) {
      uploadImageMutation.mutate(profileImageFile);
    }
  };

  const handleCreateTicket = () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both subject and message fields.",
        variant: "destructive",
      });
      return;
    }
    createTicketMutation.mutate(newTicket);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />;
      case 'office': return <Shield className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'office': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'transporter': return 'bg-green-100 text-green-800 border-green-200';
      case 'distributor': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'warehouse': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'trial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'starter': return 'bg-green-100 text-green-800 border-green-200';
      case 'professional': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'enterprise': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTicketStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-white rounded-lg w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <div className="h-96 bg-white rounded-xl shadow-sm"></div>
              </div>
              <div className="lg:col-span-3">
                <div className="h-96 bg-white rounded-xl shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Professional Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar className="w-20 h-20 border-4 border-white shadow-lg ring-2 ring-gray-100">
                  <AvatarImage 
                    src={profileImagePreview || (profile as UserProfile)?.profileImageUrl} 
                    alt="Profile" 
                  />
                  <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    {(profile as UserProfile)?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {/* Professional Camera Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 bg-black/40 rounded-full">
                  <label className="cursor-pointer text-white p-2">
                    <Camera className="h-5 w-5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {(profile as UserProfile)?.firstName && (profile as UserProfile)?.lastName 
                    ? `${(profile as UserProfile)?.firstName} ${(profile as UserProfile)?.lastName}`
                    : (profile as UserProfile)?.officeName || (profile as UserProfile)?.email?.split('@')[0]
                  }
                </h1>
                <p className="text-gray-600">{(profile as UserProfile)?.email}</p>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    {getRoleIcon((profile as UserProfile)?.role || '')}
                    <Badge className={getRoleColor((profile as UserProfile)?.role || '')}>
                      {(profile as UserProfile)?.role?.charAt(0).toUpperCase() + (profile as UserProfile)?.role?.slice(1)}
                    </Badge>
                  </div>
                  <Badge className={getPlanColor((profile as UserProfile)?.subscriptionPlan || 'trial')}>
                    {((profile as UserProfile)?.subscriptionPlan?.charAt(0)?.toUpperCase() ?? '') + ((profile as UserProfile)?.subscriptionPlan?.slice(1) ?? '') || 'Trial'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {profileImagePreview && (
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleImageUpload}
                    disabled={uploadImageMutation.isPending}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadImageMutation.isPending ? 'Uploading...' : 'Update Photo'}
                  </Button>
                  <Button 
                    onClick={() => {
                      setProfileImageFile(null);
                      setProfileImagePreview(null);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              )}
              
              <Button
                onClick={handleEditToggle}
                variant={isEditing ? "destructive" : "default"}
                className={!isEditing ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                {isEditing ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar with Account Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Account Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Member Since</p>
                    <p className="text-sm text-gray-600">
                      {(profile as UserProfile)?.createdAt ? new Date((profile as UserProfile).createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Status</p>
                    <p className="text-sm text-green-600 font-medium">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardContent className="p-0">
                <Tabs defaultValue="personal" className="w-full">
                  <div className="border-b border-gray-200 px-6 pt-6">
                    <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
                      <TabsTrigger 
                        value="personal" 
                        className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Personal Info
                      </TabsTrigger>
                      <TabsTrigger 
                        value="company"
                        className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                      >
                        <Building className="h-4 w-4 mr-2" />
                        Company Info
                      </TabsTrigger>
                      <TabsTrigger 
                        value="support"
                        className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Support Tickets
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="p-6">
                    <TabsContent value="personal" className="space-y-6 mt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                            First Name
                          </Label>
                          {isEditing ? (
                            <Input
                              id="firstName"
                              type="text"
                              value={editForm.firstName}
                              onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                              className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Enter your first name"
                            />
                          ) : (
                            <div className="h-11 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md flex items-center text-gray-900">
                              <User className="h-4 w-4 mr-2 text-gray-400" />
                              {(profile as UserProfile)?.firstName || 'Not provided'}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                            Last Name
                          </Label>
                          {isEditing ? (
                            <Input
                              id="lastName"
                              type="text"
                              value={editForm.lastName}
                              onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                              className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Enter your last name"
                            />
                          ) : (
                            <div className="h-11 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md flex items-center text-gray-900">
                              <User className="h-4 w-4 mr-2 text-gray-400" />
                              {(profile as UserProfile)?.lastName || 'Not provided'}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                            Email Address
                          </Label>
                          {isEditing ? (
                            <Input
                              id="email"
                              type="email"
                              value={editForm.email}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Enter your email"
                            />
                          ) : (
                            <div className="h-11 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md flex items-center text-gray-900">
                              <Mail className="h-4 w-4 mr-2 text-gray-400" />
                              {(profile as UserProfile)?.email}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mobile" className="text-sm font-medium text-gray-700">
                            Mobile Number
                          </Label>
                          {isEditing ? (
                            <Input
                              id="mobile"
                              type="tel"
                              value={editForm.phone}
                              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                              className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Enter mobile number"
                            />
                          ) : (
                            <div className="h-11 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md flex items-center text-gray-900">
                              <Phone className="h-4 w-4 mr-2 text-gray-400" />
                              {(profile as UserProfile)?.phone || 'Not provided'}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                            Address
                          </Label>
                          {isEditing ? (
                            <Textarea
                              id="address"
                              value={editForm.address}
                              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[80px]"
                              placeholder="Enter your complete address"
                            />
                          ) : (
                            <div className="min-h-[80px] px-3 py-2 bg-gray-50 border border-gray-200 rounded-md flex items-start text-gray-900">
                              <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-1 flex-shrink-0" />
                              <span>{(profile as UserProfile)?.address || 'Not provided'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="company" className="space-y-6 mt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="company" className="text-sm font-medium text-gray-700">
                            Company Name
                          </Label>
                          {isEditing ? (
                            <Input
                              id="company"
                              value={editForm.officeName}
                              onChange={(e) => setEditForm({ ...editForm, officeName: e.target.value })}
                              className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Enter company name"
                            />
                          ) : (
                            <div className="h-11 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md flex items-center text-gray-900">
                              <Building className="h-4 w-4 mr-2 text-gray-400" />
                              {(profile as UserProfile)?.officeName || 'Not provided'}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="gst" className="text-sm font-medium text-gray-700">
                            GST Number
                          </Label>
                          {isEditing ? (
                            <Input
                              id="gst"
                              value={editForm.gstNumber}
                              onChange={(e) => setEditForm({ ...editForm, gstNumber: e.target.value })}
                              className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Enter GST number"
                            />
                          ) : (
                            <div className="h-11 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md flex items-center text-gray-900">
                              <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
                              {(profile as UserProfile)?.gstNumber || 'Not provided'}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                            City
                          </Label>
                          {isEditing ? (
                            <Input
                              id="city"
                              value={editForm.city}
                              onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                              className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Enter city"
                            />
                          ) : (
                            <div className="h-11 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md flex items-center text-gray-900">
                              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                              {(profile as UserProfile)?.city || 'Not provided'}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="state" className="text-sm font-medium text-gray-700">
                            State
                          </Label>
                          {isEditing ? (
                            <Input
                              id="state"
                              value={editForm.state}
                              onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                              className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Enter state"
                            />
                          ) : (
                            <div className="h-11 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md flex items-center text-gray-900">
                              <Globe className="h-4 w-4 mr-2 text-gray-400" />
                              {(profile as UserProfile)?.state || 'Not provided'}
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="support" className="space-y-6 mt-0">
                      <div className="space-y-6">
                        {/* Create New Ticket */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Create Support Ticket</h3>
                            <Button
                              onClick={() => setShowNewTicketForm(!showNewTicketForm)}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              New Ticket
                            </Button>
                          </div>

                          {showNewTicketForm && (
                            <div className="space-y-4 bg-white rounded-lg p-4 border border-blue-200">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
                                    Subject
                                  </Label>
                                  <Input
                                    id="subject"
                                    value={newTicket.subject}
                                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="Brief description of the issue"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
                                    Priority
                                  </Label>
                                  <select
                                    value={newTicket.priority}
                                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as any })}
                                    className="h-11 w-full px-3 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                                  >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                  </select>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                                  Message
                                </Label>
                                <Textarea
                                  id="message"
                                  value={newTicket.message}
                                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
                                  placeholder="Please describe your issue in detail..."
                                />
                              </div>

                              <div className="flex justify-end space-x-3">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setShowNewTicketForm(false);
                                    setNewTicket({ subject: '', message: '', priority: 'medium' });
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleCreateTicket}
                                  disabled={createTicketMutation.isPending}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  {createTicketMutation.isPending ? 'Creating...' : 'Create Ticket'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Existing Tickets */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900">Your Support Tickets</h3>
                          {supportTickets && (supportTickets as SupportTicket[]).length > 0 ? (
                            <div className="space-y-3">
                              {(supportTickets as SupportTicket[]).map((ticket) => (
                                <div key={ticket.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                  <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                      <div className="flex items-center space-x-3">
                                        <h4 className="font-medium text-gray-900">{ticket.subject}</h4>
                                        <Badge className={getTicketStatusColor(ticket.status)}>
                                          {ticket.status.replace('_', ' ')}
                                        </Badge>
                                        <Badge className={getPriorityColor(ticket.priority)}>
                                          {ticket.priority}
                                        </Badge>
                                      </div>
                                      <p className="text-gray-600 text-sm line-clamp-2">{ticket.message}</p>
                                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                                        <div className="flex items-center space-x-1">
                                          <Clock className="h-3 w-3" />
                                          <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                          <FileText className="h-3 w-3" />
                                          <span>Updated {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                              <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No Support Tickets</h3>
                              <p className="text-gray-600 mb-4">You haven't created any support tickets yet.</p>
                              <Button
                                onClick={() => setShowNewTicketForm(true)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Create Your First Ticket
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    {isEditing && (
                      <>
                        <Separator className="my-6" />
                        <div className="flex justify-end space-x-4">
                          <Button
                            variant="outline"
                            onClick={handleEditToggle}
                            className="px-6"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSave}
                            disabled={updateProfileMutation.isPending}
                            className="px-6 bg-blue-600 hover:bg-blue-700"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}