import React, { useState } from 'react';
import { X, Star, Shield, HelpCircle, Code, Copy, Check } from 'lucide-react';
import { WatchModel } from '../types';

interface WatchModalProps {
  watch: WatchModel | null;
  onClose: () => void;
  onAddToCart: (watch: WatchModel) => void;
}

export default function WatchModal({ watch, onClose, onAddToCart }: WatchModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'shopify'>('desc');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!watch) return null;

  const imagesToDisplay = watch.images && watch.images.length > 0 ? watch.images : [watch.imageUrl];

  // Render a sample simulated GraphQL query showing Shopify Storefront API representation
  const graphQLPayload = `query getProductById {
  product(id: "gid://shopify/Product/${watch.id.toUpperCase()}") {
    title
    vendor
    description
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    specs: metafields(identifiers: [
      {namespace: "specifications", key: "case_size"},
      {namespace: "specifications", key: "water_resistance"},
      {namespace: "specifications", key: "crystal_type"},
      {namespace: "specifications", key: "calibre"}
    ]) {
      key
      value
    }
  }
}`;

  const copyGraphQL = () => {
    navigator.clipboard.writeText(graphQLPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Background Dim Backdrop */}
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs transition-opacity" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal Structure */}
        <div className="inline-block align-bottom bg-[#0e0e0e] rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-white/5">
          
          {/* Close button */}
          <button 
            id="close-modal-btn"
            onClick={onClose}
            className="absolute top-5 right-5 z-10 p-2 rounded-full bg-[#151515] text-stone-400 border border-white/5 hover:bg-white/5 hover:text-white transition-all active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Left Product Visual Showcase */}
            <div className="bg-[#121212] p-8 flex flex-col items-center justify-between border-r border-[#1a1a1a] relative min-h-[460px]">
              <span className="absolute top-6 left-6 text-[10px] font-mono tracking-widest text-stone-500 uppercase">
                Collection {watch.category[0].toUpperCase() + watch.category.slice(1)}
              </span>
              
              <div className="flex-1 flex items-center justify-center py-6">
                <img 
                  src={imagesToDisplay[selectedImageIndex] || watch.imageUrl} 
                  alt={watch.name} 
                  referrerPolicy="no-referrer"
                  className="max-h-[280px] w-auto object-contain p-2 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-all duration-300"
                />
              </div>

              {/* Multi-photo paginator bar */}
              {imagesToDisplay.length > 1 && (
                <div className="flex justify-center flex-wrap gap-2 mb-4">
                  {imagesToDisplay.map((img, idx) => (
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

              <p className="text-[10px] font-mono text-center text-stone-500/95">
                • Photographed under pristine studio professional lighting •
              </p>
            </div>

            {/* Right Interactive Information Pane */}
            <div className="p-8 flex flex-col justify-between h-full bg-[#0e0e0e] select-none">
              <div>
                {/* Brand & Stars */}
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-mono font-bold tracking-widest text-amber-500 uppercase">
                    {watch.brand}
                  </span>
                  <div className="flex items-center space-x-1 text-amber-500 text-xs">
                    <Star className="h-3 w-3 fill-current" />
                    <span className="font-mono text-stone-300 font-bold">{watch.rating}</span>
                  </div>
                </div>

                {/* Primary Title - Serif */}
                <h2 className="font-serif text-2xl font-medium text-white leading-tight mb-3">
                  {watch.name}
                </h2>

                {/* Pricing Boxed Accent */}
                <div className="flex items-baseline space-x-2 mb-6">
                  <span className="text-2xl font-serif font-light text-white">
                    ₹{watch.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-stone-500 font-mono">INR / GST Included</span>
                </div>

                {/* Tabs switcher: Description | Specifications | Shopify XML Schema */}
                <div className="flex border-b border-white/5 mb-5 text-xs font-mono">
                  <button
                    onClick={() => setActiveTab('desc')}
                    className={`pb-2.5 px-1 mr-4 border-b-2 font-medium transition-all ${
                      activeTab === 'desc' 
                        ? 'border-amber-500 text-amber-500' 
                        : 'border-transparent text-stone-400 hover:text-white'
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab('specs')}
                    className={`pb-2.5 px-1 mr-4 border-b-2 font-medium transition-all ${
                      activeTab === 'specs' 
                        ? 'border-amber-500 text-amber-500' 
                        : 'border-transparent text-stone-400 hover:text-white'
                    }`}
                  >
                    Mechanical Specs
                  </button>
                  <button
                    id="shopify-schema-tab"
                    onClick={() => setActiveTab('shopify')}
                    className={`pb-2.5 px-1 border-b-2 font-medium transition-all text-stone-300 flex items-center space-x-1 ${
                      activeTab === 'shopify' 
                        ? 'border-amber-500 text-amber-500' 
                        : 'border-transparent text-stone-400 hover:text-white'
                    }`}
                  >
                    <Code className="h-3 w-3" />
                    <span>Shopify GraphQL</span>
                  </button>
                </div>

                {/* Tab content rendering */}
                <div className="min-h-[140px] text-xs text-stone-300 font-sans leading-relaxed">
                  
                  {activeTab === 'desc' && (
                    <div className="space-y-4">
                      <p>{watch.description}</p>
                      <div className="flex items-center space-x-2 text-stone-400 bg-[#151515] px-3 py-2.5 rounded-lg border border-white/5">
                        <Shield className="h-4 w-4 text-amber-500" />
                        <span>Included: Unified 3-Year Official Mechanical International Warranty.</span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'specs' && (
                    <table className="w-full text-stone-300">
                      <tbody>
                        <tr className="border-b border-white/5 pb-2">
                          <td className="py-2.5 font-mono text-stone-500 w-1/3">Calibre Movement</td>
                          <td className="py-2.5 text-stone-200 font-medium">{watch.specs?.movement || 'Standard Calibre'}</td>
                        </tr>
                        <tr className="border-b border-white/5 pb-2">
                          <td className="py-2.5 font-mono text-stone-500">Dimensions (Case)</td>
                          <td className="py-2.5 text-stone-200 font-medium">{watch.specs?.caseSize || 'Standard Dimensions'}</td>
                        </tr>
                        <tr className="border-b border-white/5 pb-2">
                          <td className="py-2.5 font-mono text-stone-500">Crystal Glass</td>
                          <td className="py-2.5 text-stone-200 font-medium">{watch.specs?.crystal || 'Sapphire Crystal'}</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-mono text-stone-500">Water Resistance Rating</td>
                          <td className="py-2.5 text-emerald-400 font-semibold">{watch.specs?.waterResistance || 'Standard Water Resistance'}</td>
                        </tr>
                      </tbody>
                    </table>
                  )}

                  {activeTab === 'shopify' && (
                    <div>
                      <div className="flex justify-between items-center mb-2 bg-[#121212] px-3 py-1.5 rounded-md text-stone-400 border border-white/5">
                        <span className="font-mono text-[10px]">Shopify Storefront REST/GraphQL Node</span>
                        <button 
                          onClick={copyGraphQL}
                          className="flex items-center space-x-1 font-mono hover:text-white font-semibold"
                        >
                          {copied ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy Query</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="bg-black/50 border border-white/5 text-stone-300 p-3.5 rounded-lg text-[10px] font-mono overflow-x-auto max-h-[160px] leading-tight">
                        {graphQLPayload}
                      </pre>
                      <p className="text-[10px] text-stone-500 mt-2 italic animate-pulse">
                        *Note: Shopify maps core metrics like case size as "metafields" associated securely within the Product schema.
                      </p>
                    </div>
                  )}

                </div>
              </div>

              {/* Drawer Modal Checkout Footing panel */}
              <div className="mt-8 pt-4 border-t border-white/5 flex flex-col space-y-2">
                <button
                  id="modal-add-to-cart-btn"
                  onClick={() => {
                    onAddToCart(watch);
                    onClose();
                  }}
                  className="w-full bg-white hover:bg-amber-500 text-black py-3.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all duration-300"
                >
                  Confirm Purchase & Add to bag
                </button>
                <div className="flex justify-center items-center space-x-1.5 text-[10px] text-stone-500">
                  <span>🔒 Secure Checkout</span>
                  <span>•</span>
                  <span>🚚 Express Global Delivery Included</span>
                </div>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
