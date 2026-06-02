import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Sparkles, Shield, Camera, HelpCircle, CheckCircle2, Upload, Trash2, Calendar, Award, Copy, Check } from 'lucide-react';
import { WatchModel, LendingProposal } from '../types';
import { db, handleFirestoreError, OperationType, configDiagnostics } from '../firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

interface LendingPageProps {
  catalog: WatchModel[];
  onBack: () => void;
  initialWatchId?: string | null;
  triggerNotification: (msg: string) => void;
}

export default function LendingPage({
  catalog,
  onBack,
  initialWatchId,
  triggerNotification,
}: LendingPageProps) {
  const [selectedWatchId, setSelectedWatchId] = useState<string>('custom');
  const [customBrand, setCustomBrand] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [valuation, setValuation] = useState<number>(120000); // Default appraisal
  const [condition, setCondition] = useState<LendingProposal['condition']>('excellent');
  
  // Sender info
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [notes, setNotes] = useState('');
  
  // Photos handling
  const [photos, setPhotos] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Proposal completion
  const [submittedProposal, setSubmittedProposal] = useState<LendingProposal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // If a watch ID is passed in from URL / prop, set it!
  useEffect(() => {
    if (initialWatchId) {
      const exists = catalog.some(w => w.id === initialWatchId);
      if (exists) {
        setSelectedWatchId(initialWatchId);
        const watch = catalog.find(w => w.id === initialWatchId);
        if (watch) {
          setValuation(watch.price);
        }
      } else {
        setSelectedWatchId('custom');
      }
    }
  }, [initialWatchId, catalog]);

  // Adjust valuation when catalog watch is selected
  const handleWatchSelectChange = (val: string) => {
    setSelectedWatchId(val);
    if (val !== 'custom') {
      const match = catalog.find(w => w.id === val);
      if (match) {
        setValuation(match.price);
      }
    }
  };

  const copyLendingLink = () => {
    const watchParam = selectedWatchId !== 'custom' ? `&watch=${selectedWatchId}` : '';
    const linkObj = `${window.location.origin}${window.location.pathname}?page=lend${watchParam}`;
    navigator.clipboard.writeText(linkObj);
    setIsCopied(true);
    triggerNotification('Shareable lending link copied to your clipboard!');
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Image compression utility identical to app logic
  const compressAndAddProposalPhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedUrl = canvas.toDataURL('image/jpeg', 0.7);
            setPhotos((prev) => [...prev, compressedUrl]);
          } else {
            setPhotos((prev) => [...prev, event.target?.result as string]);
          }
        };
        img.onerror = () => {
          setPhotos((prev) => [...prev, event.target?.result as string]);
        };
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    files.forEach((file) => compressAndAddProposalPhoto(file));
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
        compressAndAddProposalPhoto(file);
      }
    });
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName || !senderEmail || !instagramHandle) {
      alert('Please provide your name, email, and Instagram handle.');
      return;
    }

    let finalBrand = '';
    let finalModel = '';

    if (selectedWatchId === 'custom') {
      if (!customBrand || !customModel) {
        alert('Please fill in the brand and model details for your watch.');
        return;
      }
      finalBrand = customBrand;
      finalModel = customModel;
    } else {
      const match = catalog.find(w => w.id === selectedWatchId);
      if (match) {
        finalBrand = match.brand;
        finalModel = match.name;
      }
    }

    setIsSubmitting(true);
    const proposalNumber = Math.floor(10000 + Math.random() * 90000);
    const trackingNo = `LEND-${Math.floor(100000 + Math.random() * 900000)}-CH`;

    const newProposal: LendingProposal = {
      id: `PROP-${proposalNumber}`,
      date: new Date().toISOString().split('T')[0],
      senderName,
      senderEmail,
      instagramHandle: instagramHandle.trim().startsWith('@') ? instagramHandle.trim() : `@${instagramHandle.trim()}`,
      watchModelId: selectedWatchId !== 'custom' ? selectedWatchId : undefined,
      watchName: finalModel,
      watchBrand: finalBrand,
      condition,
      valuation: Number(valuation),
      photos,
      notes,
      status: 'pending',
      trackingNumber: trackingNo,
    };

    // Save proposal to Firestore & LocalStorage
    try {
      if (!configDiagnostics.isUsingFallback) {
        await setDoc(doc(db, 'lending_proposals', newProposal.id), newProposal);
      }
    } catch (err) {
      console.warn("Firestore proposal upload skipped (Operating mode is fallback or security rule restricted). Saving locally.", err);
    }

    try {
      const savedProposals = localStorage.getItem('chronos_lending_proposals');
      const list = savedProposals ? JSON.parse(savedProposals) : [];
      localStorage.setItem('chronos_lending_proposals', JSON.stringify([newProposal, ...list]));
    } catch (err) {
      console.error("Local storage sync error: ", err);
    }

    setSubmittedProposal(newProposal);
    setIsSubmitting(false);
    triggerNotification(`Lending Proposal ${newProposal.id} recorded!`);
  };

  const startNewProposal = () => {
    setSubmittedProposal(null);
    setPhotos([]);
    setCustomBrand('');
    setCustomModel('');
    setNotes('');
    setSenderName('');
    setSenderEmail('');
    setInstagramHandle('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in" id="lending-page-container">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-white/5 pb-6">
        <button
          onClick={onBack}
          className="group flex items-center space-x-2.5 text-xs font-mono tracking-widest uppercase text-stone-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 w-4" />
          <span>Boutique Storefront</span>
        </button>

        <div className="flex gap-2">
          {selectedWatchId !== 'custom' && (
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full select-none">
              🎯 Specific timepiece link active
            </span>
          )}
          <button
            onClick={copyLendingLink}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-[11px] font-mono tracking-wide bg-[#151515] border border-white/10 hover:border-amber-500 hover:text-amber-500 text-stone-300 rounded-lg transition-all cursor-pointer"
          >
            {isCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            <span>{isCopied ? 'Copied Link!' : 'Get Share Link'}</span>
          </button>
        </div>
      </div>

      {submittedProposal ? (
        /* SUCCESS LANDING PAGE */
        <div className="bg-[#0e0e0e] border border-emerald-500/10 rounded-3xl p-8 sm:p-12 text-center space-y-6 max-w-2xl mx-auto shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg animate-pulse">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          
          <h2 className="font-serif text-2xl sm:text-3xl text-white tracking-tight">Proposal Successfully Archivaled</h2>
          
          <p className="text-stone-400 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
            Thank you, <span className="text-white font-bold">{submittedProposal.senderName}</span>. Your timepiece loan request has been securely parsed. Derek will contact you directly on Instagram at <span className="text-amber-500 font-mono tracking-wider">{submittedProposal.instagramHandle}</span>.
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto bg-black/40 border border-white/5 p-4 rounded-xl text-left font-mono text-xs">
            <div>
              <span className="text-[9px] text-stone-500 block">PROPOSAL REFERENCE</span>
              <span className="text-stone-200 font-bold block mt-0.5">{submittedProposal.id}</span>
            </div>
            <div>
              <span className="text-[9px] text-stone-500 block">INSURED VALUATION</span>
              <span className="text-amber-400 font-bold block mt-0.5">
                ₹{submittedProposal.valuation.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="col-span-2 pt-2 border-t border-white/5">
              <span className="text-[9px] text-stone-500 block">TIMEPIECE UNDER DISCUSSION</span>
              <span className="text-white font-bold block mt-0.5">
                [{submittedProposal.watchBrand.toUpperCase()}] {submittedProposal.watchName}
              </span>
            </div>
          </div>

          <div className="text-[10px] text-stone-500 italic max-w-md mx-auto">
            A pre-insured priority return label under reference {submittedProposal.trackingNumber} is being prepared for confirmation. Keep your catalog photos handy.
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <button
              onClick={startNewProposal}
              className="px-5 py-2.5 bg-[#151515] hover:bg-neutral-900 border border-white/10 rounded-xl text-xs font-mono tracking-wider font-bold transition-all cursor-pointer text-stone-300"
            >
              Lend Another Watch
            </button>
            <button
              onClick={onBack}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black rounded-xl text-xs font-mono tracking-widest font-bold transition-all cursor-pointer shadow-lg shadow-amber-500/10"
            >
              Back to Storefront
            </button>
          </div>
        </div>
      ) : (
        /* LENDING FORM */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Program description panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-4">
              <span className="text-[10px] font-mono font-bold tracking-[0.25em] text-amber-500 uppercase block">
                CREATOR SHOWCASE LOANS
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-white tracking-tight">
                Lend Derek <br />
                <span className="font-serif italic font-normal text-amber-500">Your Masterpiece</span>
              </h2>
              <p className="text-stone-400 text-xs sm:text-sm leading-relaxed">
                Connect directly with Derek’s horology reviews on Instagram. Submit your prestige timepiece details, get verified insurance cover during transport, and have your watch reviewed on our next Reels masterwork feature!
              </p>
            </div>

            <div className="space-y-4 bg-[#0e0e0e] border border-white/5 p-5 rounded-2xl">
              <h3 className="font-mono text-[10px] text-stone-300 font-bold uppercase tracking-widest border-b border-white/5 pb-2">
                🔒 Our Archival Handling Commitments
              </h3>
              
              <div className="space-y-3 font-sans text-xs">
                <div className="flex items-start space-x-3">
                  <Shield className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-stone-200 block">Fully Insured Transit & Custody</strong>
                    <span className="text-stone-400">Zero-risk shipping tags fully verified in partnership with boutique underwriters.</span>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Camera className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-stone-200 block">Macro Video Reels Featuring</strong>
                    <span className="text-stone-400">Pristine macro photography, studio-lighting sweeps, and custom shoutouts.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Award className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-stone-200 block">Sovereign Turnaround Guarantee</strong>
                    <span className="text-stone-400">Secure returns via DHL Priority within 10 days of feature production.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form wrapper */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="bg-[#0b0b0b] border border-white/5 p-6 sm:p-8 rounded-2xl shadow-xl space-y-5">
              <h3 className="font-sans text-stone-100 font-medium text-sm pb-1 border-b border-white/5 flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Timepiece Proposal Spec Sheet</span>
              </h3>

              {/* Timepiece selector */}
              <div>
                <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block mb-1.5">
                  Select Timepiece Under Discussion
                </label>
                <select
                  value={selectedWatchId}
                  onChange={(e) => handleWatchSelectChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#121212] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono focus:border-amber-500"
                >
                  <option value="custom">✦ Suggest Custom Timepiece Model...</option>
                  {catalog.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.brand.toUpperCase()} — {w.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom fields when suggest custom was clicked */}
              {selectedWatchId === 'custom' && (
                <div className="grid grid-cols-2 gap-3 transition-opacity duration-300">
                  <div>
                    <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block mb-1">
                      Brand Manufacture
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rolex, Cartier"
                      value={customBrand}
                      onChange={(e) => setCustomBrand(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#121212] border border-white/10 rounded-xl text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                      required={selectedWatchId === 'custom'}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block mb-1">
                      Model Reference
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Submariner 126610"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#121212] border border-white/10 rounded-xl text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                      required={selectedWatchId === 'custom'}
                    />
                  </div>
                </div>
              )}

              {/* Grid block for condition & valuation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block mb-1.5">
                    Estimated Appraisal Value (INR)
                  </label>
                  <input
                    type="number"
                    value={valuation}
                    onChange={(e) => setValuation(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-[#121212] border border-white/10 rounded-xl text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-mono"
                    min={1}
                  />
                  <span className="text-[9px] text-[#888888] block mt-1">
                    Value determines transit cargo insurance policy coverage
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block mb-1.5">
                    Physical Preservation Condition
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as LendingProposal['condition'])}
                    className="w-full px-3.5 py-2.5 bg-[#121212] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  >
                    <option value="mint">Mint / Pristine (No scratches)</option>
                    <option value="excellent">Excellent (Barely visible wear)</option>
                    <option value="good">Good (Light hairline scuffs present)</option>
                    <option value="fair">Vintage / Well Loved (Frictional character)</option>
                  </select>
                </div>
              </div>

              {/* Photo upload zone */}
              <div>
                <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block mb-1.5">
                  Pre-Approval Verification Photos
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer min-h-[90px] relative transition-colors ${
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
                  <Upload className="h-5 w-5 text-stone-500 mx-auto mb-1" />
                  <p className="text-[10px] font-sans text-stone-300">
                    Drag and drop dial / chassis photos of your watch here, or click to choose
                  </p>
                </div>

                {photos.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mt-2 bg-black/40 border border-white/5 p-2 rounded-lg">
                    {photos.map((ph, i) => (
                      <div key={i} className="aspect-square relative group bg-white/5 rounded-md overflow-hidden border border-white/10 flex items-center justify-center">
                        <img src={ph} alt="Lending Preview" className="max-h-full max-w-full object-contain p-0.5" />
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer text-[10px] font-bold"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sender personal info */}
              <div className="space-y-3.5 pt-2 border-t border-white/5">
                <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">
                  Owner Registry Information
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-mono text-stone-400 uppercase block mb-1">
                      Collector’s Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Vikram Mehta"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-stone-200 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-stone-400 uppercase block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-stone-200 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-mono text-stone-400 uppercase block mb-1">
                    Instagram Handle (for Reel shoutout & DMs)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-stone-600 text-xs font-mono">@</span>
                    <input
                      type="text"
                      placeholder="username"
                      value={instagramHandle.replace(/^@/, '')}
                      onChange={(e) => setInstagramHandle(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-stone-200 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-mono text-stone-400 uppercase block mb-1">
                    Special notes or review requests (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Features double-barrel movement, original box & documentation included..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-stone-200 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit panel */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-mono tracking-widest text-xs uppercase font-extrabold rounded-xl transition-all shadow-lg hover:shadow-amber-500/15 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
                <span>{isSubmitting ? 'Archivaling Proposal...' : 'Transmit Timepiece Proposal'}</span>
              </button>
            </form>
          </div>
          
        </div>
      )}
    </div>
  );
}
