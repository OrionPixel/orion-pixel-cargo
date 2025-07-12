import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

export interface BarcodeData {
  bookingId: string;
  trackingNumber: string;
  officeName: string;
  senderName: string;
  receiverName: string;
  pickupCity: string;
  deliveryCity: string;
  weight: number;
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
}

export const generateBarcode = (data: BarcodeData, canvas: HTMLCanvasElement): string => {
  try {
    // Use dynamic tracking number from booking data
    const barcodeText = data.trackingNumber || data.bookingId || '10000914';
    
    console.log('Generating dynamic barcode for:', barcodeText);
    
    // Set landscape canvas dimensions for professional label
    canvas.width = 800;
    canvas.height = 300;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Clear and set white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      
      // Company name at top
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(data.officeName, canvas.width / 2, 35);
      
      // Shipment details line
      ctx.font = '12px Arial';
      ctx.fillText('CARGO SHIPMENT LABEL', canvas.width / 2, 55);
      
      // Left side - FROM details
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('FROM:', 20, 85);
      
      ctx.font = '12px Arial';
      ctx.fillText(data.senderName, 20, 105);
      ctx.fillText(data.pickupCity, 20, 120);
      
      // Right side - TO details  
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('TO:', canvas.width / 2 + 20, 85);
      
      ctx.font = '12px Arial';
      ctx.fillText(data.receiverName, canvas.width / 2 + 20, 105);
      ctx.fillText(data.deliveryCity, canvas.width / 2 + 20, 120);
      
      // Shipment info
      ctx.font = '11px Arial';
      ctx.fillText(`Weight: ${data.weight}kg | Amount: ₹${data.totalAmount} | Status: ${data.paymentStatus.toUpperCase()}`, 20, 145);
      
      // Generate main barcode
      const barcodeCanvas = document.createElement('canvas');
      JsBarcode(barcodeCanvas, barcodeText, {
        format: "CODE128",
        width: 3,
        height: 60,
        displayValue: true,
        font: "Arial",
        fontSize: 16,
        textAlign: "center",
        textPosition: "bottom",
        textMargin: 10,
        background: "transparent",
        lineColor: "#000000",
        margin: 0
      });
      
      // Center barcode
      const barcodeX = (canvas.width - barcodeCanvas.width) / 2;
      ctx.drawImage(barcodeCanvas, barcodeX, 160);
      
      // Add booking ID
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Booking: ${data.bookingId}`, canvas.width / 2, 275);
      
      // Add date
      ctx.font = '10px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`Date: ${new Date(data.createdAt).toLocaleDateString('en-IN')}`, canvas.width - 20, 275);
      
      // Add company branding aligned with booking text
      ctx.font = '9px Arial';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#666666';
      ctx.fillText(`Powered by LogiGoFast & Shipping by ${data.officeName}`, 20, 275);
    }
    
    console.log('Dynamic barcode label generated successfully');
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating dynamic barcode:', error);
    return '';
  }
};

export const generateQRCode = async (data: BarcodeData): Promise<string> => {
  try {
    const qrData = {
      bookingId: data.bookingId,
      tracking: data.trackingNumber,
      office: data.officeName,
      from: data.pickupCity,
      to: data.deliveryCity,
      sender: data.senderName,
      receiver: data.receiverName,
      weight: data.weight,
      amount: data.totalAmount,
      status: data.paymentStatus,
      date: data.createdAt
    };
    
    const qrString = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 200
    });
    
    return qrString;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
};

export const generatePrintableLabel = (data: BarcodeData, barcodeImage: string, qrCodeImage: string): string => {
  const labelHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Shipping Label - ${data.trackingNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
        }
        .label {
          border: 2px solid #000;
          width: 400px;
          margin: 0 auto;
          padding: 15px;
          background: white;
        }
        .header {
          text-align: center;
          border-bottom: 1px solid #ccc;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .office-name {
          font-size: 18px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 5px;
        }
        .tracking {
          font-size: 16px;
          font-weight: bold;
          color: #dc2626;
        }
        .section {
          margin-bottom: 12px;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 4px;
        }
        .section-title {
          font-weight: bold;
          font-size: 12px;
          color: #374151;
          margin-bottom: 4px;
        }
        .section-content {
          font-size: 11px;
          color: #1f2937;
        }
        .codes-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #ccc;
        }
        .barcode-container {
          text-align: center;
          flex: 1;
        }
        .qr-container {
          text-align: center;
          margin-left: 20px;
        }
        .codes-label {
          font-size: 10px;
          color: #6b7280;
          margin-bottom: 5px;
        }
        .barcode-img, .qr-img {
          max-width: 100%;
          height: auto;
        }
        .footer {
          text-align: center;
          font-size: 10px;
          color: #6b7280;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #e5e7eb;
        }
        @media print {
          body { margin: 0; padding: 10px; }
          .label { border: 2px solid #000; }
        }
      </style>
    </head>
    <body>
      <div class="label">
        <div class="header">
          <div class="office-name">${data.officeName}</div>
          <div class="tracking">Tracking: ${data.trackingNumber}</div>
        </div>
        
        <div class="section">
          <div class="section-title">FROM</div>
          <div class="section-content">
            <strong>${data.senderName}</strong><br>
            ${data.pickupCity}
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">TO</div>
          <div class="section-content">
            <strong>${data.receiverName}</strong><br>
            ${data.deliveryCity}
          </div>
        </div>
        
        <div style="display: flex; gap: 10px;">
          <div class="section" style="flex: 1;">
            <div class="section-title">WEIGHT</div>
            <div class="section-content">${data.weight} kg</div>
          </div>
          <div class="section" style="flex: 1;">
            <div class="section-title">AMOUNT</div>
            <div class="section-content">₹${data.totalAmount}</div>
          </div>
          <div class="section" style="flex: 1;">
            <div class="section-title">STATUS</div>
            <div class="section-content">${data.paymentStatus.toUpperCase()}</div>
          </div>
        </div>
        
        <div class="codes-section">
          <div class="barcode-container">
            <div class="codes-label">BARCODE</div>
            <img src="${barcodeImage}" alt="Barcode" class="barcode-img">
          </div>
          <div class="qr-container">
            <div class="codes-label">QR CODE</div>
            <img src="${qrCodeImage}" alt="QR Code" class="qr-img" style="width: 80px; height: 80px;">
          </div>
        </div>
        
        <div class="footer">
          Generated on ${new Date(data.createdAt).toLocaleString('en-IN')}<br>
          Booking ID: ${data.bookingId}<br>
          <small style="color: #666; font-size: 9px;">Powered by LogiGoFast & Shipping by ${data.officeName}</small>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return labelHTML;
};