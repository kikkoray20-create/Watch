import { WatchModel } from '../types';
import oceanChronographImg from '../assets/images/ocean_chronograph_1779464380877.png';
import goldTourbillonImg from '../assets/images/gold_tourbillon_1779464402038.png';
import minimalTitaniumImg from '../assets/images/minimal_titanium_1779464421651.png';

export const products: WatchModel[] = [
  {
    id: 'ocean-chronograph',
    name: 'Oceanic Chronograph Active',
    brand: 'Nautica Prestige',
    price: 203350.00,
    category: 'sports',
    imageUrl: oceanChronographImg,
    description: 'A masterpiece of deep-sea engineering and athletic utility. Featuring a unidirectional rotating high-performance ceramic bezel and a high-precision automatic mechanical movement.',
    specs: {
      caseSize: '42mm Stainless Steel',
      waterResistance: '300m / 1000ft (ISO 6425)',
      crystal: 'Domed Sapphire with antireflective coding',
      movement: 'Calibre SC-300 Automatic Self-Winding'
    },
    stock: 12,
    rating: 4.9
  },
  {
    id: 'gold-tourbillon',
    name: 'Prestige Skeleton Tourbillon',
    brand: 'Horology Sovereign',
    price: 742850.00,
    category: 'prestige',
    imageUrl: goldTourbillonImg,
    description: 'An breathtaking skeletonized masterpiece displaying a custom gravity-defying manual-wind tourbillon movement. Encased in beautiful structural steel with polished chamfers and finished with an authentic brown alligator grain strap.',
    specs: {
      caseSize: '40mm Premium Gold-Plated Steel',
      waterResistance: '50m / 165ft (Splash Resistant)',
      crystal: 'Scratch-Resistant Boxed Sapphire',
      movement: 'Calibre H-900 Manual-Wind Tourbillon'
    },
    stock: 4,
    rating: 4.95
  },
  {
    id: 'minimalist-titanium',
    name: 'Metropolitan Titanium Core',
    brand: 'Elysian Designs',
    price: 95450.00,
    category: 'minimalist',
    imageUrl: minimalTitaniumImg,
    description: 'The epitome of contemporary design. Boasting an incredibly slim aerospace-grade titanium chassis with a gorgeous matte dark dial, coupled with a responsive titanium mesh deployment strap.',
    specs: {
      caseSize: '38mm Brushed Titanium',
      waterResistance: '100m / 330ft',
      crystal: 'Flat Sapphire, scratch-proof',
      movement: 'Swiss Super-Quartz, long battery life'
    },
    stock: 25,
    rating: 4.7
  },
  // Adding auxiliary luxury products to flesh out the beautiful storefront grid
  {
    id: 'luna-phase-classic',
    name: 'Astral Moonphase Calendar',
    brand: 'Horology Sovereign',
    price: 406700.00,
    category: 'classic',
    imageUrl: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=600',
    description: 'Track the cycles of the moon in high-fidelity luxury. An exquisite, multi-complication classical layout complete with date, day-of-week sub-dials, and an active gold moonphase canvas.',
    specs: {
      caseSize: '41mm Rose Gold Alloy',
      waterResistance: '50m / 165ft',
      crystal: 'Sapphire Crystal Back & Front',
      movement: 'Calibre Luna-792 Dual-Rotor Automatic'
    },
    stock: 7,
    rating: 4.85
  },
  {
    id: 'alpine-chronograph',
    name: 'Vanguard Alpine Chrono',
    brand: 'Nautica Prestige',
    price: 153550.00,
    category: 'sports',
    imageUrl: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=600',
    description: 'Designed to survive high altitudes and demanding expeditions. Built with lightweight carbon fiber compounds, a tachymeter scale bezel, and quick-release rugged rubber straps.',
    specs: {
      caseSize: '44mm Carbon Composite',
      waterResistance: '200m / 660ft',
      crystal: 'Double-Hardened AR Sapphire',
      movement: 'Calibre Kinetic-80 Supercharged Quartz'
    },
    stock: 15,
    rating: 4.6
  },
  {
    id: 'vanguard-monochrome',
    name: 'Monochrome Architectural Dial',
    brand: 'Elysian Designs',
    price: 81340.00,
    category: 'minimalist',
    imageUrl: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=600',
    description: 'Bold geometric symmetry meets modern watchmaking. Features a completely blank face with floating high-contrast hands, letting the natural materials and lines make the statement.',
    specs: {
      caseSize: '39mm Sandblasted Steel',
      waterResistance: '50m / 165ft',
      crystal: 'Anti-Reflective Mineral Sapphire',
      movement: 'Japanese high-frequency Sweep Quartz'
    },
    stock: 30,
    rating: 4.65
  }
];
