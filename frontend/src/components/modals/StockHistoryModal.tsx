import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, User, Package, TrendingUp, TrendingDown, FileText } from "lucide-react";
import type { Warehouse } from "@shared/schema";

interface StockHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouse: Warehouse | null;
}

interface StockTransaction {
  id: string;
  timestamp: string;
  operationType: "add" | "remove";
  quantity: number;
  reason: string;
  category: string;
  notes?: string;
  previousStock: number;
  newStock: number;
  userName: string;
}

export default function StockHistoryModal({ isOpen, onClose, warehouse }: StockHistoryModalProps) {
  // Mock data - in real implementation, this would fetch from API
  const stockHistory: StockTransaction[] = warehouse ? [
    {
      id: "1",
      timestamp: "2024-01-20T10:30:00Z",
      operationType: "add",
      quantity: 500,
      reason: "New shipment received from Supplier ABC",
      category: "incoming_shipment",
      notes: "Reference: SH-2024-001, Quality checked",
      previousStock: 14500,
      newStock: 15000,
      userName: "Rajesh Kumar"
    },
    {
      id: "2",
      timestamp: "2024-01-19T15:45:00Z",
      operationType: "remove",
      quantity: 200,
      reason: "Outbound shipment to Customer XYZ",
      category: "outgoing_shipment",
      notes: "Order #ORD-2024-156",
      previousStock: 14700,
      newStock: 14500,
      userName: "Priya Singh"
    },
    {
      id: "3",
      timestamp: "2024-01-18T09:15:00Z",
      operationType: "remove",
      quantity: 50,
      reason: "Damaged goods during inspection",
      category: "damage_loss",
      notes: "Water damage, items disposed",
      previousStock: 14750,
      newStock: 14700,
      userName: "Amit Sharma"
    },
    {
      id: "4",
      timestamp: "2024-01-17T14:20:00Z",
      operationType: "add",
      quantity: 1000,
      reason: "Monthly stock replenishment",
      category: "incoming_shipment",
      notes: "Bulk order delivery, Invoice #INV-2024-089",
      previousStock: 13750,
      newStock: 14750,
      userName: "Kavita Patel"
    },
    {
      id: "5",
      timestamp: "2024-01-16T11:30:00Z",
      operationType: "add",
      quantity: 25,
      reason: "Audit adjustment - stock count correction",
      category: "audit_adjustment",
      notes: "Physical count found 25 additional items",
      previousStock: 13725,
      newStock: 13750,
      userName: "System Admin"
    },
  ] : [];

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'incoming_shipment': 'bg-green-100 text-green-800',
      'outgoing_shipment': 'bg-blue-100 text-blue-800',
      'damage_loss': 'bg-red-100 text-red-800',
      'return': 'bg-yellow-100 text-yellow-800',
      'transfer': 'bg-purple-100 text-purple-800',
      'audit_adjustment': 'bg-gray-100 text-gray-800',
      'general': 'bg-slate-100 text-slate-800',
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      'incoming_shipment': 'Incoming Shipment',
      'outgoing_shipment': 'Outgoing Shipment',
      'damage_loss': 'Damage/Loss',
      'return': 'Return',
      'transfer': 'Transfer',
      'audit_adjustment': 'Audit Adjustment',
      'general': 'General',
    };
    return labels[category as keyof typeof labels] || 'General';
  };

  if (!warehouse) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Stock Transaction History
          </DialogTitle>
          <DialogDescription>
            Complete transaction history for {warehouse.name}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] w-full">
          <div className="space-y-4 p-4">
            {stockHistory.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No stock transactions found</p>
              </div>
            ) : (
              stockHistory.map((transaction, index) => (
                <div key={transaction.id} className="space-y-4">
                  <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.operationType === 'add' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.operationType === 'add' ? (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {transaction.operationType === 'add' ? 'Added' : 'Removed'}{' '}
                            <span className="text-lg font-bold">
                              {transaction.quantity.toLocaleString()}
                            </span>{' '}
                            units
                          </p>
                          <p className="text-sm text-gray-600">{transaction.reason}</p>
                        </div>
                      </div>
                      <Badge className={getCategoryColor(transaction.category)}>
                        {getCategoryLabel(transaction.category)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(transaction.timestamp)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="h-4 w-4" />
                          <span>{transaction.userName}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Previous Stock:</span>
                          <span className="font-medium">{transaction.previousStock.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">New Stock:</span>
                          <span className="font-medium">{transaction.newStock.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {transaction.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-1">Notes:</p>
                            <p className="text-sm text-gray-600">{transaction.notes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          Net Change: {transaction.operationType === 'add' ? '+' : '-'}{transaction.quantity.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500">
                          Transaction ID: {transaction.id}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {index < stockHistory.length - 1 && <Separator />}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}