import React, { useState, useRef } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Waves,
  Feather,
  ShieldCheck,
  Compass,
  Palette,
  Eye,
  Info,
  Layers,
  Volume2
} from 'lucide-react';

interface Textile {
  id: string;
  name: string;
  origin: string;
  composition: string;
  weightGsm: number;
  tactileFeel: string;
  drapeMovement: string;
  acousticNote: string;
  artisanHours: number;
  description: string;
  gradientBase: string;
  weavePatternCss: string;
  careGuide: string;
}

const TEXTILES: Textile[] = [
  {
    id: 'mulberry-silk',
    name: 'Mulberry Charmeuse Silk',
    origin: 'Artisanal Silk Farms, Sylhet & Hangzhou',
    composition: '100% Grade 6A Organic Mulberry Silk (22 Momme)',
    weightGsm: 95,
    tactileFeel: 'Cool, liquid glide with pearlescent specular reflection',
    drapeMovement: 'Cascading liquid drape with zero friction',
    acousticNote: 'Soft silken whisper during gentle motion',
    artisanHours: 28,
    description:
      'Woven from unbroken continuous filaments to produce unmatched luster on the face and a soothing crepe texture on the reverse.',
    gradientBase: 'linear-gradient(135deg, #FADBD8 0%, #F4C2C2 40%, #E8A0A0 70%, #FDF8F4 100%)',
    weavePatternCss: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, transparent 60%)',
    careGuide: 'Dry clean or cold botanical wash, iron on silk setting inside out',
  },
  {
    id: 'banarasi-brocade',
    name: 'Gilded Banarasi Brocade',
    origin: 'Heritage Looms, Varanasi & Dhaka Heritage Quarter',
    composition: 'Pure Mulberry Silk with Electroplated Zari Gold Warp',
    weightGsm: 240,
    tactileFeel: 'Substantial, sculptural, textured metallic embroidery relief',
    drapeMovement: 'Architectural folds that hold dramatic volume',
    acousticNote: 'Rich, stately rustle of metallic filaments',
    artisanHours: 74,
    description:
      'Each floral jaal motif requires supplementary weft shuttle passes guided by master weavers preserving centuries-old Mughal traditions.',
    gradientBase: 'linear-gradient(135deg, #C9A227 0%, #E4C96B 30%, #8B6B16 60%, #F7E7CE 100%)',
    weavePatternCss:
      'repeating-linear-gradient(45deg, rgba(201,162,39,0.3) 0, rgba(201,162,39,0.3) 2px, transparent 0, transparent 8px)',
    careGuide: 'Specialist dry clean only. Store wrapped in pure unbleached muslin',
  },
  {
    id: 'whisper-organza',
    name: 'Whisper Sheer Organza',
    origin: 'Lake Como Heritage Mills, Italy',
    composition: 'High-Twist Sheer Filament Silk',
    weightGsm: 35,
    tactileFeel: 'Crisp, featherweight, translucent with subtle luminous sheen',
    drapeMovement: 'Floating, billowy cloud-like suspension in air',
    acousticNote: 'Delicate papery flutter in breeze',
    artisanHours: 19,
    description:
      'Spun with tightly twisted filaments to achieve an ethereal glass-like transparency while maintaining structural bounce.',
    gradientBase: 'linear-gradient(135deg, #F0D5C0 0%, #F7E7CE 50%, #FFFDD0 100%)',
    weavePatternCss:
      'radial-gradient(ellipse at center, rgba(255,255,255,0.6) 0%, transparent 70%)',
    careGuide: 'Gentle steam press only, keep away from sharp jewelry',
  },
  {
    id: 'midnight-velvet',
    name: 'Venetian Midnight Velvet',
    origin: 'Veneto Textile Atelier, Northern Italy',
    composition: 'Silk-Rayon Micro-Pile with Deep Matte Sheen',
    weightGsm: 320,
    tactileFeel: 'Deep plush pile with hypnotic directional light-absorption',
    drapeMovement: 'Heavy, sensual fall that hugs curves with buttery grace',
    acousticNote: 'Muffled, silent luxury that absorbs ambient sound',
    artisanHours: 42,
    description:
      'Double-woven and sheared to millimeter precision to create a dense pile that shifts subtly from obsidian black to warm rose gold depending on the stroke.',
    gradientBase: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 40%, #8B4557 80%, #111111 100%)',
    weavePatternCss: 'linear-gradient(to right, rgba(139,69,87,0.3), rgba(0,0,0,0.5))',
    careGuide: 'Steam gently from reverse side, never apply direct iron pressure',
  },
  {
    id: 'jamdani-muslin',
    name: 'Hand-Loomed Heritage Jamdani',
    origin: 'Shitalakshya River Basin, Narayanganj',
    composition: 'Fine Egyptian Combed Cotton & Tussar Silk Threads',
    weightGsm: 55,
    tactileFeel: 'Incredibly breathable, supple gauze-like gossamer weave',
    drapeMovement: 'Soft poetic cascade that floats around the body',
    acousticNote: 'Nearly silent, breath-like gentle cadence',
    artisanHours: 96,
    description:
      'Recognized by UNESCO as Intangible Cultural Heritage. Every intricate geometric pattern is woven by hand with non-structural weft bamboo shuttles.',
    gradientBase: 'linear-gradient(135deg, #FAF8F3 0%, #F5F1EA 50%, #E8DDCD 100%)',
    weavePatternCss:
      'radial-gradient(circle, rgba(201,162,39,0.2) 1px, transparent 1px)',
    careGuide: 'Hand rinse in lukewarm rainwater with mild olive-oil soap',
  },
];

