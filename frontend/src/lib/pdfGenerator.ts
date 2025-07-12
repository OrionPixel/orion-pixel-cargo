import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Booking } from '@shared/schema';

export interface PDFExportOptions {
  startDate?: string;
  endDate?: string;
  title?: string;
}

export function generateBookingsPDF(bookings: Booking[], options: PDFExportOptions = {}) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('CargoFlow - Booking Report', 20, 20);
  
  // Date range info
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  const dateRange = options.startDate && options.endDate 
    ? `${formatDate(options.startDate)} to ${formatDate(options.endDate)}`
    : options.startDate 
    ? `Date: ${formatDate(options.startDate)}`
    : 'All Bookings';
  
  doc.text(`Report Period: ${dateRange}`, 20, 30);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 20, 38);
  doc.text(`Total Bookings: ${bookings.length}`, 20, 46);
  
  // Summary statistics (without revenue)
  const deliveredCount = bookings.filter(b => b.status === 'delivered').length;
  const inTransitCount = bookings.filter(b => b.status === 'in_transit').length;
  const pendingCount = bookings.filter(b => b.status === 'booked').length;
  
  doc.setFontSize(10);
  doc.text(`Status Overview: Delivered: ${deliveredCount} | In Transit: ${inTransitCount} | Pending: ${pendingCount}`, 20, 58);
  
  // Create comprehensive table data
  const tableData = bookings.map((booking, index) => [
    (index + 1).toString(),
    booking.bookingId || `BK-${booking.id}`,
    `${booking.pickupCity} → ${booking.deliveryCity}\n${booking.distance || 0} km`,
    formatDate(String(booking.pickupDateTime)),
    `${booking.senderName || 'N/A'}\n${booking.senderPhone || 'N/A'}`,
    `${booking.receiverName || 'N/A'}\n${booking.receiverPhone || 'N/A'}`,
    `Items: ${booking.itemCount || 1}\nGeneral\n${booking.weight || 0} kg`,
    `Vehicle: ${booking.vehicleId || 'N/A'}\n${booking.bookingType?.replace('_', ' ') || 'Full Load'}`,
    `Base: ₹${Number(booking.baseRate || 0).toLocaleString('en-IN')}\nGST: ₹${Number(booking.gstAmount || 0).toLocaleString('en-IN')}\nTotal: ₹${Number(booking.totalAmount || 0).toLocaleString('en-IN')}`,
    `${capitalizeStatus(booking.status || 'booked')}\n${booking.paymentStatus || 'Pending'}`
  ]);
  
  // Generate comprehensive table
  autoTable(doc, {
    head: [['#', 'Booking ID', 'Route Info', 'Pickup Date', 'Sender Details', 'Receiver Details', 'Item/Parcel Details', 'Vehicle Info', 'Pricing', 'Status']],
    body: tableData,
    startY: 65,
    styles: {
      fontSize: 7,
      cellPadding: 2,
      overflow: 'linebreak',
      valign: 'top'
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 2,
      valign: 'top',
      lineColor: [200, 200, 200],
      lineWidth: 0.5
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 8 },   // #
      1: { cellWidth: 18 },  // Booking ID
      2: { cellWidth: 25 },  // Route Info
      3: { cellWidth: 18 },  // Pickup Date
      4: { cellWidth: 22 },  // Sender Details
      5: { cellWidth: 22 },  // Receiver Details
      6: { cellWidth: 25 },  // Item/Parcel Details
      7: { cellWidth: 20 },  // Vehicle Info
      8: { cellWidth: 25 },  // Pricing
      9: { cellWidth: 18 },  // Status
    },
    margin: { left: 10, right: 10 },
    pageBreak: 'auto',
    showHead: 'everyPage'
  });
  
  // Footer
  const pageCount = doc.internal.pages.length;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount} | CargoFlow Logistics Management System`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  return doc;
}

export function downloadBookingsPDF(bookings: Booking[], options: PDFExportOptions = {}) {
  const doc = generateBookingsPDF(bookings, options);
  const filename = `bookings-report-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function capitalizeStatus(status: string): string {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

// Generate individual booking bill
export function generateBookingBill(booking: Booking, officeName: string = "LogiGoFast Logistics") {
  const doc = new jsPDF();
  
  // Header with company info
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text(officeName, 20, 25);
  
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text('CARGO BOOKING BILL', 20, 35);
  
  // Bill details
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Bill No: ${booking.bookingId || `BK-${booking.id}`}`, 140, 25);
  doc.text(`Date: ${formatDate(String(booking.createdAt || new Date().toISOString()))}`, 140, 32);
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
  doc.text(`Name: ${booking.senderName || 'N/A'}`, 20, 65);
  doc.text(`Phone: ${booking.senderPhone || 'N/A'}`, 20, 72);
  doc.text(`GST: ${booking.senderGST || 'N/A'}`, 20, 79);
  doc.text(`Address: ${booking.pickupAddress || 'N/A'}`, 20, 86);
  doc.text(`City: ${booking.pickupCity || 'N/A'}`, 20, 93);
  
  // Receiver details
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('RECEIVER DETAILS', 110, 55);
  
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Name: ${booking.receiverName || 'N/A'}`, 110, 65);
  doc.text(`Phone: ${booking.receiverPhone || 'N/A'}`, 110, 72);
  doc.text(`GST: ${booking.receiverGST || 'N/A'}`, 110, 79);
  doc.text(`Address: ${booking.deliveryAddress || 'N/A'}`, 110, 86);
  doc.text(`City: ${booking.deliveryCity || 'N/A'}`, 110, 93);
  
  // Line separator
  doc.line(20, 100, 190, 100);
  
  // Cargo details
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('CARGO DETAILS', 20, 110);
  
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Description: ${booking.cargoDescription || 'General Cargo'}`, 20, 120);
  doc.text(`Weight: ${booking.weight || 0} kg`, 20, 127);
  doc.text(`Items: ${booking.itemCount || 1}`, 20, 134);
  doc.text(`Booking Type: ${booking.bookingType?.replace('_', ' ') || 'FTL'}`, 20, 148);
  
  // Transport details
  doc.text(`Distance: ${booking.distance || 0} km`, 110, 120);
  doc.text(`Pickup: ${formatDate(String(booking.pickupDateTime))}`, 110, 127);
  doc.text(`Delivery: ${formatDate(String(booking.deliveryDateTime))}`, 110, 134);
  doc.text(`Vehicle: ${booking.vehicleId || 'To be assigned'}`, 110, 141);
  
  // Line separator
  doc.line(20, 155, 190, 155);
  
  // Billing details
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('BILLING DETAILS', 20, 165);
  
  // Create billing table
  const billingData = [
    ['Description', 'Amount (₹)'],
    ['Base Transportation Rate', Math.ceil(Number(booking.baseRate || 0)).toLocaleString('en-IN')],
  ];
  
  // Add handling charges if present
  if (booking.handlingCharges && Number(booking.handlingCharges) > 0) {
    billingData.push(['Handling Charges', Math.ceil(Number(booking.handlingCharges)).toLocaleString('en-IN')]);
  }
  
  billingData.push(
    ['GST (18%)', Math.ceil(Number(booking.gstAmount || 0)).toLocaleString('en-IN')],
    ['Total Amount', Math.ceil(Number(booking.totalAmount || 0)).toLocaleString('en-IN')]
  );
  
  autoTable(doc, {
    startY: 170,
    head: [billingData[0]],
    body: billingData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [70, 130, 180], textColor: 255, fontStyle: 'bold' },
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
  doc.text('Thank you for choosing LogiGoFast Logistics!', 20, finalY + 40);
  doc.text('For support: support@logigofast.com | +91 7000758030', 20, finalY + 47);
  
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
export function downloadBookingBill(booking: Booking, officeName: string = "LogiGoFast Logistics") {
  const doc = generateBookingBill(booking, officeName);
  const filename = `bill-${booking.bookingId || `BK-${booking.id}`}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}