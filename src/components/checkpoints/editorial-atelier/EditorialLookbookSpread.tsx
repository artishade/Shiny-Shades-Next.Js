import React, { useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Layers,
  Compass,
  ArrowRight,
  Eye,
  Plus,
  ShoppingBag,
  ExternalLink,
  BookOpen,
  SlidersHorizontal
} from 'lucide-react';
import { Link } from '@/lib/routerCompat';
import { SITE } from '@/config/siteConfig';
import { useCartStore } from '@/store/cartStore';
import type { Product } from '@/types';

interface Hotspot {
  id: string;
  x: number; // percentage
  y: number; // percentage
  title: string;
  category: string;
  price: number;
  slug: string;
  note: string;
}

interface EditorialFeature {
  issue: string;
  title: string;
  subtitle: string;
  quote: string;
  mainImage: string;
  secondaryImage: string;
  hotspots: Hotspot[];
  behindTheScenes: string;
}

const EDITORIAL_FEATURES: EditorialFeature[] = [
  {
    issue: 'VOLUME IX',
    title: 'The Golden Hour Archive',
    subtitle: 'High-Altitude Draped Silks & Sculpted Sun Lenses',
    quote: 'True luxury does not shout from billboards; it whispers through the rustle of 22-momme Mulberry silk catching the amber dusk.',
    mainImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&auto=format&fit=crop&q=85',
    secondaryImage: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=85',
    behindTheScenes: 'Shot on location during golden hour in old Dhaka and Venice. The collection features hand-hammered brass buttons and naturally dyed silk brocades.',
    hotspots: [
      {
        id: 'hs-1',
        x: 48,
        y: 35,
        title: 'Amber Mist Mirrored Cat-Eye',
        category: 'Haute Eyewear',
        price: 75.0,
        slug: 'amber-mist-mirrored-cat-eye',
        note: 'UV400 scratch-resistant crystal lenses with 24k gold foil hinges.',
      },
      {
        id: 'hs-2',
        x: 52,
        y: 68,
        title: 'Silk Rose Evening Gown',
        category: 'Evening Wear',
        price: 289.0,
        slug: 'silk-rose-evening-gown',
        note: 'Biased cut to follow feminine contours without constrictive boning.',
      },
    ],
  },
  {
    issue: 'VOLUME X',
    title: 'Nocturne in Black & Gold',
    subtitle: 'Architectural Velvets & Midnight Geometrics',
    quote: 'Black is not the absence of color; it is the sanctuary of mystery where gold shines with undisturbed majesty.',
    mainImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&auto=format&fit=crop&q=85',
    secondaryImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=85',
    behindTheScenes: 'Inspired by brutalist architecture paired with the softness of hand-sheared velvet. Over 48 hours of hand-guided stitchwork per blazer.',
    hotspots: [
      {
        id: 'hs-3',
        x: 46,
        y: 42,
        title: 'Midnight Velvet Tailored Blazer',
        category: 'Outerwear',
        price: 249.0,
        slug: 'midnight-velvet-blazer',
        note: 'Micro-pile velvet lined with duchess satin for a frictionless slip.',
      },
      {
        id: 'hs-4',
        x: 55,
        y: 22,
        title: 'Obsidian Geometric Shield',
        category: 'Haute Eyewear',
        price: 85.0,
        slug: 'obsidian-geometric-shield',
        note: 'Ultra-lightweight titanium brow bar with deep monochrome polarized lenses.',
      },
    ],
  },
];

