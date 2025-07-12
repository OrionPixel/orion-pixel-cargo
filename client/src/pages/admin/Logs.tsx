import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
  Activity, Search, Filter, RefreshCw, Download, AlertTriangle, 
  Info, CheckCircle, XCircle, Calendar, Clock
} from "lucide-react";

function AdminLogs() {
  const { user, isLoading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["/api/admin/logs", searchTerm, levelFilter, typeFilter],
    enabled: !!user && user.role === 'admin',
  });

  const { data: logStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/logs/stats"],
    enabled: !!user && user.role === 'admin',
  });

  const filteredLogs = logs.filter((log: any) => {
    const matchesSearch = log.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === "all" || log.level === levelFilter;
    const matchesType = typeFilter === "all" || log.type === typeFilter;
    return matchesSearch && matchesLevel && matchesType;
  });

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLogBadgeVariant = (level: string) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'success': return 'default';
      default: return 'outline';
    }
  };

  if (authLoading || isLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-900">Activity Logs</h1>
            <p className="text-primary-600 mt-1">Monitor system activities and events</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="bg-secondary-100 border border-secondary-200 rounded-lg">
              <Button variant="ghost" size="sm" className="text-secondary-700 hover:bg-secondary-200">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <Download className="h-4 w-4 mr-2" />
                Export Logs
              </Button>
            </div>
          </div>
        </div>

        {/* Log Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/70 backdrop-blur-sm border border-primary-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-primary-100 p-3 rounded-lg">
                  <Activity className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-primary-600">Total Logs</p>
                  <p className="text-2xl font-bold text-primary-900">{logStats?.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-accent-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-accent-100 p-3 rounded-lg">
                  <XCircle className="h-8 w-8 text-accent-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-accent-600">Errors</p>
                  <p className="text-2xl font-bold text-accent-900">{logStats?.levels?.error || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-secondary-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-secondary-100 p-3 rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-secondary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Warnings</p>
                  <p className="text-2xl font-bold text-secondary-900">{logStats?.levels?.warning || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-primary-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-primary-600">Success</p>
                  <p className="text-2xl font-bold text-primary-900">{logStats?.levels?.success || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/70 backdrop-blur-sm border border-primary-200 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-text-primary">Filter Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
                <Input
                  placeholder="Search logs by message or source..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-primary-200 focus:border-primary-500"
                />
              </div>
              
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-48 border-primary-200 focus:border-primary-500">
                  <Filter className="h-4 w-4 mr-2 text-primary-600" />
                  <SelectValue placeholder="Filter by level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48 border-primary-200 focus:border-primary-500">
                  <Filter className="h-4 w-4 mr-2 text-primary-600" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card className="bg-white/70 backdrop-blur-sm border border-primary-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-primary-900">Recent Activity</CardTitle>
            <p className="text-primary-600">Latest system logs and events</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-primary-200">
                  <TableHead className="text-primary-700 font-semibold">Level</TableHead>
                  <TableHead className="text-primary-700 font-semibold">Type</TableHead>
                  <TableHead className="text-primary-700 font-semibold">Message</TableHead>
                  <TableHead className="text-primary-700 font-semibold">Source</TableHead>
                  <TableHead className="text-primary-700 font-semibold">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log: any, index: number) => (
                  <TableRow key={index} className="hover:bg-primary-50 transition-colors">
                    <TableCell>
                      <Badge variant={getLogBadgeVariant(log.level)} className="flex items-center space-x-1">
                        {getLogIcon(log.level)}
                        <span className="capitalize">{log.level}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-secondary-600 capitalize font-medium">{log.type || 'system'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-primary-800">{log.message}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-primary-600">{log.source || 'Unknown'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-primary-600">
                        <Calendar className="h-3 w-3 mr-1 text-accent-500" />
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminLogs;