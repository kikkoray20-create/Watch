import React, { useState } from 'react';
import { X, User, Lock, Award, Shield, Truck, Package, Search, LogOut, Loader2, Sparkles, CheckCircle, Clock } from 'lucide-react';
import { UserProfile, CompactOrder } from '../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onLogin: (email: string, fullName: string) => void;
  onLogout: () => void;
  orders: CompactOrder[];
  onUpdateOrderStatus?: (orderId: string, status: CompactOrder['status']) => void;
}

export default function LoginModal({
  isOpen,
  onClose,
  user,
  onLogin,
  onLogout,
  orders,
  onUpdateOrderStatus,
}: LoginModalProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manual search order tracking state
  const [searchTrackingId, setSearchTrackingId] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<CompactOrder | null>(null);
  const [searchRan, setSearchRan] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setErrorMsg('');

    setTimeout(() => {
      setIsSubmitting(false);
      
      // Admin Credential Check
      if (email.trim() === '7737421738' && password.trim() === '123') {
        onLogin('7737421738', 'Master Horologist');
        setEmail('');
        setPassword('');
        setFullName('');
        onClose();
        return;
      }

      const nameToUse = isRegistering ? fullName || 'Vanguard Collector' : fullName || 'Alexandre Horologue';
      onLogin(email, nameToUse);
      setEmail('');
      setPassword('');
      setFullName('');
    }, 1200);
  };

  const handleAutocompleteDemo = () => {
    setEmail('alex.horo@premium.com');
    setPassword('•••••••••');
    setFullName('Alexandre Horologue');
    setIsRegistering(false);
  };

  const handleLoadAdminDemo = () => {
    setEmail('7737421738');
    setPassword('123');
    setFullName('Master Horologist');
    setIsRegistering(false);
  };

  const handleSearchTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchRan(true);
    if (!searchTrackingId.trim()) {
      setSearchedOrder(null);
      return;
    }

    const trimmed = searchTrackingId.trim().toUpperCase();
    
    // 1. Search locally loaded orders first
    const found = orders.find(
      (o) =>
        o.id.toUpperCase() === trimmed ||
        o.trackingNumber.toUpperCase() === trimmed ||
        o.id.replace('GID-ORDER-', '').toUpperCase() === trimmed
    );

    if (found) {
      setSearchedOrder(found);
      return;
    }

    // 2. Query Firestore directly (enabling offline / guest tracking)
    try {
      // Try exact order ID first
      const docRef1 = doc(db, 'orders', trimmed);
      const docSnap1 = await getDoc(docRef1);
      if (docSnap1.exists()) {
        setSearchedOrder(docSnap1.data() as CompactOrder);
        return;
      }

      // Try with GID-ORDER- prefix
      const prefixed = trimmed.startsWith('GID-ORDER-') ? trimmed : `GID-ORDER-${trimmed}`;
      const docRef2 = doc(db, 'orders', prefixed);
      const docSnap2 = await getDoc(docRef2);
      if (docSnap2.exists()) {
        setSearchedOrder(docSnap2.data() as CompactOrder);
        return;
      }

      setSearchedOrder(null);
    } catch (err) {
      console.error('Failed to query order dynamically from Firestore: ', err);
      setSearchedOrder(null);
    }
  };

  // Helper to visually render custom beautiful timeline
  const renderTrackingTimeline = (order: CompactOrder) => {
    const statuses: { label: string; desc: string; key: CompactOrder['status'] }[] = [
      { label: 'Confirmed', desc: 'Secure allocation registered', key: 'confirmed' },
      { label: 'Authorized', desc: 'Technical caliber checks completed', key: 'processing' },
      { label: 'In Transit', desc: 'Shipped via DHL Priority Air', key: 'shipped' },
      { label: 'Delivered', desc: 'Arrived at boutique coordinates', key: 'delivered' },
    ];

    const currentIndex = ['confirmed', 'processing', 'shipped', 'delivered'].indexOf(order.status);

    return (
      <div className="space-y-4">
        {/* Actual status progress indicator bar */}
        <div className="relative flex justify-between items-center px-4">
          <div className="absolute top-[14px] left-6 right-6 h-[2px] bg-stone-800" />
          <div
            className="absolute top-[14px] left-6 h-[2px] bg-amber-500 transition-all duration-700"
            style={{ width: `${(currentIndex / (statuses.length - 1)) * 88}%` }}
          />

          {statuses.map((s, idx) => {
            const isCompleted = idx <= currentIndex;
            const isActive = idx === currentIndex;

            return (
              <div key={s.key} className="relative z-10 flex flex-col items-center">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center border font-mono text-[10px] transition-all duration-500 ${
                    isActive
                      ? 'bg-amber-500 border-amber-500 text-black font-bold scale-110 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                      : isCompleted
                      ? 'bg-stone-900 border-amber-500 text-amber-500'
                      : 'bg-black border-stone-850 text-stone-600'
                  }`}
                >
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span
                  className={`text-[9px] font-mono mt-1.5 uppercase tracking-wider font-semibold ${
                    isActive ? 'text-amber-500' : isCompleted ? 'text-stone-300' : 'text-stone-600'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Selected or Active status descriptor feedback */}
        <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-1">
          <span className="text-[10px] font-mono tracking-widest text-[#999999] uppercase">CURRENT DISPATCH STATE</span>
          <div className="flex items-center space-x-2 text-white">
            <Truck className="h-4 w-4 text-amber-500 animate-pulse" />
            <span className="text-xs font-mono font-bold capitalize">{order.status}</span>
          </div>
          <p className="text-[11px] text-stone-400">
            {statuses[currentIndex]?.desc || 'Chronometer being prepared safely by watchmakers.'}
          </p>

          {/* Interactive Simulation Panel for High-Fidelity Test */}
          {onUpdateOrderStatus && (
            <div className="pt-3.5 border-t border-white/5 mt-3 flex items-center justify-between flex-wrap gap-2 text-[10px] font-mono bg-black/40 p-2.5 rounded-lg">
              <span className="text-amber-505/90">🛠️ DEV SIMULATOR: Update tracking state</span>
              <div className="flex space-x-1">
                {(['confirmed', 'processing', 'shipped', 'delivered'] as CompactOrder['status'][]).map((st) => (
                  <button
                    key={st}
                    onClick={() => onUpdateOrderStatus(order.id, st)}
                    className={`px-2 py-1 rounded border text-[9px] transition-colors ${
                      order.status === st
                        ? 'bg-amber-500 text-black border-amber-500 font-bold'
                        : 'bg-white/5 border-white/5 text-stone-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Background Dark Overlay */}
      <div className="fixed inset-0 bg-black/85 backdrop-blur-xs transition-opacity" onClick={onClose}></div>

      {/* Main Account Area */}
      <div className="bg-[#0e0e0e] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative border border-white/5 transform transition-all text-white max-h-[90vh] flex flex-col">
        
        {/* Header toolbar */}
        <div className="bg-[#121212] px-6 py-4 border-b border-white/5 flex justify-between items-center select-none shrink-0">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-amber-500" />
            <span className="font-serif text-base font-semibold text-white">
              {user?.isLoggedIn ? 'Collector Registry Portal' : 'Boutique Member Gateway'}
            </span>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/5 border border-white/5 transition-all text-stone-300 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Modal Content Container */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {user?.isLoggedIn ? (
            /* Logged In Dashboard View */
            <div className="space-y-6 text-left">
              
              {/* Member Trust Frame Header card */}
              <div className="bg-gradient-to-r from-stone-900 via-stone-905 to-[#121212] border border-white/10 p-6 rounded-2xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="absolute right-6 top-6 opacity-10">
                  <Award className="h-24 w-24 text-amber-500" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center space-x-1 text-xs font-mono text-amber-500">
                    <Sparkles className="h-3.5 w-3.5 fill-current" />
                    <span className="font-bold tracking-widest uppercase">{user.memberTier}</span>
                  </div>
                  <h3 className="font-serif text-2xl font-semibold text-white">
                    {user.fullName}
                  </h3>
                  <p className="text-stone-400 text-xs font-mono">{user.email}</p>
                </div>

                {/* Reward Loyalty Card Panel */}
                <div className="bg-[#070707] border border-white/5 px-4.5 py-3 rounded-xl shrink-0 space-y-0.5 text-center sm:text-right">
                  <span className="text-[9px] font-mono text-stone-500 uppercase tracking-widest block">LOYALTY REWARDS</span>
                  <span className="text-xl font-bold font-mono text-amber-400 block">{user.loyaltyPoints} Points</span>
                  <span className="text-[9px] text-stone-300 font-sans block">• Platinum Member Perks Tier •</span>
                </div>
              </div>

              {/* Active Subscribed Orders Tracking Subsection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h4 className="font-serif text-lg font-semibold text-white flex items-center space-x-2">
                    <Package className="h-4.5 w-4.5 text-amber-500" />
                    <span>Your Order History & Tracking Details</span>
                  </h4>
                  <span className="text-[10px] font-mono text-amber-500 tracking-wider">
                    {orders.length} Verified Order(s)
                  </span>
                </div>

                {orders.length === 0 ? (
                  <div className="py-12 border border-dashed border-white/5 rounded-2xl text-center space-y-2.5 max-w-md mx-auto">
                    <Clock className="h-8 w-8 text-stone-605 mx-auto animate-pulse" />
                    <h5 className="text-white text-xs font-semibold">No active orders located</h5>
                    <p className="text-stone-550 text-[11px] leading-relaxed max-w-xs mx-auto">
                      Any luxury allocations purchased via our secure checkouts will be compiled right here automatically.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((ord) => (
                      <div key={ord.id} className="border border-white/5 bg-[#121212]/30 rounded-2xl p-5 space-y-5">
                        
                        {/* Order info description top level metadata row */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-3">
                          <div>
                            <span className="text-[9px] font-mono text-stone-500 uppercase block">IDENTIFIER • TRACKING</span>
                            <div className="flex items-center space-x-2 mt-0.5 font-mono text-xs text-stone-200">
                              <span className="font-bold text-white">{ord.id}</span>
                              <span className="text-stone-600">|</span>
                              <span className="text-amber-550">{ord.trackingNumber}</span>
                            </div>
                          </div>

                          <div className="text-right sm:text-right">
                            <span className="text-[9px] font-mono text-stone-500 uppercase block">TOTAL AMOUNT</span>
                            <span className="text-xs font-mono font-bold text-white">
                              ₹{ord.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {/* Order Timeline Visual Stage */}
                        {renderTrackingTimeline(ord)}

                        {/* List of ordered Line Items in this order */}
                        <div className="space-y-2.5">
                          <span className="text-[10px] font-mono text-stone-500 uppercase block tracking-widest">
                            ALLOCATED TIMEPIECES
                          </span>
                          <div className="grid grid-cols-1 gap-2">
                            {ord.items.map((lineItem) => (
                              <div key={lineItem.watch.id} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                                <div className="flex items-center space-x-3">
                                  <div className="h-10 w-10 bg-[#121212] rounded-lg p-1 flex items-center justify-center shrink-0">
                                    <img src={lineItem.watch.imageUrl} alt={lineItem.watch.name} referrerPolicy="no-referrer" className="max-h-full max-w-full object-contain" />
                                  </div>
                                  <div>
                                    <h5 className="text-xs font-serif font-semibold text-white line-clamp-1">{lineItem.watch.name}</h5>
                                    <span className="text-[9px] font-mono text-stone-500">{lineItem.watch.brand}</span>
                                  </div>
                                </div>
                                <div className="text-right font-mono text-xs">
                                  <span className="text-stone-400">Qty: {lineItem.quantity}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}

              </div>

              {/* Logout Action Bar strip */}
              <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                <p className="text-[10px] font-mono text-stone-500">
                  ⚡ Auto-sync with local member cache is active
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="bg-white/5 border border-white/10 text-stone-300 hover:text-white hover:bg-rose-950/20 hover:border-rose-900/40 text-xs font-mono px-4 py-2 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout Private Profile</span>
                </button>
              </div>

            </div>
          ) : (
            /* Logged Out Login View */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              
              {/* Left Column Logins Forms */}
              <div className="md:col-span-7 space-y-4 text-left">
                
                <div className="space-y-1">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                    {isRegistering ? 'Enroll in Collector Registry' : 'Boutique Profile Access'}
                  </h3>
                  <p className="text-xs text-stone-400">
                    {isRegistering 
                      ? 'Register your email to earn loyalty reward multipliers.' 
                      : 'Provide secure coordinates to manage shipments and tracking.'}
                  </p>
                </div>

                {/* Autocomplete Quick Test Box */}
                {!isRegistering && (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <span className="text-[10px] text-amber-305 font-mono select-none">Quick sandbox testing login:</span>
                    <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleAutocompleteDemo}
                        className="bg-white/10 hover:bg-white text-stone-200 hover:text-black font-bold font-mono text-[9px] px-2.5 py-1.5 rounded transition-colors cursor-pointer animate-pulse"
                      >
                        ⚡ Customer Client
                      </button>
                      <button
                        type="button"
                        onClick={handleLoadAdminDemo}
                        className="bg-amber-500 hover:bg-amber-400 text-black font-bold font-mono text-[9px] px-2.5 py-1.5 rounded transition-colors cursor-pointer"
                      >
                        🛠️ Admin Portal
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {isRegistering && (
                    <div>
                      <label className="text-[10px] font-mono uppercase text-stone-450 block mb-1">Full Representative Name</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Alexandre Horologue"
                        className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#121212] text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-mono uppercase text-stone-455 block mb-1">Email / Login Number</label>
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex.horo@premium.com or 7737421738"
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#121212] text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-stone-455 block mb-1">Privacy Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••••"
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#121212] text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-white text-black hover:bg-amber-500 font-bold py-3 px-4 rounded-xl text-xs font-mono tracking-widest uppercase transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <span>{isRegistering ? 'Register & Enroll Member' : 'Secure Authenticated Access'}</span>
                    )}
                  </button>
                </form>

                {/* Form Switch trigger */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-[10px] font-mono text-stone-500 hover:text-white transition-colors uppercase tracking-wider"
                  >
                    {isRegistering ? 'Already enrolled? Switch to Authentication' : 'Request Registry Account Enrolment'}
                  </button>
                </div>

              </div>

              {/* Right Column Manual Order Tracking Search */}
              <div className="md:col-span-5 bg-white/5 border border-white/5 p-5 rounded-2xl text-left space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest block font-bold">INSIDER ACCESS</span>
                  <h4 className="font-serif text-base font-semibold text-white">Track Order Directly</h4>
                  <p className="text-[11px] text-stone-400">
                    Query active shipments instantly by order token or DHL code without logging in.
                  </p>
                </div>

                <form onSubmit={handleSearchTracking} className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-550" />
                    <input
                      type="text"
                      required
                      value={searchTrackingId}
                      onChange={(e) => setSearchTrackingId(e.target.value)}
                      placeholder="LP-203592-CH or GID-ORDER..."
                      className="w-full pl-9 pr-3 py-2 bg-black border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#151515] border border-white/15 hover:border-amber-550 text-stone-300 hover:text-white transition-all py-2 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase cursor-pointer"
                  >
                    Locate Shipment
                  </button>
                </form>

                {searchRan && (
                  <div className="pt-2 border-t border-white/5 space-y-2 font-mono text-[10px] leading-relaxed">
                    {searchedOrder ? (
                      <div className="space-y-2 text-stone-300 bg-black/45 p-3 rounded-xl border border-white/5">
                        <div className="flex justify-between">
                          <span className="text-amber-500 font-bold">✓ Active Stage</span>
                          <span className="capitalize">{searchedOrder.status}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-stone-500 block">DESTINATION</span>
                          <span>{searchedOrder.shippingDetails.city}, {searchedOrder.shippingDetails.country}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-stone-500 block">DHL TRACKING</span>
                          <span className="truncate block text-stone-200">{searchedOrder.trackingNumber}</span>
                        </div>
                        {/* Expandable order state inline */}
                        {renderTrackingTimeline(searchedOrder)}
                      </div>
                    ) : (
                      <div className="p-3 bg-rose-950/10 border border-rose-950/20 text-rose-400 text-[10px] rounded-lg text-center">
                        ⚠️ No tracking code was matched. Verify code or create a purchase allocation to track order.
                      </div>
                    )}
                  </div>
                )}

              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