const DYE_PALETTES = [
  { name: 'Rose Gold', color: '#B76E79', overlay: 'rgba(183, 110, 121, 0.25)' },
  { name: 'Champagne', color: '#C9A227', overlay: 'rgba(201, 162, 39, 0.25)' },
  { name: 'Emerald Noir', color: '#2E7268', overlay: 'rgba(46, 114, 104, 0.25)' },
  { name: 'Velvet Plum', color: '#8B4557', overlay: 'rgba(139, 69, 87, 0.25)' },
  { name: 'Silver Mist', color: '#C8C8E0', overlay: 'rgba(200, 200, 224, 0.25)' },
];

export const SensoryFabricLens: React.FC = () => {
  const [activeTextile, setActiveTextile] = useState<Textile>(TEXTILES[0]);
  const [activeDye, setActiveDye] = useState(DYE_PALETTES[0]);
  const [loupePos, setLoupePos] = useState<{ x: number; y: number; active: boolean }>({
    x: 50,
    y: 50,
    active: false,
  });
  const [waveActive, setWaveActive] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setLoupePos({ x, y, active: true });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
    const y = ((e.touches[0].clientY - rect.top) / rect.height) * 100;
    setLoupePos({ x, y, active: true });
  };

  const triggerWave = () => {
    setWaveActive(true);
    setTimeout(() => setWaveActive(false), 1200);
  };

  return (
    <section
      className="py-16 md:py-24 relative overflow-hidden"
      style={{ backgroundColor: '#FAF8F3' }}
      aria-labelledby="sensory-fabric-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-rose-gold/30 bg-rose-gold/10 backdrop-blur-md mb-3">
            <Feather size={14} className="text-rose-gold" />
            <span className="text-xs uppercase tracking-widest font-semibold text-rose-gold">
              Tactile Atelier & Craftsmanship Lens
            </span>
          </div>

          <h2
            id="sensory-fabric-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-editorial font-light text-charcoal tracking-tight mb-3"
          >
            The Sensory Soul of <span className="italic font-normal gold-gradient-text">Fine Textiles</span>
          </h2>

          <p className="text-sm sm:text-base text-[#66615B] font-light max-w-2xl mx-auto">
            Drag your cursor across our fabric swatches to inspect filament sheen, weave density, and tactile drape physics.
          </p>
        </div>

        {/* Textile Selector Tabs */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-3 mb-10 scrollbar-hide">
          {TEXTILES.map((t) => {
            const isSelected = t.id === activeTextile.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTextile(t)}
                className={`px-4 py-2.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-charcoal text-white shadow-md shadow-charcoal/20 scale-105 font-semibold'
                    : 'bg-white text-charcoal border border-stone-200 hover:border-rose-gold/40'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border border-stone-300"
                  style={{ background: t.gradientBase }}
                />
                {t.name}
              </button>
            );
          })}
        </div>

        {/* Main Interactive Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* LEFT: Interactive Swatch Loupe Canvas */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div
              ref={containerRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setLoupePos((prev) => ({ ...prev, active: false }))}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => setLoupePos((prev) => ({ ...prev, active: false }))}
              className={`relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-3xl overflow-hidden shadow-2xl border border-stone-300/80 cursor-crosshair select-none transition-transform duration-300 ${
                waveActive ? 'scale-[1.01]' : ''
              }`}
              style={{
                background: activeTextile.gradientBase,
              }}
            >
              {/* Pattern Texture Overlay */}
              <div
                className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
                style={{ background: activeTextile.weavePatternCss }}
              />

              {/* Dynamic Dye Tint Overlay */}
              <div
                className="absolute inset-0 mix-blend-color transition-colors duration-500 pointer-events-none"
                style={{ backgroundColor: activeDye.overlay }}
              />

              {/* Dynamic Wave Ripple */}
              {waveActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.2s_ease-in-out_infinite] pointer-events-none" />
              )}

              {/* Interactive Specular Loupe / Light Flare */}
              {loupePos.active && (
                <div
                  className="absolute pointer-events-none w-36 h-36 sm:w-44 sm:h-44 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/90 shadow-2xl backdrop-blur-xs flex items-center justify-center overflow-hidden"
                  style={{
                    left: `${loupePos.x}%`,
                    top: `${loupePos.y}%`,
                    background:
                      'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 60%, transparent 100%)',
                    boxShadow: '0 0 40px rgba(255, 255, 255, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.4)',
                  }}
                >
                  <div className="text-[10px] uppercase font-bold tracking-widest text-charcoal/80 bg-white/70 px-2.5 py-0.5 rounded-full shadow">
                    Micro-Weave
                  </div>
                </div>
              )}

              {/* Canvas Corner Badges */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-white/85 backdrop-blur-md text-xs font-semibold text-charcoal shadow-sm">
                  {activeTextile.weightGsm} GSM
                </span>
                <span className="px-3 py-1 rounded-full bg-white/85 backdrop-blur-md text-xs font-medium text-[#66615B] shadow-sm">
                  {activeTextile.origin}
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-auto">
                <div className="bg-black/60 backdrop-blur-md text-white px-3.5 py-2 rounded-xl text-xs max-w-sm">
                  <span className="font-semibold text-amber-300">Tactile Feel: </span>
                  <span className="text-stone-200">{activeTextile.tactileFeel}</span>
                </div>

                <button
                  type="button"
                  onClick={triggerWave}
                  className="px-3 py-2 rounded-xl bg-white/90 hover:bg-white text-charcoal text-xs font-semibold shadow-lg backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105"
                  title="Simulate airflow & drape physics"
                >
                  <Waves size={14} className="text-rose-gold" />
                  <span>Drape Wave</span>
                </button>
              </div>
            </div>

            {/* Live Custom Dye Palette Selector */}
            <div className="flex items-center justify-between w-full max-w-md mt-4 bg-white p-3 rounded-2xl border border-stone-200 shadow-sm">
              <div className="flex items-center gap-2">
                <Palette size={16} className="text-rose-gold" />
                <span className="text-xs font-semibold text-charcoal">Botanical Dye Test:</span>
              </div>

              <div className="flex items-center gap-2">
                {DYE_PALETTES.map((d) => (
                  <button
                    key={d.name}
                    type="button"
                    onClick={() => setActiveDye(d)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                      activeDye.name === d.name
                        ? 'scale-125 border-charcoal shadow-md'
                        : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: d.color }}
                    title={`Test ${d.name} botanical tint`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Textile Craftsmanship Specifications */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-lg shadow-stone-200/40">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-2xl font-editorial font-normal text-charcoal">
                  {activeTextile.name}
                </h3>
                <span className="px-2.5 py-1 rounded-lg bg-rose-gold/10 text-rose-gold text-xs font-semibold">
                  {activeTextile.artisanHours} Hours Hand-Loomed
                </span>
              </div>

              <p className="text-xs text-[#66615B] leading-relaxed mb-5">
                {activeTextile.description}
              </p>

              <div className="space-y-3 text-xs border-t border-stone-100 pt-4">
                <div className="flex items-start gap-2.5">
                  <Layers size={16} className="text-rose-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-charcoal block">Composition:</span>
                    <span className="text-[#66615B]">{activeTextile.composition}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Waves size={16} className="text-rose-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-charcoal block">Drape Cadence:</span>
                    <span className="text-[#66615B]">{activeTextile.drapeMovement}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Volume2 size={16} className="text-rose-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-charcoal block">Acoustic Rustle:</span>
                    <span className="text-[#66615B] italic">&ldquo;{activeTextile.acousticNote}&rdquo;</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <ShieldCheck size={16} className="text-rose-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-charcoal block">Atelier Care:</span>
                    <span className="text-[#66615B]">{activeTextile.careGuide}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Craft Heritage Notice */}
            <div className="p-4 rounded-2xl bg-stone-100/80 border border-stone-200 text-xs text-[#66615B] flex items-center gap-3">
              <Compass size={20} className="text-rose-gold flex-shrink-0" />
              <span>
                Each garment crafted with this textile is numbered and cut along natural warp grains to eliminate micro-tension and ensure a drape that flows like a second skin.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
