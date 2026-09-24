import React, { useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Palette,
  Sun,
  Moon,
  Flame,
  Droplets,
  Check,
  ArrowRight
} from 'lucide-react';
import { Link } from '@/lib/routerCompat';

interface Undertone {
  id: string;
  name: string;
  description: string;
  recommendedHues: string[];
}

const UNDERTONES: Undertone[] = [
  {
    id: 'warm',
    name: 'Golden Warm (Honey & Olive)',
    description: 'Gold jewelry glows naturally on you; veins appear greenish in natural light.',
    recommendedHues: ['#C9A227', '#E3BCA4', '#8B6B16', '#F4C2C2'],
  },
  {
    id: 'cool',
    name: 'Porcelain Cool (Rosy & Fair)',
    description: 'Silver jewelry enhances your skin; veins appear blue/violet in sunlight.',
    recommendedHues: ['#E6E6FA', '#FADBD8', '#C8C8E0', '#B76E79'],
  },
  {
    id: 'deep',
    name: 'Deep Bronze & Obsidian Glow',
    description: 'Rich warm undertones that carry vibrant jewel hues and metallic contrasts effortlessly.',
    recommendedHues: ['#E4C96B', '#8B4557', '#4B8B5A', '#FAF8F3'],
  },
  {
    id: 'neutral',
    name: 'Neutral Almond & Rose Beige',
    description: 'Both gold and silver flatter you; balanced interplay of warm and cool pigments.',
    recommendedHues: ['#F7E7CE', '#F0D5C0', '#2D2D2D', '#D4949E'],
  },
];

interface DrapeColor {
  id: string;
  name: string;
  hex: string;
  family: string;
  scientificGuidance: string;
  moodTag: string;
  gradient: string;
}

const DRAPE_COLORS: DrapeColor[] = [
  {
    id: 'champagne-gold',
    name: 'Imperial Champagne Gold',
    hex: '#C9A227',
    family: 'Warm Metallic',
    scientificGuidance:
      'Reflects high-frequency amber light waves, creating a candlelit halo that illuminates cheekbones and imparts immediate warmth.',
    moodTag: 'Commanding • Royal • Radiant',
    gradient: 'linear-gradient(135deg, #E4C96B 0%, #C9A227 50%, #8B6B16 100%)',
  },
  {
    id: 'blush-rose',
    name: 'Petal Blush & Rose Gold',
    hex: '#F4C2C2',
    family: 'Soft Romantic',
    scientificGuidance:
      'Infuses micro-rosy tones into the complexion, softening shadows under the eyes and providing a youthful, rested countenance.',
    moodTag: 'Ethereal • Delicate • Romantic',
    gradient: 'linear-gradient(135deg, #FADBD8 0%, #F4C2C2 50%, #B76E79 100%)',
  },
  {
    id: 'emerald-noir',
    name: 'Nocturne Emerald',
    hex: '#2E7268',
    family: 'Jewel Tone',
    scientificGuidance:
      'Deep cool green provides optical contrast against warm and neutral skin, sharpening facial jawline definition with noble contrast.',
    moodTag: 'Enigmatic • Rich • Sovereign',
    gradient: 'linear-gradient(135deg, #4A9B8E 0%, #2E7268 50%, #1E3535 100%)',
  },
  {
    id: 'midnight-obsidian',
    name: 'Venetian Velvet Noir',
    hex: '#111111',
    family: 'Deep Neutral',
    scientificGuidance:
      'Absorbs ambient glare, placing pure visual emphasis on facial architecture, eye brightness, and jewelry brilliance.',
    moodTag: 'Timeless • Architectural • Chic',
    gradient: 'linear-gradient(135deg, #2D2D2D 0%, #1A1A1A 50%, #000000 100%)',
  },
  {
    id: 'whisper-lavender',
    name: 'Celestial Lavender Mist',
    hex: '#E6E6FA',
    family: 'Cool Pastel',
    scientificGuidance:
      'Counteracts sallow or tired undertones with subtle violet reflections, imparting a serene, porcelain translucency.',
    moodTag: 'Poetic • Dreamy • Serene',
    gradient: 'linear-gradient(135deg, #F9F4FE 0%, #E6E6FA 50%, #C8C8E0 100%)',
  },
];

