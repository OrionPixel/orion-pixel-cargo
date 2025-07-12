import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import {
  HeadphonesIcon, Search, Filter, Eye, MessageSquare, Clock, CheckCircle, 
  AlertTriangle, XCircle, Calendar, User, Mail, Phone, RefreshCw
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { formatDistanceToNow } from 'date-fns';

function AdminSupport() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [ticketResponse, setTicketResponse] = useState("");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewTicket, setViewTicket] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState("");

  // Check authentication and admin role
  if (!authLoading && (!currentUser || currentUser.role !== 'admin')) {
    window.location.href = "/admin-login";
    return null;
  }

  // Fetch support tickets
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["/api/admin/support-tickets"],
    enabled: !!currentUser && currentUser.role === 'admin',
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Fetch messages for the viewed ticket
  const { data: ticketMessages = [], refetch: refetchMessages } = useQuery({
    queryKey: ["/api/messages", viewTicket?.id],
    queryFn: () => fetch(`/api/messages?ticketId=${viewTicket?.id}`, {
      credentials: 'include'
    }).then(res => res.json()),
    enabled: !!viewTicket && viewDialogOpen,
  });

  // Sort ticket messages by creation date (most recent first)
  const sortedTicketMessages = (ticketMessages || []).sort((a: any, b: any) => {
    const dateA = new Date(a.createdAt || 0);
    const dateB = new Date(b.createdAt || 0);
    return dateB.getTime() - dateA.getTime();
  });

  // Filter tickets and sort by recent order
  const filteredTickets = useMemo(() => {
    return tickets
      .filter((ticket: any) => {
        const matchesSearch = ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             ticket.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             ticket.message?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
        const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
      })
      .sort((a: any, b: any) => {
        // Sort by creation date in descending order (most recent first)
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
  }, [tickets, searchTerm, statusFilter, priorityFilter]);

  // Stats calculation
  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t: any) => t.status === 'open').length,
      inProgress: tickets.filter((t: any) => t.status === 'in_progress').length,
      resolved: tickets.filter((t: any) => t.status === 'resolved').length,
      closed: tickets.filter((t: any) => t.status === 'closed').length,
      high: tickets.filter((t: any) => t.priority === 'high').length,
      medium: tickets.filter((t: any) => t.priority === 'medium').length,
      low: tickets.filter((t: any) => t.priority === 'low').length
    };
  }, [tickets]);

  // Respond to ticket mutation
  const respondToTicketMutation = useMutation({
    mutationFn: async ({ ticketId, response }: { ticketId: string; response: string }) => {
      const result = await apiRequest("POST", "/api/admin/respond-ticket", {
        ticketId,
        response
      });
      return result.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Response sent successfully" });
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      setResponseDialogOpen(false);
      setTicketResponse("");
      setSelectedTicket(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Update ticket status mutation
  const updateTicketStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      const result = await apiRequest("PATCH", `/api/admin/tickets/${ticketId}`, {
        status
      });
      return result.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Ticket status updated" });
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Update ticket priority mutation
  const updateTicketPriorityMutation = useMutation({
    mutationFn: async ({ ticketId, priority }: { ticketId: string; priority: string }) => {
      const result = await apiRequest("PATCH", `/api/admin/tickets/${ticketId}`, {
        priority
      });
      return result.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Ticket priority updated" });
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Send reply mutation for conversation
  const sendReplyMutation = useMutation({
    mutationFn: async (replyData: { message: string; relatedTicketId: number; toUserId: string; subject: string }) => {
      const messagePayload = {
        toUserId: replyData.toUserId,
        subject: replyData.subject,
        message: replyData.message,
        relatedTicketId: replyData.relatedTicketId,
        priority: "medium"
      };
      return await apiRequest("POST", "/api/messages", messagePayload);
    },
    onSuccess: () => {
      toast({
        title: "Reply Sent",
        description: "Your reply has been sent successfully.",
      });
      setReplyMessage("");
      refetchMessages();
    },
    onError: (error) => {
      console.error("Failed to send reply:", error);
      toast({
        title: "Error",
        description: "Failed to send reply. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'in_progress': return 'secondary';
      case 'resolved': return 'default';
      case 'closed': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading support tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Support Center</h1>
              <p className="text-slate-600">Manage customer support tickets and inquiries</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        <main className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <HeadphonesIcon className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-slate-600">Total</p>
                    <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <XCircle className="h-8 w-8 text-red-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-slate-600">Open</p>
                    <p className="text-2xl font-bold text-slate-800">{stats.open}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-amber-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-slate-600">In Progress</p>
                    <p className="text-2xl font-bold text-slate-800">{stats.inProgress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-slate-600">Resolved</p>
                    <p className="text-2xl font-bold text-slate-800">{stats.resolved}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-slate-600">High Priority</p>
                    <p className="text-2xl font-bold text-slate-800">{stats.high}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-amber-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-slate-600">Medium</p>
                    <p className="text-2xl font-bold text-slate-800">{stats.medium}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-slate-600">Low Priority</p>
                    <p className="text-2xl font-bold text-slate-800">{stats.low}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search tickets by subject or user..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-48">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket Details</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket: any) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-800">#{ticket.id}</p>
                          <p className="text-sm text-slate-600 max-w-xs truncate">{ticket.subject}</p>
                          <p className="text-xs text-slate-500 max-w-xs truncate">{ticket.message}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <User className="h-3 w-3 mr-1" />
                            {ticket.userName}
                          </div>
                          {ticket.email && (
                            <div className="flex items-center text-sm text-slate-500">
                              <Mail className="h-3 w-3 mr-1" />
                              {ticket.email}
                            </div>
                          )}
                          {ticket.phone && (
                            <div className="flex items-center text-sm text-slate-500">
                              <Phone className="h-3 w-3 mr-1" />
                              {ticket.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={ticket.priority} 
                          onValueChange={(value) => updateTicketPriorityMutation.mutate({ ticketId: ticket.id, priority: value })}
                        >
                          <SelectTrigger className="w-28">
                            <div className="flex items-center gap-1">
                              {getPriorityIcon(ticket.priority)}
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={ticket.status} 
                          onValueChange={(value) => updateTicketStatusMutation.mutate({ ticketId: ticket.id, status: value })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-slate-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setViewTicket(ticket)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Ticket Details #{viewTicket?.id}</DialogTitle>
                                <DialogDescription>
                                  Complete ticket information and user details
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-6">
                                {/* Ticket Information */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-slate-700">Subject</label>
                                    <p className="text-sm text-slate-600 mt-1">{viewTicket?.subject}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-slate-700">Category</label>
                                    <p className="text-sm text-slate-600 mt-1 capitalize">{viewTicket?.category}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-slate-700">Priority</label>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant={getPriorityColor(viewTicket?.priority)}>
                                        {getPriorityIcon(viewTicket?.priority)}
                                        {viewTicket?.priority}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-slate-700">Status</label>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant={getStatusColor(viewTicket?.status)}>
                                        {viewTicket?.status?.replace('_', ' ')}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-slate-700">Created</label>
                                    <p className="text-sm text-slate-600 mt-1">
                                      {viewTicket?.createdAt ? new Date(viewTicket.createdAt).toLocaleString() : 'N/A'}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-slate-700">Last Updated</label>
                                    <p className="text-sm text-slate-600 mt-1">
                                      {viewTicket?.updatedAt ? new Date(viewTicket.updatedAt).toLocaleString() : 'N/A'}
                                    </p>
                                  </div>
                                </div>

                                {/* User Information */}
                                <div className="border-t pt-4">
                                  <h4 className="text-lg font-medium text-slate-800 mb-3">User Information</h4>
                                  <div className="grid grid-cols-3 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-slate-700">Name</label>
                                      <p className="text-sm text-slate-600 mt-1">{viewTicket?.userName || 'Unknown User'}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-slate-700">Email</label>
                                      <p className="text-sm text-slate-600 mt-1">{viewTicket?.userEmail || 'No Email'}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-slate-700">Phone</label>
                                      <p className="text-sm text-slate-600 mt-1">{viewTicket?.userPhone || 'No Phone'}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Ticket Message */}
                                <div className="border-t pt-4">
                                  <h4 className="text-lg font-medium text-slate-800 mb-3">Original Message</h4>
                                  <div className="p-4 bg-slate-50 rounded-lg">
                                    <p className="text-sm text-slate-700">{viewTicket?.message}</p>
                                  </div>
                                </div>

                                {/* Messages Section */}
                                <Separator />
                                
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    <Label className="text-sm font-medium">Conversation</Label>
                                  </div>
                                  
                                  <ScrollArea className="max-h-80 w-full border rounded-md p-3">
                                    {sortedTicketMessages.length > 0 ? (
                                      <div className="space-y-3">
                                        {sortedTicketMessages.map((message: any, index: number) => (
                                          <div key={index} className="p-3 rounded-md bg-gray-50 border-l-4 border-blue-500">
                                            <div className="flex items-center justify-between mb-2">
                                              <div className="flex items-center gap-2">
                                                <User className="h-3 w-3" />
                                                <span className="text-xs font-medium">{message.senderName || 'User'}</span>
                                              </div>
                                              <span className="text-xs text-gray-500">
                                                {formatDistanceToNow(new Date(message.createdAt || new Date()), { addSuffix: true })}
                                              </span>
                                            </div>
                                            <p className="text-sm leading-relaxed">{message.message}</p>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-center py-8 text-gray-500">
                                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                        <p>No messages in this conversation yet</p>
                                      </div>
                                    )}
                                  </ScrollArea>

                                  {/* Reply Section */}
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium">Send Reply</Label>
                                    <div className="space-y-2">
                                      <Textarea
                                        placeholder="Type your reply here..."
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        rows={3}
                                      />
                                      <Button 
                                        size="sm" 
                                        onClick={() => {
                                          if (replyMessage.trim() && viewTicket) {
                                            sendReplyMutation.mutate({
                                              message: replyMessage,
                                              relatedTicketId: viewTicket.id,
                                              toUserId: viewTicket.userId,
                                              subject: `Re: ${viewTicket.subject}`
                                            });
                                          }
                                        }}
                                        disabled={!replyMessage.trim() || sendReplyMutation.isPending}
                                      >
                                        {sendReplyMutation.isPending ? "Sending..." : "Send Reply"}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedTicket(ticket)}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Respond to Ticket #{selectedTicket?.id}</DialogTitle>
                                <DialogDescription>
                                  Subject: {selectedTicket?.subject}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-lg">
                                  <p className="text-sm font-medium text-slate-700">Original Message:</p>
                                  <p className="text-sm text-slate-600 mt-1">{selectedTicket?.message}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Your Response</label>
                                  <Textarea
                                    value={ticketResponse}
                                    onChange={(e) => setTicketResponse(e.target.value)}
                                    placeholder="Type your response here..."
                                    rows={4}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={() => {
                                    if (selectedTicket) {
                                      respondToTicketMutation.mutate({
                                        ticketId: selectedTicket.id,
                                        response: ticketResponse
                                      });
                                    }
                                  }}
                                  disabled={!ticketResponse.trim() || respondToTicketMutation.isPending}
                                >
                                  {respondToTicketMutation.isPending ? "Sending..." : "Send Response"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

export default AdminSupport;