import React, { useState } from 'react';
import { X, Printer, Download, Send, Check, Loader2, FileText, Mail, ShieldCheck } from 'lucide-react';
import { CompactOrder, BoutiqueSettings } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface InvoiceModalProps {
  order: CompactOrder;
  onClose: () => void;
  settings: BoutiqueSettings;
}

export default function InvoiceModal({ order, onClose, settings }: InvoiceModalProps) {
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendStep, setSendStep] = useState('');

  // Computations
  const subtotal = order.items.reduce((acc, item) => acc + item.watch.price * item.quantity, 0);
  
  // Custom wrapping option selection list
  const giftBoxOpts = settings.giftBoxOptions || [
    { id: 'leather', name: 'Luxury Leather Gift Box', price: 1250 }
  ];
  // Calculate gift wrapping cost
  const giftWrappingCost = order.shippingDetails.giftWrapping ? (giftBoxOpts[0]?.price || 1250) : 0;
  
  // Free shipping rules
  const isFreeShippingAvailable = settings.freeShippingEnabled !== false;
  const threshold = settings.freeShippingThreshold !== undefined ? settings.freeShippingThreshold : 400000;
  const shippingCost = (isFreeShippingAvailable && subtotal > threshold) || subtotal === 0 ? 0 : 12500;
  
  // Derive discount amount to match total exactly
  const calculatedTotal = subtotal + giftWrappingCost + shippingCost;
  const discountAmount = Math.max(0, calculatedTotal - order.total);

  // Send physical mail/dispatch simulation
  const handleSendInvoice = () => {
    setIsSending(true);
    setSendSuccess(false);
    
    // Staged high fidelity animation notifications 
    const steps = [
      'Establishing secure cryptographic session for Swiss registries...',
      'Bundling timepiece serial allocations and certification logs...',
      'Transmitting secure PDF ledger to customer inbox...',
      'Registering dispatch confirmation onto local web ledger...'
    ];

    let currentStep = 0;
    setSendStep(steps[currentStep]);

    const interval = setInterval(() => {
      currentStep += 1;
      if (currentStep < steps.length) {
        setSendStep(steps[currentStep]);
      } else {
        clearInterval(interval);
        setIsSending(false);
        setSendSuccess(true);
        setTimeout(() => setSendSuccess(false), 5000);
      }
    }, 800);
  };

  // PDF generation
  const handleDownloadPDF = async () => {
    try {
      const input = document.getElementById('printable-invoice-canvas');
      if (!input) {
        console.error('Invoice canvas element not found');
        return;
      }

      console.log('Generating PDF...');
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF (A4 size)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice-${order.id}.pdf`);
      console.log('PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  // Browser system layout printing
  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="invoice-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      {/* Styles tailored specifically to isolate print preview beautifully */}

      <div className="bg-[#111111] border border-white/10 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:max-h-[90vh] animate-fade-in no-print">
        
        {/* Modal Action Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-black/60 border-b border-white/5">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-amber-500" />
            <h3 className="font-serif text-base font-semibold text-white">Hublot Allocation Invoice</h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-lg cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Outer body for visual dashboard representation */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Action Toolbar buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
            <div className="text-[11px] text-stone-400 font-mono">
              Action Panel to dispatch, download or compile the physical parcel invoice.
            </div>
            
            <div className="flex flex-wrap gap-2">
              {/* Send invoice button */}
              <button
                type="button"
                onClick={handleSendInvoice}
                disabled={isSending}
                className="bg-amber-600/10 border border-amber-500/25 hover:bg-amber-600/20 text-amber-500 hover:text-amber-400 px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>{isSending ? 'Transmitting...' : 'Send Invoice'}</span>
              </button>

              {/* Download Invoice button */}
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="bg-stone-900 border border-white/10 hover:bg-stone-800 text-stone-200 px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download PDF</span>
              </button>

              {/* Print Invoice button */}
              <button
                type="button"
                onClick={handlePrint}
                className="bg-white hover:bg-stone-200 text-black px-4 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>

          {/* Staged Sending status banner */}
          {isSending && (
            <div className="bg-amber-500/5 border border-amber-500/20 p-3.5 rounded-xl flex items-center space-x-3 text-xs text-amber-400 font-mono animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin shrink-0 text-amber-500" />
              <span>{sendStep}</span>
            </div>
          )}

          {sendSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl flex items-center space-x-3 text-xs text-emerald-400 font-mono">
              <Check className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
              <span>Invoice ledger transmitted directly to <strong>{order.shippingDetails.email}</strong>. Digital copy registered.</span>
            </div>
          )}

          {/* Invoice Frame Visual */}
          <div className="border border-white/5 rounded-xl overflow-hidden bg-black p-1">
            <div className="text-[11px] font-mono text-stone-500 text-right px-4 pt-2 select-none uppercase">
              • Horology Print-Compatible Layout Canvas •
            </div>
            
            {/* INVOICE CANVAS */}
            <div id="printable-invoice-canvas" className="bg-white text-stone-900 p-8 sm:p-10 font-sans border border-stone-200 shadow-sm">
              
              {/* Header block logo & details */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-stone-200 pb-6 print-border">
                <div className="space-y-1 text-left">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="h-5 w-5 text-amber-700 print-text-dark" />
                    <span className="font-serif font-bold text-lg text-black uppercase tracking-wider print-text-dark">
                      {settings.storeName || 'HUBLOT BOUTIQUE'}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-stone-600 print-text-gray tracking-widest uppercase">
                    Premium Horology Geneva • Certified Allocation
                  </p>
                </div>

                <div className="text-left sm:text-right space-y-1 font-mono text-xs">
                  <p className="text-black font-bold print-text-dark">INVOICE LEDGER</p>
                  <p className="text-stone-600 print-text-gray">No: <span className="text-amber-700 font-bold">{order.id}</span></p>
                  <p className="text-stone-600 print-text-gray">Date: {order.date}</p>
                  <p className="text-stone-600 print-text-gray">Status: <span className="uppercase text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">{order.status}</span></p>
                </div>
              </div>

              {/* Courier and Client Info layout row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-stone-200 print-border text-xs">
                
                {/* Billing details / boutique address */}
                <div className="space-y-2 text-left">
                  <span className="text-[9px] font-mono text-stone-500 uppercase tracking-widest block font-bold">ISSUER OUTLET OFFICE</span>
                  <div className="space-y-0.5 font-serif text-stone-900 print-text-dark">
                    <p className="font-semibold text-black print-text-dark">Official Swiss Hublot Horology</p>
                    <p className="not-italic text-[11px] font-sans text-stone-600 print-text-gray leading-relaxed max-w-xs">
                      Rue de la Constitution 12<br />
                      Geneva, 1204 Switzerland<br />
                      Secure Dispatch: air-priority@hublot-premium.ch<br />
                      Boutique Registry: +41 22 310 1205
                    </p>
                  </div>
                </div>

                {/* Shipping details */}
                <div className="space-y-2 text-left">
                  <span className="text-[9px] font-mono text-stone-500 uppercase tracking-widest block font-bold">COURIER RECIPIENT</span>
                  <div className="space-y-0.5 font-serif text-stone-900 print-text-dark">
                    <p className="font-semibold text-black print-text-dark">{order.shippingDetails.fullName}</p>
                    <div className="not-italic font-sans text-stone-600 print-text-gray text-[11px] space-y-0.5">
                      <p>{order.shippingDetails.address}</p>
                      <p>{order.shippingDetails.city}, {order.shippingDetails.postalCode}</p>
                      <p className="uppercase">{order.shippingDetails.country}</p>
                      <p className="mt-1 font-mono text-[10px] text-stone-600 print-text-gray text-amber-700">
                        {order.shippingDetails.email} {order.shippingDetails.phone ? `• ${order.shippingDetails.phone}` : ''}
                      </p>
                      <p className="font-mono text-[9px] uppercase tracking-wider text-amber-800/85">
                        CARRIER METHOD: DHL SECURE {order.shippingDetails.shippingMethod.toUpperCase()} DISPATCH
                      </p>
                      <p className="font-mono text-[9px] uppercase tracking-wider">
                        REGISTRY TRACKING: {order.trackingNumber}
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Table list of line items */}
              <div className="py-6 space-y-4">
                <span className="text-[9px] font-mono text-stone-500 uppercase tracking-widest block text-left font-bold">ALLOCATED LUXURY ASSETS</span>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 print-border text-[9px] font-mono uppercase tracking-widest text-stone-600 print-text-gray">
                        <th className="py-2.5 font-bold">Watch Allocation Summary</th>
                        <th className="py-2.5 text-right font-bold">Base Cost</th>
                        <th className="py-2.5 text-center font-bold">Qty</th>
                        <th className="py-2.5 text-right font-bold">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 print-border">
                      {order.items.map((item) => (
                        <tr key={item.watch.id} className="text-[11px] print-text-dark">
                          <td className="py-3.5">
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 bg-stone-100 p-0.5 rounded border border-stone-200 flex items-center justify-center shrink-0 print-border">
                                <img src={item.watch.imageUrl} alt={item.watch.name} onError={(e) => { (e.target as any).src='https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=300'; }} referrerPolicy="no-referrer" className="max-h-full max-w-full object-contain" />
                              </div>
                              <div>
                                <p className="font-serif font-bold text-black print-text-dark">{item.watch.name}</p>
                                <p className="text-[9px] font-mono text-stone-600 uppercase tracking-wider print-text-gray">
                                  {item.watch.brand} • Case: {item.watch.specs?.caseSize || 'Standard'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 text-right font-mono text-stone-700 print-text-dark">
                            ₹{item.watch.price.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                          </td>
                          <td className="py-3.5 text-center font-mono text-stone-700 print-text-dark">
                            {item.quantity}
                          </td>
                          <td className="py-3.5 text-right font-mono text-black font-semibold print-text-dark">
                            ₹{(item.watch.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Breakdowns block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-stone-200 print-border text-xs">
                
                {/* Notes Column */}
                <div className="text-left text-[11px] text-stone-600 print-text-gray leading-relaxed font-sans space-y-2">
                  <p className="font-mono text-[9px] uppercase tracking-wider font-bold">Terms & Warranties</p>
                  <p>
                    All Luxury Swiss Swiss-made Horology assets carry an official active boutique warranty covering calibration errors and tourbillon components for a term of up to 48 months from registration.
                  </p>
                  <p className="text-[10px] text-amber-700/80">
                    * For physical parcels, please print this original document and insert it directly into the side sleeve of the packing crate.
                  </p>
                </div>

                {/* Subtotals column breakdown */}
                <div className="space-y-2.5 font-mono text-stone-900 print-text-dark text-right">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-600 print-text-gray uppercase text-[9px] tracking-wider">Cart Subtotal:</span>
                    <span className="text-stone-900 print-text-dark">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 1 })}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-xs text-rose-700">
                      <span className="text-stone-600 print-text-gray uppercase text-[9px] tracking-wider">Discount ({order.shippingDetails.discountCode || 'PROMO'}):</span>
                      <span className="font-bold">-₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 1 })}</span>
                    </div>
                  )}

                  {order.shippingDetails.giftWrapping && (
                    <div className="flex justify-between text-xs">
                      <span className="text-stone-600 print-text-gray uppercase text-[9px] tracking-wider">Premium Wooden Gift Box:</span>
                      <span className="text-stone-900 print-text-dark">₹{giftWrappingCost.toLocaleString('en-IN', { minimumFractionDigits: 1 })}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-xs">
                    <span className="text-stone-600 print-text-gray uppercase text-[9px] tracking-wider">Insured Air Carriage:</span>
                    <span className="text-stone-900 print-text-dark">
                      {shippingCost === 0 ? (
                        <span className="text-emerald-700 font-bold uppercase text-[10px]">Complimentary</span>
                      ) : (
                        `₹${shippingCost.toLocaleString('en-IN', { minimumFractionDigits: 1 })}`
                      )}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-stone-200 print-border flex justify-between items-center text-sm font-bold text-stone-900 print-text-dark">
                    <span className="font-serif text-stone-600 print-text-gray text-xs font-semibold tracking-wider uppercase">INVOICE BALANCE:</span>
                    <span className="text-amber-700 text-base font-bold print-text-dark">
                      ₹{order.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

              </div>

              {/* Verification Seal signature block */}
              <div className="mt-8 pt-6 border-t border-white/5 text-center text-[10px] font-mono text-stone-500 print-text-gray uppercase tracking-widest">
                Authorized Signature Registrar • Hublot Genève S.A.
              </div>

            </div>
          </div>

        </div>

        {/* Modal Action Footer */}
        <div className="px-6 py-4 bg-black/60 border-t border-white/5 flex justify-end no-print">
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1c1c1c] border border-white/10 hover:bg-white/5 text-stone-200 text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer"
          >
            Close Invoice Board
          </button>
        </div>

      </div>
    </div>
  );
}
