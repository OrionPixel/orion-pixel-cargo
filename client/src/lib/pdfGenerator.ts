import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Booking } from '@shared/schema';

export interface PDFExportOptions {
  startDate?: string;
  endDate?: string;
  officeName?: string;
  companyGST?: string;
  userEmail?: string;
  userName?: string;
  companyName?: string;
  title?: string;
}

// Helper functions for safe data formatting
function formatTextSafe(text: string | null | undefined, fallback = 'N/A'): string {
  if (text === null || text === undefined || text === '') return fallback;
  // Clean text to prevent copy-paste conversion issues
  return String(text).replace(/[^\u0020-\u007E]/g, '').trim();
}

function formatDateSafe(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-IN');
  } catch {
    return 'N/A';
  }
}

function formatCurrencySafe(amount: string | number | null | undefined): string {
  if (!amount) return '0';
  // Handle decimal type from database (stored as string)
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '0';
  return Math.ceil(numAmount).toString();
}

function formatWeightSafe(weight: string | number | null | undefined): string {
  if (!weight) return '0 kg';
  // Handle decimal type from database (stored as string)  
  const numWeight = typeof weight === 'string' ? parseFloat(weight) : weight;
  if (isNaN(numWeight)) return '0 kg';
  return `${numWeight} kg`;
}

function formatDistanceSafe(distance: string | number | null | undefined): string {
  if (!distance) return '0 km';
  // Handle decimal type from database (stored as string)
  const numDistance = typeof distance === 'string' ? parseFloat(distance) : distance;
  if (isNaN(numDistance)) return '0 km';
  return `${numDistance} km`;
}

function capitalizeStatus(status: string | null | undefined): string {
  if (!status) return 'N/A';
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
}

