/* ===================================================
   Hero.tsx — Premium full-viewport hero banner
   =================================================== */

import React, { useEffect, useState } from 'react';
import { m as motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from '@/lib/routerCompat';
import { usePrerenderedContent, type ContentData } from '@/store/contentStore';

// ─── Helpers ────────────────────────────────────────────────────────────────────

const buildSrcSet = (url: string): string | undefined => {
  if (!url?.includes('cloudinary.com')) return undefined;
  const marker = '/upload/';
  const idx = url.indexOf(marker);
  if (idx === -1) return undefined;
  const base = url.slice(0, idx + marker.length);
  const rest = url.slice(idx + marker.length);
  const widths = [640, 1024, 1280, 1920];
  return widths.map((w) => `${base}w_${w},q_auto,f_auto/${rest} ${w}w`).join(', ');
};

const optimizeUrl = (url: string, width: number): string => {
  if (!url || !url.includes('cloudinary.com')) return url;
  const marker = '/upload/';
  const idx = url.indexOf(marker);
  if (idx === -1) return url;
  const base = url.slice(0, idx + marker.length);
  const rest = url.slice(idx + marker.length);
  return `${base}w_${width},q_auto,f_auto/${rest}`;
};

// ─── Hero Component ─────────────────────────────────────────────────────────────

export const Hero: React.FC<{ initialContent?: ContentData | null }> = ({ initialContent }) => {
  const navigate = useNavigate();
  const content = usePrerenderedContent(initialContent);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Early return — Hero disabled
  if (!content.heroEnabled) return null;

  const hasImage = !!content.heroImageUrl;
  const hasMobileImage = !!content.heroImageUrlMobile;

  // Content values (admin overrides, with sensible defaults)
  const eyebrowText = 'More Than Just Clothes';
  const titleText = content.heroTitle || 'A New Chapter';
  const subtitleText = content.heroSubtitle || 'for Your Style';
  const bodyText =
    content.heroBodyText ||
    'Discover timeless pieces that match your mood, your moments, and your unique you.';
  const ctaText = content.heroButtonText || 'Explore Collections';

  const heroSrcSet = hasImage ? buildSrcSet(content.heroImageUrl) : undefined;
  const heroSrc = hasImage ? optimizeUrl(content.heroImageUrl, 1280) : undefined;
  const heroMobileSrc = hasMobileImage
    ? optimizeUrl(content.heroImageUrlMobile!, 768)
    : undefined;
  const heroMobileSrcSet = hasMobileImage
    ? buildSrcSet(content.heroImageUrlMobile!)
    : undefined;

  return (
    <section
      className="relative w-full min-h-screen flex items-center overflow-hidden"
      style={{ minHeight: '100vh' }}
    >
      {/* ─── Background Image ───────────────────────────────────────────────── */}
      {hasImage ? (
        <picture className="absolute inset-0 w-full h-full">
          {hasMobileImage && (
            <source
              media="(max-width: 767px)"
              srcSet={heroMobileSrcSet || heroMobileSrc}
              sizes="100vw"
            />
          )}
          <img
            src={heroSrc || content.heroImageUrl}
            srcSet={heroSrcSet}
            sizes="100vw"
            alt=""
            aria-hidden="true"
            loading="eager"
            fetchPriority="high"
            decoding="sync"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: '45% 30%' }}
          />
        </picture>
      ) : (
        <div
          className="absolute inset-0 hero-gradient"
          aria-hidden="true"
        />
      )}

      {/* ─── Gradient Overlay ───────────────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(135deg, rgba(15,12,10,0.6) 0%, rgba(15,12,10,0.15) 55%, rgba(15,12,10,0.5) 100%)',
        }}
      />

      {/* ─── Handwritten Accent Text ────────────────────────────────────────── */}
      <motion.div
        className="absolute z-10"
        style={{ top: '8%', right: '5%' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.8, delay: 0.3 }}
      >
        <p className="font-serif italic text-2xl md:text-4xl text-white/45">
          Style Grace You
          <span className="block mt-1 text-base text-white/30">♥</span>
        </p>
      </motion.div>

      {/* ─── Main Content ───────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-8 lg:px-12 py-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16">
          {/* Left Column — Headline Content */}
          <motion.div
            className="w-full lg:w-1/2 text-left"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.8,
              delay: prefersReducedMotion ? 0 : 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {/* Eyebrow */}
            <span
              className="text-xs uppercase tracking-widest mb-4 block text-white/70"
              style={{ letterSpacing: '0.28em' }}
            >
              {eyebrowText}
            </span>

            {/* Headline */}
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-2">
              {titleText}
              <span
                className="block font-normal italic"
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '0.6em',
                  lineHeight: 1.4,
                  marginTop: '0.15em',
                  color: '#F4C2C2',
                }}
              >
                {subtitleText}
              </span>
            </h1>

            {/* Body Text */}
            <p
              className="mt-6 text-base md:text-lg max-w-md"
              style={{
                color: 'rgba(255,255,255,0.82)',
                fontWeight: 300,
                lineHeight: 1.7,
              }}
            >
              {bodyText}
            </p>

            {/* CTA Button */}
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.6, delay: 0.4 }}
            >
              <button
                onClick={() => navigate('/shop')}
                className="inline-flex items-center gap-2 px-8 py-3.5 text-xs uppercase font-semibold transition-all duration-300 ease-out"
                style={{
                  backgroundColor: '#F4C2C2',
                  color: '#2a2a2a',
                  borderRadius: '50px',
                  boxShadow: '0 4px 14px rgba(243, 211, 203, 0.35)',
                  letterSpacing: '0.16em',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.boxShadow =
                    '0 8px 24px rgba(243, 211, 203, 0.45)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F4C2C2';
                  e.currentTarget.style.boxShadow =
                    '0 4px 14px rgba(243, 211, 203, 0.35)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {ctaText}
                <ArrowRight size={14} style={{ color: '#2a2a2a' }} />
              </button>
            </motion.div>
          </motion.div>

          {/* Right Column — Scroll Indicator */}
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.8, delay: 0.6 }}
          >
            <span
              className="text-xs uppercase mb-3 text-white/50"
              style={{
                letterSpacing: '0.3em',
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
              }}
            >
              Scroll
            </span>
            <div
              className="w-px h-48 mb-3"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)',
              }}
            />
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: 'rgba(255,255,255,0.6)',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* ─── Torn Paper Bottom Edge ─────────────────────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '96px',
          zIndex: 4,
          background: `
            linear-gradient(180deg, transparent 0%, rgba(250,247,242,0.6) 15%, #faf7f2 100%),
            repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 3px,
              rgba(0,0,0,0.015) 3px,
              rgba(0,0,0,0.015) 4px
            )
          `,
          clipPath:
            'polygon(0% 20%, 5% 15%, 10% 25%, 15% 10%, 20% 22%, 25% 12%, 30% 20%, 35% 8%, 40% 18%, 45% 12%, 50% 22%, 55% 10%, 60% 20%, 65% 14%, 70% 24%, 75% 11%, 80% 19%, 85% 13%, 90% 21%, 95% 9%, 100% 18%, 100% 100%, 0% 100%)',
        }}
        aria-hidden="true"
      />

      {/* ─── CSS Keyframes ─────────────────────────────────────────────────── */}
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.3);
          }
        }
      `}</style>

      <style jsx global>{`
        @media (max-width: 768px) {
          .hero-content {
            padding: 0 1.4rem;
          }
        }
        @media (max-width: 480px) {
          .hero-headline {
            font-size: 2.6rem;
          }
        }
      `}</style>
    </section>
  );
};
