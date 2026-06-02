import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Shield, Award, HelpCircle, ShoppingBag, Landmark, Truck, RefreshCcw, Heart, Send, CreditCard } from 'lucide-react';
import { WatchModel } from '../types';
import { products } from '../data/products';

interface WatchPageProps {
  watch: WatchModel;
  onBack: () => void;
  onAddToCart: (watch: WatchModel) => void;
  onBuyNow?: (watch: WatchModel) => void;
  onSelectAnotherWatch: (watch: WatchModel) => void;
  onLendTimepiece?: (watchId: string) => void;
  warrantyActive?: boolean;
  catalog?: WatchModel[];
}

interface UserReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  isVerified: boolean;
}

export default function WatchPage({
  watch,
  onBack,
  onAddToCart,
  onBuyNow,
  onSelectAnotherWatch,
  onLendTimepiece,
  warrantyActive = true,
  catalog,
}: WatchPageProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'reviews'>('details');
  const [isLiked, setIsLiked] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [shareCopied, setShareCopied] = useState(false);
  
  // Local state for user reviews submissions
  const [reviews, setReviews] = useState<UserReview[]>(() => {
    const saved = localStorage.getItem(`chronos_reviews_${watch.id}`);
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'rev-1',
        author: 'Vikram Mehta',
        rating: 5,
        date: '2026-04-12',
        comment: 'Absolutely superb piece of engineering. The sweep of the hands is incredibly smooth. The packaging was top-notch with DHL prioritised tracking.',
        isVerified: true
      },
      {
        id: 'rev-2',
        author: 'Ananya S.',
        rating: 4.5,
        date: '2026-05-01',
        comment: 'Incredible detail on the gears. Feels extremely lightweight on the wrist. Easily the headturner in my corporate collection.',
        isVerified: true
      }
    ];
  });

  const [newAuthor, setNewAuthor] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');

  // Sync reviews to storage
  useEffect(() => {
    try {
      localStorage.setItem(`chronos_reviews_${watch.id}`, JSON.stringify(reviews));
    } catch (e) {
      console.error('[LocalStorage Error] Failed to persist review:', e);
    }
  }, [reviews, watch.id]);

  // Handle review submission
  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newComment.trim()) return;

    const reviewItem: UserReview = {
      id: `rev-${Date.now()}`,
      author: newAuthor,
      rating: newRating,
      date: new Date().toISOString().split('T')[0],
      comment: newComment,
      isVerified: true
    };

    setReviews([reviewItem, ...reviews]);
    setNewAuthor('');
    setNewRating(5);
    setNewComment('');
    setReviewSuccessMsg('Thank you! Your verified owner review is posted successfully.');
    setTimeout(() => setReviewSuccessMsg(''), 4000);
  };



  // Get Related Watches (Filter out current watch)
  const relatedWatches = (catalog || products).filter(p => p.id !== watch.id).slice(0, 3);

  // Auto-scroll to top when watch changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [watch.id]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in" id={`watch-page-container-${watch.id}`}>
      
      {/* Navigation and Actions Row */}
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={onBack}
          className="group flex items-center space-x-2.5 text-xs font-mono tracking-widest uppercase text-stone-400 hover:text-white transition-colors cursor-pointer"
          id="back-to-boutique-btn"
        >
          <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1.5 transition-transform" />
          <span>Back to Boutique Storefront</span>
        </button>

        {warrantyActive && (
          <span className="text-[10px] font-mono text-amber-500/80 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-full select-none animate-pulse">
            ✨ Live Spec Sheet & Warranty Engine Active
          </span>
        )}
      </div>

      {/* Main Container Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Interactive Media Frame Column */}
        <div className="lg:col-span-6 space-y-6">
          <div className="relative bg-[#0e0e0e] rounded-3xl border border-white/5 p-8 sm:p-14 flex items-center justify-center overflow-hidden group select-none shadow-[inset_0_4px_40px_rgba(0,0,0,0.8)]">
            
            {/* Background luxury gradient glowing dust */}
            <div className="absolute inset-0 bg-radial-gradient from-amber-500/5 to-transparent opacity-40 group-hover:opacity-80 transition-opacity duration-700 pointer-events-none"></div>

            {/* Category Banner over image showcase */}
            <span className="absolute top-6 left-6 text-[10px] font-bold tracking-[0.2em] font-mono text-stone-500 uppercase">
              COUTURIER • {watch.category} Collection
            </span>

            {/* Premium Wishlist Heart Action */}
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`absolute top-6 right-6 p-2.5 rounded-full border transition-all duration-300 active:scale-90 cursor-pointer ${
                isLiked
                  ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                  : 'bg-[#151515] border-white/10 text-stone-450 hover:text-white hover:bg-white/5'
              }`}
              title="Add to premium collection wishlist"
            >
              <Heart className={`h-4.5 w-4.5 ${isLiked ? 'fill-current' : ''}`} />
            </button>

            {/* Watch Primary Visualization Portrait */}
            <div className="relative flex flex-col items-center justify-center py-6 min-h-[440px]">
              <div className="transform group-hover:scale-105 transition-transform duration-700 ease-out py-4">
                <img
                  src={(watch.images && watch.images[selectedImageIndex]) || watch.imageUrl}
                  alt={watch.name}
                  referrerPolicy="no-referrer"
                  className="max-h-[320px] sm:max-h-[380px] w-auto object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]"
                />
              </div>

              {/* Multi-photo paginator bar */}
              {watch.images && watch.images.length > 1 && (
                <div className="flex justify-center flex-wrap gap-2 mt-4 z-10">
                  {watch.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`h-11 w-11 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                        selectedImageIndex === idx
                          ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500'
                          : 'border-white/10 bg-black/40 hover:border-white/20'
                      }`}
                    >
                      <img src={img} alt={`Angle ${idx + 1}`} className="h-full w-full object-contain p-0.5" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Studio validation annotation */}
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-mono tracking-widest text-stone-500 uppercase whitespace-nowrap select-none">
              • High Definition Studio Master Render •
            </p>
          </div>

          {/* Core Trust Milestones Section */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#0e0e0e] border border-white/5 p-4 rounded-2xl text-center space-y-1">
              <Truck className="h-4.5 w-4.5 text-amber-500 mx-auto" />
              <h4 className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">Insured DHL</h4>
              <p className="text-[10px] text-stone-400">Complimentary priority premium air shipment</p>
            </div>
            <div className="bg-[#0e0e0e] border border-white/5 p-4 rounded-2xl text-center space-y-1">
              <Award className="h-4.5 w-4.5 text-amber-500 mx-auto" />
              <h4 className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">3-Yr Cover</h4>
              <p className="text-[10px] text-stone-400">Comprehensive manufacturer warranty</p>
            </div>
            <div className="bg-[#0e0e0e] border border-white/5 p-4 rounded-2xl text-center space-y-1">
              <RefreshCcw className="h-4.5 w-4.5 text-amber-500 mx-auto" />
              <h4 className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">Bespoke Returns</h4>
              <p className="text-[10px] text-stone-400">14-day hassle free courier return pickup</p>
            </div>
          </div>
        </div>

        {/* Right Information & Interactivity Column */}
        <div className="lg:col-span-6 space-y-8 text-left">
          
          {/* Identity Header */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-mono font-bold tracking-[0.25em] text-amber-500 uppercase">
                {watch.brand}
              </span>
              <div className="flex items-center space-x-1 font-mono text-xs text-stone-300">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span className="font-bold text-white">{watch.rating}</span>
                <span className="text-stone-500">({reviews.length} Owner Reviews)</span>
              </div>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl text-white font-medium tracking-tight leading-tight">
              {watch.name}
            </h1>
          </div>

          {/* Pricing & Shipment urgencies box */}
          <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-[10px] font-mono text-stone-550 uppercase tracking-widest block">Authorized Boutique Price</span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-3xl font-serif font-semibold text-white">
                    ₹{watch.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs font-mono text-stone-500">INR Taxes / GST Incl.</span>
                </div>
              </div>

              {watch.stock <= 5 ? (
                <div className="bg-rose-950/20 text-rose-400 text-xs font-mono px-3.5 py-1.5 rounded-lg border border-rose-900/30 flex items-center space-x-1.5 shrink-0">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                  <span>Extremely Rare: {watch.stock} piece(s) in stock!</span>
                </div>
              ) : (
                <div className="bg-emerald-950/20 text-emerald-400 text-xs font-mono px-3.5 py-1.5 rounded-lg border border-emerald-900/40 flex items-center space-x-1.5 shrink-0">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>In Stock • Ready to dispatch</span>
                </div>
              )}
            </div>

            {/* Adding action button to directly authorize cart items loading */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onAddToCart(watch)}
                className="flex-1 bg-stone-900 hover:bg-stone-800 text-white border border-white/10 py-3.5 px-4 rounded-xl text-xs font-mono font-bold tracking-widest uppercase transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer select-none"
                id={`add-to-cart-page-${watch.id}`}
              >
                <ShoppingBag className="h-4 w-4" />
                <span>ADD TO CART</span>
              </button>

              <button
                onClick={() => onBuyNow && onBuyNow(watch)}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black py-3.5 px-4 rounded-xl text-xs font-mono font-bold tracking-widest uppercase transition-all duration-300 hover:shadow-[0_0_15px_rgba(245,158,11,0.35)] flex items-center justify-center space-x-2 cursor-pointer select-none"
                id={`buy-now-page-${watch.id}`}
              >
                <CreditCard className="h-4 w-4" />
                <span>BUY NOW</span>
              </button>
            </div>

            <div className="text-[10px] font-mono text-stone-500 flex justify-between pt-1 font-semibold">
              <span>✈️ Order in next 02h 45m to dispatch today</span>
              <span>🔒 256-Bit SSL Secured</span>
            </div>
          </div>

          {/* Interactive Specification Tabs Section */}
          <div className="border border-white/5 rounded-2xl bg-[#0e0e0e] overflow-hidden">
            
            {/* Headers navigation */}
            <div className="p-2 sm:p-3 bg-[#121212] border-b border-white/5 flex flex-col sm:flex-row gap-2.5 text-xs font-mono select-none">
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 py-2.5 px-4 rounded-xl font-medium tracking-wider text-center transition-all cursor-pointer border ${
                  activeTab === 'details'
                    ? 'bg-amber-500 text-black border-amber-500 font-extrabold shadow-[0_4px_12px_rgba(245,158,11,0.25)]'
                    : 'bg-[#181818] text-stone-400 border-white/5 hover:text-white hover:bg-neutral-800'
                }`}
              >
                Timepiece Details
              </button>
              <button
                onClick={() => setActiveTab('specs')}
                className={`flex-1 py-2.5 px-4 rounded-xl font-medium tracking-wider text-center transition-all cursor-pointer border ${
                  activeTab === 'specs'
                    ? 'bg-amber-500 text-black border-amber-500 font-extrabold shadow-[0_4px_12px_rgba(245,158,11,0.25)]'
                    : 'bg-[#181818] text-stone-400 border-white/5 hover:text-white hover:bg-neutral-800'
                }`}
              >
                Technical Meta Specs
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex-1 py-2.5 px-4 rounded-xl font-medium tracking-wider text-center transition-all cursor-pointer border ${
                  activeTab === 'reviews'
                    ? 'bg-amber-500 text-black border-amber-500 font-extrabold shadow-[0_4px_12px_rgba(245,158,11,0.25)]'
                    : 'bg-[#181818] text-stone-400 border-white/5 hover:text-white hover:bg-neutral-800'
                }`}
              >
                Owner Reviews ({reviews.length})
              </button>
            </div>

            {/* Core Tab Content Screen Area */}
            <div className="p-6 text-xs sm:text-sm text-stone-350 leading-relaxed min-h-[220px]">
              
              {activeTab === 'details' && (
                <div className="space-y-4 font-sans text-stone-300">
                  <p>{watch.description}</p>
                  <div className="border border-white/5 bg-[#121212] p-4 rounded-xl flex items-center space-x-3 text-stone-400">
                    <Shield className="h-5 w-5 text-amber-500 shrink-0" />
                    <span className="text-xs">
                      Includes a serialized Certificate of Authenticity confirming absolute alignment of jewels, calibres, and structural chronometric casing metrics under Swiss benchmark codes.
                    </span>
                  </div>
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="space-y-2">
                  <table className="w-full text-stone-300">
                    <tbody>
                      <tr className="border-b border-white/5">
                        <td className="py-2.5 font-mono text-stone-550 w-1/3">Calibre Calibrated</td>
                        <td className="py-2.5 text-stone-205 font-medium">{watch.specs?.movement || 'Standard Calibre'}</td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2.5 font-mono text-stone-555">Chassis Architecture</td>
                        <td className="py-2.5 text-stone-200 font-medium">{watch.specs?.caseSize || 'Standard Dimensions'}</td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2.5 font-mono text-stone-555">Protection Coating</td>
                        <td className="py-2.5 text-stone-200 font-medium">{watch.specs?.crystal || 'Sapphire Crystal'}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-mono text-stone-555">Waterproof ISO Rating</td>
                        <td className="py-2.5 text-emerald-400 font-bold">{watch.specs?.waterResistance || 'Standard Water Resistance'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}



              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  
                  {/* Reviews Submit Form */}
                  <form onSubmit={handleAddReview} className="p-4 bg-[#121212] border border-white/10 rounded-xl space-y-3 text-left">
                    <span className="text-[10px] uppercase tracking-wider font-mono text-amber-500 font-semibold block">Post Verified Review</span>
                    
                    {reviewSuccessMsg && (
                      <div className="bg-emerald-950/20 text-emerald-400 text-xs py-2 px-3 rounded border border-emerald-900/30 font-mono">
                        {reviewSuccessMsg}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-mono text-stone-500 block mb-1">Your Name</label>
                        <input
                          type="text"
                          required
                          value={newAuthor}
                          onChange={(e) => setNewAuthor(e.target.value)}
                          placeholder="Lord Alexandre"
                          className="w-full px-3 py-1.5 bg-black border border-white/5 rounded text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-mono text-stone-500 block mb-1">Star Assessment</label>
                        <select
                          value={newRating}
                          onChange={(e) => setNewRating(Number(e.target.value))}
                          className="w-full px-3 py-1.5 bg-black border border-white/5 rounded text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="5">⭐⭐⭐⭐⭐ (5 / 5)</option>
                          <option value="4">⭐⭐⭐⭐ (4 / 5)</option>
                          <option value="3">⭐⭐⭐ (3 / 5)</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-[9px] font-mono text-stone-500 block mb-1">Chronometer feedback</label>
                      <textarea
                        required
                        rows={2}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Detail mechanical alignment, sweep motion, and craftsmanship..."
                        className="w-full px-3 py-1.5 bg-black border border-white/5 rounded text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-white text-black hover:bg-amber-500 hover:text-black font-semibold font-mono text-[10px] px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Send className="h-3 w-3" />
                        <span>Publish Verified Review</span>
                      </button>
                    </div>
                  </form>

                  {/* Existing Reviews list container */}
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="p-3.5 bg-white/5 border border-white/5 rounded-xl space-y-1.5 text-left text-xs">
                        <div className="flex justify-between items-center font-mono">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white pr-1 border-r border-white/10">{rev.author}</span>
                            <span className="text-[9px] text-stone-550 flex items-center bg-amber-500/15 text-amber-400 border border-amber-500/25 px-1.5 py-0.5 rounded-full">
                              ✓ Verified Owner
                            </span>
                          </div>
                          <span className="text-stone-500 text-[10px]">{rev.date}</span>
                        </div>

                        {/* Stars indicator */}
                        <div className="text-amber-505 select-none font-mono text-[10px]">
                          {"★".repeat(Math.floor(rev.rating)) + (rev.rating % 1 !== 0 ? "½" : "")}
                        </div>

                        <p className="text-stone-400 font-sans leading-relaxed">{rev.comment}</p>
                      </div>
                    ))}
                  </div>

                </div>
              )}

            </div>
          </div>

        </div>
      </div>

      {/* Suggested & Related Timepieces Shelf */}
      <section className="mt-20 border-t border-white/5 pt-12 text-left">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-amber-505 uppercase block mb-1">
            Discover Heirloom Curations
          </span>
          <h3 className="font-serif text-2xl font-semibold text-white mb-6">
            Related Elite Chronometers
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {relatedWatches.map((rel) => (
            <div
              key={rel.id}
              onClick={() => onSelectAnotherWatch(rel)}
              className="group bg-[#0e0e0e] border border-white/5 rounded-2xl p-5 hover:border-amber-500/30 transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div className="bg-[#121212] aspect-square rounded-xl p-4 flex items-center justify-center mb-4 relative overflow-hidden">
                <img
                  src={rel.imageUrl}
                  alt={rel.name}
                  referrerPolicy="no-referrer"
                  className="max-h-[140px] w-auto object-contain transform group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div>
                <span className="text-[9px] font-mono text-stone-550 uppercase tracking-widest block mb-1">
                  {rel.brand}
                </span>
                <h4 className="font-serif text-sm font-medium text-white group-hover:text-amber-500 transition-colors line-clamp-1">
                  {rel.name}
                </h4>
                <p className="text-xs text-amber-500 font-mono mt-1 font-semibold">
                  Price: ₹{rel.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
