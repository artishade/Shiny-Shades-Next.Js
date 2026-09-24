import React, { useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  RotateCcw,
  Crown,
  Moon,
  Sun,
  Flame,
  Diamond,
  Share2,
  ArrowRight,
  Check
} from 'lucide-react';
import { Link } from '@/lib/routerCompat';

interface QuestionOption {
  label: string;
  sublabel: string;
  archetypeWeight: 'sovereign' | 'poet' | 'alchemist' | 'minimalist';
  icon: any;
}

interface Question {
  id: number;
  title: string;
  tagline: string;
  options: QuestionOption[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    title: 'What silhouette architecture commands your presence?',
    tagline: 'Choose how fabric should sculpt your entrance.',
    options: [
      {
        label: 'Regal Drama & Golden Sweep',
        sublabel: 'Floor-length silhouettes, structured shoulders, commanding train.',
        archetypeWeight: 'sovereign',
        icon: Crown,
      },
      {
        label: 'Fluid & Ethereal Cascade',
        sublabel: 'Weightless georgette, cascading gathers that float in breeze.',
        archetypeWeight: 'alchemist',
        icon: Sparkles,
      },
      {
        label: 'Sensual Nocturne & Deep Velvet',
        sublabel: 'Body-skimming bias cuts, mysterious cowls, tactile depth.',
        archetypeWeight: 'poet',
        icon: Moon,
      },
      {
        label: 'Sculptural Precision & Clean Lines',
        sublabel: 'Architectural pleating, sharp lapels, monochromatic power.',
        archetypeWeight: 'minimalist',
        icon: Diamond,
      },
    ],
  },
  {
    id: 2,
    title: 'In which atmospheric light does your spirit awaken?',
    tagline: 'The lighting that defines your aura.',
    options: [
      {
        label: 'Golden Hour at the Palais',
        sublabel: 'Amber sunlight refracting off 24k gold leaf and champagne silk.',
        archetypeWeight: 'sovereign',
        icon: Sun,
      },
      {
        label: 'Velvet Starlight & Jazz Salon',
        sublabel: 'Intimate candlelit reflections and deep shadowy intrigue.',
        archetypeWeight: 'poet',
        icon: Moon,
      },
      {
        label: 'Pearlescent Dawn by the Sea',
        sublabel: 'Pastel mists, iridescent dew, and whispers of morning rose.',
        archetypeWeight: 'alchemist',
        icon: Sparkles,
      },
      {
        label: 'Metropolitan High Noon',
        sublabel: 'High-contrast monochrome, crisp shadows, runway spotlight.',
        archetypeWeight: 'minimalist',
        icon: Flame,
      },
    ],
  },
  {
    id: 3,
    title: 'What is your non-negotiable signature accent?',
    tagline: 'The crowning detail that seals your look.',
    options: [
      {
        label: 'Heirloom Gold & Brocade',
        sublabel: 'Gilded embroidery that carries centuries of heritage.',
        archetypeWeight: 'sovereign',
        icon: Crown,
      },
      {
        label: 'Sculpted Statement Eyewear',
        sublabel: 'Architectural frames that guard your gaze and exude mystery.',
        archetypeWeight: 'minimalist',
        icon: Diamond,
      },
      {
        label: 'Cascading Pearl Chandelier Drops',
        sublabel: 'Baroque organic pearls that sway with every turn of the neck.',
        archetypeWeight: 'poet',
        icon: Moon,
      },
      {
        label: 'Gossamer Translucent Layers',
        sublabel: 'Organza veils and shimmering crystalline accents.',
        archetypeWeight: 'alchemist',
        icon: Sparkles,
      },
    ],
  },
];

interface PersonaResult {
  title: string;
  subtitle: string;
  manifesto: string;
  palette: string[];
  signatureGarment: string;
  recommendedEyewear: string;
  categoryLink: string;
  cardBg: string;
  accentBorder: string;
}

