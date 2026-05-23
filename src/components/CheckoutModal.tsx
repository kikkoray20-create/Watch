import React, { useState } from 'react';
import { X, CreditCard, ChevronRight, CheckCircle2, Terminal, RefreshCw, Send, Loader2 } from 'lucide-react';
import { CartItem, CheckoutDetails, WebhookLog } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  appliedPromo: { code: string; percent: number } | null;
  giftWrapping: boolean;
  onOrderCompleted: (details: CheckoutDetails, generatedLogs: WebhookLog[]) => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cart,
  appliedPromo,
  giftWrapping,
  onOrderCompleted,
}: CheckoutModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'United States',
    shippingMethod: 'air_priority',
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
  });

  if (!isOpen) return null;

  // Calculative indices
  const subtotal = cart.reduce((acc, item) => acc + item.watch.price * item.quantity, 0);
  const discountAmount = appliedPromo ? (subtotal * appliedPromo.percent) / 100 : 0;
  const giftWrappingCost = giftWrapping ? 1250.00 : 0;
  const shippingCost = subtotal > 400000 || subtotal === 0 ? 0.00 : 12500.00;
  const totalAmount = subtotal - discountAmount + giftWrappingCost + shippingCost;

  // Simple handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Safe credentials helper
  const handleAutoFill = () => {
    setFormData({
      fullName: 'Alexandre Horologue',
      email: 'alex.horo@premium.com',
      address: '742 Chronograph Avenue',
      city: 'Geneva',
      postalCode: '1201',
      country: 'Switzerland',
      shippingMethod: 'air_priority',
      cardNumber: '4111 •••• •••• 4242',
      cardName: 'Alexandre Horologue',
      expiry: '12/29',
      cvv: '399',
    });
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.fullName || !formData.email || !formData.address || !formData.city) {
        alert('Please complete all contact and mailing coordinates.');
        return;
      }
      setStep(2);
    }
  };

  const handlePay = () => {
    if (!formData.cardNumber || !formData.cardName || !formData.expiry || !formData.cvv) {
      alert('Please fill out the credit card specifications.');
      return;
    }

    setIsProcessing(true);

    // Simulate luxury API gateway check in 1.5 seconds
    setTimeout(() => {
      setIsProcessing(false);
      setStep(3);

      // Trigger Webhook Event logs matching official Shopify standards
      const orderNumber = Math.floor(1000 + Math.random() * 9000);
      const trackingCode = `LP-${Math.floor(100000 + Math.random() * 900000)}-CH`;
      
      const orderLogs: WebhookLog[] = [
        {
          id: `webhook-${Date.now()}-1`,
          event: 'checkouts/create',
          timestamp: new Date().toLocaleTimeString(),
          status: 'success',
          payload: {
            id: Date.now(),
            cart_subtotal: subtotal,
            promo_applied: appliedPromo?.code || 'None',
            email: formData.email,
          },
          explanation: 'Dispatched on secure initialization. Shopify caches active shopping carts to support multi-device retrieval.'
        },
        {
          id: `webhook-${Date.now()}-2`,
          event: 'orders/create',
          timestamp: new Date(Date.now() + 200).toLocaleTimeString(),
          status: 'success',
          payload: {
            order_id: `GID-ORDER-${orderNumber}`,
            amount: totalAmount,
            line_items: cart.map(item => ({
              sku: `${item.watch.brand.slice(0,4).toUpperCase()}-${item.watch.id.toUpperCase()}`,
              name: item.watch.name,
              qty: item.quantity,
              unit_price: item.watch.price
            })),
            is_gift_wrapped: giftWrapping,
            buyer_coordinates: {
              name: formData.fullName,
              city: formData.city,
              country: formData.country
            }
          },
          explanation: 'Fires automatically upon gateway card authorization. Initiates logistics API requests and invoice indexing.'
        },
        {
          id: `webhook-${Date.now()}-3`,
          event: 'inventory/deplete',
          timestamp: new Date(Date.now() + 450).toLocaleTimeString(),
          status: 'success',
          payload: {
            reason: "Secure order checkout",
            items_adjusted: cart.map(item => ({
              sku: `${item.watch.brand.slice(0,4).toUpperCase()}-${item.watch.id.toUpperCase()}`,
              previous_inventory: item.watch.stock,
              committed_inventory: item.quantity,
              remaining_inventory: Math.max(0, item.watch.stock - item.quantity)
            }))
          },
          explanation: 'Instructs the database cache layer to decrease real-time catalog stock quantities to prevent double-allocations.'
        },
        {
          id: `webhook-${Date.now()}-4`,
          event: 'fulfillments/update',
          timestamp: new Date(Date.now() + 700).toLocaleTimeString(),
          status: 'success',
          payload: {
            tracking_number: trackingCode,
            courier: "DHL Air Priority Express",
            warehouse_origin: "Geneva Central Warehouse No.4",
            status: "In Transit"
          },
          explanation: 'Dispatched when shipping labels are generated. Communicates telemetry tracking to customer dashboard routes.'
        }
      ];

      onOrderCompleted(formData as CheckoutDetails, orderLogs);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-xs transition-opacity" onClick={onClose}></div>

      {/* Main Box containing Checkout stage */}
      <div className="bg-[#0e0e0e] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative border border-white/5 transform transition-all text-white">
        
        {/* Header toolbar */}
        <div className="bg-[#121212] px-6 py-4 border-b border-white/5 flex justify-between items-center select-none">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-amber-500" />
            <span className="font-serif text-base font-semibold text-white">Secure Order Gateway</span>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/5 border border-white/5 transition-all text-stone-300 cursor-pointer"
            disabled={isProcessing}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Status tracker timeline nodes */}
        <div className="px-6 py-3 border-b border-white/5 flex items-center space-x-2 text-xs font-mono text-stone-400 select-none bg-[#121212]">
          <span className={step === 1 ? 'text-amber-500 font-bold' : 'text-stone-500'}>1. Delivery Info</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className={step === 2 ? 'text-amber-500 font-bold' : 'text-stone-500'}>2. Card details</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className={step === 3 ? 'text-emerald-400 font-bold' : 'text-stone-500'}>3. Completion</span>
        </div>

        {/* Wizard content core */}
        <div className="p-6">
          
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4 text-left">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 mb-2 gap-2">
                <span className="text-[11px] text-amber-300 font-mono">Simulate a quick test checkout:</span>
                <button
                  type="button"
                  onClick={handleAutoFill}
                  className="bg-white text-black hover:bg-amber-500 font-bold text-[10px] py-1 px-3.5 rounded-md transition-colors whitespace-nowrap cursor-pointer hover:text-black"
                >
                  ⚡ Autofill Luxury Address
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono uppercase text-stone-400 block mb-1">Full Subscriber Name</label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Alexandre Horologue"
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#121212] text-white text-sm focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-stone-400 block mb-1">Contact Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="alex.horo@premium.com"
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#121212] text-white text-sm focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-stone-400 block mb-1">Shipping Destination Address</label>
                <input
                  type="text"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="742 Chronograph Avenue"
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#121212] text-white text-sm focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-mono uppercase text-stone-400 block mb-1">City / Region</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Geneva"
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#121212] text-white text-sm focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-stone-400 block mb-1">Postal Zip Code</label>
                  <input
                    type="text"
                    name="postalCode"
                    required
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    placeholder="1201"
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#121212] text-white text-sm focus:ring-1 focus:ring-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-stone-400 block mb-1">Country</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#121212] text-white text-sm focus:ring-1 focus:ring-amber-500 focus:outline-none dropdown-dark"
                >
                  <option value="India">India</option>
                  <option value="Switzerland">Switzerland</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Germany">Germany</option>
                  <option value="Japan">Japan</option>
                </select>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-white/5 gap-4">
                <div className="text-left font-sans">
                  <span className="text-[9px] font-mono text-stone-500 uppercase tracking-widest block">Total Invoice</span>
                  <span className="font-serif font-semibold text-lg text-white">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <button
                  type="submit"
                  id="delivery-next-btn"
                  className="w-full sm:w-auto bg-white text-black hover:bg-amber-500 font-bold px-6 py-2.5 rounded-lg text-xs tracking-wider transition-colors cursor-pointer"
                >
                  Proceed to Payment Selection
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-4 text-left">
              {/* Payment instructions */}
              <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="h-9 w-14 bg-black rounded-md flex items-center justify-center text-white/90 font-mono text-xs font-bold leading-none tracking-widest p-1 border border-white/10 shrink-0">
                  CHRONO
                </div>
                <div className="text-[11px] text-stone-400 leading-relaxed">
                  <b>Simulated Vault</b>. Your transaction is mock-tokenized securely under SSL. Private credentials never reach or affect any live billing channels.
                </div>
              </div>

              {/* Credit card styling mockup */}
              <div className="bg-gradient-to-r from-stone-900 via-[#121212] to-stone-900 p-6 rounded-2xl text-white shadow-lg space-y-6 relative border border-white/10 overflow-hidden select-none">
                <div className="absolute right-6 top-6 opacity-5">
                  <Terminal className="h-28 w-28 text-white" />
                </div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-stone-500">Chronos Elite Card</span>
                    <h4 className="font-serif text-sm font-medium tracking-wide mt-0.5">Alexandre Horologue</h4>
                  </div>
                  <span className="text-sm tracking-widest font-mono text-amber-500 font-bold italic">⚜️ PLATINUM</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-mono uppercase text-stone-500">Card Code Credentials</label>
                  <p className="font-mono text-base sm:text-lg tracking-[0.2em] font-semibold text-amber-200">
                    {formData.cardNumber || '•••• •••• •••• ••••'}
                  </p>
                </div>

                <div className="flex justify-between items-end font-mono">
                  <div>
                    <span className="text-[8px] text-stone-500 block uppercase">Valid Thru</span>
                    <span className="text-xs">{formData.expiry || 'MM/YY'}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-stone-500 block uppercase">CVC</span>
                    <span className="text-xs">{formData.cvv || '•••'}</span>
                  </div>
                </div>
              </div>

              {/* Input forms */}
              <div className="space-y-3 mt-4">
                <div>
                  <label className="text-[10px] font-mono uppercase text-[#bbbbbb] block mb-1">Credit Card Number</label>
                  <input
                    type="text"
                    name="cardNumber"
                    required
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    placeholder="4111 4300 2392 4242"
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#121212] text-white text-sm focus:ring-1 focus:ring-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-[#bbbbbb] block mb-1">Expiration MM/YY</label>
                    <input
                      type="text"
                      name="expiry"
                      required
                      value={formData.expiry}
                      onChange={handleInputChange}
                      placeholder="12/29"
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#121212] text-white text-sm focus:ring-1 focus:ring-amber-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase text-[#bbbbbb] block mb-1">CVV Security Code</label>
                    <input
                      type="text"
                      name="cvv"
                      required
                      value={formData.cvv}
                      onChange={handleInputChange}
                      placeholder="399"
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#121212] text-white text-sm focus:ring-1 focus:ring-amber-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center border-t border-white/5 gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-stone-450 hover:text-white text-xs font-semibold py-2 cursor-pointer"
                  disabled={isProcessing}
                >
                  Go Back
                </button>
                <button
                  type="button"
                  id="checkout-confirm-payment-btn"
                  onClick={handlePay}
                  disabled={isProcessing}
                  className="bg-white text-black hover:bg-amber-500 hover:text-black font-bold px-6 py-2.5 rounded-lg text-xs tracking-wider transition-colors flex items-center space-x-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Verifying Card...</span>
                    </>
                  ) : (
                    <span>Authorize Payment of ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-emerald-950/20 text-emerald-400 animate-bounce mb-2 border border-emerald-900/30">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              
              <h3 className="font-serif text-2xl font-semibold text-white leading-tight">
                Order Completed!
              </h3>
              
              <p className="text-xs text-stone-300 max-w-sm mx-auto leading-relaxed">
                Thank you for your purchase. We have committed your allocation and finalized your premium timepiece reservation sequence.
              </p>

              {/* Delivery info segment */}
              <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-xs max-w-sm mx-auto font-mono text-stone-400 select-none">
                <span className="text-[10px] block uppercase text-stone-500">ESTIMATED LOGISTICS SEQUENCE</span>
                <p className="text-amber-500 font-bold mt-1">3 - 5 Business Days via DHL Express</p>
              </div>

              <div className="pt-6 border-t border-white/5">
                <button
                  onClick={onClose}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 py-3 rounded-xl text-xs tracking-wider transition-colors cursor-pointer"
                >
                  Return to Storefront
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
