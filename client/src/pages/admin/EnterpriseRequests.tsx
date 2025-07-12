import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Building2, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  User, 
  Mail,
  Phone,
  MapPin,
  DollarSign
} from 'lucide-react';

export default function EnterpriseRequests() {
  const { toast } = useToast();
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [commissionRate, setCommissionRate] = useState<string>('');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const { data: enterpriseRequests = [], isLoading } = useQuery({
    queryKey: ['/api/admin/enterprise-requests'],
  });

  const approveMutation = useMutation({
    mutationFn: async ({ userId, action, commissionRate }: { 
      userId: string; 
      action: 'approve' | 'reject'; 
      commissionRate?: string 
    }) => {
      return await apiRequest(`/api/admin/users/${userId}/approve-enterprise`, {
        method: 'PATCH',
        body: { action, commissionRate: commissionRate ? Number(commissionRate) : undefined }
      });
    },
    onSuccess: (data, variables) => {
      toast({
        title: variables.action === 'approve' ? "Request Approved" : "Request Rejected",
        description: `Enterprise plan request ${variables.action}d successfully`,
      });
      setProcessingRequest(null);
      setCommissionRate('');
      setSelectedRequest(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/enterprise-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Action Failed",
        description: error.message || "Failed to process enterprise request",
        variant: "destructive",
      });
      setProcessingRequest(null);
    },
  });

  const handleApprove = (request: any) => {
    if (!commissionRate || isNaN(Number(commissionRate))) {
      toast({
        title: "Invalid Commission Rate",
        description: "Please enter a valid commission rate",
        variant: "destructive",
      });
      return;
    }

    setProcessingRequest(request.id);
    approveMutation.mutate({
      userId: request.id,
      action: 'approve',
      commissionRate
    });
  };

  const handleReject = (request: any) => {
    setProcessingRequest(request.id);
    approveMutation.mutate({
      userId: request.id,
      action: 'reject'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Enterprise Plan Requests</h1>
          <p className="text-text-secondary">Review and approve enterprise plan applications</p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {enterpriseRequests.length} Pending
        </Badge>
      </div>

      {enterpriseRequests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto text-text-secondary mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No Pending Requests</h3>
            <p className="text-text-secondary">All enterprise plan requests have been processed</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {enterpriseRequests.map((request: any) => (
            <Card key={request.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                    {request.firstName} {request.lastName}
                  </CardTitle>
                  <Badge variant="secondary">
                    Enterprise Plan
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-text-secondary" />
                    <span className="text-sm">{request.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-text-secondary" />
                    <span className="text-sm">
                      Requested: {request.enterpriseRequestDate ? 
                        new Date(request.enterpriseRequestDate).toLocaleDateString() : 
                        new Date(request.createdAt).toLocaleDateString()
                      }
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`commission-${request.id}`}>Set Commission Rate (%)</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        id={`commission-${request.id}`}
                        type="number"
                        placeholder="0"
                        min="0"
                        max="100"
                        step="0.1"
                        value={selectedRequest === request.id ? commissionRate : ''}
                        onChange={(e) => {
                          setSelectedRequest(request.id);
                          setCommissionRate(e.target.value);
                        }}
                        className="w-32"
                      />
                      <span className="text-sm text-text-secondary">%</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Button
                      onClick={() => handleApprove(request)}
                      disabled={processingRequest === request.id || !commissionRate || selectedRequest !== request.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {processingRequest === request.id ? 'Approving...' : 'Approve'}
                    </Button>
                    
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(request)}
                      disabled={processingRequest === request.id}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {processingRequest === request.id ? 'Rejecting...' : 'Reject'}
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <User className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Enterprise Request Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium text-text-secondary">Full Name</Label>
                              <p className="text-text-primary">{request.firstName} {request.lastName}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-text-secondary">Email</Label>
                              <p className="text-text-primary">{request.email}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium text-text-secondary">Plan Type</Label>
                              <Badge variant="outline">Enterprise</Badge>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-text-secondary">Request Date</Label>
                              <p className="text-text-primary">
                                {new Date(request.createdAt).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-text-secondary">Current Status</Label>
                            <Badge variant="secondary" className="ml-2">
                              {request.enterpriseApprovalStatus || 'Pending'}
                            </Badge>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
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