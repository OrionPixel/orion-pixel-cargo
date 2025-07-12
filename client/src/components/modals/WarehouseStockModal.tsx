import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Minus, Package, TrendingUp, AlertTriangle, History, Clock, FileText } from "lucide-react";
import type { Warehouse } from "@shared/schema";

interface WarehouseStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouse: Warehouse | null;
}

export default function WarehouseStockModal({ isOpen, onClose, warehouse }: WarehouseStockModalProps) {
  const [stockChange, setStockChange] = useState(0);
  const [operation, setOperation] = useState<"add" | "remove">("add");
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState("general");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const stockCategories = [
    { value: "general", label: "General Stock" },
    { value: "incoming_shipment", label: "Incoming Shipment" },
    { value: "outgoing_shipment", label: "Outgoing Shipment" },
    { value: "damage_loss", label: "Damage/Loss" },
    { value: "return", label: "Return" },
    { value: "transfer", label: "Transfer" },
    { value: "audit_adjustment", label: "Audit Adjustment" },
  ];

  const quickActions = [
    { label: "+100", value: 100 },
    { label: "+500", value: 500 },
    { label: "+1000", value: 1000 },
    { label: "-100", value: -100 },
    { label: "-500", value: -500 },
    { label: "-1000", value: -1000 },
  ];

  const updateStockMutation = useMutation({
    mutationFn: async (data: { id: number; stockChange: number; reason: string; category: string; notes: string }) => {
      const response = await apiRequest("PUT", `/api/warehouses/${data.id}/stock`, { 
        stockChange: operation === "add" ? data.stockChange : -data.stockChange,
        reason: data.reason,
        category: data.category,
        notes: data.notes,
        operationType: operation,
        timestamp: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses/analytics"] });
      toast({
        title: "Success",
        description: `Stock ${operation === "add" ? "added" : "removed"} successfully`,
      });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update stock",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setStockChange(0);
    setReason("");
    setCategory("general");
    setNotes("");
    setOperation("add");
  };

  const handleSubmit = () => {
    if (!warehouse || stockChange <= 0 || !reason.trim()) return;
    updateStockMutation.mutate({ 
      id: warehouse.id, 
      stockChange, 
      reason: reason.trim(),
      category,
      notes: notes.trim(),
    });
  };

  const handleQuickAction = (value: number) => {
    if (value > 0) {
      setOperation("add");
      setStockChange(value);
    } else {
      setOperation("remove");
      setStockChange(Math.abs(value));
    }
  };

  if (!warehouse) return null;

  const currentStock = warehouse.currentStock || 0;
  const capacity = warehouse.capacity || 0;
  const maxCapacity = warehouse.maxCapacity || capacity;
  const utilizationPercentage = capacity > 0 ? Math.round((currentStock / capacity) * 100) : 0;
  
  const newStock = operation === "add" ? currentStock + stockChange : currentStock - stockChange;
  const newUtilization = capacity > 0 ? Math.round((newStock / capacity) * 100) : 0;
  
  const exceedsCapacity = newStock > maxCapacity;
  const belowZero = newStock < 0;
  const isValidOperation = !exceedsCapacity && !belowZero && stockChange > 0 && reason.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Management
          </DialogTitle>
          <DialogDescription>
            Update stock levels for {warehouse.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Current Status */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Current Stock</span>
              <span className="text-lg font-bold">{currentStock.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Capacity</span>
              <span className="text-sm">{capacity.toLocaleString()} (Max: {maxCapacity.toLocaleString()})</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Utilization</span>
              <Badge variant={utilizationPercentage > 80 ? "destructive" : utilizationPercentage > 60 ? "secondary" : "default"}>
                {utilizationPercentage}%
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Available Space</span>
              <span className="text-sm font-medium text-green-600">
                {(maxCapacity - currentStock).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <Label>Quick Actions</Label>
            <div className="grid grid-cols-3 gap-1">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action.value)}
                  className={`text-xs h-8 ${action.value > 0 ? 'text-green-600 border-green-300' : 'text-red-600 border-red-300'}`}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Operation Type */}
          <div className="space-y-2">
            <Label>Operation Type</Label>
            <div className="flex gap-2">
              <Button
                variant={operation === "add" ? "default" : "outline"}
                onClick={() => setOperation("add")}
                className="flex-1 h-9"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Stock
              </Button>
              <Button
                variant={operation === "remove" ? "default" : "outline"}
                onClick={() => setOperation("remove")}
                className="flex-1 h-9"
                size="sm"
              >
                <Minus className="h-4 w-4 mr-1" />
                Remove Stock
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="stockChange">
                {operation === "add" ? "Add" : "Remove"} Quantity
              </Label>
              <Input
                id="stockChange"
                type="number"
                value={stockChange || ""}
                onChange={(e) => setStockChange(Number(e.target.value) || 0)}
                placeholder="Enter quantity"
                min="1"
                className="h-9"
              />
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {stockCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Required)</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., New shipment received, Damaged goods removal"
              required
              className="h-9"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details, reference numbers, etc."
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Preview */}
          {stockChange > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Transaction Preview</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Operation:</span>
                <span className="font-medium capitalize">{operation} Stock</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Category:</span>
                <span className="font-medium">{stockCategories.find(c => c.value === category)?.label}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>New Stock Level:</span>
                <span className={`font-medium ${newStock < 0 ? 'text-red-600' : newStock > maxCapacity ? 'text-orange-600' : 'text-green-600'}`}>
                  {newStock.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>New Utilization:</span>
                <span className={`font-medium ${newUtilization > 100 ? 'text-red-600' : newUtilization > 80 ? 'text-orange-600' : 'text-green-600'}`}>
                  {newUtilization}%
                </span>
              </div>

              {/* Warnings */}
              {exceedsCapacity && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  Exceeds maximum capacity
                </div>
              )}
              
              {belowZero && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  Cannot go below zero
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1 h-9">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!isValidOperation || updateStockMutation.isPending}
              className="flex-1 h-9"
            >
              {updateStockMutation.isPending ? (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {`${operation === "add" ? "Add" : "Remove"} Stock`}
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}