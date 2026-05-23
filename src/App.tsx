import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import WatchCard from './components/WatchCard';
import WatchModal from './components/WatchModal';
import WatchPage from './components/WatchPage';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import LoginModal from './components/LoginModal';
import MasterDashboard from './components/MasterDashboard';

import { products } from './data/products';
import { CartItem, WatchModel, CheckoutDetails, UserProfile, CompactOrder, BoutiqueSettings } from './types';
import { ShieldCheck, ArrowRight, Info, Clock, AlertCircle } from 'lucide-react';

export default function App() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('chronos_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedWatch, setSelectedWatch] = useState<WatchModel | null>(null);
  const [activeWatchPage, setActiveWatchPage] = useState<WatchModel | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeDiscount, setActiveDiscount] = useState<{ code: string; percent: number } | null>(null);
  const [isGiftWrapSelected, setIsGiftWrapSelected] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  // Boutique Storefront Settings Customize Space
  const [boutiqueSettings, setBoutiqueSettings] = useState<BoutiqueSettings>(() => {
    const saved = localStorage.getItem('chronos_settings');
    return saved ? JSON.parse(saved) : {
      storeName: 'CHRONOS',
      promoCode: 'SHOPIFY20',
      promoDiscountPercent: 20,
      heroTitle: 'Precision Built',
      heroSub: 'For Generation Sovereigns',
      heroDesc: 'Experience the masterworks of micro-mechanics. Our watches combine aerospace-grade lightweight titanium housing, box sapphire crystals, and complex gear-turning manual Tourbillon calibre movements.',
      warrantyActive: true,
    };
  });

  // Dynamic Catalog of Watches
  const [catalog, setCatalog] = useState<WatchModel[]>(() => {
    const saved = localStorage.getItem('chronos_catalog');
    return saved ? JSON.parse(saved) : products;
  });

  // User Authentication & Loyalty state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('chronos_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Admin view toggle helper state
  const [isAdminDashboardActive, setIsAdminDashboardActive] = useState(false);

  // Trackable Order History mapping
  const [orders, setOrders] = useState<CompactOrder[]>(() => {
    const saved = localStorage.getItem('chronos_orders');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'GID-ORDER-3829',
        date: '2026-05-18',
        total: 203350,
        items: [
          {
            watch: products[0],
            quantity: 1,
          }
        ],
        shippingDetails: {
          fullName: 'Alexandre Horologue',
          email: 'alex.horo@premium.com',
          address: '742 Chronograph Avenue',
          city: 'Geneva',
          postalCode: '1201',
          country: 'Switzerland',
          shippingMethod: 'air_priority',
          giftWrapping: true,
          discountCode: 'SHOPIFY20',
        } as any,
        status: 'shipped',
        trackingNumber: 'LP-839210-CH',
      }
    ];
  });

  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Sync cart to local storage
  useEffect(() => {
    localStorage.setItem('chronos_cart', JSON.stringify(cart));
  }, [cart]);

  // Sync user profile state
  useEffect(() => {
    localStorage.setItem('chronos_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // Sync tracking orders list
  useEffect(() => {
    localStorage.setItem('chronos_orders', JSON.stringify(orders));
  }, [orders]);

  // Sync dynamic catalog list
  useEffect(() => {
    localStorage.setItem('chronos_catalog', JSON.stringify(catalog));
  }, [catalog]);

  // Sync boutique configuration setting
  useEffect(() => {
    localStorage.setItem('chronos_settings', JSON.stringify(boutiqueSettings));
  }, [boutiqueSettings]);

  // Trigger floating alert banners
  const triggerNotification = (message: string) => {
    setNotifications((prev) => [...prev, message]);
    setTimeout(() => {
      setNotifications((prev) => prev.slice(1));
    }, 3000);
  };

  // Add items handler
  const handleAddToCart = (watch: WatchModel) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.watch.id === watch.id);
      if (existing) {
        return prevCart.map((item) =>
          item.watch.id === watch.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { watch, quantity: 1 }];
    });
    triggerNotification(`Added "${watch.name}" to your shipping satchel!`);
  };

  // Manage quantity
  const handleUpdateQuantity = (watchId: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveItem(watchId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.watch.id === watchId ? { ...item, quantity: qty } : item))
    );
  };

  // Remove watch
  const handleRemoveItem = (watchId: string) => {
    const target = cart.find((item) => item.watch.id === watchId);
    setCart((prev) => prev.filter((item) => item.watch.id !== watchId));
    if (target) {
      triggerNotification(`Removed "${target.watch.name}" from your satchel.`);
    }
  };

  // Process core checkout trigger
  const handleCheckoutInitiation = (discount: { code: string; percent: number }, giftWrap: boolean) => {
    setActiveDiscount(discount.code ? discount : null);
    setIsGiftWrapSelected(giftWrap);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  // Final confirmation
  const handleOrderCompleted = (details: CheckoutDetails) => {
    // Determine the calculated total
    const subtotal = cart.reduce((acc, item) => acc + item.watch.price * item.quantity, 0);
    const discountAmount = activeDiscount ? (subtotal * activeDiscount.percent) / 100 : 0;
    const giftWrappingCost = isGiftWrapSelected ? 1250 : 0;
    const shippingCost = subtotal > 400000 || subtotal === 0 ? 0 : 12500;
    const totalAmount = subtotal - discountAmount + giftWrappingCost + shippingCost;

    const orderNumber = Math.floor(1000 + Math.random() * 9000);
    const trackingCode = `LP-${Math.floor(100000 + Math.random() * 900000)}-CH`;

    const newOrder: CompactOrder = {
      id: `GID-ORDER-${orderNumber}`,
      date: new Date().toISOString().split('T')[0],
      total: totalAmount,
      items: [...cart],
      shippingDetails: { ...details },
      status: 'confirmed',
      trackingNumber: trackingCode,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Update active registered member tier / award points
    if (currentUser && currentUser.isLoggedIn) {
      setCurrentUser((prevUser) => {
        if (!prevUser) return null;
        const newPoints = prevUser.loyaltyPoints + Math.floor(totalAmount / 10000);
        let tier: UserProfile['memberTier'] = 'Loyal Collector';
        if (newPoints > 100) tier = 'Grand Sovereign';
        else if (newPoints > 40) tier = 'Vanguard';

        return {
          ...prevUser,
          loyaltyPoints: newPoints,
          memberTier: tier,
        };
      });
    } else {
      // Auto register/enroll customer profile so tracking is instantly visible in client
      setCurrentUser({
        email: details.email,
        fullName: details.fullName,
        isLoggedIn: true,
        memberTier: 'Loyal Collector',
        loyaltyPoints: Math.floor(totalAmount / 10000),
      });
    }

    setCart([]);
    setIsCheckoutOpen(false);
    triggerNotification(`Order ${newOrder.id} logged; tracking initialized!`);
  };

  // Search routing filter criteria
  const filteredProducts = catalog.filter((watch) => {
    const matchesCategory = selectedCategory === 'all' || watch.category === selectedCategory;
    const matchesQuery =
      watch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      watch.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      watch.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      watch.specs.movement.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#050505] text-[#e0e0e0]" id="app-root-container">
      
      {/* Admin Floating Banner for Coordinators to switch views */}
      {currentUser?.isAdmin && (
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 py-3.5 px-6 text-[#080808] font-mono text-xs select-none sticky top-0 z-50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl font-bold">
          <div className="flex items-center space-x-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-black animate-ping shrink-0"></span>
            <span>BOUTIQUE ADMINISTRATIVE PORTAL ACTIVE • Logged in as Master Horologist</span>
          </div>
          <div className="flex items-center space-x-3 w-full sm:w-auto justify-center">
            <button
              onClick={() => setIsAdminDashboardActive(!isAdminDashboardActive)}
              className="bg-black text-white hover:bg-neutral-900 border border-black px-4 py-1.5 rounded-full shadow text-[11px] uppercase tracking-wider font-extrabold flex items-center space-x-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <span>{isAdminDashboardActive ? 'Switch to Customer Site ↱' : 'Switch to Master Dashboard 🛠️'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Header Panel */}
      <Header
        cart={cart}
        setIsCartOpen={setIsCartOpen}
        searchQuery={searchQuery}
        setSearchQuery={(q) => {
          setSearchQuery(q);
          if (q) {
            setActiveWatchPage(null);
          }
        }}
        selectedCategory={selectedCategory}
        setSelectedCategory={(cat) => {
          setSelectedCategory(cat);
          setActiveWatchPage(null);
        }}
        onLogoClick={() => {
          setSearchQuery('');
          setSelectedCategory('all');
          setActiveWatchPage(null);
        }}
        user={currentUser}
        onLoginClick={() => setIsLoginOpen(true)}
        storeName={boutiqueSettings.storeName}
      />

      {/* Floating alert notifications */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2 pointer-events-none select-none max-w-sm">
        {notifications.map((msg, i) => (
          <div
            key={i}
            className="p-4 bg-stone-900 border border-stone-800 text-stone-100 rounded-xl shadow-lg text-xs font-mono font-medium flex items-center space-x-2 animate-slide-up"
          >
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
            <span>{msg}</span>
          </div>
        ))}
      </div>

      {/* Main Experience Rendering */}
      <main className="flex-grow">
        {isAdminDashboardActive ? (
          <MasterDashboard
            catalog={catalog}
            onUpdateCatalog={(newCatalog) => {
              setCatalog(newCatalog);
              if (activeWatchPage && !newCatalog.some(w => w.id === activeWatchPage.id)) {
                setActiveWatchPage(null);
              }
            }}
            orders={orders}
            onUpdateOrderStatus={(orderId, status) => {
              setOrders((prev) =>
                prev.map((ord) => (ord.id === orderId ? { ...ord, status } : ord))
              );
              triggerNotification(`Order ${orderId} dispatch status set: ${status}`);
            }}
            onAddOrderSimulation={() => {
              const rId = Math.floor(1000 + Math.random() * 9000);
              const rItem = catalog[Math.floor(Math.random() * catalog.length)] || products[0];
              const testOrder: CompactOrder = {
                id: `GID-ORDER-${rId}`,
                date: new Date().toISOString().split('T')[0],
                total: rItem.price,
                items: [{ watch: rItem, quantity: 1 }],
                shippingDetails: {
                  fullName: 'Victoria Pendelton',
                  email: 'victoria.pendelton@collector-perks.com',
                  address: '902 Royal Crest Way',
                  city: 'Mumbai',
                  postalCode: '400001',
                  country: 'India',
                  shippingMethod: 'air_priority',
                  giftWrapping: true,
                  discountCode: 'MASTERDASH',
                } as any,
                status: 'confirmed',
                trackingNumber: `LP-${Math.floor(100000 + Math.random() * 900000)}-CH`,
              };
              setOrders((prev) => [testOrder, ...prev]);
              triggerNotification(`Simulated live purchase for Order ${testOrder.id} successfully.`);
            }}
            onClearOrders={() => {
              if (confirm('Clear all historical tracked order records?')) {
                setOrders([]);
                triggerNotification('Dispatch tracking logs wiped.');
              }
            }}
            settings={boutiqueSettings}
            onUpdateSettings={setBoutiqueSettings}
            onRestoreOriginals={() => {
              setCatalog(products);
              triggerNotification('Inventory collection restored to Swiss default specifications.');
            }}
            onClose={() => setIsAdminDashboardActive(false)}
          />
        ) : activeWatchPage ? (
          <WatchPage
            watch={activeWatchPage}
            onBack={() => setActiveWatchPage(null)}
            onAddToCart={handleAddToCart}
            onSelectAnotherWatch={(wt) => setActiveWatchPage(wt)}
            warrantyActive={boutiqueSettings.warrantyActive}
            catalog={catalog}
          />
        ) : (
          <div>
            
            {/* Elegant Luxury Hero Showcase Banner */}
            <section className="bg-gradient-to-b from-[#0b0b0b] to-[#050505] select-none border-b border-white/5 py-16 sm:py-24 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 mix-blend-overlay">
                <div className="h-full w-full bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]"></div>
              </div>
              
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  
                  {/* Left Column Text Content */}
                  <div className="lg:col-span-7 space-y-6 text-left">
                    <span className="text-[10px] font-mono tracking-[0.3em] font-semibold text-amber-500 uppercase block">
                      PRESTIGE HEIRLOOM ASSEMBLIES
                    </span>
                    <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white leading-[1.1]">
                      Precision Built <br />
                      <span className="font-serif italic font-normal text-amber-500">For Generation Sovereigns</span>
                    </h1>
                    <p className="text-stone-400 text-xs sm:text-sm max-w-md leading-relaxed font-sans">
                      Experience the masterworks of micro-mechanics. Our watches combine aerospace-grade lightweight titanium housing, box sapphire crystals, and complex gear-turning manual Tourbillon calibre movements.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3 pt-2 font-mono">
                      <a
                        href="#collection-shelf"
                        className="bg-white text-black hover:bg-amber-500 px-6 py-3.5 rounded-lg text-xs font-bold tracking-widest transition-all duration-300 text-center shadow-lg hover:shadow-amber-500/10 cursor-pointer"
                      >
                        Explore Chronometers ↓
                      </a>
                    </div>
                  </div>

                  {/* Right Column Interactive Featured Hero Watch */}
                  <div className="lg:col-span-5 relative flex justify-center">
                    <div className="relative h-[280px] sm:h-[340px] w-[280px] sm:w-[340px] bg-[#0e0e0e] rounded-full shadow-[0_20px_50px_rgba(245,158,11,0.05)] border border-white/5 flex items-center justify-center p-6 group cursor-pointer" onClick={() => setActiveWatchPage(products[1])}>
                      <img
                        src={products[1].imageUrl}
                        alt="Featured Golden Tourbillon"
                        referrerPolicy="no-referrer"
                        className="h-full w-auto object-contain p-2 group-hover:rotate-6 transition-all duration-700 ease-out"
                      />
                      <span className="absolute bottom-4 right-4 bg-black/80 border border-white/10 text-white text-[9px] font-mono font-bold tracking-widest uppercase py-1.5 px-3 rounded-full hover:bg-amber-500 hover:text-black transition-colors">
                        Inspect prestige specs →
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </section>

            {/* Campaign Voucher Banner Strip */}
            <div className="bg-[#080808] text-amber-500/90 select-none py-4 border-y border-white/5">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center text-xs font-mono select-none gap-2">
                <span className="flex items-center space-x-1.5 font-sans font-medium text-stone-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping"></span>
                  <span>LIMITED PROMOTION IN PROGRESS: Test our secure shopping platform!</span>
                </span>
                <span>
                  Apply code <b className="text-white hover:underline bg-[#151515] border border-white/10 px-2 py-1 rounded">SHOPIFY20</b> at checkout for <b className="text-white font-bold">20% off all watches</b>
                </span>
              </div>
            </div>

            {/* Core Product Grid Display */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-20" id="collection-shelf">
              
              {/* Product list section title */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b border-white/5 pb-6 mb-10 gap-4">
                <div className="text-left select-none">
                  <span className="text-[10px] font-mono text-amber-500 tracking-widest uppercase block mb-1">
                    Authentic Catalog Selection
                  </span>
                  <h2 className="font-serif text-3xl font-medium tracking-tight text-white">
                    Precision Timepiece Chronometers
                  </h2>
                </div>
              </div>

              {/* Grid content handler */}
              {filteredProducts.length === 0 ? (
                <div className="py-20 text-center font-mono max-w-sm mx-auto space-y-3">
                  <AlertCircle className="h-8 w-8 text-stone-600 mx-auto" />
                  <h4 className="text-white text-sm font-semibold">No Chronometers Matched Inquiry</h4>
                  <p className="text-stone-400 text-xs leading-relaxed">
                    We could not find watches matching terms inside our boutique inventory. Reset your filters or modify search terms.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs px-4 py-2 rounded-md font-sans font-medium cursor-pointer"
                  >
                    Reset Filter Parameters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredProducts.map((watch) => (
                    <WatchCard
                      key={watch.id}
                      watch={watch}
                      onSelect={(wt) => setActiveWatchPage(wt)}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              )}

              {/* Quality Badging Footer Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 border-t border-white/5 pt-10 select-none text-left">
                <div className="space-y-1">
                  <ShieldCheck className="h-6 w-6 text-amber-500 mb-2" />
                  <h4 className="font-serif text-sm font-semibold text-white">Complimentary Courier Coverage</h4>
                  <p className="text-[11px] text-stone-400 leading-relaxed font-sans">
                    Insured Priority Air logistics are fully supported on orders crossing milestones. Packaged securely with real-time DHL timeline tracking.
                  </p>
                </div>
                <div className="space-y-1">
                  <Clock className="h-6 w-6 text-amber-500 mb-2" />
                  <h4 className="font-serif text-sm font-semibold text-white">3-Year International Coverage</h4>
                  <p className="text-[11px] text-stone-400 leading-relaxed font-sans">
                    Each mechanical timepiece is backed by a comprehensive warranty certified directly via individual model structural logs.
                  </p>
                </div>
                <div className="space-y-1">
                  <Info className="h-6 w-6 text-amber-500 mb-2" />
                  <h4 className="font-serif text-sm font-semibold text-white">Certified Catalog Transparency</h4>
                  <p className="text-[11px] text-stone-400 leading-relaxed font-sans">
                    Each watch holds unique serialization detailing exact jewel alignments, calibres, and luxury details.
                  </p>
                </div>
              </div>

            </section>

          </div>
        )}
      </main>

      {/* Footer copyright */}
      <footer className="bg-[#080808] border-t border-white/5 text-center py-8 select-none text-xs text-stone-500 font-sans" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} {boutiqueSettings.storeName} Boutiques. Designed using high-fidelity Tailwind. All rights reserved.</p>
        </div>
      </footer>

      {/* Interactive Detail View Lightbox Modal */}
      {selectedWatch && (
        <WatchModal
          watch={selectedWatch}
          onClose={() => setSelectedWatch(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Cart Drawer Sidebar */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckoutInitiation}
        customPromoCode={boutiqueSettings.promoCode}
        customPromoDiscountPercent={boutiqueSettings.promoDiscountPercent}
      />

      {/* Checkout Payment Wizard */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        appliedPromo={activeDiscount}
        giftWrapping={isGiftWrapSelected}
        onOrderCompleted={handleOrderCompleted}
      />

      {/* Login & Order Tracking Dashboard */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        user={currentUser}
        onLogin={(email, fullName) => {
          const isAdmin = email.trim() === '7737421738';
          setCurrentUser({
            email,
            fullName: isAdmin ? 'Master Horologist' : fullName,
            isLoggedIn: true,
            memberTier: isAdmin ? 'Master Horologist' : 'Loyal Collector',
            loyaltyPoints: isAdmin ? 9999 : 15,
            isAdmin: isAdmin,
          });

          if (isAdmin) {
            setIsAdminDashboardActive(true); // Automatically switch onto the administrative console!
            triggerNotification(`Authorized Admin Session. Master Dashboard loaded.`);
          } else {
            triggerNotification(`Welcome back, ${fullName}! Session active.`);
          }
        }}
        onLogout={() => {
          setCurrentUser(null);
          setIsAdminDashboardActive(false);
          triggerNotification('Boutique session cleared successfully.');
        }}
        orders={orders}
        onUpdateOrderStatus={(orderId, status) => {
          setOrders((prev) =>
            prev.map((ord) => (ord.id === orderId ? { ...ord, status } : ord))
          );
          triggerNotification(`Order ${orderId} dispatch status: ${status}`);
        }}
      />

    </div>
  );
}
