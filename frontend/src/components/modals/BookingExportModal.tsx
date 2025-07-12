import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { downloadBookingsPDF } from "@/lib/pdfGenerator";
import type { Booking } from "@shared/schema";

interface BookingExportModalProps {
  bookings: Booking[];
  trigger?: React.ReactNode;
}

export default function BookingExportModal({ bookings, trigger }: BookingExportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [exportType, setExportType] = useState<'all' | 'today' | 'custom'>('today');

  const handleExport = () => {
    let filteredBookings = bookings;
    let options = {};

    if (exportType === 'today') {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
      filteredBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.pickupDateTime);
        return bookingDate >= todayStart && bookingDate <= todayEnd;
      });
      
      options = {
        startDate: todayStart.toISOString(),
        endDate: todayEnd.toISOString(),
        title: "Today's Bookings"
      };
    } else if (exportType === 'custom' && startDate && endDate) {
      const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
      
      filteredBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.pickupDateTime);
        return bookingDate >= start && bookingDate <= end;
      });
      
      options = {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        title: "Custom Date Range Bookings"
      };
    }

    downloadBookingsPDF(filteredBookings, options);
    setIsOpen(false);
  };

  const getFilteredCount = () => {
    if (exportType === 'all') return bookings.length;
    
    if (exportType === 'today') {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
      return bookings.filter(booking => {
        const bookingDate = new Date(booking.pickupDateTime);
        return bookingDate >= todayStart && bookingDate <= todayEnd;
      }).length;
    }
    
    if (exportType === 'custom' && startDate && endDate) {
      const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
      
      return bookings.filter(booking => {
        const bookingDate = new Date(booking.pickupDateTime);
        return bookingDate >= start && bookingDate <= end;
      }).length;
    }
    
    return 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export PDF</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Export Bookings to PDF</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Export Type Selection */}
          <div className="space-y-2">
            <Label>Select Date Range</Label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="exportType"
                  checked={exportType === 'today'}
                  onChange={() => setExportType('today')}
                  className="text-primary"
                />
                <span>Today's Bookings</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="exportType"
                  checked={exportType === 'custom'}
                  onChange={() => setExportType('custom')}
                  className="text-primary"
                />
                <span>Custom Date Range</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="exportType"
                  checked={exportType === 'all'}
                  onChange={() => setExportType('all')}
                  className="text-primary"
                />
                <span>All Bookings</span>
              </label>
            </div>
          </div>

          {/* Custom Date Range */}
          {exportType === 'custom' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}

          {/* Preview Info */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-700">
                Bookings to export: <span className="text-blue-600">{getFilteredCount()}</span>
              </p>
              {getFilteredCount() > 0 && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Ready to export
                </span>
              )}
            </div>
            {exportType === 'today' && (
              <p className="text-xs text-slate-500">
                📅 All bookings with pickup date scheduled for today ({new Date().toLocaleDateString('en-IN')})
              </p>
            )}
            {exportType === 'custom' && startDate && endDate && (
              <p className="text-xs text-slate-500">
                📅 From {format(startDate, "PP")} to {format(endDate, "PP")}
              </p>
            )}
            {exportType === 'all' && (
              <p className="text-xs text-slate-500">
                📋 Complete booking history export
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button
              onClick={handleExport}
              disabled={exportType === 'custom' && (!startDate || !endDate)}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}