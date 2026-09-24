import React, { useState, useMemo } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Shuffle,
  Eye,
  Check,
  Share2,
  ShoppingBag,
  Sliders,
  Sun,
  Moon,
  Flame,
  Crown,
  Layers,
  Heart,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useProductStore } from '@/store/productStore';
import { useCartStore } from '@/store/cartStore';
import { products as fallbackProducts } from '@/data/mockData';
import { PriceDisplay, Badge } from '@/components/ui';
import { SITE } from '@/config/siteConfig';
import { Link } from '@/lib/routerCompat';
import type { Product } from '@/types';

// ─── Preset Moods & Aesthetics ────────────────────────────────────────────────
interface OccasionTheme {
  id: string;
  name: string;
  tagline: string;
  palette: string[];
  recommendedAttireTag: string;
  lightingName: string;
  ambienceBg: string;
  accentColor: string;
}

const OCCASIONS: OccasionTheme[] = [
  {
    id: 'gala',
    name: 'Royal Gala & Black Tie',
    tagline: 'Gilded drama, floor-sweeping majesty & liquid silk reflections.',
    palette: ['#C9A227', '#E4C96B', '#2D2D2D', '#F4C2C2'],
    recommendedAttireTag: 'silk',
    lightingName: 'Golden Hour',
    ambienceBg: 'from-amber-950/40 via-stone-900 to-black',
    accentColor: '#C9A227',
  },
  {
    id: 'riviera',
    name: 'Riviera Sunset Yacht',
    tagline: 'Breeze-kissed georgette, champagne gradients & oversized sunglasses.',
    palette: ['#F7E7CE', '#E3BCA4', '#4A9B8E', '#FFFDD0'],
    recommendedAttireTag: 'dress',
    lightingName: 'Sunlit Champagne',
    ambienceBg: 'from-orange-950/30 via-stone-900 to-slate-950',
    accentColor: '#E0C595',
  },
  {
    id: 'midnight',
    name: 'Midnight Noir Soirée',
    tagline: 'Sensual velvet, sculpted sharp tailoring & enigmatic dark lenses.',
    palette: ['#111111', '#8B4557', '#C8C8E0', '#D4AF37'],
    recommendedAttireTag: 'velvet',
    lightingName: 'Velvet Dusk',
    ambienceBg: 'from-purple-950/40 via-black to-stone-950',
    accentColor: '#D4949E',
  },
  {
    id: 'avant-garde',
    name: 'Metropolitan High Fashion',
    tagline: 'Architectural pleating, avant-garde eyewear & statement silhouettes.',
    palette: ['#2A2A2A', '#FAF8F3', '#B76E79', '#E6E6FA'],
    recommendedAttireTag: 'top',
    lightingName: 'Studio Spotlight',
    ambienceBg: 'from-stone-900 via-neutral-900 to-black',
    accentColor: '#F4C2C2',
  },
];

// Curated eyewear accessories to pair in the studio
const SHADES_ACCESSORIES = [
  {
    id: 'acc-1',
    name: 'The Empress Cat-Eye Shades',
    style: 'Sculpted Acetate with 24k Gold Accents',
    price: 65.0,
    lensColor: 'Gradient Amber Noir',
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'acc-2',
    name: 'Riviera Oversized Aviator',
    style: 'Titanium Wire with Rose Gold Flash',
    price: 78.0,
    lensColor: 'Champagne Mirror',
    image: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'acc-3',
    name: 'Nocturne Geometric Shield',
    style: 'Rimless Frameless Silhouette',
    price: 85.0,
    lensColor: 'Obsidian Black UV400',
    image: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'acc-4',
    name: 'Aura Oval Tortoiseshell',
    style: 'Hand-Polished Italian Mazzucchelli',
    price: 72.0,
    lensColor: 'Warm Sepia Haze',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80',
  },
];

