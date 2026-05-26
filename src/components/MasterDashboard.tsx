import React, { useState } from 'react';
import { 
  Database, 
  ShoppingBag, 
  Sliders, 
  Plus, 
  Edit, 
  Trash2, 
  Upload,  
  RotateCcw, 
  DollarSign, 
  Package, 
  Clock, 
  User, 
  FileText, 
  TrendingUp, 
  ToggleLeft, 
  ToggleRight, 
  ChevronRight, 
  CheckCircle, 
  AlertTriangle,
  Coins
} from 'lucide-react';
import { WatchModel, CompactOrder, BoutiqueSettings } from '../types';

interface MasterDashboardProps {
  catalog: WatchModel[];
  onUpdateCatalog: (newCatalog: WatchModel[]) => void;
  orders: CompactOrder[];
  onUpdateOrderStatus: (orderId: string, status: CompactOrder['status']) => void;
  onRemoveOrder: (orderId: string) => void;
  onAddOrderSimulation: () => void;
  onClearOrders: () => void;
  settings: BoutiqueSettings;
  onUpdateSettings: (newSettings: BoutiqueSettings) => void;
  onRestoreOriginals: () => void;
  onClose: () => void;
}

export default function MasterDashboard({
  catalog,
  onUpdateCatalog,
  orders,
  onUpdateOrderStatus,
  onRemoveOrder,
  onAddOrderSimulation,
  onClearOrders,
  settings,
  onUpdateSettings,
  onRestoreOriginals,
  onClose,
}: MasterDashboardProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders' | 'customizer'>('catalog');
  
  // Settings Drafts for Boutique customizer
  const [draftSettings, setDraftSettings] = useState<BoutiqueSettings>({ ...settings });
  const [isSettingsSaved, setIsSettingsSaved] = useState(true);

  React.useEffect(() => {
    setDraftSettings({ ...settings });
    setIsSettingsSaved(true);
  }, [settings]);

  // Custom timepiece state
  const [isAddingWatch, setIsAddingWatch] = useState(false);
  const [editingWatchId, setEditingWatchId] = useState<string | null>(null);
  
  // Form states for adding/editing watch
  const [watchId, setWatchId] = useState('');
  const [watchName, setWatchName] = useState('');
  const [watchBrand, setWatchBrand] = useState('');
  const [watchPrice, setWatchPrice] = useState(150000);
  const [watchCategory, setWatchCategory] = useState<WatchModel['category']>('sports');
  const [watchImgUrl, setWatchImgUrl] = useState('');
  const [watchPhotos, setWatchPhotos] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [watchDesc, setWatchDesc] = useState('');
  const [caseSize, setCaseSize] = useState('42mm Titanium');
  const [waterRes, setWaterRes] = useState('100m / 330ft');
  const [crystal, setCrystal] = useState('Domed Sapphire');
  const [movement, setMovement] = useState('Automatic Movement');
  const [watchStock, setWatchStock] = useState(10);
  const [watchRating, setWatchRating] = useState(4.8);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setWatchPhotos((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!e.dataTransfer.files) return;
    const files = Array.from(e.dataTransfer.files) as File[];
    
    files.forEach((file) => {
      if (file.type && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setWatchPhotos((prev) => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setWatchPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Bulk Upload state
  const [jsonPaste, setJsonPaste] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Calculate order metrics
  const totalRevenues = orders.reduce((acc, o) => acc + o.total, 0);
  const finishedOrders = orders.filter((o) => o.status === 'delivered').length;
  const pendingOrders = orders.filter((o) => o.status !== 'delivered').length;

  // Handles individual watch editor loading
  const handleOpenEdit = (watch: WatchModel) => {
    setEditingWatchId(watch.id);
    setWatchId(watch.id);
    setWatchName(watch.name);
    setWatchBrand(watch.brand);
    setWatchPrice(watch.price);
    setWatchCategory(watch.category);
    setWatchImgUrl(watch.imageUrl);
    setWatchPhotos(watch.images || (watch.imageUrl ? [watch.imageUrl] : []));
    setWatchDesc(watch.description);
    setCaseSize(watch.specs.caseSize);
    setWaterRes(watch.specs.waterResistance);
    setCrystal(watch.specs.crystal);
    setMovement(watch.specs.movement);
    setWatchStock(watch.stock);
    setWatchRating(watch.rating);
    setIsAddingWatch(true);
  };

  const resetWatchForm = () => {
    setIsAddingWatch(false);
    setEditingWatchId(null);
    setWatchId('');
    setWatchName('');
    setWatchBrand('');
    setWatchPrice(150000);
    setWatchCategory('sports');
    setWatchImgUrl('');
    setWatchPhotos([]);
    setWatchDesc('');
    setCaseSize('42mm Titanium');
    setWaterRes('100m / 330ft');
    setCrystal('Domed Sapphire');
    setMovement('Automatic Movement');
    setWatchStock(10);
    setWatchRating(4.8);
  };

  // Submit custom timepiece (Add / Edit)
  const handleSaveWatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!watchId || !watchName || !watchBrand) {
      alert('Please fill in identifier code, watch name, and brand.');
      return;
    }

    const defaultImg = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400';
    const newWatch: WatchModel = {
      id: watchId.trim().toLowerCase().replace(/\s+/g, '-'),
      name: watchName,
      brand: watchBrand,
      price: Number(watchPrice),
      category: watchCategory,
      imageUrl: watchPhotos[0] || watchImgUrl.trim() || defaultImg,
      images: watchPhotos.length > 0 ? watchPhotos : [watchImgUrl.trim() || defaultImg],
      description: watchDesc || 'Custom luxury timepiece curated by boutique administrators.',
      specs: {
        caseSize,
        waterResistance: waterRes,
        crystal,
        movement,
      },
      stock: Number(watchStock),
      rating: Number(watchRating),
    };

    if (editingWatchId) {
      // Edit existing
      const updated = catalog.map((w) => (w.id === editingWatchId ? newWatch : w));
      onUpdateCatalog(updated);
    } else {
      // Add new
      if (catalog.some((w) => w.id === newWatch.id)) {
        alert('A watch with this identifier code already exists.');
        return;
      }
      onUpdateCatalog([...catalog, newWatch]);
    }

    resetWatchForm();
  };

  // Delete watch from catalog list
  const handleDeleteWatch = (id: string) => {
    if (confirm('Are you select-positive to remove this timepiece model from boutique catalog?')) {
      const updated = catalog.filter((w) => w.id !== id);
      onUpdateCatalog(updated);
    }
  };

  // Process bulk catalog upload format
  const handleBulkUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');
    setUploadSuccess(false);

    try {
      const parsed = JSON.parse(jsonPaste);
      if (!Array.isArray(parsed)) {
        setUploadError('Catalogs must be structured as a valid JSON Array [] of timepiece nodes.');
        return;
      }

      // Quick validate nodes schema
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (!item.id || !item.name || !item.brand || typeof item.price !== 'number') {
          setUploadError(`Timepiece Node at index ${i} is missing foundational parameters (id, name, brand, or numeric price).`);
          return;
        }
        // Ensure specs object exists
        if (!item.specs) {
          item.specs = {
            caseSize: '40mm Steel',
            waterResistance: '50m',
            crystal: 'Sapphire glass',
            movement: 'Automatic Swiss Movement',
          };
        }
      }

      onUpdateCatalog(parsed);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
      setUploadError(`Failed to parse parameters: ${err?.message || 'Invalid JSON syntax'}`);
    }
  };

  // Quick fill textbox with current catalog JSON
  const handleLoadCurrentJSON = () => {
    setJsonPaste(JSON.stringify(catalog, null, 2));
  };

  // Update boutique config settings locally (draft state)
  const handleSettingChange = (key: keyof BoutiqueSettings, val: any) => {
    setDraftSettings((prev) => ({
      ...prev,
      [key]: val,
    }));
    setIsSettingsSaved(false);
  };

  const handleSaveSettings = () => {
    onUpdateSettings(draftSettings);
    setIsSettingsSaved(true);
  };

  return (
    <div className="bg-[#080808] border-b border-white/5 text-stone-200 text-left relative min-h-[500px]" id="master-admin-console-panel">
      
      {/* Admin dashboard header row */}
      <div className="bg-[#101010] px-6 py-5 border-b border-amber-500/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-amber-500 text-black text-[9px] font-mono px-2 py-0.5 rounded font-black tracking-widest uppercase">
              MASTER PORTAL
            </span>
            <span className="text-stone-500">•</span>
            <span className="text-[10px] text-stone-300 font-mono tracking-widest uppercase">SID COORDINATE REGISTER: ACTIVE</span>
          </div>
          <h2 className="font-serif text-2xl font-semibold text-white mt-1.5 flex items-center space-x-2">
            <span>Boutique Horology Master Dashboard</span>
          </h2>
        </div>
      </div>

      {/* Grid Stats Highlights Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-white/5 bg-black/45">
        <div className="p-4 border-r border-white/5 space-y-0.5">
          <span className="text-[9px] font-mono text-stone-550 uppercase tracking-widest">BOUTIQUE REVENUE</span>
          <span className="text-base sm:text-lg font-bold font-mono text-amber-500 block">
            ₹{totalRevenues.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
          </span>
        </div>
        <div className="p-4 border-r border-white/5 space-y-0.5">
          <span className="text-[9px] font-mono text-stone-550 uppercase tracking-widest">ORDERS ACTIVE</span>
          <span className="text-base sm:text-lg font-bold font-mono text-white block">
            {orders.length} Allocation(s)
          </span>
        </div>
        <div className="p-4 border-r border-white/5 space-y-0.5">
          <span className="text-[9px] font-mono text-stone-550 uppercase tracking-widest">DISPATCH STATUS</span>
          <span className="text-base sm:text-lg font-bold font-mono text-emerald-400 block">
            {finishedOrders} Delivered / {pendingOrders} Pending
          </span>
        </div>
        <div className="p-4 space-y-0.5">
          <span className="text-[9px] font-mono text-stone-550 uppercase tracking-widest">ACTIVE CATALOG</span>
          <span className="text-base sm:text-lg font-bold font-mono text-amber-400 block">
            {catalog.length} Handcrafted Models
          </span>
        </div>
      </div>

      {/* Tabs navigation row */}
      <div className="px-6 border-b border-white/5 flex flex-wrap gap-2 select-none justify-between items-center py-2 bg-[#0d0d0d]">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => { setActiveTab('catalog'); resetWatchForm(); }}
            className={`px-4 py-2.5 text-xs font-mono tracking-wider transition-all flex items-center space-x-1.5 border-b-2 cursor-pointer ${
              activeTab === 'catalog'
                ? 'border-amber-500 text-amber-500 font-bold bg-[#121212]'
                : 'border-transparent text-stone-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>Manage Catalog ({catalog.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 text-xs font-mono tracking-wider transition-all flex items-center space-x-1.5 border-b-2 cursor-pointer ${
              activeTab === 'orders'
                ? 'border-amber-500 text-amber-500 font-bold bg-[#121212]'
                : 'border-transparent text-stone-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Orders & Shipments ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('customizer')}
            className={`px-4 py-2.5 text-xs font-mono tracking-wider transition-all flex items-center space-x-1.5 border-b-2 cursor-pointer ${
              activeTab === 'customizer'
                ? 'border-amber-500 text-amber-500 font-bold bg-[#121212]'
                : 'border-transparent text-stone-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Customize Storefront Sites</span>
          </button>
        </div>
      </div>

      {/* Main Container Content */}
      <div className="p-6">
        
        {/* TAB 1: CATALOG MANAGEMENT */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-mono tracking-widest text-[#999999] uppercase select-none">
                Boutique Inventory Shelf
              </h3>
              {!isAddingWatch && (
                <button
                  onClick={() => { resetWatchForm(); setIsAddingWatch(true); }}
                  className="bg-amber-500/10 border border-amber-500/30 text-amber-505 hover:bg-amber-500 hover:text-black hover:border-amber-500 px-3.5 py-1.5 rounded-lg text-[11px] font-mono transition-all font-bold tracking-widest uppercase flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Curate New Timepiece</span>
                </button>
              )}
            </div>

            {isAddingWatch ? (
              /* Timepiece Form (Add / Edit) */
              <form onSubmit={handleSaveWatchSubmit} className="bg-black/50 border border-white/5 p-6 rounded-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h4 className="font-serif text-base text-white font-bold">
                    {editingWatchId ? `Edit Timepiece Parameters: ${editingWatchId}` : 'Curate Custom Timepiece Model'}
                  </h4>
                  <button
                    type="button"
                    onClick={resetWatchForm}
                    className="text-stone-400 hover:text-white font-mono text-[10px] uppercase cursor-pointer"
                  >
                    Cancel Forms
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  <div>
                    <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block mb-1">Model Identifier ID Code</label>
                    <input
                      type="text"
                      required
                      disabled={!!editingWatchId}
                      value={watchId}
                      onChange={(e) => setWatchId(e.target.value)}
                      placeholder="e.g. oceanic-active"
                      className="w-full px-3.5 py-2.5 bg-[#121212] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block mb-1">Timepiece Model Name</label>
                    <input
                      type="text"
                      required
                      value={watchName}
                      onChange={(e) => setWatchName(e.target.value)}
                      placeholder="e.g. Titanic Skeleton Chronometer"
                      className="w-full px-3.5 py-2.5 bg-[#121212] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block mb-1">Brand Name Label</label>
                    <input
                      type="text"
                      required
                      value={watchBrand}
                      onChange={(e) => setWatchBrand(e.target.value)}
                      placeholder="e.g. Nautica Prestige"
                      className="w-full px-3.5 py-2.5 bg-[#121212] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block mb-1">Retail Price (₹ Rupees)</label>
                    <input
                      type="number"
                      required
                      value={watchPrice}
                      onChange={(e) => setWatchPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-[#121212] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block mb-1">Category Classification</label>
                    <select
                      value={watchCategory}
                      onChange={(e) => setWatchCategory(e.target.value as WatchModel['category'])}
                      className="w-full px-3.5 py-2.5 bg-[#121212] border border-white/10 rounded-xl text-xs text-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono cursor-pointer"
                    >
                      <option value="sports">Sports</option>
                      <option value="classic">Classic</option>
                      <option value="minimalist">Minimalist</option>
                      <option value="prestige">Prestige</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block mb-1">Active Stock Count</label>
                    <input
                      type="number"
                      value={watchStock}
                      onChange={(e) => setWatchStock(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-[#121212] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block mb-1">
                      Upload Catalog Photos <span className="text-amber-500 font-bold">*</span>
                    </label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-xl p-4 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px] ${
                        isDragging
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-white/10 hover:border-white/20 bg-[#121212]'
                      }`}
                    >
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Upload className="h-6 w-6 text-stone-400 mb-2" />
                      <span className="text-[11px] text-stone-300 font-medium select-none">
                        Drag & drop multiple photos here, or click to choose
                      </span>
                      <span className="text-[9px] text-[#888888] select-none mt-1">
                        Any photo uploaded updates the catalog item in real-time
                      </span>
                    </div>

                    {/* Previews wrapper */}
                    {watchPhotos.length > 0 && (
                      <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 gap-2 bg-black/40 p-2.5 rounded-lg border border-white/5">
                        {watchPhotos.map((photo, idx) => (
                          <div key={idx} className="relative group aspect-square rounded-md overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                            <img
                              src={photo}
                              alt="Catalog source"
                              className="max-h-full max-w-full object-contain p-1"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(idx)}
                              className="absolute top-1 right-1 h-3.5 w-3.5 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold shadow-md transition-opacity"
                            >
                              ✕
                            </button>
                            <span className="absolute bottom-0.5 left-0.5 bg-black/75 px-1 py-0.5 rounded text-[8px] font-mono text-amber-500 font-semibold shadow">
                              #{idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block mb-1">Initial Stars Score Rating (max 5.0)</label>
                    <input
                      type="number"
                      step="0.05"
                      max="5.0"
                      value={watchRating}
                      onChange={(e) => setWatchRating(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-[#121212] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-[10px] font-mono text-[#999999] uppercase tracking-widest select-none pt-2 border-t border-white/5">
                    TECHNICAL COMPLICATION SPECIFICATIONS
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-[9px] font-mono text-stone-400 block mb-0.5">Case Size / Material</label>
                      <input
                        type="text"
                        value={caseSize}
                        onChange={(e) => setCaseSize(e.target.value)}
                        className="w-full p-2 bg-black border border-white/10 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono text-stone-400 block mb-0.5">Water Resistance Rating</label>
                      <input
                        type="text"
                        value={waterRes}
                        onChange={(e) => setWaterRes(e.target.value)}
                        className="w-full p-2 bg-black border border-white/10 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono text-stone-400 block mb-0.5">Crystal Lens Type</label>
                      <input
                        type="text"
                        value={crystal}
                        onChange={(e) => setCrystal(e.target.value)}
                        className="w-full p-2 bg-black border border-white/10 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono text-stone-400 block mb-0.5">Engine Movement / Calibre</label>
                      <input
                        type="text"
                        value={movement}
                        onChange={(e) => setMovement(e.target.value)}
                        className="w-full p-2 bg-black border border-white/10 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block mb-1">Curator's Narrative Narrative Description</label>
                  <textarea
                    rows={3}
                    value={watchDesc}
                    onChange={(e) => setWatchDesc(e.target.value)}
                    placeholder="Enter an aesthetic high-end copy descriptions..."
                    className="w-full px-3.5 py-2.5 bg-[#121212] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none font-sans"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={resetWatchForm}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs text-stone-300 font-mono transition-colors cursor-pointer"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold border border-amber-500 text-xs rounded-xl font-mono transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <span>✓ Compile Timepiece to Catalog</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Catalog grid list */
              <div className="overflow-x-auto bg-[#101010]/30 border border-white/5 rounded-2xl">
                <table className="w-full min-w-[700px] border-collapse text-[11px] font-mono">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#121212] text-[#999999] text-left uppercase text-[9px] tracking-wider select-none">
                      <th className="p-4 w-20">Preview</th>
                      <th className="p-4">Model Description</th>
                      <th className="p-4">Brand / Category</th>
                      <th className="p-4 text-left">Price (INR)</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4">Specs Summary</th>
                      <th className="p-4 text-center w-24">Management Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catalog.map((w) => (
                      <tr key={w.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                        <td className="p-4">
                          <div className="h-12 w-12 bg-black rounded-lg p-1.5 flex items-center justify-center border border-white/5">
                            <img src={w.imageUrl} alt={w.name} referrerPolicy="no-referrer" className="max-h-full max-w-full object-contain" />
                          </div>
                        </td>
                        <td className="p-4 text-left">
                          <span className="text-white text-xs font-semibold block">{w.name}</span>
                          <span className="text-stone-500 text-[10px] block mt-0.5">UID: {w.id}</span>
                        </td>
                        <td className="p-4 uppercase text-stone-400">
                          <span className="text-stone-200 block">{w.brand}</span>
                          <span className="text-[9px] text-[#9a9a9a] block font-light">{w.category}</span>
                        </td>
                        <td className="p-4 text-xs text-amber-500 font-bold">
                          ₹{w.price.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                              w.stock === 0 
                                ? 'bg-rose-950/20 text-rose-400 border border-rose-900/30' 
                                : w.stock < 5 
                                ? 'bg-amber-950/20 text-amber-400 border border-amber-900/30' 
                                : 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30'
                            }`}>
                              {w.stock} Qty
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-[10px] text-stone-450 max-w-[200px] truncate">
                          {w.specs.caseSize} • {w.specs.movement}
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center items-center space-x-1.5">
                            <button
                              onClick={() => handleOpenEdit(w)}
                              className="p-1.5 bg-white/5 rounded hover:bg-amber-500 hover:text-black border border-white/5 hover:border-amber-500 transition-all text-stone-300 cursor-pointer"
                              title="Edit Timepiece"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteWatch(w.id)}
                              className="p-1.5 bg-white/5 rounded hover:bg-rose-950/80 hover:text-white border border-white/5 hover:border-rose-900/40 transition-all text-rose-400 cursor-pointer"
                              title="Delete Timepiece"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: ORDER & SHIPMENTS CODES */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-sm font-mono tracking-widest text-[#999999] uppercase select-none font-bold">
                  Insular Dispatch Log Controls
                </h3>
                <p className="text-[11px] text-stone-450">
                  Update customer shipping dispatch states.
                </p>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-white/5 rounded-2xl space-y-3">
                <Package className="h-8 w-8 text-stone-600 mx-auto" />
                <h4 className="text-white text-xs font-semibold">No order files detected</h4>
                <p className="text-stone-400 text-[11px] max-w-xs mx-auto">
                  Buy a watch in the store view to populate shipping logs instantly.
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-left">
                {orders.map((order) => (
                  <div key={order.id} className="border border-white/5 bg-[#121212]/30 rounded-2xl p-5 space-y-4">
                    
                    {/* Header info bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-3">
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-[#999999] uppercase font-bold tracking-wider block">ID & DATE</span>
                        <div className="flex items-center space-x-2 text-xs font-mono">
                          <span className="text-white font-bold">{order.id}</span>
                          <span className="text-stone-605">|</span>
                          <span className="text-stone-300">{order.date}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[9px] text-[#999999] uppercase font-bold tracking-wider block">SHIPMENT TRACKING</span>
                        <span className="text-xs text-amber-505 font-mono block">{order.trackingNumber}</span>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-[9px] text-[#999999] uppercase font-bold tracking-wider block">TOTAL PAYOUT (INR)</span>
                        <span className="text-xs text-white font-mono font-bold">
                          ₹{order.total.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                        </span>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-[9px] text-rose-500 uppercase font-bold tracking-wider block">MANAGEMENT ACTION</span>
                        <button
                          onClick={() => onRemoveOrder(order.id)}
                          className="mt-1 bg-rose-950/20 border border-rose-900/40 text-rose-400 hover:bg-rose-900 hover:text-white hover:border-rose-900 text-[10.5px] font-mono font-bold tracking-widest px-2.5 py-1 rounded uppercase cursor-pointer transition-colors flex items-center space-x-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Remove Order</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-1">
                      
                      {/* Customer Profile Column */}
                      <div className="md:col-span-5 space-y-2 text-[11px]">
                        <span className="text-[9px] text-[#999999] uppercase block tracking-widest font-bold">COURIER DESTINATION RECIPIENT</span>
                        <div className="space-y-1 bg-black/40 p-3.5 rounded-xl border border-white/5">
                          <p className="text-white font-semibold font-serif">{order.shippingDetails?.fullName || 'Anonymous'}</p>
                          <p className="text-stone-400">{order.shippingDetails?.email}</p>
                          <p className="text-stone-300 mt-1">{order.shippingDetails?.address}</p>
                          <p className="text-stone-300">{order.shippingDetails?.city}, {order.shippingDetails?.postalCode}</p>
                          <p className="text-stone-400 capitalize">DHL Service: {order.shippingDetails?.shippingMethod || 'priority'}</p>
                          {order.shippingDetails?.giftWrapping && (
                            <span className="inline-block mt-2 bg-amber-505/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[9px] font-bold">
                              🎁 Classic Gift Wrap Allocation Included
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Items Column */}
                      <div className="md:col-span-7 space-y-2">
                        <span className="text-[9px] text-[#999999] uppercase block tracking-widest font-bold">TIMEPIECES INVOLVED</span>
                        <div className="grid grid-cols-1 gap-1.5">
                          {order.items.map((line) => (
                            <div key={line.watch.id} className="flex justify-between items-center bg-black/40 p-2.5 rounded-lg border border-white/5 text-[11px]">
                              <div className="flex items-center space-x-2.5">
                                <div className="h-8 w-8 bg-stone-900 rounded p-1 flex items-center justify-center shrink-0">
                                  <img src={line.watch.imageUrl} alt={line.watch.name} referrerPolicy="no-referrer" className="max-h-full max-w-full object-contain" />
                                </div>
                                <div className="text-left">
                                  <span className="text-stone-200 font-semibold line-clamp-1 block">{line.watch.name}</span>
                                  <span className="text-stone-500 font-mono text-[9px] font-light uppercase block">{line.watch.brand}</span>
                                </div>
                              </div>
                              <span className="font-mono text-stone-100 shrink-0">Qty: {line.quantity}</span>
                            </div>
                          ))}
                        </div>

                        {/* Interactive Dispatch Slider Controls */}
                        <div className="pt-2">
                          <span className="text-[9px] text-amber-500 uppercase block tracking-widest font-bold mb-1.5">
                            TRANSMIT DISPATCH STATUS CHANGE
                          </span>
                          <div className="flex flex-wrap gap-1 font-mono text-[9px]">
                            {['confirmed', 'processing', 'shipped', 'delivered', 'rejected'].map((st) => (
                              <button
                                key={st}
                                onClick={() => onUpdateOrderStatus(order.id, st as CompactOrder['status'])}
                                className={`px-2.5 py-1.5 rounded-lg border uppercase font-bold transition-all cursor-pointer ${
                                  order.status === st
                                    ? st === 'rejected'
                                      ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-500'
                                      : 'bg-amber-500 text-black border-amber-500 hover:bg-amber-400'
                                    : st === 'rejected'
                                      ? 'bg-rose-950/20 border-rose-900/40 text-rose-400 hover:bg-rose-900/40 hover:text-white'
                                      : 'bg-white/5 border-white/5 text-stone-400 hover:bg-white/10 hover:text-white'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>

                      </div>

                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* TAB 3: CUSTOMIZE STOREFRONT CONFIG */}
        {activeTab === 'customizer' && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-sm font-mono tracking-widest text-[#999999] uppercase select-none font-bold">
                  Boutique Front-end Web Configurator
                </h3>
                <p className="text-[11px] text-stone-450 mt-0.5">
                  Prepare setting revisions below, then commit them to the live cloud store using the Save button on the right.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                {!isSettingsSaved && (
                  <span className="text-[10px] text-amber-500 font-mono font-bold animate-pulse">
                    ● UNSAVED CHANGES
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className={`px-5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all duration-300 ${
                    isSettingsSaved
                      ? 'bg-[#121212] border border-white/10 text-stone-500 cursor-not-allowed'
                      : 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer'
                  }`}
                  disabled={isSettingsSaved}
                >
                  Save Storefront Changes
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/40 p-6 rounded-2xl border border-white/5 text-xs text-left">
              
              {/* Store Identity configurations */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-mono text-amber-500 uppercase tracking-widest select-none font-bold border-b border-white/5 pb-2">
                  STORE BRAND IDENTITY Setting
                </h4>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">Boutique Brand Logo Name</label>
                  <input
                    type="text"
                    value={draftSettings.storeName || ''}
                    onChange={(e) => handleSettingChange('storeName', e.target.value)}
                    className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                  <p className="text-[9px] text-stone-550 block">*Applies to dynamic logo text in header, forms, and email receipts.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">Discounts Promo Code Token</label>
                  <input
                    type="text"
                    value={draftSettings.promoCode || ''}
                    onChange={(e) => handleSettingChange('promoCode', e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">Promo Percentage Discount (%)</label>
                  <input
                    type="number"
                    value={draftSettings.promoDiscountPercent || 0}
                    onChange={(e) => handleSettingChange('promoDiscountPercent', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">Warranty Engine Badge Status</label>
                  <div className="flex items-center space-x-2 pt-1 font-mono text-stone-300">
                    <button
                      type="button"
                      onClick={() => handleSettingChange('warrantyActive', !draftSettings.warrantyActive)}
                      className="text-amber-500 cursor-pointer text-stone-400 focus:outline-none"
                    >
                      {draftSettings.warrantyActive ? (
                        <ToggleRight className="h-8 w-8 text-amber-500" />
                      ) : (
                        <ToggleLeft className="h-8 w-8 text-stone-600" />
                      )}
                    </button>
                    <span className="text-[10px]">
                      {draftSettings.warrantyActive ? 'ENABLED: Show live spec chip on Watch Details' : 'DISABLED: Hide live specs warranty indicator'}
                    </span>
                  </div>
                </div>

              </div>

              {/* Hero Banner text configurations */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-mono text-amber-500 uppercase tracking-widest select-none font-bold border-b border-white/5 pb-2">
                  HERO BANNER CUSTOMIZER COPY
                </h4>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">Hero Section Tagline Subtitle</label>
                  <input
                    type="text"
                    value={draftSettings.heroSub || ''}
                    onChange={(e) => handleSettingChange('heroSub', e.target.value)}
                    className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">Hero Main Large Headline Title</label>
                  <input
                    type="text"
                    value={draftSettings.heroTitle || ''}
                    onChange={(e) => handleSettingChange('heroTitle', e.target.value)}
                    className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">Hero Narrative Description Copy</label>
                  <textarea
                    rows={4}
                    value={draftSettings.heroDesc || ''}
                    onChange={(e) => handleSettingChange('heroDesc', e.target.value)}
                    className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none leading-relaxed"
                  />
                </div>
              </div>

            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-amber-500/5 p-4 rounded-xl border border-amber-500/10 text-left">
              <div className="text-[11px] font-mono flex items-center space-x-2.5">
                <CheckCircle className="h-5 w-5 text-amber-500 shrink-0" />
                <p className="text-stone-300">
                  ⚡ Configuration updates will sync directly with the Cloud Firestore Database upon clicking Save.
                </p>
              </div>

              {!isSettingsSaved && (
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg font-mono uppercase tracking-wider transition-colors cursor-pointer"
                >
                  ⚡ Click to Save Changes
                </button>
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
