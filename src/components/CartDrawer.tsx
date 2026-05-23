import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, Gift, Percent, HelpCircle } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (id: string, q: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: (discount: { code: string; percent: number }, giftWrap: boolean) => void;
  customPromoCode?: string;
  customPromoDiscountPercent?: number;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  customPromoCode,
  customPromoDiscountPercent,
}: CartDrawerProps) {
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; percent: number } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [giftWrapping, setGiftWrapping] = useState(false);
  const [showShopifyTip, setShowShopifyTip] = useState(false);

  if (!isOpen) return null;

  // Calculation parameters
  const subtotal = cart.reduce((acc, item) => acc + item.watch.price * item.quantity, 0);
  const FREE_SHIPPING_THRESHOLD = 400000;
  
  // Discount
  const discountAmount = appliedPromo ? (subtotal * appliedPromo.percent) / 100 : 0;
  
  // Gift wrapping
  const giftWrappingCost = giftWrapping ? 1250.00 : 0;
  
  // Shipping
  const shippingCost = subtotal > FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0.00 : 12500.00;
  
  const estimatedTotal = subtotal - discountAmount + giftWrappingCost + shippingCost;

  // Handle promo codes
  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    const code = promoCode.trim().toUpperCase();
    
    const targetCode = (customPromoCode || 'SHOPIFY20').toUpperCase();
    const targetPercent = customPromoDiscountPercent !== undefined ? customPromoDiscountPercent : 20;

    if (code === targetCode) {
      setAppliedPromo({ code: targetCode, percent: targetPercent });
      setPromoCode('');
    } else if (code === 'CHRONOS10') {
      setAppliedPromo({ code: 'CHRONOS10', percent: 10 });
      setPromoCode('');
    } else {
      setPromoError(`Invalid coupon. Try "${targetCode}" (${targetPercent}% off) or "CHRONOS10" (10% off)`);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="cart-drawer-overlay">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-xs transition-opacity" onClick={onClose}></div>

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0e0e0e] shadow-2xl flex flex-col border-l border-white/5 text-white">
          
          {/* Header Panel */}
          <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-[#121212] select-none">
            <div>
              <h2 className="font-serif text-lg font-medium text-white">Your Shopping Satchel</h2>
              <p className="text-[10px] font-mono text-stone-500">Insured luxury air dispatch</p>
            </div>
            <button 
              id="close-cart-btn"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/5 transition-all text-stone-400 border border-white/5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Core Cart Scroll View */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Free Shipping Progress bar */}
            {subtotal > 0 && (
              <div className="bg-[#121212] p-3.5 rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-1.5 text-xs">
                  <span className="font-medium text-stone-300">
                    {subtotal >= FREE_SHIPPING_THRESHOLD 
                      ? '🎉 Free Insured Shipping Unlocked!' 
                      : 'Free Insured Global Shipping Milestone'}
                  </span>
                  <span className="font-mono text-amber-500 font-medium">
                    ₹{subtotal.toLocaleString('en-IN')} / ₹{FREE_SHIPPING_THRESHOLD.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)}%` }}
                  />
                </div>
                {subtotal < FREE_SHIPPING_THRESHOLD && (
                  <p className="text-[10px] text-stone-500 mt-2 font-sans">
                    Add <span className="font-mono font-bold text-amber-500">₹{(FREE_SHIPPING_THRESHOLD - subtotal).toLocaleString('en-IN')}</span> more to unlock complimentary secure courier logistics.
                  </p>
                )}
              </div>
            )}

            {cart.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center">
                <div className="p-4 rounded-full bg-[#121212] border border-white/5 mb-4">
                  <X className="h-6 w-6 text-stone-600" />
                </div>
                <h3 className="font-serif text-base text-stone-300 font-medium">Satchel is Empty</h3>
                <p className="text-xs text-stone-500 max-w-xs mt-1 leading-relaxed">
                  Browse our exclusive mechanical collections and append luxury timepiece models to begin.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div 
                    key={item.watch.id} 
                    className="flex space-x-4 pb-4 border-b border-white/5 items-start hover:bg-white/5 p-1.5 rounded-md transition-all"
                  >
                    <div className="h-20 w-20 bg-[#121212] rounded-lg overflow-hidden border border-white/5 flex-shrink-0 flex items-center justify-center">
                      <img 
                        src={item.watch.imageUrl} 
                        alt={item.watch.name} 
                        referrerPolicy="no-referrer"
                        className="object-contain h-16 w-16" 
                      />
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <span className="text-[9px] font-mono text-amber-500 tracking-wider block uppercase">
                        {item.watch.brand}
                      </span>
                      <h4 className="font-serif text-sm font-medium text-white truncate leading-tight">
                        {item.watch.name}
                      </h4>
                      <p className="text-xs text-stone-400 font-mono mt-1">
                        ₹{item.watch.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })} each
                      </p>
                      
                      {/* Quantity Controls and Trash in inline bar */}
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center space-x-2 bg-[#151515] rounded-md p-1 border border-white/5">
                          <button
                            id={`decrease-quantity-${item.watch.id}`}
                            onClick={() => onUpdateQuantity(item.watch.id, item.quantity - 1)}
                            className="p-1 rounded-sm text-stone-400 hover:bg-white/5 hover:text-white transition-all active:scale-90"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-mono font-bold w-5 text-center text-stone-200">
                            {item.quantity}
                          </span>
                          <button
                            id={`increase-quantity-${item.watch.id}`}
                            onClick={() => onUpdateQuantity(item.watch.id, item.quantity + 1)}
                            className="p-1 rounded-sm text-stone-400 hover:bg-white/5 hover:text-white transition-all active:scale-90"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <button
                          id={`remove-item-${item.watch.id}`}
                          onClick={() => onRemoveItem(item.watch.id)}
                          className="text-stone-500 hover:text-rose-400 hover:bg-rose-950/20 rounded p-1 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing Ledger Footing */}
          {cart.length > 0 && (
            <div className="border-t border-white/5 p-6 bg-[#121212] space-y-4">
              
              {/* Promo input and optional Gift wrap toggle in compact container */}
              <div className="space-y-3">
                {/* Gift wrapping toggle */}
                <label className="flex items-center space-x-3 cursor-pointer bg-[#151515] px-3 py-2 rounded-lg border border-white/5 select-none">
                  <input
                    type="checkbox"
                    checked={giftWrapping}
                    onChange={(e) => setGiftWrapping(e.target.checked)}
                    className="rounded border-white/10 text-amber-500 bg-[#0e0e0e] focus:ring-amber-500"
                  />
                  <div className="flex items-center space-x-2 text-stone-300">
                    <Gift className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-medium">Add Luxury Leather Gift Box Wrapping (+₹1,250.00)</span>
                  </div>
                </label>

                {/* Promo Coupon Form */}
                {!appliedPromo ? (
                  <form onSubmit={handleApplyPromo} className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Insert code (e.g. SHOPIFY20)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-grow px-3 py-1.5 focus:ring-1 focus:ring-amber-500 rounded-md border border-white/10 bg-[#0e0e0e] text-white placeholder-stone-600 focus:outline-none text-xs font-mono"
                    />
                    <button
                      id="apply-coupon-btn"
                      type="submit"
                      className="bg-white hover:bg-amber-500 text-black px-4 py-1.5 rounded-md text-xs font-bold tracking-wider transition-colors font-sans"
                    >
                      Apply
                    </button>
                  </form>
                ) : (
                  <div className="flex justify-between items-center bg-amber-950/20 border border-amber-900/35 px-3 py-2 rounded-lg text-xs font-mono">
                    <span className="text-amber-300 flex items-center space-x-1">
                      <Percent className="h-3.5 w-3.5 text-amber-500" />
                      <span>Code: <b>{appliedPromo.code}</b> ({appliedPromo.percent}% Off)</span>
                    </span>
                    <button
                      onClick={handleRemovePromo}
                      className="text-stone-400 hover:text-white font-bold"
                    >
                      Remove
                    </button>
                  </div>
                )}
                {promoError && (
                  <p className="text-[10px] text-rose-400 font-mono mt-1">{promoError}</p>
                )}
              </div>

              {/* Price rows */}
              <div className="space-y-2 text-xs font-sans text-stone-300">
                <div className="flex justify-between">
                  <span>Cart Subtotal</span>
                  <span className="font-mono text-white">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>Active Discount ({appliedPromo.percent}%)</span>
                    <span className="font-mono">-₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {giftWrapping && (
                  <div className="flex justify-between">
                    <span>Premium Leather Wrap</span>
                    <span className="font-mono text-white">₹{giftWrappingCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Secure Air Logistics</span>
                  <span className="font-mono text-white">
                    {shippingCost === 0 ? 'Complimentary' : `₹${shippingCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                  </span>
                </div>

                <div className="border-t border-white/5 pt-3 flex justify-between items-baseline">
                  <span className="font-serif text-sm font-medium text-white">Estimated Invoice Balance</span>
                  <span className="font-serif text-lg font-semibold text-white">
                    ₹{estimatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Educational Drawer element explaining pricing calculation logic in Shopify */}
              <div className="border-t border-white/5 pt-3 select-none">
                <button
                  onClick={() => setShowShopifyTip(!showShopifyTip)}
                  className="w-full flex items-center justify-between text-[11px] text-stone-400 hover:text-white transition-colors font-mono"
                  type="button"
                >
                  <span className="flex items-center space-x-1">
                    <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
                    <span>How Shopify calculates this in production</span>
                  </span>
                  <span>{showShopifyTip ? 'Hide' : 'Reveal'}</span>
                </button>
                {showShopifyTip && (
                  <div className="mt-2 bg-[#0e0e0e] rounded-lg p-3 text-[10px] text-stone-400 border border-white/10 leading-relaxed font-sans">
                    <b>Tax & Shipping Engine Automation</b>: In a live Shopify theme, tax computations are handled automatically through integrated services (like Avalon or TaxJar) matching local laws based on delivery coordinates. Discount algorithms assess active promotion eligibility on the basket and recalculate variant nodes dynamically in real time.
                  </div>
                )}
              </div>

              <button
                id="checkout-initiate-btn"
                onClick={() => onCheckout(appliedPromo || { code: '', percent: 0 }, giftWrapping)}
                className="w-full bg-white text-black hover:bg-amber-500 hover:text-black py-4 rounded-xl text-xs font-bold tracking-widest uppercase transition-all duration-300 hover:shadow-[0_0_15px_rgba(245,158,11,0.25)]"
              >
                Secure Checkout
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
