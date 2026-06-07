import React, { useState, useEffect } from 'react';
import { X, CreditCard, ChevronRight, CheckCircle2, Terminal, RefreshCw, Send, Loader2, Eye, EyeOff } from 'lucide-react';
import { CartItem, CheckoutDetails, WebhookLog, UserProfile, GiftBoxOption } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  appliedPromo: { code: string; percent: number } | null;
  giftWrapping: boolean;
  selectedGiftBoxId?: string;
  giftBoxOptions?: GiftBoxOption[];
  onOrderCompleted: (details: CheckoutDetails, generatedLogs: WebhookLog[]) => void;
  user: UserProfile | null;
  onLogin: (email: string, fullName: string, password?: string, isSignUp?: boolean) => Promise<void>;
  freeShippingEnabled?: boolean;
  freeShippingThreshold?: number;
  whatsappOwnerNumber?: string;
  whatsappAutoRedirectEnabled?: boolean;
  storeName?: string;
  secureAirLogisticsCost?: number;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cart,
  appliedPromo,
  giftWrapping,
  selectedGiftBoxId = 'leather',
  giftBoxOptions = [],
  onOrderCompleted,
  user,
  onLogin,
  freeShippingEnabled = true,
  freeShippingThreshold = 400000,
  whatsappOwnerNumber,
  whatsappAutoRedirectEnabled,
  storeName = 'CHRONOS',
  secureAirLogisticsCost = 12500,
}: CheckoutModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [contactOption, setContactOption] = useState<'phone' | 'email'>('phone');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'India',
    shippingMethod: 'air_priority',
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.fullName,
        email: user.email,
      }));
    }
  }, [user]);

  if (!isOpen) return null;

  // Calculative indices
  const subtotal = cart.reduce((acc, item) => acc + item.watch.price * item.quantity, 0);
  const discountAmount = appliedPromo ? (subtotal * appliedPromo.percent) / 100 : 0;
  
  const selectedBox = giftBoxOptions.find(b => b.id === selectedGiftBoxId) || giftBoxOptions[0];
  const giftWrappingCost = giftWrapping && selectedBox ? selectedBox.price : 0;
  
  const isFreeShippingAvailable = freeShippingEnabled !== false;
  const threshold = freeShippingThreshold !== undefined ? freeShippingThreshold : 400000;
  const shippingCost = (isFreeShippingAvailable && subtotal > threshold) || subtotal === 0 ? 0.00 : secureAirLogisticsCost;
  const totalAmount = subtotal - discountAmount + giftWrappingCost + shippingCost;

  // Simple handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Safe credentials helper
  const handleAutoFill = () => {
    setFormData((prev) => ({
      ...prev,
      fullName: 'Alexandre Horologue',
      email: '9876543215',
      address: '742 Chronograph Avenue',
      city: 'Geneva',
      postalCode: '1201',
      country: 'Switzerland',
      shippingMethod: 'air_priority',
      cardNumber: '4111 •••• •••• 4242',
      cardName: 'Alexandre Horologue',
      expiry: '12/29',
      cvv: '399',
    }));
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.fullName.trim()) {
        alert('Please enter your full name to proceed.');
        return;
      }
      if (!formData.email.trim()) {
        alert('Please enter your primary contact email or mobile number.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.address) {
        alert('Please complete the compulsory Shipping Destination Address.');
        return;
      }
      if (!formData.city) {
        alert('Please complete the compulsory City / Region.');
        return;
      }
      if (!formData.postalCode) {
        alert('Please complete the compulsory Postal Zip Code.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handlePay = () => {
    setIsProcessing(true);

    // Simulate luxury API gateway check in 1.5 seconds
    setTimeout(() => {
      setIsProcessing(false);
      setStep(5);

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
        <div className="px-6 py-3 border-b border-white/5 flex items-center space-x-2 text-[10px] md:text-xs font-mono text-stone-400 select-none bg-[#121212] overflow-x-auto whitespace-nowrap">
          <span className={step === 1 ? 'text-amber-500 font-bold' : step > 1 ? 'text-emerald-500 font-bold' : 'text-stone-500'}>1. Client Identity</span>
          <ChevronRight className="h-3 w-3 text-stone-600 shrink-0" />
          <span className={step === 2 ? 'text-amber-500 font-bold' : step > 2 ? 'text-emerald-500 font-bold' : 'text-stone-500'}>2. Select Info</span>
          <ChevronRight className="h-3 w-3 text-stone-600 shrink-0" />
          <span className={step === 3 ? 'text-amber-500 font-bold' : step > 3 ? 'text-emerald-500' : 'text-stone-500'}>3. Card details</span>
          <ChevronRight className="h-3 w-3 text-stone-600 shrink-0" />
          <span className={step === 4 ? 'text-amber-500 font-bold' : step > 4 ? 'text-emerald-400 font-bold' : 'text-stone-500'}>4. Collation</span>
        </div>

        {/* Wizard content core */}
        <div className="p-6">
          
          {step === 1 && (
            <div className="space-y-5 text-left animate-fade-in">
              <div className="bg-white/5 border border-white/5 p-6 rounded-xl space-y-4">
                <div>
                  <h4 className="text-xs font-serif font-bold text-stone-200">Customer Identification</h4>
                  <p className="text-[9px] font-mono text-stone-400">Please provide your contact coordinates to initialize the bespoke order allocation.</p>
                </div>

                <form onSubmit={handleNextStep} className="space-y-4">
                  <div>
                    <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 block mb-1">
                      Full Name <span className="text-amber-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      placeholder="Alexandre Horologue"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none focus:border-amber-500 text-white font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 block mb-1">
                        Contact Mobile or Email <span className="text-amber-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        name="email"
                        required
                        placeholder="e.g. 9876543210 or email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none focus:border-amber-500 text-white font-sans"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 block mb-1">
                        Secondary Phone (Optional)
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="e.g. +41 78 123 4567"
                        value={formData.phone || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none focus:border-amber-500 text-white font-sans"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={handleAutoFill}
                      className="text-[10px] font-mono text-amber-500 hover:underline cursor-pointer"
                    >
                      ⚡ Preset Premium Client Demo Details
                    </button>
                    <button
                      type="submit"
                      className="bg-white text-black hover:bg-amber-500 font-bold px-6 py-2.5 rounded-lg text-[10px] font-mono tracking-wider uppercase transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <span>Proceed to Select Info</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 text-left">
              {/* Profile Bar indicator */}
              <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex justify-between items-center text-[11px] font-mono text-stone-400">
                <span>Shipping coordinates for: <strong className="text-white font-sans">{formData.fullName || user?.fullName}</strong></span>
                <span className="text-stone-500">[Mobile: {formData.email || user?.email}]</span>
              </div>

              <form onSubmit={handleNextStep} className="space-y-4">
                <div className="space-y-4">
                  {/* Shipping Destination Address - Compulsory */}
                  <div>
                    <label className="text-[10px] font-mono uppercase text-stone-400 block mb-1">
                      Shipping Destination Address <span className="text-amber-500 font-bold">* (Compulsory)</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="742 Chronograph Avenue"
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#121212] text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* City & Zip - Compulsory */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-mono uppercase text-stone-400 block mb-1">
                        City / Region <span className="text-amber-500 font-bold">* (Compulsory)</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        required
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Geneva"
                        className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#121212] text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase text-stone-400 block mb-1">
                        Postal Zip Code <span className="text-amber-500 font-bold">* (Compulsory)</span>
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        required
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        placeholder="1201"
                        className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#121212] text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Country Selection - Compulsory */}
                  <div>
                    <label className="text-[10px] font-mono uppercase text-stone-400 block mb-1">
                      Country <span className="text-amber-500 font-bold">* (Compulsory)</span>
                    </label>
                    <select
                      name="country"
                      required
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#121212] text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none dropdown-dark"
                    >
                      <option value="Switzerland">Switzerland</option>
                      <option value="India">India</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Germany">Germany</option>
                      <option value="Japan">Japan</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-between items-center border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-stone-400 hover:text-white text-xs font-semibold py-2 cursor-pointer"
                  >
                    Go Back
                  </button>
                  <button
                    type="submit"
                    className="bg-white text-black hover:bg-amber-500 font-bold px-6 py-2.5 rounded-lg text-xs tracking-wider transition-all duration-200 cursor-pointer"
                  >
                    Proceed to Card details
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 text-left">
              {/* Premium Direct Contact Payment Panel */}
              <div className="bg-gradient-to-br from-neutral-900 to-stone-950 border border-amber-500/30 p-8 rounded-2xl text-center space-y-4">
                <div className="mx-auto h-12 w-12 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
                  <CreditCard className="h-6 w-6 text-amber-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-mono text-xs font-bold tracking-widest text-amber-500 uppercase">
                    Secure Order Gateway
                  </h3>
                  <p className="font-serif text-lg font-bold text-white tracking-wide uppercase leading-tight">
                    FOR PAYMENT, OUR TEAM WILL CONNECT WITH YOU.
                  </p>
                  <p className="text-[11px] font-sans text-stone-400">
                    Once you finalize this order collation, our private boutique manager will reach out via your registered mobile number to process custom payment parameters and options.
                  </p>
                </div>
              </div>

              <form onSubmit={handleNextStep} className="space-y-4">
                <div className="pt-4 flex justify-between items-center border-t border-white/5 mx-auto">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-stone-400 hover:text-white text-xs font-semibold py-2 cursor-pointer"
                  >
                    Go Back
                  </button>
                  <button
                    type="submit"
                    className="bg-white text-black hover:bg-amber-500 font-bold px-6 py-2.5 rounded-lg text-xs tracking-wider transition-all duration-200 cursor-pointer uppercase font-mono"
                  >
                    Proceed to Collation
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5 text-left">
              <div className="border border-white/5 bg-white/5 p-4 rounded-xl space-y-4">
                <h4 className="font-serif text-amber-500 text-xs font-bold tracking-widest uppercase pb-2 border-b border-white/5">
                  Invoice & Despatch Collation
                </h4>

                {/* 1. Committed Timepieces list */}
                <div className="space-y-3">
                  <p className="text-[9px] font-mono text-stone-500 uppercase tracking-wider">Allocated Timepieces</p>
                  <div className="space-y-2.5 max-h-32 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div key={item.watch.id} className="flex justify-between items-center bg-black/40 p-2 rounded-lg border border-white/5 text-xs">
                        <div className="flex items-center space-x-2.5">
                          <img 
                            src={item.watch.imageUrl} 
                            alt={item.watch.name} 
                            className="h-8 w-8 object-cover rounded bg-stone-900 border border-white/10"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <h5 className="font-semibold text-white truncate max-w-[180px]">{item.watch.name}</h5>
                            <p className="text-[9px] font-mono text-stone-400">{item.watch.brand} • Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-serif font-medium text-amber-400">₹{(item.watch.price * item.quantity).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Dispatch profile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5 text-[11px] text-stone-400">
                  <div>
                    <span className="text-[9px] font-mono text-stone-500 uppercase block mb-1">Verified Member</span>
                    <p className="text-white font-semibold font-sans leading-tight">{formData.fullName || user?.fullName}</p>
                    <p className="text-stone-400 font-mono text-[10px]">Mobile: {formData.email || user?.email}</p>
                    <p className="text-stone-500 font-mono text-[9px] mt-1">Tier: {user?.memberTier || 'Loyal Collector'}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-stone-500 uppercase block mb-1">Shipping Destination</span>
                    <p className="text-white font-sans leading-relaxed">{formData.address}</p>
                    <p className="text-stone-400 font-mono text-[10px]">{formData.city}, {formData.postalCode}</p>
                    <p className="text-amber-500 font-mono text-[10px] tracking-wide mt-1">📍 {formData.country} (DHL Express)</p>
                  </div>
                </div>

                {/* 3. Payment Option */}
                <div className="pt-2 border-t border-white/5 text-[11px]">
                  <span className="text-[9px] font-mono text-stone-500 uppercase block mb-1">Approved Payment Source</span>
                  <div className="flex justify-between items-center text-stone-400">
                    <span>Direct Team Connection</span>
                    <span className="font-mono text-amber-500 font-bold uppercase text-[9.5px]">
                      Team Will Connect
                    </span>
                  </div>
                </div>

                {/* 4. Billing statement */}
                <div className="pt-3 border-t border-white/5 space-y-1.5 font-mono text-[10.5px] text-stone-400">
                  <div className="flex justify-between text-xs text-stone-500">
                    <span>Cart Subtotal</span>
                    <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Promo Applied ({appliedPromo?.code})</span>
                      <span>- ₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {giftWrapping && (
                    <div className="flex justify-between">
                      <span>🎁 {selectedBox?.name || 'Gift Wrapping'}</span>
                      <span>₹{giftWrappingCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>DHL Courier Priority Fee</span>
                    <span>{shippingCost === 0 ? 'COMPLIMENTARY' : `₹${shippingCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-white/5 gap-4">
                <div className="text-left font-sans flex-shrink-0">
                  <span className="text-[9px] font-mono text-stone-500 uppercase tracking-widest block">Total Collation Balance</span>
                  <span className="font-serif font-black text-xl text-white">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex space-x-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={isProcessing}
                    className="px-4 py-2.5 text-stone-400 hover:text-white font-semibold text-xs border border-white/5 hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                  >
                    Go Back
                  </button>
                  <button
                    type="button"
                    id="checkout-confirm-payment-btn"
                    onClick={handlePay}
                    disabled={isProcessing}
                    className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-black font-bold px-6 py-2.5 rounded-lg text-xs tracking-wider transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Confirming Order...</span>
                      </>
                    ) : (
                      <span>Place Secure Order</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-emerald-950/20 text-emerald-400 animate-bounce mb-2 border border-emerald-900/30">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              
              <h3 className="font-serif text-2xl font-semibold text-white leading-tight">
                Allocation Confirmed!
              </h3>
              
              <p className="text-xs text-stone-300 max-w-sm mx-auto leading-relaxed font-sans">
                Thank you for your purchase. We have committed your physical allocation in our Swiss vaults and initialized your premium timepiece reservation sequence.
              </p>

              {/* WhatsApp direct receipt share widget */}
              <div className="p-4 bg-emerald-950/10 border border-emerald-800/20 rounded-xl space-y-2.5 max-w-sm mx-auto text-center" id="whatsapp-receipt-share-box">
                <p className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-bold">
                  🟢 RECEIVE BILL / DETAILS ON WHATSAPP
                </p>
                <p className="text-[10.5px] text-stone-400 font-sans leading-normal">
                  Click below to instantly share your luxury timepiece allocation slip & invoice coordinates to WhatsApp.
                </p>
                
                <a
                  href={`https://wa.me/${(whatsappOwnerNumber || '919876543210').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `*📢 NEW WATCH ALLOCATION CONFIRMED - ${storeName || 'CHRONOS'}*\n` +
                    `---------------------------------------\n` +
                    `*Owner / Client:* ${formData.fullName || user?.fullName}\n` +
                    `*Registered Mobile ID:* ${formData.email || user?.email}\n` +
                    `*Delivery Address:* ${formData.address}, ${formData.city}\n\n` +
                    `*Items Reserved:*\n` +
                    `${cart.map(item => `- ${item.quantity}x ${item.watch.brand} ${item.watch.name} (₹${item.watch.price.toLocaleString('en-IN')})`).join('\n')}\n\n` +
                    `*Total Collation Amount:* ₹${totalAmount.toLocaleString('en-IN')}\n` +
                    `---------------------------------------\n` +
                    `_Please finalize our secure reservation. Thank you!_`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center space-x-2 bg-[#25D366] hover:bg-emerald-500 text-black font-mono font-bold text-[11px] uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all shadow-[0_4px_15px_rgba(37,211,102,0.15)] hover:scale-[1.01]"
                >
                  <Send className="h-4 w-4 shrink-0" />
                  <span>Send Order to WhatsApp</span>
                </a>
                <p className="text-[9px] text-stone-500 font-mono">
                  * Opens a secure WhatsApp chat prefilled with your bill details.
                </p>
              </div>

              {/* Delivery info segment */}
              <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-xs max-w-sm mx-auto font-mono text-stone-400 select-none">
                <span className="text-[10px] block uppercase text-stone-500">ESTIMATED LOGISTICS TIMELINE</span>
                <p className="text-amber-500 font-bold mt-1">3 - 5 Business Days via DHL Express Air Priority</p>
                <p className="text-[9px] text-stone-500 mt-1">Consignee: {formData.fullName || user?.fullName}</p>
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
