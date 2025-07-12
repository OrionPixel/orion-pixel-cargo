import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { generateBarcode, generateQRCode, generatePrintableLabel, BarcodeData } from '@/lib/barcodeGenerator';
import { Printer, Download, Package } from 'lucide-react';
import type { Booking } from '@shared/schema';

interface BarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  officeName?: string;
}

export default function BarcodeModal({ isOpen, onClose, booking, officeName = "CargoFlow Logistics" }: BarcodeModalProps) {
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);
  const [barcodeImage, setBarcodeImage] = useState<string>('');
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen && booking) {
      setTimeout(() => {
        if (barcodeCanvasRef.current) {
          generateCodes();
        }
      }, 100);
    }
  }, [isOpen, booking]);

  const generateCodes = async () => {
    if (!booking || !barcodeCanvasRef.current) return;

    setIsGenerating(true);
    
    try {
      const barcodeData: BarcodeData = {
        bookingId: booking.bookingId || '',
        trackingNumber: booking.trackingNumber || '',
        officeName: officeName,
        senderName: booking.senderName || '',
        receiverName: booking.receiverName || '',
        pickupCity: booking.pickupCity || '',
        deliveryCity: booking.deliveryCity || '',
        weight: Number(booking.weight) || 0,
        totalAmount: Number(booking.totalAmount) || 0,
        paymentStatus: booking.paymentStatus || 'pending',
        createdAt: String(booking.createdAt) || new Date().toISOString()
      };

      console.log('Generating codes for:', barcodeData);

      const barcodeImg = generateBarcode(barcodeData, barcodeCanvasRef.current);
      console.log('Barcode generated:', barcodeImg ? 'Success' : 'Failed');
      setBarcodeImage(barcodeImg);

      const qrImg = await generateQRCode(barcodeData);
      console.log('QR code generated:', qrImg ? 'Success' : 'Failed');
      setQrCodeImage(qrImg);
    } catch (error) {
      console.error('Error generating codes:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    if (!booking || !barcodeCanvasRef.current) return;

    // Get the barcode canvas image
    const barcodeCanvas = barcodeCanvasRef.current;
    const barcodeImageData = barcodeCanvas.toDataURL('image/png');

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Barcode Label</title>
          <style>
            * { margin: 0; padding: 0; }
            body { 
              background: white;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .barcode-label {
              max-width: 100%;
              height: auto;
            }
            @media print {
              body { 
                margin: 0; 
                padding: 0;
                min-height: auto;
              }
              .barcode-label {
                width: 100%;
                height: auto;
              }
            }
          </style>
        </head>
        <body>
          <img src="${barcodeImageData}" alt="Barcode Label" class="barcode-label" />
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  const handleDownload = () => {
    if (!booking || !barcodeImage || !qrCodeImage) return;

    const barcodeData: BarcodeData = {
      bookingId: booking.bookingId || '',
      trackingNumber: booking.trackingNumber || '',
      officeName: officeName,
      senderName: booking.senderName || '',
      receiverName: booking.receiverName || '',
      pickupCity: booking.pickupCity || '',
      deliveryCity: booking.deliveryCity || '',
      weight: Number(booking.weight) || 0,
      totalAmount: Number(booking.totalAmount) || 0,
      paymentStatus: booking.paymentStatus || 'pending',
      createdAt: String(booking.createdAt) || new Date().toISOString()
    };

    const labelHTML = generatePrintableLabel(barcodeData, barcodeImage, qrCodeImage);
    
    const blob = new Blob([labelHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shipping-label-${booking.trackingNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Shipping Label & Barcode
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Only Barcode Label */}
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Printable Barcode Label</h3>
            <p className="text-sm text-gray-600">All booking details included on label</p>
          </div>
          
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg shadow-lg border">
              <canvas 
                ref={barcodeCanvasRef} 
                className="block mx-auto"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>
          </div>
          
          <div className="text-center text-sm text-gray-600">
            <p>Complete shipping label with sender, receiver, and tracking information</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleDownload} className="bg-green-600 hover:bg-green-700">
              <Download className="h-4 w-4 mr-2" />
              Download Label
            </Button>
            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
              <Printer className="h-4 w-4 mr-2" />
              Print Label
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}