export const EditorialLookbookSpread: React.FC = () => {
  const [activeIssueIndex, setActiveIssueIndex] = useState<number>(0);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [viewMode, setViewMode] = useState<'spread' | 'notes'>('spread');

  const currentFeature = EDITORIAL_FEATURES[activeIssueIndex];

  return (
    <section
      className="py-16 md:py-24 relative overflow-hidden bg-white"
      aria-labelledby="editorial-archive-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Masthead */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-stone-200 pb-6 mb-10 gap-4">
          <div>
            <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-[#B76E79] font-bold mb-2">
              <BookOpen size={15} />
              <span>Couture Lookbook & Editorial Gazette</span>
            </div>
            <h2
              id="editorial-archive-heading"
              className="text-3xl sm:text-4xl md:text-5xl font-editorial font-light text-charcoal tracking-tight"
            >
              {currentFeature.title}
            </h2>
            <p className="text-xs sm:text-sm text-[#66615B] font-light mt-1">
              {currentFeature.subtitle} — {currentFeature.issue}
            </p>
          </div>

          {/* Issue Switcher & Mode Tabs */}
          <div className="flex items-center gap-2">
            {EDITORIAL_FEATURES.map((feat, idx) => (
              <button
                key={feat.issue}
                type="button"
                onClick={() => {
                  setActiveIssueIndex(idx);
                  setActiveHotspot(null);
                }}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                  activeIssueIndex === idx
                    ? 'bg-charcoal text-white shadow-md'
                    : 'bg-stone-100 text-[#66615B] hover:bg-stone-200'
                }`}
              >
                {feat.issue}
              </button>
            ))}

            <div className="h-4 w-px bg-stone-300 mx-1 hidden sm:block" />

            <button
              type="button"
              onClick={() => setViewMode((m) => (m === 'spread' ? 'notes' : 'spread'))}
              className="px-3.5 py-2 rounded-full border border-stone-300 text-xs font-medium text-charcoal hover:border-charcoal transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <SlidersHorizontal size={13} />
              <span>{viewMode === 'spread' ? 'Field Notes' : 'Lookbook'}</span>
            </button>
          </div>
        </div>

        {viewMode === 'spread' ? (
          /* Editorial Asymmetric Spread View */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Primary Large Editorial Photograph with Interactive Hotspots */}
            <div className="lg:col-span-8 relative group rounded-3xl overflow-hidden shadow-2xl border border-stone-200 aspect-[4/5] sm:aspect-[16/11]">
              <img
                src={currentFeature.mainImage}
                alt={currentFeature.title}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

              {/* Editorial Caption Banner on photo */}
              <div className="absolute bottom-6 left-6 right-6 z-10 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="max-w-md">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-amber-300 block mb-1">
                    Editorial Spotlight
                  </span>
                  <p className="text-xs sm:text-sm font-editorial italic text-stone-200 leading-snug">
                    &ldquo;{currentFeature.quote}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-amber-200/90 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 self-start sm:self-auto">
                  <Sparkles size={12} />
                  <span>Click pulsing dots to inspect details</span>
                </div>
              </div>

              {/* Interactive Hotspots Pins */}
              {currentFeature.hotspots.map((hs) => (
                <div
                  key={hs.id}
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveHotspot(activeHotspot?.id === hs.id ? null : hs)}
                    className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white text-charcoal shadow-xl border-2 border-amber-400 hover:scale-125 transition-transform cursor-pointer"
                    aria-label={`Inspect ${hs.title}`}
                  >
                    <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-60" />
                    <Plus size={14} className="text-charcoal relative z-10 font-bold" />
                  </button>

                  {/* Hotspot Floating Tooltip Card */}
                  {activeHotspot?.id === hs.id && (
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 bg-stone-950/95 text-white p-4 rounded-2xl border border-amber-400/60 shadow-2xl backdrop-blur-xl z-30 animate-in fade-in zoom-in-95 duration-200">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block mb-0.5">
                        {hs.category}
                      </span>
                      <h4 className="text-sm font-semibold font-editorial text-white mb-1">
                        {hs.title}
                      </h4>
                      <p className="text-[11px] text-stone-300 leading-relaxed mb-3">
                        {hs.note}
                      </p>
                      <div className="flex items-center justify-between border-t border-stone-800 pt-2.5">
                        <span className="text-xs font-bold text-amber-300">
                          {SITE.currency.symbol}{hs.price}
                        </span>
                        <Link
                          to={`/search?q=${encodeURIComponent(hs.title)}`}
                          className="text-[11px] font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 px-3 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>View Piece</span>
                          <ArrowRight size={11} />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Secondary Editorial Column: Texture Vignette & Story */}
            <div className="lg:col-span-4 space-y-6">
              {/* Secondary Image */}
              <div className="relative rounded-3xl overflow-hidden shadow-xl border border-stone-200 aspect-[4/5]">
                <img
                  src={currentFeature.secondaryImage}
                  alt="Craftsmanship detail"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-stone-200 text-charcoal">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-rose-gold block mb-0.5">
                    Texture Vignette
                  </span>
                  <p className="text-xs font-editorial italic text-[#66615B]">
                    Specular reflection under warm amber studio floodlights.
                  </p>
                </div>
              </div>

              {/* Quote Card */}
              <div className="bg-stone-50 rounded-3xl p-6 border border-stone-200">
                <span className="text-[10px] uppercase tracking-widest font-bold text-amber-600 block mb-2">
                  Atelier Manifesto
                </span>
                <p className="text-xs sm:text-sm font-editorial italic text-charcoal leading-relaxed">
                  &ldquo;Fashion is our architecture of joy. Whether you walk down a sunlit boulevard or dance beneath grand chandeliers, every stitch should feel like an embrace.&rdquo;
                </p>

                <div className="mt-4 pt-4 border-t border-stone-200 flex items-center justify-between">
                  <span className="text-[11px] text-[#66615B]">Dhaka — Paris — Milan</span>
                  <Link
                    to="/shop"
                    className="text-xs font-semibold text-charcoal hover:text-rose-gold transition-colors flex items-center gap-1"
                  >
                    <span>Browse All Pieces</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Field Notes & Behind The Scenes */
          <div className="bg-stone-50 rounded-3xl p-8 border border-stone-200 max-w-3xl mx-auto">
            <span className="text-xs uppercase tracking-widest font-bold text-rose-gold block mb-2">
              Artisan Journal & Field Notes
            </span>
            <h3 className="text-2xl font-editorial text-charcoal mb-4">
              Behind the Seams: {currentFeature.title}
            </h3>
            <p className="text-sm text-[#66615B] leading-relaxed mb-6">
              {currentFeature.behindTheScenes}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-t border-stone-200 pt-5">
              <div>
                <span className="font-semibold text-charcoal block">Location Scouting:</span>
                <span className="text-[#66615B]">Heritage quarters and private riverfront pavilions</span>
              </div>
              <div>
                <span className="font-semibold text-charcoal block">Color Balance:</span>
                <span className="text-[#66615B]">Warm amber, vintage rose, and deep midnight contrast</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setViewMode('spread')}
              className="mt-6 px-5 py-2.5 rounded-full bg-charcoal text-white text-xs font-medium hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Return to Lookbook
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