const JEWELRY_ACCESSORIES = [
  {
    id: 'jew-1',
    name: 'Solstice Chandelier Earrings',
    type: 'Cascading baroque pearls & hammered gold',
    price: 48.0,
    accent: 'Lustrous Pearl',
  },
  {
    id: 'jew-2',
    name: 'Serpent Coil Cuff',
    type: 'Brushed rose gold with zircon micro-pave',
    price: 54.0,
    accent: 'Rose Gold Shimmer',
  },
  {
    id: 'jew-3',
    name: 'Constellation Choker',
    type: 'Delicate celestial crystals on velvet ribbon',
    price: 62.0,
    accent: 'Crystal Starlight',
  },
];

export const AtelierStyleStudio: React.FC = () => {
  const allStoreProducts = useProductStore((s) => s.products);
  const products = allStoreProducts.length > 0 ? allStoreProducts : fallbackProducts;
  const addItem = useCartStore((s) => s.addItem);

  const [activeOccasion, setActiveOccasion] = useState<OccasionTheme>(OCCASIONS[0]);
  const [selectedAttireIndex, setSelectedAttireIndex] = useState<number>(0);
  const [selectedShadesIndex, setSelectedShadesIndex] = useState<number>(0);
  const [selectedJewelryIndex, setSelectedJewelryIndex] = useState<number>(0);
  const [lightingMode, setLightingMode] = useState<'golden' | 'noir' | 'crystal' | 'studio'>('golden');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [bagSuccess, setBagSuccess] = useState<boolean>(false);

  // Filter fashion garments suitable for the styling canvas
  const attireList = useMemo(() => {
    return products.slice(0, 8);
  }, [products]);

  const currentAttire = attireList[selectedAttireIndex] || attireList[0];
  const currentShades = SHADES_ACCESSORIES[selectedShadesIndex];
  const currentJewelry = JEWELRY_ACCESSORIES[selectedJewelryIndex];

  // Dynamic styling harmony calculations
  const harmonyScore = useMemo(() => {
    // Generate a delightful realistic score between 92% and 99%
    const seed = (selectedAttireIndex * 7 + selectedShadesIndex * 13 + selectedJewelryIndex * 19) % 8;
    return 92 + seed;
  }, [selectedAttireIndex, selectedShadesIndex, selectedJewelryIndex]);

  // Lighting overlay styling
  const lightingOverlayClass = useMemo(() => {
    switch (lightingMode) {
      case 'golden':
        return 'bg-gradient-to-t from-amber-500/20 via-orange-500/10 to-transparent';
      case 'noir':
        return 'bg-gradient-to-t from-purple-950/40 via-black/40 to-transparent';
      case 'crystal':
        return 'bg-gradient-to-t from-cyan-400/15 via-pink-400/10 to-transparent';
      case 'studio':
      default:
        return 'bg-gradient-to-t from-white/10 via-transparent to-transparent';
    }
  }, [lightingMode]);

  const handleRandomizeLook = () => {
    setSelectedAttireIndex(Math.floor(Math.random() * attireList.length));
    setSelectedShadesIndex(Math.floor(Math.random() * SHADES_ACCESSORIES.length));
    setSelectedJewelryIndex(Math.floor(Math.random() * JEWELRY_ACCESSORIES.length));
    const randomOccasion = OCCASIONS[Math.floor(Math.random() * OCCASIONS.length)];
    setActiveOccasion(randomOccasion);
  };

  const handleAddFullLookToBag = () => {
    if (currentAttire) {
      addItem(currentAttire, currentAttire.sizes?.[0] || 'M', currentAttire.colors?.[0]?.name || 'Standard');
    }
    setBagSuccess(true);
    setTimeout(() => setBagSuccess(false), 3000);
  };

  const handleShareOrCopy = () => {
    const text = `Shiny Shades Atelier Curated Look:\n✨ Occasion: ${activeOccasion.name}\n👗 Attire: ${currentAttire?.name}\n🕶️ Eyewear: ${currentShades.name}\n💎 Accent: ${currentJewelry.name}\nSynergy Score: ${harmonyScore}%`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    }
  };

  return (
    <section
      className="py-16 md:py-24 relative overflow-hidden text-stone-100"
      style={{
        background: 'linear-gradient(180deg, #121110 0%, #1a1816 50%, #0f0e0d 100%)',
      }}
      aria-labelledby="atelier-studio-heading"
    >
      {/* Ambient background glow & atmospheric noise */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div
          className="absolute -top-48 -left-48 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: activeOccasion.accentColor, opacity: 0.15 }}
        />
        <div
          className="absolute -bottom-48 -right-48 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: '#B76E79', opacity: 0.18 }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Editorial Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 backdrop-blur-md mb-4">
            <Sparkles size={14} className="text-amber-300 animate-pulse" />
            <span className="text-xs uppercase tracking-widest font-semibold text-amber-200">
              Interactive Fashion Atelier
            </span>
          </div>

          <h2
            id="atelier-studio-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-editorial font-light tracking-tight text-white mb-4"
          >
            Curate Your <span className="italic font-normal text-amber-300">Signature Silhouette</span>
          </h2>

          <p className="text-sm sm:text-base text-stone-400 font-light leading-relaxed">
            Mix couture garments, artisanal shades, and heirloom accents in real-time.
            Explore atmospheric lighting moods and test your styling harmony score.
          </p>
        </div>

        {/* Occasion Mood Selectors */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mb-10">
          {OCCASIONS.map((occ) => {
            const isSelected = occ.id === activeOccasion.id;
            return (
              <button
                key={occ.id}
                type="button"
                onClick={() => setActiveOccasion(occ)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-400 text-stone-950 shadow-lg shadow-amber-400/20 scale-105 font-semibold'
                    : 'bg-stone-900/80 text-stone-300 border border-stone-800 hover:border-amber-500/40 hover:text-white'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: occ.accentColor,
                    boxShadow: isSelected ? '0 0 8px currentColor' : 'none',
                  }}
                />
                {occ.name}
              </button>
            );
          })}
        </div>

        {/* The Studio Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* LEFT: Attire & Garment Selector */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-stone-900/90 border border-stone-800/80 rounded-2xl p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-widest text-amber-300 font-semibold flex items-center gap-1.5">
                  <Layers size={14} /> Layer 01: The Silhouette
                </span>
                <span className="text-[11px] text-stone-400">
                  {selectedAttireIndex + 1} of {attireList.length}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 mb-4">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedAttireIndex((prev) =>
                      prev === 0 ? attireList.length - 1 : prev - 1
                    )
                  }
                  className="p-2 rounded-xl bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition-colors"
                  aria-label="Previous attire piece"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="text-center flex-1 min-w-0">
                  <h3 className="text-base font-medium text-white truncate font-editorial">
                    {currentAttire?.name}
                  </h3>
                  <p className="text-xs text-amber-400/90 font-semibold mt-0.5">
                    {SITE.currency.symbol}
                    {currentAttire?.price}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedAttireIndex((prev) =>
                      prev === attireList.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="p-2 rounded-xl bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition-colors"
                  aria-label="Next attire piece"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Garment Quick Thumbnails */}
              <div className="grid grid-cols-4 gap-2">
                {attireList.slice(0, 4).map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedAttireIndex(idx)}
                    className={`relative rounded-xl overflow-hidden aspect-[3/4] border transition-all ${
                      selectedAttireIndex === idx
                        ? 'border-amber-400 ring-2 ring-amber-400/30 scale-105'
                        : 'border-stone-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div
                      className={`w-full h-full bg-cover bg-center ${
                        p.images?.[0]?.startsWith('product-gradient')
                          ? p.images[0]
                          : 'bg-stone-800'
                      }`}
                      style={
                        p.images?.[0]?.startsWith('http')
                          ? { backgroundImage: `url(${p.images[0]})` }
                          : undefined
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Shades Selector */}
            <div className="bg-stone-900/90 border border-stone-800/80 rounded-2xl p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-widest text-amber-300 font-semibold flex items-center gap-1.5">
                  <Eye size={14} /> Layer 02: Haute Eyewear
                </span>
                <span className="text-[11px] text-stone-400">
                  {selectedShadesIndex + 1} of {SHADES_ACCESSORIES.length}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedShadesIndex((prev) =>
                      prev === 0 ? SHADES_ACCESSORIES.length - 1 : prev - 1
                    )
                  }
                  className="p-2 rounded-xl bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition-colors"
                  aria-label="Previous shades"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="text-center flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate font-editorial">
                    {currentShades.name}
                  </h3>
                  <p className="text-xs text-stone-400 truncate">{currentShades.lensColor}</p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedShadesIndex((prev) =>
                      prev === SHADES_ACCESSORIES.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="p-2 rounded-xl bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition-colors"
                  aria-label="Next shades"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Jewelry / Accent Pill selector */}
              <div className="mt-4 pt-3 border-t border-stone-800">
                <p className="text-[11px] text-stone-400 mb-2 uppercase tracking-wider font-semibold">
                  Statement Finishing Touch:
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {JEWELRY_ACCESSORIES.map((jew, jIdx) => (
                    <button
                      key={jew.id}
                      type="button"
                      onClick={() => setSelectedJewelryIndex(jIdx)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] text-center truncate border transition-all ${
                        selectedJewelryIndex === jIdx
                          ? 'border-amber-400/80 bg-amber-400/10 text-amber-300 font-semibold'
                          : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {jew.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CENTER: The Interactive Lookbook Canvas */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-full max-w-md aspect-[3/4] rounded-3xl overflow-hidden border border-amber-500/30 shadow-2xl shadow-black/80 bg-stone-950 p-2">
              {/* Inner ambient atmosphere lighting layer */}
              <div
                className={`absolute inset-0 z-10 transition-colors duration-700 pointer-events-none ${lightingOverlayClass}`}
              />

              {/* Background gradient & Occasion tone */}
              <div
                className={`absolute inset-0 bg-gradient-to-b ${activeOccasion.ambienceBg} opacity-90 transition-all duration-700`}
              />

              {/* Attire Garment Image & silhouette presentation */}
              <div className="relative w-full h-full rounded-2xl overflow-hidden flex flex-col justify-between p-6 z-10">
                {/* Floating tags */}
                <div className="flex items-center justify-between">
                  <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-medium text-white flex items-center gap-1.5">
                    <Crown size={12} className="text-amber-400" />
                    <span>{activeOccasion.name}</span>
                  </div>

                  {/* Harmony score badge */}
                  <div className="px-3 py-1 rounded-full bg-amber-400/20 backdrop-blur-md border border-amber-400/50 text-[11px] font-bold text-amber-300 flex items-center gap-1">
                    <Sparkles size={12} />
                    <span>{harmonyScore}% SYNERGY</span>
                  </div>
                </div>

                {/* Central Visual Focus */}
                <div className="my-auto flex flex-col items-center text-center">
                  <div className="relative w-44 h-56 sm:w-52 sm:h-64 rounded-2xl overflow-hidden shadow-2xl border border-white/15 mb-3 satin-sheen">
                    <div
                      className={`w-full h-full bg-cover bg-center transition-all duration-700 ${
                        currentAttire?.images?.[0]?.startsWith('product-gradient')
                          ? currentAttire.images[0]
                          : 'bg-stone-800'
                      }`}
                      style={
                        currentAttire?.images?.[0]?.startsWith('http')
                          ? { backgroundImage: `url(${currentAttire.images[0]})` }
                          : undefined
                      }
                    />

                    {/* Overlay badge with shades preview floating */}
                    <div className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur-md rounded-xl p-2 border border-white/10 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-stone-800">
                        <img
                          src={currentShades.image}
                          alt={currentShades.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="text-[10px] text-amber-300 font-semibold truncate">
                          + {currentShades.name}
                        </p>
                        <p className="text-[9px] text-stone-400 truncate">{currentShades.style}</p>
                      </div>
                    </div>
                  </div>

                  {/* Color Swatch Harmony Dots */}
                  <div className="flex items-center gap-2 mt-2">
                    {activeOccasion.palette.map((hex, i) => (
                      <span
                        key={i}
                        className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm transition-transform hover:scale-125"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                </div>

                {/* Bottom Canvas Card Info */}
                <div className="bg-black/70 backdrop-blur-md rounded-xl p-3.5 border border-white/10 text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-stone-300 font-medium">
                        Look Total:{' '}
                        <span className="text-amber-300 font-bold">
                          {SITE.currency.symbol}
                          {(
                            (currentAttire?.price || 180) +
                            currentShades.price +
                            currentJewelry.price
                          ).toFixed(2)}
                        </span>
                      </p>
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        Includes: Garment, Haute Eyewear & Finishing Accent
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddFullLookToBag}
                      className="px-3 py-1.5 rounded-lg bg-amber-400 text-stone-950 font-bold text-xs hover:bg-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {bagSuccess ? (
                        <>
                          <Check size={14} /> Added!
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={14} /> Add Full Look
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick action bar beneath the canvas */}
            <div className="flex items-center gap-3 mt-4">
              <button
                type="button"
                onClick={handleRandomizeLook}
                className="px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:border-amber-400/40 transition-all flex items-center gap-2 text-xs font-medium cursor-pointer"
              >
                <Shuffle size={14} className="text-amber-400" />
                <span>Surprise Me</span>
              </button>

              <button
                type="button"
                onClick={handleShareOrCopy}
                className="px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:border-amber-400/40 transition-all flex items-center gap-2 text-xs font-medium cursor-pointer"
              >
                {copiedSuccess ? (
                  <>
                    <Check size={14} className="text-green-400" />
                    <span>Copied Blueprint!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={14} className="text-amber-400" />
                    <span>Share Style Card</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT: Atmospheric Lighting Studio & Curated Critique */}
          <div className="lg:col-span-3 space-y-5">
            {/* Lighting Studio Controls */}
            <div className="bg-stone-900/90 border border-stone-800/80 rounded-2xl p-5 backdrop-blur-xl">
              <h4 className="text-xs uppercase tracking-widest text-amber-300 font-semibold mb-3 flex items-center gap-1.5">
                <Sun size={14} /> Atmospheric Lighting
              </h4>
              <p className="text-xs text-stone-400 mb-4">
                Shift the runway ambiance to inspect fabrics under different light spectrums:
              </p>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'golden', name: 'Golden Hour', icon: Flame, color: 'text-amber-400' },
                  { id: 'noir', name: 'Velvet Dusk', icon: Moon, color: 'text-purple-400' },
                  { id: 'crystal', name: 'Crystal Dawn', icon: Sparkles, color: 'text-cyan-300' },
                  { id: 'studio', name: 'Studio White', icon: Sun, color: 'text-stone-200' },
                ].map((lt) => {
                  const Icon = lt.icon;
                  const isCurrent = lightingMode === lt.id;
                  return (
                    <button
                      key={lt.id}
                      type="button"
                      onClick={() => setLightingMode(lt.id as any)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        isCurrent
                          ? 'border-amber-400 bg-amber-400/10 text-white font-medium'
                          : 'border-stone-800 bg-stone-950/40 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Icon size={14} className={lt.color} />
                      <span className="text-xs">{lt.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stylist's Editorial Critique */}
            <div className="bg-gradient-to-br from-stone-900 to-amber-950/30 border border-amber-500/20 rounded-2xl p-5 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-2 text-amber-300">
                <Crown size={15} />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Maison Stylist Verdict
                </span>
              </div>

              <blockquote className="text-xs sm:text-sm font-editorial italic text-stone-300 leading-relaxed mb-3">
                &ldquo;{activeOccasion.tagline}&rdquo;
              </blockquote>

              <div className="space-y-2 text-[11px] text-stone-400 border-t border-stone-800 pt-3">
                <div className="flex items-center justify-between">
                  <span>Color Balance:</span>
                  <span className="text-amber-300 font-medium">Harmonious Warmth</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Occasion Suitability:</span>
                  <span className="text-emerald-400 font-medium">99% Flawless</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Silhouette Mood:</span>
                  <span className="text-stone-200 font-medium">{currentAttire?.category || 'Couture'}</span>
                </div>
              </div>

              {currentAttire?.slug && (
                <Link
                  to={`/product/${currentAttire.slug}`}
                  className="mt-4 block w-full py-2 text-center text-xs font-medium text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer"
                >
                  Inspect Main Piece Details
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