// Generate bookings export PDF with A4 landscape layout
export function generateBookingsPDF(bookings: Booking[], options: PDFExportOptions = {}) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  // Header with white background
  doc.setFillColor(255, 255, 255); // White background
  doc.rect(0, 0, doc.internal.pageSize.width, 32, 'F');
  
  // Black text on white background
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const companyName = options.companyName || options.officeName || 'LogiGoFast';
  doc.text(`${companyName} - Bookings Export Report`, 20, 16);
  
  // User info and date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const userInfo = `User: ${options.userName || 'User'} | Company: ${options.companyName || options.officeName || 'N/A'}`;
  doc.text(userInfo, 20, 24);
  
  // Add GST and email info with black text
  doc.setTextColor(0, 0, 0);
  const gstInfo = options.companyGST ? `GST: ${options.companyGST}` : '';
  const emailInfo = options.userEmail ? `Email: ${options.userEmail}` : '';
  const additionalInfo = [gstInfo, emailInfo].filter(Boolean).join(' | ');
  if (additionalInfo) {
    doc.text(additionalInfo, 20, 29);
  }
  
  const dateInfo = options.startDate && options.endDate 
    ? `Period: ${formatDateSafe(options.startDate)} - ${formatDateSafe(options.endDate)}`
    : `Generated: ${formatDateSafe(new Date())}`;
  doc.text(dateInfo, doc.internal.pageSize.width - 20, 24, { align: 'right' });
  
  // Table headers - proper text format
  const headers = [
    'Booking ID', 'Date', 'Route', 'Type', 'Weight', 'Sender', 'Receiver', 'Base Amount', 'GST Amount', 'Total Amount', 'Status'
  ];
  
  const tableData = bookings.map(booking => [
    formatTextSafe(booking.bookingId, 'BK-' + booking.id.toString()),
    formatDateSafe(booking.createdAt),
    formatTextSafe(booking.pickupCity) + ' to ' + formatTextSafe(booking.deliveryCity),
    formatTextSafe(booking.bookingType?.replace('_', ' ')),
    formatWeightSafe(booking.weight).replace(' kg', ''),
    formatTextSafe(booking.senderName),
    formatTextSafe(booking.receiverName),
    formatCurrencySafe(booking.baseRate),
    formatCurrencySafe(booking.gstAmount),
    formatCurrencySafe(booking.totalAmount),
    capitalizeStatus(booking.status)
  ]);
  
  // Create table with proper column widths
  autoTable(doc, {
    startY: 40,
    head: [headers],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      font: 'helvetica',
      fontStyle: 'normal'
    },
    headStyles: {
      fillColor: [132, 39, 215], // Purple theme
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      textColor: 60
    },
    columnStyles: {
      0: { cellWidth: 18, font: 'helvetica', fontStyle: 'normal' }, // Booking ID
      1: { cellWidth: 16, font: 'helvetica', fontStyle: 'normal' }, // Date
      2: { cellWidth: 28, font: 'helvetica', fontStyle: 'normal' }, // Route
      3: { cellWidth: 12, font: 'helvetica', fontStyle: 'normal' }, // Type
      4: { cellWidth: 14, font: 'helvetica', fontStyle: 'normal' }, // Weight
      5: { cellWidth: 22, font: 'helvetica', fontStyle: 'normal' }, // Sender
      6: { cellWidth: 22, font: 'helvetica', fontStyle: 'normal' }, // Receiver
      7: { cellWidth: 16, halign: 'right', font: 'helvetica', fontStyle: 'normal' }, // Base
      8: { cellWidth: 14, halign: 'right', font: 'helvetica', fontStyle: 'normal' }, // GST
      9: { cellWidth: 16, halign: 'right', font: 'helvetica', fontStyle: 'normal' }, // Total
      10: { cellWidth: 16, font: 'helvetica', fontStyle: 'normal' } // Status
    },
    margin: { left: 20, right: 20 }
  });
  
  // Summary section
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  const totalBookings = bookings.length;
  const totalRevenue = bookings.reduce((sum, booking) => {
    const amount = parseFloat(booking.totalAmount || '0');
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  const totalGST = bookings.reduce((sum, booking) => {
    const gst = parseFloat(booking.gstAmount || '0');
    return sum + (isNaN(gst) ? 0 : gst);
  }, 0);
  const baseAmount = totalRevenue - totalGST;
  
  // Clean summary without background box
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(132, 39, 215); // Purple color
  doc.text('SUMMARY', 25, finalY + 8);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text('Total Bookings: ' + totalBookings, 25, finalY + 18);
  doc.text('Base Amount: Rs. ' + formatCurrencySafe(baseAmount), 25, finalY + 28);
  doc.text('GST Amount: Rs. ' + formatCurrencySafe(totalGST), 25, finalY + 38);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(132, 39, 215);
  doc.text('Total Revenue: Rs. ' + formatCurrencySafe(totalRevenue), 25, finalY + 48);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Generated by ${options.officeName || 'LogiGoFast'} | ${new Date().toLocaleString('en-IN')}`,
    doc.internal.pageSize.width / 2,
    doc.internal.pageSize.height - 10,
    { align: 'center' }
  );
  
  return doc;
}

// Download bookings PDF
export function downloadBookingsPDF(bookings: Booking[], options: PDFExportOptions = {}) {
  const doc = generateBookingsPDF(bookings, options);
  const filename = `bookings-export-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

// Generate individual booking bill
export function generateBookingBill(booking: Booking & { vehicleRegistration?: string; vehicleType?: string; driverName?: string }, officeName: string = "LogiGoFast", companyGST?: string, user?: any) {
  const doc = new jsPDF();
  
  // Header with company info
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text(officeName, 20, 25);
  
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text('CARGO BOOKING BILL', 20, 35);
  
  // Company GST (if available)
  if (companyGST) {
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`GST: ${companyGST}`, 20, 42);
  }
  
  // Bill details
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Bill No: ${booking.bookingId || `BK-${booking.id}`}`, 140, 25);
  doc.text(`Date: ${formatDateSafe(booking.createdAt)}`, 140, 32);
  doc.text(`Status: ${capitalizeStatus(booking.status || 'booked')}`, 140, 39);
  
  // Line separator
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 45, 190, 45);
  
  // Sender details
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('SENDER DETAILS', 20, 55);
  
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Name: ${formatTextSafe(booking.senderName)}`, 20, 65);
  doc.text(`Phone: ${formatTextSafe(booking.senderPhone)}`, 20, 72);
  doc.text(`GST: ${formatTextSafe(booking.senderGST)}`, 20, 79);
  doc.text(`Address: ${formatTextSafe(booking.pickupAddress)}`, 20, 86);
  doc.text(`City: ${formatTextSafe(booking.pickupCity)}`, 20, 93);
  
  // Receiver details
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('RECEIVER DETAILS', 110, 55);
  
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Name: ${formatTextSafe(booking.receiverName)}`, 110, 65);
  doc.text(`Phone: ${formatTextSafe(booking.receiverPhone)}`, 110, 72);
  doc.text(`GST: ${formatTextSafe(booking.receiverGST)}`, 110, 79);
  doc.text(`Address: ${formatTextSafe(booking.deliveryAddress)}`, 110, 86);
  doc.text(`City: ${formatTextSafe(booking.deliveryCity)}`, 110, 93);
  
  // Line separator
  doc.line(20, 100, 190, 100);
  
  // Cargo details
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('CARGO DETAILS', 20, 110);
  
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Description: ${formatTextSafe(booking.cargoDescription, 'General Cargo')}`, 20, 120);
  doc.text(`Weight: ${formatWeightSafe(booking.weight)}`, 20, 127);
  doc.text(`Items: ${formatTextSafe(booking.itemCount?.toString(), '1')}`, 20, 134);
  doc.text(`Booking Type: ${formatTextSafe(booking.bookingType?.replace('_', ' '))}`, 20, 141);
  
  // Transport details
  doc.text(`Distance: ${formatDistanceSafe(booking.distance)}`, 110, 120);
  doc.text(`Pickup: ${formatDateSafe(booking.pickupDateTime)}`, 110, 127);
  doc.text(`Delivery: ${formatDateSafe(booking.deliveryDateTime)}`, 110, 134);
  const vehicleInfo = booking.vehicleRegistration 
    ? `${booking.vehicleRegistration} (${booking.vehicleType || 'Vehicle'})`
    : formatTextSafe(booking.vehicleId?.toString(), 'To be assigned');
  doc.text(`Vehicle: ${vehicleInfo}`, 110, 141);
  
  // Driver information (if available)
  if (booking.driverName) {
    doc.text(`Driver: ${booking.driverName}`, 110, 148);
  }
  
  // Line separator
  doc.line(20, 155, 190, 155);
  
  // Billing details
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('BILLING DETAILS', 20, 158);
  
  // Create billing table with proper structure
  const billingData = [
    ['Description', 'Amount (₹)'],
    ['Base Transportation Rate', formatCurrencySafe(booking.baseRate).replace('₹', '')],
  ];
  
  // Add handling charges if present
  const handlingCharges = Number(booking.handlingCharges || 0);
  if (handlingCharges > 0) {
    billingData.push(['Handling Charges', formatCurrencySafe(handlingCharges).replace('₹', '')]);
  }
  
  billingData.push(
    ['GST (18%)', formatCurrencySafe(booking.gstAmount).replace('₹', '')],
    ['Total Amount', formatCurrencySafe(booking.totalAmount).replace('₹', '')]
  );
  
  autoTable(doc, {
    startY: 163,
    head: [billingData[0]],
    body: billingData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [132, 39, 215], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { textColor: 60 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 50, halign: 'right' }
    },
    margin: { left: 20, right: 20 }
  });
  
  // Payment status
  const finalY = (doc as any).lastAutoTable.finalY || 200;
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Payment Status: ${booking.paymentStatus === 'paid' ? 'PAID' : 'PENDING'}`, 20, finalY + 15);
  
  // Tracking info
  if (booking.trackingNumber) {
    doc.text(`Tracking Number: ${booking.trackingNumber}`, 20, finalY + 25);
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Thank you for choosing ${officeName}!`, 20, finalY + 40);
  doc.text(`For support: ${user?.email || 'support@logigofast.com'} | ${user?.phone || '+91 7000758030'}`, 20, finalY + 47);
  
  // Page number
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    `Generated on: ${new Date().toLocaleDateString('en-IN')} | LogiGoFast Logistics`,
    doc.internal.pageSize.width / 2,
    doc.internal.pageSize.height - 10,
    { align: 'center' }
  );
  
  return doc;
}

// Download individual booking bill
export function downloadBookingBill(booking: Booking, officeName: string = "LogiGoFast", companyGST?: string, user?: any) {
  const doc = generateBookingBill(booking, officeName, companyGST, user);
  const filename = `bill-${booking.bookingId || `BK-${booking.id}`}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

// Legacy function for backward compatibility
export function generateBookingBillLegacy(booking: Booking, officeName: string = "LogiGoFast", companyGST?: string, user?: any) {
  return generateBookingBill(booking, officeName, companyGST, user);
}