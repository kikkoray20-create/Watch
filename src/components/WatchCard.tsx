import React from 'react';
import { Star, ShieldAlert, Zap, LayoutGrid } from 'lucide-react';
import { WatchModel } from '../types';

interface WatchCardProps {
  key?: string;
  watch: WatchModel;
  onSelect: (watch: WatchModel) => void;
  onAddToCart: (watch: WatchModel) => void;
}

export default function WatchCard({ watch, onSelect, onAddToCart }: WatchCardProps) {
  return (
    <div 
      className="group flex flex-col justify-between bg-[#0e0e0e] rounded-2xl border border-white/5 overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_40px_rgba(245,158,11,0.05)] hover:border-amber-500/30 transition-all duration-500"
      id={`watch-card-${watch.id}`}
    >
      {/* Product Image Stage */}
      <div 
        className="relative pt-[100%] bg-[#121212] overflow-hidden cursor-pointer border-b border-white/5"
        onClick={() => onSelect(watch)}
      >
        <img
          src={watch.imageUrl}
          alt={watch.name}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out p-6 opacity-90 group-hover:opacity-100"
        />
        
        {/* Category Badge overlay */}
        <span className="absolute top-4 left-4 bg-black/80 backdrop-blur-md text-[9px] tracking-widest uppercase font-mono px-3 py-1.5 rounded-full border border-white/10 shadow-md text-stone-300">
          {watch.category}
        </span>

        {/* Stock urgency tag */}
        {watch.stock <= 5 && (
          <span className="absolute bottom-4 left-4 bg-rose-950/40 text-rose-400 text-[9px] font-mono tracking-wider px-2.5 py-1 rounded-md border border-rose-900/30 flex items-center space-x-1">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping"></span>
            <span>Only {watch.stock} Left</span>
          </span>
        )}
      </div>

      {/* Product Card Details */}
      <div className="p-6 flex flex-col flex-grow justify-between">
        <div>
          {/* Brand Prefix */}
          <span className="text-[10px] uppercase tracking-widest font-mono text-amber-500 font-semibold mb-1 block">
            {watch.brand}
          </span>
          
          {/* Title - Serif Font */}
          <h3 
            className="font-serif text-lg text-white font-medium line-clamp-1 hover:text-amber-500 transition-colors cursor-pointer"
            onClick={() => onSelect(watch)}
          >
            {watch.name}
          </h3>

          {/* Customer Reviews Rating */}
          <div className="flex items-center space-x-1.5 mt-1.5 mb-3">
            <div className="flex items-center text-amber-500">
              <Star className="h-3.5 w-3.5 fill-current" />
            </div>
            <span className="text-xs font-mono font-medium text-stone-300">{watch.rating}</span>
            <span className="text-white/10">|</span>
            <span className="text-[10px] text-stone-500 font-sans">Verified Owner Reviews</span>
          </div>

          {/* Compact Technical Specs Bar */}
          <div className="bg-[#151515] rounded-lg p-2.5 border border-white/5 mb-4 text-[11px] font-mono text-stone-400 space-y-1">
            <div className="flex justify-between">
              <span className="text-stone-500">Calibre:</span>
              <span className="text-stone-200 font-medium truncate max-w-[120px]" title={watch.specs?.movement || 'Calibre'}>{(watch.specs?.movement || 'Standard').split(' ')[0]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Case size:</span>
              <span className="text-stone-200 font-medium">{watch.specs?.caseSize || 'Standard'}</span>
            </div>
          </div>
        </div>

        {/* Price & Primary Call to Action */}
        <div className="flex flex-col gap-3 mt-auto pt-3 border-t border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-stone-500 tracking-wider uppercase">Price</span>
            <span className="font-serif text-base font-medium text-white">
              ₹{watch.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              id={`view-watch-btn-${watch.id}`}
              onClick={() => onSelect(watch)}
              className="flex-1 bg-[#151515] text-stone-300 border border-white/10 hover:border-amber-500 hover:text-white px-3 py-2.5 rounded-lg text-xs font-bold tracking-wider transition-all duration-300 active:scale-95 text-center cursor-pointer select-none"
            >
              Watch
            </button>
            <button
              id={`add-to-cart-${watch.id}`}
              onClick={() => onAddToCart(watch)}
              className="flex-1 bg-white text-black hover:bg-amber-500 hover:text-black px-3 py-2.5 rounded-lg text-xs font-bold tracking-wider transition-all duration-300 active:scale-95 text-center cursor-pointer select-none"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
