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

// Firebase Database & Authentication Setup
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, configDiagnostics } from './firebase';

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
  const [selectedGiftBoxId, setSelectedGiftBoxId] = useState<string>('leather');
  const [notifications, setNotifications] = useState<string[]>([]);

  // Boutique Storefront Settings Customize Space
  const [boutiqueSettings, setBoutiqueSettings] = useState<BoutiqueSettings>(() => {
    const saved = localStorage.getItem('chronos_settings');
    const defaultOpts = [
      { id: 'leather', name: 'Luxury Leather Gift Box', price: 1250 },
      { id: 'walnut', name: 'Solid Walnut Collector\'s Case', price: 3500 },
      { id: 'velvet', name: 'Velvet Heritage Pouch', price: 750 }
    ];
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        giftWrappingEnabled: true,
        giftBoxOptions: defaultOpts,
        freeShippingEnabled: true,
        freeShippingThreshold: 400000,
        ...parsed
      };
    }
    return {
      storeName: 'CHRONOS',
      promoCode: 'SHOPIFY20',
      promoDiscountPercent: 20,
      heroTitle: 'Precision Built',
      heroSub: 'For Generation Sovereigns',
      heroDesc: 'Experience the masterworks of micro-mechanics. Our watches combine aerospace-grade lightweight titanium housing, box sapphire crystals, and complex gear-turning manual Tourbillon calibre movements.',
      warrantyActive: true,
      giftWrappingEnabled: true,
      giftBoxOptions: defaultOpts,
      freeShippingEnabled: true,
      freeShippingThreshold: 400000,
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

  // Firebase integration status states
  const [firebaseConnected, setFirebaseConnected] = useState<boolean | null>(
    configDiagnostics.isUsingFallback ? false : null
  );
  const [firebaseErrorText, setFirebaseErrorText] = useState<string | null>(
    configDiagnostics.isUsingFallback ? "Incomplete configuration in environment settings" : null
  );
  const [showConfigHelper, setShowConfigHelper] = useState(false);

  // Admin view toggle helper state
  const [isAdminDashboardActive, setIsAdminDashboardActive] = useState(false);

  // List of all registered customers (for Admin Master Dashboard)
  const [users, setUsers] = useState<UserProfile[]>([]);

  // Trackable Order History mapping
  const [orders, setOrders] = useState<CompactOrder[]>([]);

  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // ---------------------------------------------------------------------------
  // Firestore Data Loader (Catalog settings & products initialization)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // 1. Fetch Boutique Settings
    const loadBoutiqueSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'boutique_config');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBoutiqueSettings(docSnap.data() as BoutiqueSettings);
          setFirebaseConnected(true);
        } else {
          // Initialize/seed settings to Firestore in first invocation
          const defaultSettings: BoutiqueSettings = {
            storeName: 'CHRONOS',
            promoCode: 'SHOPIFY20',
            promoDiscountPercent: 20,
            heroTitle: 'Precision Built',
            heroSub: 'For Generation Sovereigns',
            heroDesc: 'Experience the masterworks of micro-mechanics. Our watches combine aerospace-grade lightweight titanium housing, box sapphire crystals, and complex gear-turning manual Tourbillon calibre movements.',
            warrantyActive: true,
            giftWrappingEnabled: true,
            giftBoxOptions: [
              { id: 'leather', name: 'Luxury Leather Gift Box', price: 1250 },
              { id: 'walnut', name: 'Solid Walnut Collector\'s Case', price: 3500 },
              { id: 'velvet', name: 'Velvet Heritage Pouch', price: 750 }
            ],
          };
          try {
            await setDoc(docRef, defaultSettings);
            setFirebaseConnected(true);
          } catch (writeErr) {
            console.warn("Seeding default boutique config skipped (Admin auth required). Operating with local fallback and state.");
          }
          setBoutiqueSettings(defaultSettings);
        }
      } catch (err) {
        setFirebaseConnected(false);
        setFirebaseErrorText(err instanceof Error ? err.message : String(err));
        try {
          // Send to logging utility so system can verify/debug security rules
          handleFirestoreError(err, OperationType.GET, 'settings/boutique_config');
        } catch (thrownErr) {
          console.warn("Continuing with local fallback after logging Firestore settings error.", thrownErr);
        }
      }
    };

    // 2. Fetch Catalog (Watches)
    const loadCatalog = async () => {
      try {
        const colRef = collection(db, 'watches');
        const querySnap = await getDocs(colRef);
        if (querySnap.empty) {
          // Seed catalog watches to Firestore database
          try {
            for (const w of products) {
              await setDoc(doc(db, 'watches', w.id), w);
            }
          } catch (writeErr) {
            console.warn("Seeding default catalog skipped (Admin auth required). Operating with local fallback and state.");
          }
          setCatalog(products);
        } else {
          const loadedWatches: WatchModel[] = [];
          querySnap.forEach((doc) => {
            loadedWatches.push(doc.data() as WatchModel);
          });
          setCatalog(loadedWatches);
        }
      } catch (err) {
        setFirebaseConnected(false);
        setFirebaseErrorText(err instanceof Error ? err.message : String(err));
        
        const savedLocal = localStorage.getItem('chronos_catalog');
        const fallbackCatalog = savedLocal ? JSON.parse(savedLocal) : products;
        
        try {
          handleFirestoreError(err, OperationType.GET, 'watches');
          setCatalog(fallbackCatalog);
        } catch (thrownErr) {
          console.warn("Continuing with local fallback after logging Firestore watches error.", thrownErr);
          setCatalog(fallbackCatalog);
        }
      }
    };

    // 3. Seed Master Admin credential profile in Firestore
    const seedAdminUser = async () => {
      try {
        const seedSingleDoc = async (userId: string, emailVal: string) => {
          const docRef = doc(db, 'users', userId);
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            const adminProfile: any = {
              email: emailVal,
              fullName: 'Master Horologist',
              isLoggedIn: false,
              memberTier: 'Master Horologist',
              loyaltyPoints: 9999,
              isAdmin: true,
              password: '123'
            };
            await setDoc(docRef, adminProfile);
          }
        };

        await seedSingleDoc('admin', 'admin@chronos.com');
        await seedSingleDoc('admin_chronos_com', 'admin@chronos.com');
        console.log('[Firebase Seeder] Master user profile verification completed.');
      } catch (err) {
        console.warn('Skipped admin seeding (local mode fallback or auth restricted).', err);
      }
    };

    if (!configDiagnostics.isUsingFallback) {
      loadBoutiqueSettings();
      loadCatalog();
      seedAdminUser();
    } else {
      setFirebaseConnected(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Real-time Orders Listener (Updates instantly on state changes)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let unsubscribe: () => void = () => {};

    const setupOrdersListener = () => {
      if (configDiagnostics.isUsingFallback) {
        // Run purely in local storage fallback mode
        const saved = localStorage.getItem('chronos_orders');
        if (saved) {
          const allOrders: CompactOrder[] = JSON.parse(saved);
          if (currentUser?.isAdmin) {
            // Master/Admin sees all orders
            setOrders(allOrders);
          } else if (currentUser?.isLoggedIn && currentUser.email) {
            // User sees their personal orders
            const filtered = allOrders.filter(
              (ord) => ord.shippingDetails?.email === currentUser.email
            );
            setOrders(filtered);
          } else {
            // When logged out, let's keep all or empty? Let's display all so logged-out viewers see seed orders
            setOrders(allOrders);
          }
        }
        return;
      }
      try {
        const ordersCol = collection(db, 'orders');
        let ordersQuery;

        if (currentUser?.isAdmin) {
          // Administrators see all boutique orders
          ordersQuery = query(ordersCol);
        } else if (currentUser?.isLoggedIn && currentUser.email) {
          // Authenticated users get their personal orders
          ordersQuery = query(
            ordersCol,
            where('shippingDetails.email', '==', currentUser.email)
          );
        } else {
          // Fallback static list (from localStorage/seed) when logged out and non-admin
          return;
        }

        unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
          const loadedOrders: CompactOrder[] = [];
          snapshot.forEach((doc) => {
            loadedOrders.push(doc.data() as CompactOrder);
          });
          // Sort client-side to avoid composite indexing limits
          loadedOrders.sort((a, b) => b.date.localeCompare(a.date));
          setOrders(loadedOrders);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'orders_query');
          // Graceful fallback to local orders on listener permission or connection error
          const saved = localStorage.getItem('chronos_orders');
          if (saved) {
            const allOrdersIndex: CompactOrder[] = JSON.parse(saved);
            if (currentUser?.isAdmin) {
              setOrders(allOrdersIndex);
            } else if (currentUser?.isLoggedIn && currentUser.email) {
              const filtered = allOrdersIndex.filter(
                (ord) => ord.shippingDetails?.email === currentUser.email
              );
              setOrders(filtered);
            } else {
              setOrders(allOrdersIndex);
            }
          }
        });
      } catch (err) {
        console.error('Failed to setup orders listener: ', err);
      }
    };

    setupOrdersListener();
    return () => unsubscribe();
  }, [currentUser]);

  // Real-time Users Listener (Loads all registered customers for the master user)
  useEffect(() => {
    let unsubscribe: () => void = () => {};

    const setupUsersListener = () => {
      if (currentUser?.isAdmin) {
        if (configDiagnostics.isUsingFallback) {
          // Local fallback mode: load from localStorage
          const localUsersStr = localStorage.getItem('boutique_users') || '{}';
          let localUsers: Record<string, any> = {};
          try {
            localUsers = JSON.parse(localUsersStr);
          } catch (err) {}
          const userList: UserProfile[] = Object.values(localUsers).map((u: any) => ({
            email: u.email,
            fullName: u.fullName,
            isLoggedIn: false,
            memberTier: u.memberTier || 'Loyal Collector',
            loyaltyPoints: u.loyaltyPoints || 15,
            isAdmin: !!u.isAdmin
          }));
          setUsers(userList);
          return;
        }

        try {
          const usersCol = collection(db, 'users');
          unsubscribe = onSnapshot(usersCol, (snapshot) => {
            const loadedUsers: UserProfile[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data() as any;
              loadedUsers.push({
                email: data.email,
                fullName: data.fullName,
                isLoggedIn: !!data.isLoggedIn,
                memberTier: data.memberTier || 'Loyal Collector',
                loyaltyPoints: Number(data.loyaltyPoints ?? 15),
                isAdmin: !!data.isAdmin,
              });
            });
            setUsers(loadedUsers);
          }, (error) => {
            console.error("Firestore users listener error: ", error);
            // Fallback to local storage on error
            const localUsersStr = localStorage.getItem('boutique_users') || '{}';
            let localUsers: Record<string, any> = {};
            try {
              localUsers = JSON.parse(localUsersStr);
            } catch (err) {}
            const userList: UserProfile[] = Object.values(localUsers).map((u: any) => ({
              email: u.email,
              fullName: u.fullName,
              isLoggedIn: false,
              memberTier: u.memberTier || 'Loyal Collector',
              loyaltyPoints: u.loyaltyPoints || 15,
              isAdmin: !!u.isAdmin
            }));
            setUsers(userList);
          });
        } catch (err) {
          console.error("Failed to setup users listener: ", err);
        }
      } else {
        setUsers([]);
      }
    };

    setupUsersListener();
    return () => unsubscribe();
  }, [currentUser]);

  // Sync cart to local storage (Cart is purely client side session)
  useEffect(() => {
    localStorage.setItem('chronos_cart', JSON.stringify(cart));
  }, [cart]);

  // Sync user profile state locally as well
  useEffect(() => {
    localStorage.setItem('chronos_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // Sync catalog timeline details to local storage backing
  useEffect(() => {
    localStorage.setItem('chronos_catalog', JSON.stringify(catalog));
  }, [catalog]);

  // Sync custom boutique configuration settings to local storage
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

  // Direct checkout purchase handler
  const handleBuyNow = (watch: WatchModel) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.watch.id === watch.id);
      if (existing) {
        return prevCart;
      }
      return [...prevCart, { watch, quantity: 1 }];
    });
    setIsCheckoutOpen(true);
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
  const handleCheckoutInitiation = (discount: { code: string; percent: number }, giftWrap: boolean, giftBoxId?: string) => {
    setActiveDiscount(discount.code ? discount : null);
    setIsGiftWrapSelected(giftWrap);
    if (giftBoxId) {
      setSelectedGiftBoxId(giftBoxId);
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  // Final confirmation
  const handleOrderCompleted = (details: CheckoutDetails) => {
    // Determine the calculated total
    const subtotal = cart.reduce((acc, item) => acc + item.watch.price * item.quantity, 0);
    const discountAmount = activeDiscount ? (subtotal * activeDiscount.percent) / 100 : 0;
    
    const giftBoxOpts = boutiqueSettings.giftBoxOptions || [
      { id: 'leather', name: 'Luxury Leather Gift Box', price: 1250 }
    ];
    const selectedBox = giftBoxOpts.find(b => b.id === selectedGiftBoxId);
    const giftWrappingCost = isGiftWrapSelected && selectedBox ? selectedBox.price : 0;
    
    const isFreeShippingAvailable = boutiqueSettings.freeShippingEnabled !== false;
    const threshold = boutiqueSettings.freeShippingThreshold !== undefined ? boutiqueSettings.freeShippingThreshold : 400000;
    const shippingCost = (isFreeShippingAvailable && subtotal > threshold) || subtotal === 0 ? 0 : 12500;
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

    // Save order payload securely inside Firestore database
    const saveOrderToFirestore = async () => {
      try {
        await setDoc(doc(db, 'orders', newOrder.id), newOrder);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `orders/${newOrder.id}`);
      }
    };
    saveOrderToFirestore();

    // Directly append order to master database in local storage
    try {
      const saved = localStorage.getItem('chronos_orders');
      const existingOrders = saved ? JSON.parse(saved) : [];
      const cleaned = existingOrders.filter((o: CompactOrder) => o.id !== newOrder.id);
      localStorage.setItem('chronos_orders', JSON.stringify([newOrder, ...cleaned]));
    } catch (e) {
      console.error('Error syncing order to local storage master index:', e);
    }

    setOrders((prev) => [newOrder, ...prev]);

    // Update active registered member tier / award points
    if (currentUser && currentUser.isLoggedIn) {
      const newPoints = currentUser.loyaltyPoints + Math.floor(totalAmount / 10000);
      let tier: UserProfile['memberTier'] = 'Loyal Collector';
      if (newPoints > 100) tier = 'Grand Sovereign';
      else if (newPoints > 40) tier = 'Vanguard';

      const updatedUser: UserProfile = {
        ...currentUser,
        loyaltyPoints: newPoints,
        memberTier: tier,
      };
      
      setCurrentUser(updatedUser);

      // Persist the updated loyalty profile to Firestore
      const saveUserProfile = async () => {
        try {
          const userIdKey = updatedUser.email.replace(/[.@]/g, '_');
          await setDoc(doc(db, 'users', userIdKey), updatedUser);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `users/${updatedUser.email}`);
        }
      };
      saveUserProfile();
    } else {
      // Auto register/enroll customer profile so tracking is instantly visible in client
      const anonymousProfile: UserProfile = {
        email: details.email,
        fullName: details.fullName,
        isLoggedIn: true,
        memberTier: 'Loyal Collector',
        loyaltyPoints: Math.floor(totalAmount / 10000),
      };
      setCurrentUser(anonymousProfile);

      const saveUserProfile = async () => {
        try {
          const userIdKey = anonymousProfile.email.replace(/[.@]/g, '_');
          await setDoc(doc(db, 'users', userIdKey), anonymousProfile);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `users/${anonymousProfile.email}`);
        }
      };
      saveUserProfile();
    }

    setCart([]);
    setIsCheckoutOpen(false);
    triggerNotification(`Order ${newOrder.id} logged; tracking initialized!`);
  };

  // ---------------------------------------------------------------------------
  // Admin Firestore Operations
  // ---------------------------------------------------------------------------
  const handleUpdateCatalog = async (newCatalog: WatchModel[]) => {
    const oldCatalog = [...catalog];
    setCatalog(newCatalog);
    if (activeWatchPage && !newCatalog.some(w => w.id === activeWatchPage.id)) {
      setActiveWatchPage(null);
    }
    
    try {
      // Deletions
      const deleted = oldCatalog.filter(oldW => !newCatalog.some(newW => newW.id === oldW.id));
      for (const w of deleted) {
        await deleteDoc(doc(db, 'watches', w.id));
      }
      // Overwrites/Additions
      for (const w of newCatalog) {
        await setDoc(doc(db, 'watches', w.id), w);
      }
      triggerNotification('Inventory catalog synced down to Firestore cloud successfully!');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'watches');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: CompactOrder['status']) => {
    // Optimistically update the reactive state first so that changes are seen instantly
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status } : ord))
    );

    // Sync status change directly to local storage master index
    try {
      const saved = localStorage.getItem('chronos_orders');
      if (saved) {
        const allOrders: CompactOrder[] = JSON.parse(saved);
        const updated = allOrders.map((ord) => ord.id === orderId ? { ...ord, status } : ord);
        localStorage.setItem('chronos_orders', JSON.stringify(updated));
      }
    } catch (e) {
      console.error('Error updating order status in local storage master index:', e);
    }

    try {
      const docRef = doc(db, 'orders', orderId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const orderData = docSnap.data() as CompactOrder;
        orderData.status = status;
        await setDoc(docRef, orderData);
        triggerNotification(`Order ${orderId} status updated to "${status}" in Cloud.`);
      } else {
        triggerNotification(`Order ${orderId} status updated locally in current boutique session.`);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
      triggerNotification(`Order ${orderId} updated locally (Cloud Sync offline).`);
    }
  };

  const handleRemoveOrder = async (orderId: string) => {
    if (confirm(`Are you sure you want to remove order ${orderId}?`)) {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));

      // Sync removal directly to local storage master index
      try {
        const saved = localStorage.getItem('chronos_orders');
        if (saved) {
          const allOrders: CompactOrder[] = JSON.parse(saved);
          const filtered = allOrders.filter((ord) => ord.id !== orderId);
          localStorage.setItem('chronos_orders', JSON.stringify(filtered));
        }
      } catch (e) {
        console.error('Error removing order from local storage master index:', e);
      }
      try {
        await deleteDoc(doc(db, 'orders', orderId));
        triggerNotification(`Order ${orderId} removed from Cloud Database.`);
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `orders/${orderId}`);
        triggerNotification(`Order ${orderId} removed from local session.`);
      }
    }
  };

  const handleClearOrders = async () => {
    if (confirm('Clear all historical tracked order records?')) {
      try {
        const snap = await getDocs(collection(db, 'orders'));
        for (const docSnap of snap.docs) {
          await deleteDoc(doc(db, 'orders', docSnap.id));
        }
        setOrders([]);
        localStorage.setItem('chronos_orders', JSON.stringify([]));
        triggerNotification('Dispatch tracking logs wiped from Firestore database.');
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, 'orders');
      }
    }
  };

  const handleUpdateUserProfile = async (updatedUser: UserProfile) => {
    try {
      const userIdKey = updatedUser.email.replace(/[.@]/g, '_');
      
      setUsers((prev) => prev.map((u) => u.email === updatedUser.email ? updatedUser : u));
      if (currentUser?.email === updatedUser.email) {
        setCurrentUser(updatedUser);
      }

      const localUsersStr = localStorage.getItem('boutique_users') || '{}';
      let localUsers: Record<string, any> = {};
      try { localUsers = JSON.parse(localUsersStr); } catch (err) {}
      localUsers[updatedUser.email] = {
        ...(localUsers[updatedUser.email] || {}),
        ...updatedUser
      };
      localStorage.setItem('boutique_users', JSON.stringify(localUsers));

      if (!configDiagnostics.isUsingFallback) {
        await setDoc(doc(db, 'users', userIdKey), updatedUser, { merge: true });
      }
      triggerNotification(`Member profile for ${updatedUser.fullName} updated.`);
    } catch (e) {
      console.error(e);
      triggerNotification(`Failed to sync profile: ${(e as Error).message}`);
    }
  };

  const handleRemoveUserProfile = async (email: string) => {
    try {
      const userIdKey = email.replace(/[.@]/g, '_');
      
      setUsers((prev) => prev.filter((u) => u.email !== email));

      const localUsersStr = localStorage.getItem('boutique_users') || '{}';
      let localUsers: Record<string, any> = {};
      try { localUsers = JSON.parse(localUsersStr); } catch (err) {}
      if (localUsers[email]) {
        delete localUsers[email];
        localStorage.setItem('boutique_users', JSON.stringify(localUsers));
      }

      if (!configDiagnostics.isUsingFallback) {
        await deleteDoc(doc(db, 'users', userIdKey));
      }
      triggerNotification(`Profile ${email} removed.`);
    } catch (e) {
      console.error(e);
      triggerNotification(`Failed to remove: ${(e as Error).message}`);
    }
  };

  const handleUpdateSettings = async (newSettings: BoutiqueSettings) => {
    setBoutiqueSettings(newSettings);
    try {
      await setDoc(doc(db, 'settings', 'boutique_config'), newSettings);
      triggerNotification('Store layout and policies updated in Firestore.');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'settings/boutique_config');
    }
  };

  const handleRestoreOriginals = async () => {
    try {
      setCatalog(products);
      for (const p of products) {
        await setDoc(doc(db, 'watches', p.id), p);
      }
      triggerNotification('Swiss defaults restored and written to Firestore!');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'watches');
    }
  };

  const handleLoginUser = async (email: string, fullName: string, password?: string, isSignUp?: boolean) => {
    const trimmedEmail = email.trim();
    const userIdKey = trimmedEmail.replace(/[.@]/g, '_');

    try {
      const docRef = doc(db, 'users', userIdKey);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        if (isSignUp) {
          throw new Error('This boutique profile is already registered. Please go back and authenticate.');
        }

        const loadedProfile = docSnap.data() as UserProfile & { password?: string };
        
        if (loadedProfile.password !== undefined && loadedProfile.password !== '') {
          if (password !== loadedProfile.password) {
            throw new Error('Incorrect credentials entered for boutique profile.');
          }
        }

        const loggedInUser: UserProfile = {
          email: loadedProfile.email,
          fullName: loadedProfile.fullName,
          isLoggedIn: true,
          memberTier: loadedProfile.memberTier,
          loyaltyPoints: loadedProfile.loyaltyPoints,
          isAdmin: !!loadedProfile.isAdmin,
        };

        setCurrentUser(loggedInUser);
        if (loggedInUser.isAdmin) {
          setIsAdminDashboardActive(true);
          triggerNotification(`Authorized Admin Session. Master Dashboard loaded.`);
        } else {
          triggerNotification(`Welcome back, ${loggedInUser.fullName}! Session synced with Firestore.`);
        }
      } else {
        // Special handling for the Master admin user if database is completely empty / not seeded
        if (trimmedEmail === 'admin' || trimmedEmail === 'admin@chronos.com') {
          if (password === '123') {
            const adminUser: UserProfile = {
              email: trimmedEmail,
              fullName: 'Master Horologist',
              isLoggedIn: true,
              memberTier: 'Master Horologist',
              loyaltyPoints: 9999,
              isAdmin: true,
            };
            setCurrentUser(adminUser);
            setIsAdminDashboardActive(true);
            triggerNotification(`Authorized Admin Session (Local Master Portal).`);
            return;
          } else {
            throw new Error('Incorrect credentials entered for Master Portal.');
          }
        }

        if (!isSignUp) {
          throw new Error('Profile not found in boutique registry. Please sign up (SHING UP) first.');
        }

        // Normal register flow
        const newProfileWithPwd: any = {
          email: trimmedEmail,
          fullName: fullName || 'Vanguard Collector',
          isLoggedIn: true,
          memberTier: 'Loyal Collector',
          loyaltyPoints: 15,
          password: password || '',
        };
        await setDoc(docRef, newProfileWithPwd);

        const newProfile: UserProfile = {
          email: trimmedEmail,
          fullName: newProfileWithPwd.fullName,
          isLoggedIn: true,
          memberTier: newProfileWithPwd.memberTier,
          loyaltyPoints: newProfileWithPwd.loyaltyPoints,
        };
        setCurrentUser(newProfile);
        triggerNotification(`Enrolled successfully! Profile initialized in Firestore.`);
      }
    } catch (e: any) {
      // If it is one of our custom validation error messages, bubble it up to LoginModal/CheckoutModal
      if (
        e.message === 'This boutique profile is already registered. Please go back and authenticate.' ||
        e.message === 'Profile not found in boutique registry. Please sign up (SHING UP) first.' ||
        e.message === 'Incorrect credentials entered for boutique profile.' ||
        e.message === 'Incorrect credentials entered for Master Portal.'
      ) {
        throw e;
      }

      // Local fallback login checks when Firebase configuration is offline
      if (trimmedEmail === 'admin' || trimmedEmail === 'admin@chronos.com') {
        if (password === '123') {
          const adminUser: UserProfile = {
            email: trimmedEmail,
            fullName: 'Master Horologist',
            isLoggedIn: true,
            memberTier: 'Master Horologist',
            loyaltyPoints: 9999,
            isAdmin: true,
          };
          setCurrentUser(adminUser);
          setIsAdminDashboardActive(true);
          triggerNotification(`Authorized Local Admin Session.`);
          return;
        } else {
          throw new Error('Incorrect credentials entered for Master Portal.');
        }
      }

      // For normal users in offline fallback check local storage registry
      const localUsersStr = localStorage.getItem('boutique_users') || '{}';
      let localUsers: Record<string, any> = {};
      try {
        localUsers = JSON.parse(localUsersStr);
      } catch (err) {}

      if (localUsers[trimmedEmail]) {
        const matchedLocal = localUsers[trimmedEmail];
        if (isSignUp) {
          throw new Error('This boutique profile is already registered. Please login.');
        }
        if (password && matchedLocal.password !== password) {
          throw new Error('Incorrect credentials entered for offline profile.');
        }
        const loggedInUser: UserProfile = {
          email: matchedLocal.email,
          fullName: matchedLocal.fullName,
          isLoggedIn: true,
          memberTier: matchedLocal.memberTier || 'Loyal Collector',
          loyaltyPoints: matchedLocal.loyaltyPoints || 15,
        };
        setCurrentUser(loggedInUser);
        triggerNotification(`Welcome back, ${loggedInUser.fullName}! (Offline Session synced)`);
        return;
      }

      if (!isSignUp) {
        throw new Error('Profile not found in local boutique registry. Please sign up (SHING UP) first.');
      }

      // Save new local fallback user registry
      const newProfile: UserProfile = {
        email: trimmedEmail,
        fullName: fullName || 'Vanguard Collector',
        isLoggedIn: true,
        memberTier: 'Loyal Collector',
        loyaltyPoints: 15,
      };

      localUsers[trimmedEmail] = {
        email: trimmedEmail,
        fullName: fullName || 'Vanguard Collector',
        password: password || '',
        memberTier: 'Loyal Collector',
        loyaltyPoints: 15,
      };
      localStorage.setItem('boutique_users', JSON.stringify(localUsers));

      setCurrentUser(newProfile);
      triggerNotification('Offline Sign Up Completed!');
    }
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
      {currentUser?.isAdmin && !isAdminDashboardActive && (
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
        hideCategoryShelf={isAdminDashboardActive}
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
            onUpdateCatalog={handleUpdateCatalog}
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onRemoveOrder={handleRemoveOrder}
            onClearOrders={handleClearOrders}
            settings={boutiqueSettings}
            onUpdateSettings={handleUpdateSettings}
            onRestoreOriginals={handleRestoreOriginals}
            onClose={() => setIsAdminDashboardActive(false)}
            users={users}
            onUpdateUser={handleUpdateUserProfile}
            onRemoveUser={handleRemoveUserProfile}
          />
        ) : activeWatchPage ? (
          <WatchPage
            watch={activeWatchPage}
            onBack={() => setActiveWatchPage(null)}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
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
        giftWrappingEnabled={boutiqueSettings.giftWrappingEnabled !== false}
        giftBoxOptions={boutiqueSettings.giftBoxOptions || [
          { id: 'leather', name: 'Luxury Leather Gift Box', price: 1250 }
        ]}
        selectedGiftBoxId={selectedGiftBoxId}
        onSelectGiftBox={setSelectedGiftBoxId}
        freeShippingEnabled={boutiqueSettings.freeShippingEnabled !== false}
        freeShippingThreshold={boutiqueSettings.freeShippingThreshold !== undefined ? boutiqueSettings.freeShippingThreshold : 400000}
      />

      {/* Checkout Payment Wizard */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        appliedPromo={activeDiscount}
        giftWrapping={isGiftWrapSelected}
        selectedGiftBoxId={selectedGiftBoxId}
        giftBoxOptions={boutiqueSettings.giftBoxOptions || [
          { id: 'leather', name: 'Luxury Leather Gift Box', price: 1250 }
        ]}
        onOrderCompleted={handleOrderCompleted}
        user={currentUser}
        onLogin={handleLoginUser}
        freeShippingEnabled={boutiqueSettings.freeShippingEnabled !== false}
        freeShippingThreshold={boutiqueSettings.freeShippingThreshold !== undefined ? boutiqueSettings.freeShippingThreshold : 400000}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        user={currentUser}
        onLogin={handleLoginUser}
        onLogout={() => {
          setCurrentUser(null);
          setIsAdminDashboardActive(false);
          triggerNotification('Boutique session cleared successfully.');
        }}
        orders={orders}
        onUpdateOrderStatus={handleUpdateOrderStatus}
      />

      {/* Firebase Diagnostics Overlay Helper Modal (Hinglish) */}
      {showConfigHelper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0b0b0b] border border-white/10 max-w-lg w-full rounded-2xl p-6 sm:p-8 relative shadow-2xl font-sans" id="firebase-diagnostics-modal">
            <button
              onClick={() => setShowConfigHelper(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white transition-colors cursor-pointer text-lg font-mono p-1"
            >
              ✕
            </button>
            
            <div className="flex items-center space-x-3 mb-6">
              <AlertCircle className="h-6 w-6 text-amber-500 animate-pulse" />
              <h3 className="text-lg font-serif tracking-wider uppercase text-white">Firebase Connection Helper</h3>
            </div>

            <p className="text-stone-350 text-xs leading-relaxed mb-6">
              <strong>Hinglish Guidance:</strong> Aapka watch boutique standard <strong>Local Fallback Mode</strong> me chal rha hai.
              Agar aap isko real Firebase backend se connect karna chahte hain, toh verified environment variables ka setup checklist check karein.
            </p>

            <div className="space-y-3.5 bg-black/50 border border-white/5 p-4 rounded-xl font-mono text-[11px] mb-6">
              <div className="text-[10px] text-stone-500 uppercase tracking-widest border-b border-white/5 pb-1 mb-2">
                Loaded Configuration Checklist:
              </div>
              
              <div className="flex justify-between items-center">
                <span>1. API Key (VITE_FIREBASE_API_KEY):</span>
                <span>{configDiagnostics.apiKeyValid ? "✅ Loaded" : configDiagnostics.hasApiKey ? "⚠️ Incomplete/Invalid format" : "✕ Empty"}</span>
              </div>
              
              <div className="flex justify-between items-center border-t border-white/5 pt-2">
                <span>2. Project ID (VITE_FIREBASE_PROJECT_ID):</span>
                <span>{configDiagnostics.hasProjectId ? "✅ Loaded/Correct" : "✕ Empty"}</span>
              </div>

              <div className="flex justify-between items-center border-t border-white/5 pt-2">
                <span>3. App ID (VITE_FIREBASE_APP_ID):</span>
                <span>{configDiagnostics.hasAppId ? "✅ Loaded/Correct" : "✕ Empty"}</span>
              </div>

              <div className="flex justify-between items-center border-t border-white/5 pt-2">
                <span>4. Auth Domain (VITE_FIREBASE_AUTH_DOMAIN):</span>
                <span>{configDiagnostics.hasAuthDomain ? "✅ Loaded/Correct" : "✕ Empty"}</span>
              </div>

              <div className="flex flex-col gap-1 border-t border-white/5 pt-2 text-[10px] text-stone-400">
                <span className="font-sans font-semibold text-stone-300">Resolved Project Details:</span>
                <span>• Project ID: <code className="text-amber-500/90">{configDiagnostics.projectId}</code></span>
                <span>• Database ID: <code className="text-amber-500/90">{configDiagnostics.databaseId}</code></span>
                {firebaseErrorText && (
                  <span className="text-red-400 block max-h-16 overflow-y-auto scrollbar-none">
                    • Connection Error: <code>{firebaseErrorText}</code>
                  </span>
                )}
              </div>
            </div>

            <div className="text-stone-350 text-xs space-y-2 mb-6 bg-amber-500/5 border border-amber-500/10 p-3.5 rounded-xl font-mono leading-relaxed">
              <div className="font-sans font-bold text-amber-500 flex items-center space-x-1">
                <span>💡 How to Fix (Connect Kaise Karein):</span>
              </div>
              <ul className="list-decimal pl-4 space-y-1 text-[11px]">
                <li>AI Studio editor ke extreme left settings gears (Settings Panel) par jaen.</li>
                <li><strong>"Environment Variables"</strong> section me direct environment fields update karein.</li>
                <li>Verify karein ki aapne correct <strong>API Key</strong> (<code className="text-amber-500">starts with AIzaSy</code>) aur other parameters (Project ID, App ID, etc.) enter kiya ho.</li>
                <li>Save karke page refresh karein real sync verify karne ke liye!</li>
              </ul>
            </div>

            <button
              onClick={() => setShowConfigHelper(false)}
              className="w-full bg-stone-900 border border-white/10 hover:border-amber-500/40 text-stone-200 py-3.5 rounded-full text-xs font-semibold hover:text-white transition-all cursor-pointer"
            >
              Close Config Guide
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
