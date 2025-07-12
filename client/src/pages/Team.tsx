import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useUserTheme } from "@/contexts/UserThemeContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Shield,
  UserCheck,
  Settings,
  Edit3,
  Trash2,
  Building2,
  Star,
  Award,
  Target,
  Clock,
  MessageSquare
} from "lucide-react";

export default function Team() {
  const userTheme = useUserTheme();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("members");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    location: "",
    salary: "",
    notes: ""
  });
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    department: "",
    permissions: [] as string[],
    salary_range: "",
    level: ""
  });

  const [teamMembers, setTeamMembers] = useState([
    {
      id: 1,
      name: "Rajesh Kumar",
      email: "rajesh@logigofast.com",
      phone: "+91 98765 43210",
      role: "Operations Manager",
      department: "Operations",
      location: "Mumbai",
      joinDate: "2023-01-15",
      status: "active",
      avatar: "RK",
      salary: "₹75,000",
      performance: "95%",
      tasks: 24,
      rating: 4.8
    },
    {
      id: 2,
      name: "Priya Sharma",
      email: "priya@logigofast.com",
      phone: "+91 98765 43211",
      role: "Fleet Coordinator",
      department: "Fleet Management",
      location: "Delhi",
      joinDate: "2023-03-20",
      status: "active",
      avatar: "PS",
      salary: "₹68,000",
      performance: "92%",
      tasks: 18,
      rating: 4.6
    },
    {
      id: 3,
      name: "Amit Singh",
      email: "amit@logigofast.com",
      phone: "+91 98765 43212",
      role: "Warehouse Supervisor",
      department: "Warehouse",
      location: "Bangalore",
      joinDate: "2023-02-10",
      status: "active",
      avatar: "AS",
      salary: "₹55,000",
      performance: "88%",
      tasks: 32,
      rating: 4.4
    },
    {
      id: 4,
      name: "Sneha Patel",
      email: "sneha@logigofast.com",
      phone: "+91 98765 43213",
      role: "Customer Support Lead",
      department: "Customer Service",
      location: "Pune",
      joinDate: "2023-04-05",
      status: "active",
      avatar: "SP",
      salary: "₹52,000",
      performance: "96%",
      tasks: 28,
      rating: 4.9
    },
    {
      id: 5,
      name: "Vikash Gupta",
      email: "vikash@logigofast.com",
      phone: "+91 98765 43214",
      role: "Driver",
      department: "Transportation",
      location: "Hyderabad",
      joinDate: "2023-05-12",
      status: "active",
      avatar: "VG",
      salary: "₹35,000",
      performance: "90%",
      tasks: 45,
      rating: 4.3
    },
    {
      id: 6,
      name: "Kavita Joshi",
      email: "kavita@logigofast.com",
      phone: "+91 98765 43215",
      role: "Accounts Manager",
      department: "Finance",
      location: "Chennai",
      joinDate: "2023-06-18",
      status: "active",
      avatar: "KJ",
      salary: "₹62,000",
      performance: "94%",
      tasks: 15,
      rating: 4.7
    }
  ]);

  const departments = ["All", "Operations", "Fleet Management", "Warehouse", "Customer Service", "Transportation", "Finance"];
  const [selectedDepartment, setSelectedDepartment] = useState("All");

  // Available roles/positions in the company
  const [companyRoles, setCompanyRoles] = useState([
    {
      id: 1,
      name: "Operations Manager",
      description: "Oversees daily operations and fleet management",
      department: "Operations",
      permissions: ["view_all_bookings", "manage_fleet", "view_reports", "manage_team"],
      salary_range: "₹60,000 - ₹80,000",
      level: "Senior"
    },
    {
      id: 2,
      name: "Fleet Coordinator",
      description: "Coordinates vehicle assignments and maintenance",
      department: "Fleet Management",
      permissions: ["view_bookings", "manage_vehicles", "view_gps"],
      salary_range: "₹45,000 - ₹65,000",
      level: "Mid"
    },
    {
      id: 3,
      name: "Warehouse Supervisor",
      description: "Manages warehouse operations and inventory",
      department: "Warehouse",
      permissions: ["manage_warehouse", "view_inventory", "manage_loading"],
      salary_range: "₹40,000 - ₹60,000",
      level: "Mid"
    },
    {
      id: 4,
      name: "Customer Support Lead",
      description: "Handles customer queries and complaints",
      department: "Customer Service",
      permissions: ["view_customers", "manage_support", "view_bookings"],
      salary_range: "₹35,000 - ₹55,000",
      level: "Mid"
    },
    {
      id: 5,
      name: "Driver",
      description: "Responsible for safe transportation of goods",
      department: "Transportation",
      permissions: ["view_assigned_trips", "update_status", "view_route"],
      salary_range: "₹25,000 - ₹40,000",
      level: "Junior"
    },
    {
      id: 6,
      name: "Accounts Manager",
      description: "Manages financial transactions and billing",
      department: "Finance",
      permissions: ["view_financials", "manage_payments", "generate_reports"],
      salary_range: "₹50,000 - ₹70,000",
      level: "Senior"
    }
  ]);

  // Available permissions
  const availablePermissions = [
    "view_all_bookings", "view_bookings", "manage_bookings", "view_customers", "manage_customers",
    "view_fleet", "manage_fleet", "manage_vehicles", "view_gps", "manage_warehouse", 
    "view_inventory", "manage_loading", "view_financials", "manage_payments", 
    "generate_reports", "view_reports", "manage_team", "manage_support", 
    "view_assigned_trips", "update_status", "view_route"
  ];

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === "All" || member.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return `bg-primary/10 text-primary border-primary/20`;
      case 'inactive': return `bg-red-50 text-red-600 border-red-200`;
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const handleAddMember = () => {
    if (!newMember.name || !newMember.email || !newMember.role) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const newId = Math.max(...teamMembers.map(m => m.id)) + 1;
    const memberToAdd = {
      ...newMember,
      id: newId,
      avatar: newMember.name.split(' ').map(n => n[0]).join('').toUpperCase(),
      joinDate: new Date().toISOString().split('T')[0],
      status: "active",
      performance: "85%",
      tasks: 0,
      rating: 4.0
    };

    setTeamMembers([...teamMembers, memberToAdd]);
    setNewMember({
      name: "",
      email: "",
      phone: "",
      role: "",
      department: "",
      location: "",
      salary: "",
      notes: ""
    });
    setIsAddModalOpen(false);
    
    toast({
      title: "Team Member Added",
      description: `${newMember.name} has been added to the team successfully`
    });
  };

  const handleEditMember = () => {
    if (!selectedMember) return;

    setTeamMembers(teamMembers.map(member => 
      member.id === selectedMember.id ? selectedMember : member
    ));
    setIsEditModalOpen(false);
    setSelectedMember(null);
    
    toast({
      title: "Member Updated",
      description: "Team member information has been updated successfully"
    });
  };

  const handleDeleteMember = (id: number) => {
    setTeamMembers(teamMembers.filter(member => member.id !== id));
    toast({
      title: "Member Removed",
      description: "Team member has been removed from the team"
    });
  };

  const sendMessage = (member: any) => {
    toast({
      title: "Message Sent",
      description: `Message sent to ${member.name} at ${member.email}`
    });
  };

  const handleAddRole = () => {
    if (!newRole.name || !newRole.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in role name and description",
        variant: "destructive"
      });
      return;
    }

    const newId = Math.max(...companyRoles.map(r => r.id)) + 1;
    const roleToAdd = {
      ...newRole,
      id: newId
    };

    setCompanyRoles([...companyRoles, roleToAdd]);
    setNewRole({
      name: "",
      description: "",
      department: "",
      permissions: [],
      salary_range: "",
      level: ""
    });
    setIsRoleModalOpen(false);
    
    toast({
      title: "Role Created",
      description: `${newRole.name} role has been created successfully`
    });
  };

  const handleEditRole = () => {
    if (!selectedRole) return;

    setCompanyRoles(companyRoles.map(role => 
      role.id === selectedRole.id ? selectedRole : role
    ));
    setIsEditRoleModalOpen(false);
    setSelectedRole(null);
    
    toast({
      title: "Role Updated",
      description: "Role information has been updated successfully"
    });
  };

  const handleDeleteRole = (id: number) => {
    // Check if any team member has this role
    const roleInUse = teamMembers.some(member => 
      companyRoles.find(role => role.id === id)?.name === member.role
    );
    
    if (roleInUse) {
      toast({
        title: "Cannot Delete Role",
        description: "This role is currently assigned to team members",
        variant: "destructive"
      });
      return;
    }

    setCompanyRoles(companyRoles.filter(role => role.id !== id));
    toast({
      title: "Role Deleted",
      description: "Role has been removed successfully"
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Team Management</h1>
                  <p className="text-sm text-muted-foreground">Manage your team members and their performance</p>
                </div>
              </div>
            </div>
            
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team Member
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Team Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={newMember.name}
                      onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newMember.email}
                      onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={newMember.phone}
                      onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role *</Label>
                    <Select value={newMember.role} onValueChange={(value) => setNewMember({...newMember, role: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Operations Manager">Operations Manager</SelectItem>
                        <SelectItem value="Fleet Coordinator">Fleet Coordinator</SelectItem>
                        <SelectItem value="Warehouse Supervisor">Warehouse Supervisor</SelectItem>
                        <SelectItem value="Customer Support Lead">Customer Support Lead</SelectItem>
                        <SelectItem value="Driver">Driver</SelectItem>
                        <SelectItem value="Accounts Manager">Accounts Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Select value={newMember.department} onValueChange={(value) => setNewMember({...newMember, department: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Operations">Operations</SelectItem>
                        <SelectItem value="Fleet Management">Fleet Management</SelectItem>
                        <SelectItem value="Warehouse">Warehouse</SelectItem>
                        <SelectItem value="Customer Service">Customer Service</SelectItem>
                        <SelectItem value="Transportation">Transportation</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newMember.location}
                      onChange={(e) => setNewMember({...newMember, location: e.target.value})}
                      placeholder="Enter location"
                    />
                  </div>
                  <div>
                    <Label htmlFor="salary">Salary</Label>
                    <Input
                      id="salary"
                      value={newMember.salary}
                      onChange={(e) => setNewMember({...newMember, salary: e.target.value})}
                      placeholder="Enter salary (e.g., ₹50,000)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newMember.notes}
                      onChange={(e) => setNewMember({...newMember, notes: e.target.value})}
                      placeholder="Additional notes..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddMember} className="flex-1">
                      Add Member
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Tabs Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 tabs-list-fix">
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Members
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Role Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            {/* Filters */}
        <Card className="bg-white border-2 border-primary/10 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search team members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 border-primary/20 focus:border-primary focus:ring-primary/20"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {departments.map((dept) => (
                  <Button
                    key={dept}
                    variant={selectedDepartment === dept ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDepartment(dept)}
                    className={`h-8 ${
                      selectedDepartment === dept 
                        ? 'bg-primary text-primary-foreground shadow-md' 
                        : 'border-primary/20 text-primary hover:bg-primary/10'
                    }`}
                  >
                    {dept}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="group hover:shadow-xl transition-all duration-300 bg-white cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                  <p className="text-3xl font-bold text-foreground">{teamMembers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 bg-white cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                  <UserCheck className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Members</p>
                  <p className="text-3xl font-bold text-foreground">{teamMembers.filter(m => m.status === 'active').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 bg-white cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Building2 className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Departments</p>
                  <p className="text-3xl font-bold text-foreground">{departments.length - 1}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 bg-white cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                  <p className="text-3xl font-bold text-foreground">
                    {teamMembers.length > 0 ? (teamMembers.reduce((acc, m) => acc + m.rating, 0) / teamMembers.length).toFixed(1) : '0.0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <Card key={member.id} className="group hover:shadow-2xl transition-all duration-300 border-2 border-primary/10 hover:border-primary/30">
              <CardContent className="p-6 bg-[#ffffff]">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                        {member.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-foreground text-lg">{member.name}</h3>
                      <p className="text-sm text-muted-foreground font-medium">{member.role}</p>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(member.status)} text-xs font-medium border`}>
                    {member.status}
                  </Badge>
                </div>

                {/* Performance Metrics */}
                <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">Performance:</span>
                      <span className="font-bold text-foreground">{member.performance}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-secondary" />
                      <span className="text-muted-foreground">Tasks:</span>
                      <span className="font-bold text-foreground">{member.tasks}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-accent" />
                      <span className="text-muted-foreground">Rating:</span>
                      <span className="font-bold text-foreground">{member.rating}/5.0</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">Salary:</span>
                      <span className="font-bold text-foreground">{member.salary}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Phone className="h-4 w-4 text-secondary" />
                    <span>{member.phone}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-accent" />
                    <span>{member.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>Joined {new Date(member.joinDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <Badge variant="outline" className="text-xs font-medium border-primary/30 text-primary">
                    {member.department}
                  </Badge>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                    onClick={() => {
                      setSelectedMember(member);
                      setIsEditModalOpen(true);
                    }}
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-secondary/30 text-secondary hover:bg-secondary hover:text-secondary-foreground"
                    onClick={() => sendMessage(member)}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteMember(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Member Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
            </DialogHeader>
            {selectedMember && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedMember.name}
                    onChange={(e) => setSelectedMember({...selectedMember, name: e.target.value})}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email Address</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={selectedMember.email}
                    onChange={(e) => setSelectedMember({...selectedMember, email: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone Number</Label>
                  <Input
                    id="edit-phone"
                    value={selectedMember.phone}
                    onChange={(e) => setSelectedMember({...selectedMember, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-role">Role</Label>
                  <Select value={selectedMember.role} onValueChange={(value) => setSelectedMember({...selectedMember, role: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Operations Manager">Operations Manager</SelectItem>
                      <SelectItem value="Fleet Coordinator">Fleet Coordinator</SelectItem>
                      <SelectItem value="Warehouse Supervisor">Warehouse Supervisor</SelectItem>
                      <SelectItem value="Customer Support Lead">Customer Support Lead</SelectItem>
                      <SelectItem value="Driver">Driver</SelectItem>
                      <SelectItem value="Accounts Manager">Accounts Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    value={selectedMember.location}
                    onChange={(e) => setSelectedMember({...selectedMember, location: e.target.value})}
                    placeholder="Enter location"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-salary">Salary</Label>
                  <Input
                    id="edit-salary"
                    value={selectedMember.salary}
                    onChange={(e) => setSelectedMember({...selectedMember, salary: e.target.value})}
                    placeholder="Enter salary"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleEditMember} className="flex-1">
                    Update Member
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {filteredMembers.length === 0 && (
          <Card className="border-2 border-dashed border-primary/20">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No team members found</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                {searchTerm || selectedDepartment !== "All" 
                  ? "Try adjusting your search or filter criteria to find team members."
                  : "Get started by adding your first team member to begin managing your workforce."
                }
              </p>
              {!searchTerm && selectedDepartment === "All" && (
                <Button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Team Member
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Filter Results Summary */}
        {filteredMembers.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {filteredMembers.length} of {teamMembers.length} team members
              {selectedDepartment !== "All" && ` in ${selectedDepartment}`}
              {searchTerm && ` matching "${searchTerm}"`}
            </span>
            {(searchTerm || selectedDepartment !== "All") && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedDepartment("All");
                }}
                className="text-primary hover:text-primary/80"
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
          </TabsContent>

          <TabsContent value="roles" className="space-y-6">
            {/* Role Management Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-foreground">Role Management</h2>
                <p className="text-sm text-muted-foreground">Create and manage company roles and permissions</p>
              </div>
              <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Role
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Role</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="role-name">Role Name *</Label>
                        <Input
                          id="role-name"
                          value={newRole.name}
                          onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                          placeholder="Enter role name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="role-level">Level</Label>
                        <Select value={newRole.level} onValueChange={(value) => setNewRole({...newRole, level: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Junior">Junior</SelectItem>
                            <SelectItem value="Mid">Mid</SelectItem>
                            <SelectItem value="Senior">Senior</SelectItem>
                            <SelectItem value="Lead">Lead</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="role-description">Description *</Label>
                      <Textarea
                        id="role-description"
                        value={newRole.description}
                        onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                        placeholder="Describe the role responsibilities"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="role-department">Department</Label>
                        <Select value={newRole.department} onValueChange={(value) => setNewRole({...newRole, department: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Operations">Operations</SelectItem>
                            <SelectItem value="Fleet Management">Fleet Management</SelectItem>
                            <SelectItem value="Warehouse">Warehouse</SelectItem>
                            <SelectItem value="Customer Service">Customer Service</SelectItem>
                            <SelectItem value="Transportation">Transportation</SelectItem>
                            <SelectItem value="Finance">Finance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="role-salary">Salary Range</Label>
                        <Input
                          id="role-salary"
                          value={newRole.salary_range}
                          onChange={(e) => setNewRole({...newRole, salary_range: e.target.value})}
                          placeholder="e.g., ₹30,000 - ₹50,000"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Permissions</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                        {availablePermissions.map((permission) => (
                          <div key={permission} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission}
                              checked={newRole.permissions.includes(permission)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewRole({
                                    ...newRole,
                                    permissions: [...newRole.permissions, permission]
                                  });
                                } else {
                                  setNewRole({
                                    ...newRole,
                                    permissions: newRole.permissions.filter(p => p !== permission)
                                  });
                                }
                              }}
                            />
                            <Label htmlFor={permission} className="text-sm capitalize">
                              {permission.replace(/_/g, ' ')}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsRoleModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddRole} className="bg-primary hover:bg-primary/90">
                        Create Role
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companyRoles.map((role) => (
                <Card key={role.id} className="group hover:shadow-xl transition-all duration-300 border-2 border-primary/10 hover:border-primary/30">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                          <Shield className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground text-lg">{role.name}</h3>
                          <p className="text-sm text-muted-foreground">{role.department}</p>
                        </div>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        {role.level}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">{role.description}</p>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Permissions: {role.permissions.length}</span>
                      </div>
                      {role.salary_range && (
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-secondary" />
                          <span className="text-sm">{role.salary_range}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRole(role);
                            setIsEditRoleModalOpen(true);
                          }}
                          className="text-primary hover:bg-primary/10"
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteRole(role.id)}
                          className="text-red-600 hover:bg-red-50 hover:border-red-200"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {teamMembers.filter(member => member.role === role.name).length} assigned
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Edit Role Modal */}
            <Dialog open={isEditRoleModalOpen} onOpenChange={setIsEditRoleModalOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Role</DialogTitle>
                </DialogHeader>
                {selectedRole && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-role-name">Role Name *</Label>
                        <Input
                          id="edit-role-name"
                          value={selectedRole.name}
                          onChange={(e) => setSelectedRole({...selectedRole, name: e.target.value})}
                          placeholder="Enter role name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-role-level">Level</Label>
                        <Select 
                          value={selectedRole.level} 
                          onValueChange={(value) => setSelectedRole({...selectedRole, level: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Junior">Junior</SelectItem>
                            <SelectItem value="Mid">Mid</SelectItem>
                            <SelectItem value="Senior">Senior</SelectItem>
                            <SelectItem value="Lead">Lead</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="edit-role-description">Description *</Label>
                      <Textarea
                        id="edit-role-description"
                        value={selectedRole.description}
                        onChange={(e) => setSelectedRole({...selectedRole, description: e.target.value})}
                        placeholder="Describe the role responsibilities"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-role-department">Department</Label>
                        <Select 
                          value={selectedRole.department} 
                          onValueChange={(value) => setSelectedRole({...selectedRole, department: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Operations">Operations</SelectItem>
                            <SelectItem value="Fleet Management">Fleet Management</SelectItem>
                            <SelectItem value="Warehouse">Warehouse</SelectItem>
                            <SelectItem value="Customer Service">Customer Service</SelectItem>
                            <SelectItem value="Transportation">Transportation</SelectItem>
                            <SelectItem value="Finance">Finance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="edit-role-salary">Salary Range</Label>
                        <Input
                          id="edit-role-salary"
                          value={selectedRole.salary_range}
                          onChange={(e) => setSelectedRole({...selectedRole, salary_range: e.target.value})}
                          placeholder="e.g., ₹30,000 - ₹50,000"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Permissions</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                        {availablePermissions.map((permission) => (
                          <div key={permission} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-${permission}`}
                              checked={selectedRole.permissions.includes(permission)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedRole({
                                    ...selectedRole,
                                    permissions: [...selectedRole.permissions, permission]
                                  });
                                } else {
                                  setSelectedRole({
                                    ...selectedRole,
                                    permissions: selectedRole.permissions.filter(p => p !== permission)
                                  });
                                }
                              }}
                            />
                            <Label htmlFor={`edit-${permission}`} className="text-sm capitalize">
                              {permission.replace(/_/g, ' ')}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsEditRoleModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleEditRole} className="bg-primary hover:bg-primary/90">
                        Update Role
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}