const PERSONAS: Record<string, PersonaResult> = {
  sovereign: {
    title: 'The Gilded Sovereign',
    subtitle: 'Archetype 01 — Radiant Authority & Royal Drama',
    manifesto:
      'You do not enter rooms; you occupy them. You favor heavy silks, 24k gold embroidery, and architectural silhouettes that echo dynastic grandeur. Your presence is warm, stately, and permanently unforgettable.',
    palette: ['#C9A227', '#E4C96B', '#111111', '#F4C2C2'],
    signatureGarment: 'Silk Rose Evening Gown & Banarasi Zari Cape',
    recommendedEyewear: 'The Empress 24k Gold Cat-Eye Shades',
    categoryLink: '/category/evening-wear',
    cardBg: 'linear-gradient(135deg, #1C1917 0%, #292524 50%, #451A03 100%)',
    accentBorder: 'border-amber-400',
  },
  poet: {
    title: 'The Velvet Nocturne',
    subtitle: 'Archetype 02 — Enigmatic Sensuality & Poetic Depth',
    manifesto:
      'Drawn to the quiet hours between midnight and dusk. You wear dark velvets, draped cowls, and smoky crystals that reveal their allure only to those fortunate enough to lean in close.',
    palette: ['#111111', '#8B4557', '#C8C8E0', '#2D2D2D'],
    signatureGarment: 'Midnight Velvet Tailored Blazer & Bias-Cut Slip',
    recommendedEyewear: 'Nocturne Geometric Obsidian Shield',
    categoryLink: '/category/outerwear',
    cardBg: 'linear-gradient(135deg, #0F0E17 0%, #1F1123 50%, #2A1728 100%)',
    accentBorder: 'border-rose-400',
  },
  alchemist: {
    title: 'The Ethereal Alchemist',
    subtitle: 'Archetype 03 — Weightless Grace & Prismatic Light',
    manifesto:
      'You turn motion into poetry. Layers of whisper-soft organza and pastel chiffon follow your stride like morning mist. You gravitate toward blush roses, champagne highlights, and delicate pearl droplets.',
    palette: ['#FADBD8', '#F7E7CE', '#E6E6FA', '#FFFDD0'],
    signatureGarment: 'Lavender Dream Midi Dress & Belle Tulle Skirt',
    recommendedEyewear: 'Riviera Champagne Flash Aviator',
    categoryLink: '/category/dresses',
    cardBg: 'linear-gradient(135deg, #2A2438 0%, #352F44 50%, #5C5470 100%)',
    accentBorder: 'border-pink-300',
  },
  minimalist: {
    title: 'The Avant-Garde Empress',
    subtitle: 'Archetype 04 — Architectural Precision & Modernist Edge',
    manifesto:
      'Unapologetically razor-sharp. You reject excess in favor of perfect geometry, unexpected cuts, and oversized sculptural eyewear. Your silhouette is clean, intimidatingly chic, and effortlessly futuristic.',
    palette: ['#FAF8F3', '#111111', '#B76E79', '#66615B'],
    signatureGarment: 'Crystal Pleated Palazzo & Pearl Satin Blouse',
    recommendedEyewear: 'Aura Oval Hand-Polished Mazzucchelli',
    categoryLink: '/category/pants',
    cardBg: 'linear-gradient(135deg, #18181B 0%, #27272A 50%, #3F3F46 100%)',
    accentBorder: 'border-stone-300',
  },
};

