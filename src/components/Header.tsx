import React, { useState } from 'react';
import { ShoppingBag, Clock, Search, User, X, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem, UserProfile } from '../types';

interface HeaderProps {
  cart: CartItem[];
  setIsCartOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  onLogoClick?: () => void;
  user: UserProfile | null;
  onLoginClick: () => void;
  storeName?: string;
  categories?: string[];
  hideCategoryShelf?: boolean;
}

export default function Header({
  cart,
  setIsCartOpen,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  onLogoClick,
  user,
  onLoginClick,
  storeName = 'CHRONOS',
  categories = ['sports', 'classic', 'minimalist', 'prestige'],
  hideCategoryShelf = false,
}: HeaderProps) {
  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-md border-b border-white/5" id="app-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {!isMobileSearchOpen ? (
            <motion.div
              key="normal-header-layout"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="flex justify-between items-center h-20 gap-4"
            >
              {/* Brand Logo */}
              <div 
                onClick={onLogoClick}
                className="flex items-center space-x-3 cursor-pointer shrink-0 select-none"
              >
                <Clock className="h-6 w-6 sm:h-7 sm:w-7 text-amber-500 animate-pulse" />
                <div>
                  <span className="font-serif text-lg tracking-[0.3em] font-light text-white block sm:inline uppercase">
                    {storeName}
                  </span>
                  <p className="text-[9px] font-mono tracking-widest text-amber-500/80 uppercase -mt-1 hidden sm:block">
                    PREMIUM HOROLOGY
                  </p>
                </div>
              </div>

              {/* Search Input - Desktop & Tablet */}
              <div className="relative flex-grow max-w-sm hidden md:block">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-stone-500" />
                <input
                  type="text"
                  placeholder="Query models, movements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full rounded-full text-xs bg-[#121212] border border-white/10 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white font-sans transition-all"
                />
              </div>

              {/* Right Area - Shopping Bag & User Actions */}
              <div className="flex items-center space-x-2 sm:space-x-4 ml-auto">
                
                {/* Search Trigger Icon on Mobile */}
                <button
                  onClick={() => setIsMobileSearchOpen(true)}
                  className="p-2 rounded-full border border-white/10 hover:bg-white/5 active:scale-95 text-stone-300 hover:text-white transition-all cursor-pointer md:hidden shrink-0"
                  aria-label="Search"
                >
                  <Search className="h-4 w-4" />
                </button>

                {/* Shopping Bag Button */}
                <button
                  id="cart-trigger-btn"
                  onClick={() => setIsCartOpen(true)}
                  className="relative p-2.5 rounded-full border border-white/10 hover:bg-white/5 hover:border-amber-500/40 transition-all duration-300 active:scale-95 text-white cursor-pointer shrink-0"
                >
                  <ShoppingBag className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                  {totalCartItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[9px] font-bold font-mono h-5 w-5 rounded-full flex items-center justify-center border-2 border-[#050505] animate-bounce">
                      {totalCartItems}
                    </span>
                  )}
                </button>

                {/* Profile Sign-in & Track Actions */}
                {user?.isLoggedIn ? (
                  <button
                    id="profile-trigger-btn"
                    onClick={onLoginClick}
                    className="flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-full border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/15 text-white transition-all text-[11px] sm:text-xs font-mono font-medium cursor-pointer active:scale-95"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span className="max-w-[80px] sm:max-w-[120px] truncate">{user.fullName.split(' ')[0]}</span>
                  </button>
                ) : (
                  <button
                    id="login-trigger-btn"
                    onClick={onLoginClick}
                    className="flex items-center space-x-1 sm:space-x-1.5 px-3 sm:px-4 py-2 rounded-full border border-white/10 hover:border-amber-500/40 text-stone-300 hover:text-white bg-white/5 hover:bg-white/8 transition-all text-[11px] sm:text-xs font-mono font-medium cursor-pointer active:scale-95 whitespace-nowrap"
                  >
                    <User className="h-3.5 w-3.5 text-stone-450" />
                    <span>Track Order</span>
                  </button>
                )}

              </div>
            </motion.div>
          ) : (
            <motion.div
              key="mobile-search-active-layout"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.15 }}
              className="flex items-center h-20 gap-3 md:hidden w-full"
            >
              <button
                onClick={() => {
                  setIsMobileSearchOpen(false);
                  setSearchQuery('');
                }}
                className="p-2 -ml-2 rounded-full text-stone-400 hover:text-white hover:bg-white/5 cursor-pointer transition-all"
                aria-label="Back"
              >
                <ArrowLeft className="h-4.5 w-4.5" />
              </button>

              <div className="relative flex-grow">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-amber-500" />
                <input
                  type="text"
                  placeholder="Search watches, brands, specs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="pl-9 pr-8 py-2 w-full rounded-full text-xs bg-[#121212] border border-amber-500/30 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white font-sans transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-white cursor-pointer"
                    aria-label="Clear query"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  setIsMobileSearchOpen(false);
                  setSearchQuery('');
                }}
                className="text-xs font-mono text-stone-300 hover:text-white select-none whitespace-nowrap active:scale-95 transition-all cursor-pointer px-1"
              >
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Shelf - Extremely Mobile Friendly Horizontal Scroll bar */}
        {!hideCategoryShelf && (
          <div className="pb-4 pt-1 flex items-center overflow-x-auto scrollbar-none gap-2 font-mono text-[10px] sm:text-xs">
            <span className="text-stone-500 uppercase tracking-wider pr-1 hidden sm:inline select-none">Collections:</span>
            {['all', ...categories].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full whitespace-nowrap border capitalize transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-500 border-amber-500 text-black font-semibold'
                    : 'bg-white/5 border-white/10 text-stone-350 hover:text-white hover:bg-white/8'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

      </div>
    </header>
  );
}
