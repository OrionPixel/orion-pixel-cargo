import { useState } from "react";
import { X, Plus, Calendar, DollarSign, FileText, Tag, Truck } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUserTheme } from "@/contexts/UserThemeContext";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense?: any;
  mode?: 'create' | 'edit';
}

export default function ExpenseModal({ isOpen, onClose, expense, mode = 'create' }: ExpenseModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { themeSettings } = useUserTheme();
  
  // Debug theme settings
  console.log('🎨 ExpenseModal Theme Settings:', themeSettings);
  
  const [formData, setFormData] = useState({
    amount: expense?.amount || '',
    expenseType: expense?.expenseType || 'fuel',
    category: expense?.category || 'General',
    description: expense?.description || '',
    expenseDate: expense?.expenseDate ? new Date(expense.expenseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    vehicleId: expense?.vehicleId || ''
  });

  // Fetch user vehicles for the dropdown
  const { data: vehicles = [] } = useQuery({
    queryKey: ['/api/vehicles'],
    enabled: isOpen
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/expenses', data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses/analytics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/financial-reports'] });
      onClose();
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create expense",
        variant: "destructive",
      });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PUT', `/api/expenses/${expense?.id}`, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses/analytics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/financial-reports'] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update expense",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      amount: '',
      expenseType: 'fuel',
      category: 'General',
      description: '',
      expenseDate: new Date().toISOString().split('T')[0],
      vehicleId: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.description) {
      toast({
        title: "Error",
        description: "Amount and description are required",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      ...formData,
      amount: parseFloat(formData.amount),
      vehicleId: formData.vehicleId || null
    };

    if (mode === 'edit') {
      updateExpenseMutation.mutate(submitData);
    } else {
      createExpenseMutation.mutate(submitData);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  const expenseTypes = [
    { value: 'salary', label: 'Team Salary', icon: '👥' },
    { value: 'commission', label: 'Agent Commission', icon: '💰' },
    { value: 'fuel', label: 'Vehicle Fuel', icon: '⛽' },
    { value: 'toll', label: 'Toll Charges', icon: '🛣️' },
    { value: 'maintenance', label: 'Vehicle Maintenance', icon: '🔧' },
    { value: 'office', label: 'Office Expenses', icon: '🏢' },
    { value: 'other', label: 'Other', icon: '📋' }
  ];

  const categories = [
    'General', 'Operations', 'Vehicle', 'Staff', 'Administrative', 'Marketing', 'Technology', 'Travel'
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div 
          className="px-6 py-4 border-b border-gray-200 flex items-center justify-between"
          style={{ backgroundColor: `${themeSettings.primaryColor}15` }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${themeSettings.primaryColor}25` }}
            >
              <Plus className="w-5 h-5" style={{ color: themeSettings.primaryColor }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {mode === 'edit' ? 'Edit Expense' : 'Add New Expense'}
              </h2>
              <p className="text-sm text-gray-600">
                {mode === 'edit' ? 'Update expense details' : 'Track your business expenses'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <DollarSign className="w-4 h-4" style={{ color: themeSettings.primaryColor }} />
              Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary transition-colors"
              style={{ borderColor: formData.amount ? `${themeSettings.primaryColor}50` : undefined }}
              placeholder="Enter expense amount"
              required
            />
          </div>

          {/* Expense Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Tag className="w-4 h-4" style={{ color: themeSettings.primaryColor }} />
              Expense Type
            </label>
            <select
              value={formData.expenseType}
              onChange={(e) => handleChange('expenseType', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary transition-colors"
              style={{ borderColor: `${themeSettings.primaryColor}50` }}
            >
              {expenseTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: themeSettings.primaryColor }} />
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary transition-colors"
              style={{ borderColor: `${themeSettings.primaryColor}50` }}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle (for fuel/maintenance expenses) */}
          {(formData.expenseType === 'fuel' || formData.expenseType === 'maintenance') && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Truck className="w-4 h-4" style={{ color: themeSettings.primaryColor }} />
                Vehicle (Optional)
              </label>
              <select
                value={formData.vehicleId}
                onChange={(e) => handleChange('vehicleId', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary transition-colors"
                style={{ borderColor: `${themeSettings.primaryColor}50` }}
              >
                <option value="">Select Vehicle (Optional)</option>
                {vehicles.map((vehicle: any) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.registrationNumber} - {vehicle.vehicleType}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: themeSettings.primaryColor }} />
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary transition-colors resize-none"
              style={{ borderColor: formData.description ? `${themeSettings.primaryColor}50` : undefined }}
              placeholder="Enter expense description"
              rows={3}
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Calendar className="w-4 h-4" style={{ color: themeSettings.primaryColor }} />
              Expense Date
            </label>
            <input
              type="date"
              value={formData.expenseDate}
              onChange={(e) => handleChange('expenseDate', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary transition-colors"
              style={{ borderColor: `${themeSettings.primaryColor}50` }}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createExpenseMutation.isPending || updateExpenseMutation.isPending}
              className="flex-1 px-4 py-3 text-white rounded-lg transition-colors disabled:opacity-50"
              style={{ backgroundColor: themeSettings.primaryColor }}
            >
              {createExpenseMutation.isPending || updateExpenseMutation.isPending
                ? 'Saving...'
                : mode === 'edit' 
                  ? 'Update Expense'
                  : 'Add Expense'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}