export const InteractiveColorDrape: React.FC = () => {
  const [activeUndertone, setActiveUndertone] = useState<Undertone>(UNDERTONES[0]);
  const [activeDrape, setActiveDrape] = useState<DrapeColor>(DRAPE_COLORS[0]);

  const isRecommended = activeUndertone.recommendedHues.includes(activeDrape.hex);

  return (
    <section
      className="py-16 md:py-24 relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #FAF8F3 0%, #F5F1EA 50%, #FAF8F3 100%)',
      }}
      aria-labelledby="color-drape-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-600/20 bg-amber-500/10 backdrop-blur-md mb-3">
            <Palette size={14} className="text-amber-700" />
            <span className="text-xs uppercase tracking-widest font-semibold text-amber-800">
              Virtual Color Analysis Studio
            </span>
          </div>

          <h2
            id="color-drape-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-editorial font-light text-charcoal tracking-tight mb-3"
          >
            Discover Your <span className="italic font-normal gold-gradient-text">Runway Color Harmony</span>
          </h2>

          <p className="text-sm sm:text-base text-[#66615B] font-light max-w-2xl mx-auto">
            Test how haute couture color temperatures interact with your skin undertone to create a glowing halo effect.
          </p>
        </div>

        {/* Step 1: Undertone Selector */}
        <div className="max-w-4xl mx-auto mb-10">
          <span className="text-xs uppercase tracking-widest font-semibold text-charcoal block mb-3 text-center sm:text-left">
            Step 01: Select Your Undertone Spectrum
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {UNDERTONES.map((u) => {
              const isSelected = u.id === activeUndertone.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setActiveUndertone(u)}
                  className={`p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'bg-charcoal text-white border-charcoal shadow-lg scale-105'
                      : 'bg-white text-charcoal border-stone-200 hover:border-amber-400'
                  }`}
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-1">
                    {u.name}
                  </h4>
                  <p
                    className={`text-[11px] leading-relaxed ${
                      isSelected ? 'text-stone-300' : 'text-[#66615B]'
                    }`}
                  >
                    {u.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Drape Preview Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
          {/* LEFT: The Drape Simulation Canvas */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="relative w-full max-w-sm aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-stone-200 bg-stone-900 p-2">
              {/* Animated Drape Color Fabric Background */}
              <div
                className="absolute inset-0 transition-all duration-700 pointer-events-none"
                style={{ background: activeDrape.gradient }}
              />

              {/* Silk Texture overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

              {/* Center Silhouette Graphic Frame */}
              <div className="relative w-full h-full rounded-2xl overflow-hidden flex flex-col justify-between p-6 z-10 text-white">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-xs font-semibold">
                    {activeDrape.family}
                  </span>

                  {isRecommended ? (
                    <span className="px-3 py-1 rounded-full bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1 shadow-md">
                      <Sparkles size={12} /> Ideal Harmony
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs">
                      Experimental Accent
                    </span>
                  )}
                </div>

                {/* Central Fabric Waves Visual */}
                <div className="my-auto text-center">
                  <div className="w-28 h-28 mx-auto rounded-full border-4 border-white/30 shadow-2xl backdrop-blur-md flex items-center justify-center mb-3 bg-white/10">
                    <Palette size={36} className="text-white drop-shadow-md" />
                  </div>
                  <h3 className="text-2xl font-editorial text-white font-normal">
                    {activeDrape.name}
                  </h3>
                  <p className="text-xs text-amber-200 mt-0.5 tracking-wider uppercase font-semibold">
                    {activeDrape.moodTag}
                  </p>
                </div>

                {/* Bottom Color Swatch Display */}
                <div className="bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-300">Spectral Tone:</span>
                    <span className="text-xs font-mono font-bold text-amber-300">
                      {activeDrape.hex}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drape Color Palette Chips */}
            <div className="flex items-center justify-center gap-2.5 mt-4 flex-wrap">
              {DRAPE_COLORS.map((dc) => (
                <button
                  key={dc.id}
                  type="button"
                  onClick={() => setActiveDrape(dc)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeDrape.id === dc.id
                      ? 'bg-charcoal text-white ring-2 ring-amber-400 scale-105'
                      : 'bg-white text-charcoal border border-stone-200 hover:border-amber-400'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-stone-300"
                    style={{ backgroundColor: dc.hex }}
                  />
                  <span>{dc.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: Harmony Explanation & Recommendations */}
          <div className="lg:col-span-6 space-y-5">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xl shadow-stone-200/50">
              <span className="text-xs uppercase tracking-widest font-bold text-amber-600 block mb-1">
                Atelier Color Science
              </span>
              <h3 className="text-2xl font-editorial text-charcoal mb-3">
                Why {activeDrape.name} Complements You
              </h3>

              <p className="text-xs sm:text-sm text-[#66615B] leading-relaxed mb-6">
                {activeDrape.scientificGuidance}
              </p>

              <div className="space-y-3 text-xs border-t border-stone-100 pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-charcoal">Undertone Resonance:</span>
                  <span className={isRecommended ? 'text-amber-600 font-bold' : 'text-[#66615B]'}>
                    {isRecommended ? '✨ Flawless Match' : 'Creative Contrast'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-charcoal">Lighting Temperature:</span>
                  <span className="text-[#66615B]">{activeDrape.family} Spectrum</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-charcoal">Recommended Pairing:</span>
                  <span className="text-charcoal font-medium">Warm Gold & Diamond Sheen</span>
                </div>
              </div>

              <Link
                to={`/search?q=${encodeURIComponent(activeDrape.name.split(' ')[0])}`}
                className="mt-6 w-full py-3 rounded-xl bg-charcoal text-white text-xs font-semibold hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Browse {activeDrape.name.split(' ')[0]} Capsule Pieces</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