export const AuraPersonaQuiz: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [resultKey, setResultKey] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const handleSelectOption = (weight: string) => {
    const updated = [...answers, weight];
    setAnswers(updated);

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Calculate winning archetype
      const counts: Record<string, number> = {};
      updated.forEach((w) => {
        counts[w] = (counts[w] || 0) + 1;
      });
      let maxKey = 'sovereign';
      let maxCount = 0;
      Object.entries(counts).forEach(([k, count]) => {
        if (count > maxCount) {
          maxCount = count;
          maxKey = k;
        }
      });
      setResultKey(maxKey);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAnswers([]);
    setResultKey(null);
  };

  const handleCopyPersona = (result: PersonaResult) => {
    const text = `My Haute-Couture Aura is: ${result.title} (${result.subtitle}) ✨\nSignature Look: ${result.signatureGarment} + ${result.recommendedEyewear}\nDiscover your persona at Shiny Shades.`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const currentQ = QUESTIONS[currentStep];
  const activeResult = resultKey ? PERSONAS[resultKey] : null;

  return (
    <section
      className="py-16 md:py-24 relative overflow-hidden text-stone-100"
      style={{
        background: 'linear-gradient(180deg, #0F0E0D 0%, #161412 50%, #1A1816 100%)',
      }}
      aria-labelledby="aura-quiz-heading"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 backdrop-blur-md mb-3">
            <Sparkles size={14} className="text-amber-300" />
            <span className="text-xs uppercase tracking-widest font-semibold text-amber-200">
              Couture Aura Discovery
            </span>
          </div>

          <h2
            id="aura-quiz-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-editorial font-light text-white tracking-tight mb-3"
          >
            What is Your <span className="italic font-normal text-amber-300">Haute-Couture Aura?</span>
          </h2>

          <p className="text-sm sm:text-base text-stone-400 font-light max-w-xl mx-auto">
            Take this 3-question sensorial questionnaire to reveal your fashion archetype, signature palette, and curated wardrobe capsule.
          </p>
        </div>

        {/* Progress Tracker */}
        {!activeResult && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {QUESTIONS.map((q, idx) => (
              <div
                key={q.id}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  idx === currentStep
                    ? 'w-10 bg-amber-400 shadow-sm shadow-amber-400/50'
                    : idx < currentStep
                    ? 'w-6 bg-amber-600'
                    : 'w-6 bg-stone-800'
                }`}
              />
            ))}
          </div>
        )}

        {/* Question View */}
        {!activeResult && currentQ && (
          <div className="bg-stone-900/90 border border-stone-800/90 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl">
            <div className="mb-6 text-center sm:text-left">
              <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold block mb-1">
                Question 0{currentQ.id} of 03
              </span>
              <h3 className="text-xl sm:text-2xl font-editorial text-white mb-1">
                {currentQ.title}
              </h3>
              <p className="text-xs text-stone-400">{currentQ.tagline}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentQ.options.map((opt, i) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectOption(opt.archetypeWeight)}
                    className="p-5 rounded-2xl border border-stone-800 bg-stone-950/60 hover:bg-stone-900 hover:border-amber-400/60 text-left transition-all duration-300 group cursor-pointer hover:scale-[1.02] shadow-md"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400 group-hover:bg-amber-400 group-hover:text-stone-950 transition-colors">
                        <Icon size={18} />
                      </div>
                      <h4 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                        {opt.label}
                      </h4>
                    </div>
                    <p className="text-xs text-stone-400 leading-relaxed pl-10">
                      {opt.sublabel}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Result View: Tarot Card Presentation */}
        {activeResult && (
          <div className="relative rounded-3xl overflow-hidden border border-amber-500/40 p-6 sm:p-10 shadow-2xl shadow-black/80"
            style={{ background: activeResult.cardBg }}
          >
            {/* Glowing Accent Ring */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-semibold uppercase tracking-widest mb-3">
                <Crown size={13} /> {activeResult.subtitle}
              </div>

              <h3 className="text-3xl sm:text-4xl md:text-5xl font-editorial font-light text-white mb-4">
                {activeResult.title}
              </h3>

              {/* Color Swatches */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {activeResult.palette.map((hex, idx) => (
                  <span
                    key={idx}
                    className="w-5 h-5 rounded-full border-2 border-white/30 shadow-md transform hover:scale-125 transition-transform"
                    style={{ backgroundColor: hex }}
                    title={hex}
                  />
                ))}
              </div>

              <blockquote className="text-sm sm:text-base font-editorial italic text-stone-200 leading-relaxed mb-8 bg-black/40 p-5 rounded-2xl border border-white/10">
                &ldquo;{activeResult.manifesto}&rdquo;
              </blockquote>

              {/* Curated Recommendations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-8">
                <div className="p-4 rounded-2xl bg-black/50 border border-white/10">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block mb-1">
                    Signature Silhouette
                  </span>
                  <p className="text-xs text-white font-medium">
                    {activeResult.signatureGarment}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/50 border border-white/10">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block mb-1">
                    Signature Eyewear
                  </span>
                  <p className="text-xs text-white font-medium">
                    {activeResult.recommendedEyewear}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to={activeResult.categoryLink}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-amber-400 text-stone-950 font-semibold text-xs hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-400/20"
                >
                  <span>Explore My Curated Edit</span>
                  <ArrowRight size={14} />
                </Link>

                <button
                  type="button"
                  onClick={() => handleCopyPersona(activeResult)}
                  className="w-full sm:w-auto px-5 py-3 rounded-full bg-stone-900/80 border border-stone-700 text-stone-200 text-xs font-medium hover:text-white hover:border-amber-400/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check size={14} className="text-green-400" />
                      <span>Copied Card!</span>
                    </>
                  ) : (
                    <>
                      <Share2 size={14} className="text-amber-400" />
                      <span>Share My Persona</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto px-5 py-3 rounded-full bg-transparent border border-stone-800 text-stone-400 text-xs font-medium hover:text-stone-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Retake</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
