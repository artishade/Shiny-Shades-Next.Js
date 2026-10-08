/**
 * Home page — Template-based design
 * Matches the design from shiny-shades-template.html
 */

import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { GetStaticProps } from 'next';

// SVG Icons
const icons = {
  search: '<path d="M21 21l-4.3-4.3"/><circle cx="11" cy="11" r="7"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.500-2A5.5 5.5 0 0 0 2 8.500c0 2.300 1.500 4 3 5.500l7 7Z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.600-7 8-7s8 3 8 7"/>',
  bag: '<path d="M5 7h14l1 14H4z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  left: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  play: '<path d="M8 5v14l11-7z"/>',
  gem: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l3 6 3-6M12 21 9 9m3 12 3-12"/>',
  truck: '<path d="M2 6h12v10H2zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.500 8 8 9 4.500-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  crown: '<path d="M11.56 3.27a.5.5 0 0 1 .88 0l2.95 5.6a1 1 0 0 0 1.52.3L21.18 5.5a.5.5 0 0 1 .8.52l-2.83 10.25a1 1 0 0 1-.96.73H5.81a1 1 0 0 1-.96-.73L2.02 6.02a.5.5 0 0 1 .8-.52l4.27 3.66a1 1 0 0 0 1.52-.3z"/><path d="M5 21h14"/>',
  sparkles: '<path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.14 1.58a.5.5 0 0 1 0 .96L15.5 14.06A2 2 0 0 0 14.06 15.5l-1.58 6.14a.5.5 0 0 1-.96 0z"/><path d="M20 3v4M22 5h-4M4 17v2M5 18H3"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  diamond: '<path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z"/>',
};

// Data from template
const CATEGORIES = [
  { name: "Traditional Wear", grad: "linear-gradient(160deg,#e9b8bf,#b76e79 60%,#5e2233)" },
  { name: "Western Wear", grad: "linear-gradient(160deg,#6c7a3a,#3e4a22 60%,#171310)" },
  { name: "Saree", grad: "linear-gradient(160deg,#c9a227,#5e2233 60%,#2a1a4a)" },
  { name: "Burqa", grad: "linear-gradient(160deg,#4a3f3a,#171310)" },
  { name: "Garara", grad: "linear-gradient(160deg,#a8384f,#5e2233 70%,#2a0f18)" },
  { name: "Nightwear", grad: "linear-gradient(160deg,#a9c6dc,#6f93b0 70%,#3f5a73)" },
];

const FEATURED = [
  { name: "Embroidered Three Piece", grad: "linear-gradient(170deg,#f0e2b6,#c9b78a 55%,#6b5a3a)" },
  { name: "Digital Print Three Piece", grad: "linear-gradient(170deg,#8a5aa8,#4a2260 55%,#1b0f26)" },
  { name: "Banarasi Silk Saree", grad: "linear-gradient(170deg,#c9a227,#8b3a4a 55%,#2a0f18)" },
  { name: "Zari Anarkali", grad: "linear-gradient(170deg,#e9b8bf,#b76e79 55%,#5e2233)" },
  { name: "Chiffon Party Set", grad: "linear-gradient(170deg,#a9c6dc,#5f7f9d 55%,#22313f)" },
  { name: "Handloom Cotton Set", grad: "linear-gradient(170deg,#d9c9a8,#8a7a55 55%,#3a2f1e)" },
];

const PRODUCTS = [
  { id: 1, title: 'Royal Banarasi Silk Saree', cat: 'Saree', sub: 'Banarasi Silk', price: 11650, was: 14650, off: 20, rating: 5.0, badge: '', fabric: 'Pure Banarasi silk with real zari, hand-finished French seams.', tags: ['featured', 'trending'], g: ['#c9a227', '#8b6b16', '#1b1510'] },
  { id: 2, title: 'Golden Hour Maxi Skirt', cat: 'Western Wear', sub: 'Bias Satin', price: 4850, was: null, off: 0, rating: 4.9, badge: '', fabric: 'Bias-cut satin with a fluid, weighted drape.', tags: ['featured', 'trending'], g: ['#e4c96b', '#8b6b16', '#3a2f24'] },
  { id: 3, title: 'Silk Rose Evening Gown', cat: 'Western Wear', sub: 'Mulberry Silk', price: 8650, was: 11650, off: 26, rating: 4.8, badge: '', fabric: 'Mulberry silk charmeuse with a sculpted bodice.', tags: ['trending'], g: ['#b76e79', '#5e2233', '#0e0b09'] },
  { id: 4, title: 'Rosé Satin Slip Dress', cat: 'Western Wear', sub: 'Charmeuse Satin', price: 5950, was: 7850, off: 24, rating: 4.8, badge: 'new', fabric: 'Bias-cut charmeuse satin, fully lined.', tags: ['new', 'trending'], g: ['#e9c2c4', '#b76e79', '#5e2233'] },
  { id: 5, title: 'Kundan & Pearl Heritage Jewelry Set', cat: 'Traditional Wear', sub: 'Kundan & Freshwater Pearl', price: 3650, was: 4850, off: 25, rating: 4.8, badge: 'new', fabric: 'Kundan stones set in brass with freshwater pearls.', tags: ['new', 'featured'], g: ['#f0e2b6', '#c9a227', '#5e2233'] },
  { id: 6, title: 'Pearl Elegance Blouse', cat: 'Western Wear', sub: 'Satin', price: 3950, was: 5150, off: 23, rating: 4.7, badge: '', fabric: 'Pearl-buttoned satin with a soft shoulder.', tags: ['sale', 'featured'], g: ['#efe3cd', '#c9a227', '#8b6b16'] },
  { id: 7, title: 'Moonlight Sequin Top', cat: 'Western Wear', sub: 'Sequin Mesh', price: 5750, was: 6950, off: 17, rating: 4.7, badge: 'new', fabric: 'Hand-sewn sequins on stretch mesh.', tags: ['new', 'trending'], g: ['#cfd6dd', '#8b6b16', '#171310'] },
  { id: 8, title: 'Embroidered Georgette Salwar Kameez', cat: 'Traditional Wear', sub: 'Georgette', price: 7550, was: 8950, off: 16, rating: 4.7, badge: 'new', fabric: 'Embroidered georgette with a lined kameez.', tags: ['new', 'featured'], g: ['#c98fa0', '#5e2233', '#0e0b09'] },
  { id: 9, title: 'Garden Party Wrap Dress', cat: 'Western Wear', sub: 'Printed Rayon', price: 4850, was: null, off: 0, rating: 4.6, badge: '', fabric: 'Breathable rayon with a true wrap closure.', tags: ['featured'], g: ['#a8bf8f', '#3a2f24', '#0e0b09'] },
  { id: 10, title: 'Zardozi Heritage Bridal Lehenga', cat: 'Traditional Wear', sub: 'Silk Velvet', price: 19450, was: 23950, off: 19, rating: 5.0, badge: '', fabric: 'Silk velvet with hand-worked zardozi embroidery.', tags: ['featured', 'trending'], g: ['#8b6b16', '#b76e79', '#0e0b09'] },
];

const LOOKS = [
  { no: '01', name: 'The Heritage', note: 'Banarasi silk & undivided attention', g: ['#c9a227', '#8b6b16', '#0e0b09'] },
  { no: '02', name: 'The Maverick', note: 'Leather, studs & zero apologies', g: ['#2b2118', '#5e2233', '#0e0b09'] },
  { no: '03', name: 'The Flâneuse', note: 'Denim days, cream-skirt reveries', g: ['#cfd6dd', '#c9a227', '#3a2f24'] },
  { no: '04', name: 'The Showstopper', note: 'Sequins tuned to catch every light', g: ['#e4c96b', '#b76e79', '#171310'] },
  { no: '05', name: 'The Minimalist', note: 'One silhouette, infinite presence', g: ['#efe6d4', '#8b6b16', '#171310'] },
  { no: '06', name: 'The Muse', note: 'White lace, unhurried mornings', g: ['#f7f2e8', '#e9dcc3', '#8b6b16'] },
];

const QUESTIONS = [
  {
    q: 'How should a room learn your name?',
    whisper: 'Silhouettes speak before you do.',
    options: [
      { icon: 'crown', t: 'A sweeping train', s: 'Floor-length drama, structured shoulders', aura: 'Rose Gold' },
      { icon: 'sparkles', t: 'A cascading whisper', s: 'Weightless tiers that float as you move', aura: 'Champagne Ivory' },
      { icon: 'moon', t: 'A bias-cut murmur', s: 'Body-skimming velvet, deep and tactile', aura: 'Midnight Bordeaux' },
      { icon: 'diamond', t: 'A precise line', s: 'Architectural pleats, sharp lapels', aura: 'Antique Gold' },
    ],
  },
  {
    q: 'What does your Friday evening sound like?',
    whisper: 'The light tells the truth.',
    options: [
      { icon: 'sparkles', t: 'Candlelight and low jazz', s: 'Soft, unhurried, golden', aura: 'Champagne Ivory' },
      { icon: 'crown', t: 'A rooftop and a playlist', s: 'Loud, bright, unapologetic', aura: 'Rose Gold' },
      { icon: 'moon', t: 'Silk sheets and a novel', s: 'Quiet luxury, zero plans', aura: 'Midnight Bordeaux' },
      { icon: 'diamond', t: 'A launch and a list', s: 'Sharp rooms, sharper people', aura: 'Antique Gold' },
    ],
  },
  {
    q: 'Choose the detail you never skip.',
    whisper: 'God is in the finishing.',
    options: [
      { icon: 'diamond', t: 'The zari at the hem', s: 'Heritage you can trace', aura: 'Antique Gold' },
      { icon: 'sparkles', t: 'The sequin that catches', s: 'A glint of mischief', aura: 'Rose Gold' },
      { icon: 'crown', t: 'The shoulder line', s: 'Structure first, always', aura: 'Midnight Bordeaux' },
      { icon: 'moon', t: 'The weight of the silk', s: 'How it falls, not how it looks', aura: 'Champagne Ivory' },
    ],
  },
  {
    q: 'Your shine, in one word?',
    whisper: 'Say it without flinching.',
    options: [
      { icon: 'crown', t: 'Commanding', s: 'Rooms reorganise around you', aura: 'Antique Gold' },
      { icon: 'sparkles', t: 'Luminous', s: 'Impossible to look past', aura: 'Rose Gold' },
      { icon: 'moon', t: 'Enigmatic', s: 'Known slowly, remembered long', aura: 'Midnight Bordeaux' },
      { icon: 'diamond', t: 'Timeless', s: 'Proof that elegance ages well', aura: 'Champagne Ivory' },
    ],
  },
];

const SHADES = [
  { name: 'Rose Gold', hex: '#b76e79' },
  { name: 'Champagne', hex: '#e4c96b' },
  { name: 'Antique Gold', hex: '#8b6b16' },
  { name: 'Bordeaux', hex: '#5e2233' },
  { name: 'Ivory', hex: '#efe6d4' },
  { name: 'Midnight', hex: '#1b1510' },
  { name: 'Emerald', hex: '#1f5c48' },
  { name: 'Lilac Mist', hex: '#a89cc8' },
];

// Helper functions
const grad = (g: string[]) => `linear-gradient(150deg,${g[0]},${g[1]} 48%,${g[2]})`;
const money = (n: number) => '৳' + n.toLocaleString('en-US');
const svg = (p: string, w: number) => `<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const star = '<svg viewBox="0 0 24 24"><path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.05 1.1-6.5-4.7-4.6 6.5-.95z"/></svg>';

const TemplateHomePage: React.FC = () => {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [showTotop, setShowTotop] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalProduct, setModalProduct] = useState<any>(null);
  const [wishlist, setWishlist] = useState<Set<number>>(new Set());
  const [bag, setBag] = useState<Set<number>>(new Set());
  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'trending' | 'sale' | 'featured'>('all');
  const [activeCat, setActiveCat] = useState<string>('Everything');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('featured');
  const [visible, setVisible] = useState(10);
  const [pg, setPg] = useState(0);
  const [step, setStep] = useState(0);
  const [auras, setAuras] = useState<string[]>([]);
  const [shadeIndex, setShadeIndex] = useState(0);
  const [intensity, setIntensity] = useState(72);
  const [pins, setPins] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const pages = Math.ceil(FEATURED.length / 2);

  // Scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
      setShowTotop(window.scrollY > 700);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Toast notification
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2200);
  }, []);

  // Filter products
  const filteredProducts = PRODUCTS.filter(p => {
    if (activeCat !== 'Everything' && p.cat !== activeCat) return false;
    if (activeFilter !== 'all' && !p.tags.includes(activeFilter)) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!(p.title + ' ' + p.cat + ' ' + p.sub + ' ' + p.fabric).toLowerCase().includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sort === 'price-asc') return a.price - b.price;
    if (sort === 'price-desc') return b.price - a.price;
    if (sort === 'rating') return b.rating - a.rating;
    return 0;
  });

  // Render current slide
  const renderSlide = () => {
    const items = FEATURED.slice(pg * 2, pg * 2 + 2);
    return items.map((p, i) => (
      <Link key={i} href="/shop" className="pcard ph" style={{ background: p.grad }}>
        <span>{p.name}</span>
        <em dangerouslySetInnerHTML={{ __html: svg(icons.arrow, 16) }} />
      </Link>
    ));
  };

  // Handle prev/next
  const handlePrev = () => setPg((pg - 1 + pages) % pages);
  const handleNext = () => setPg((pg + 1) % pages);

  // Open modal
  const openModal = (product: any) => {
    setModalProduct(product);
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    document.body.style.overflow = '';
  };

  // Add to bag
  const addToBag = (productId: number) => {
    setBag(prev => new Set(prev).add(productId));
    showToast('Added to bag — ' + PRODUCTS.find(p => p.id === productId)?.title + ' ✧');
    closeModal();
  };

  // Add to wishlist
  const addToWishlist = (productId: number) => {
    setWishlist(prev => new Set(prev).add(productId));
    showToast('Saved to wishlist ❤');
  };

  // Reveal more products - IMPORTANT: Expands cards then redirects to shop page
  const revealMore = () => {
    setVisible(prev => Math.min(prev + 6, filteredProducts.length));
    // After revealing more, redirect to shop page as requested
    setTimeout(() => {
      router.push('/shop');
    }, 500);
  };

  // Render product cards
  const renderProductCards = () => {
    const slice = filteredProducts.slice(0, visible);
    if (slice.length === 0) {
      return (
        <div className="empty" style={{ gridColumn: '1/-1' }}>
          <p className="font-display" style={{ fontSize: '1.5rem', fontStyle: 'italic' }}>
            Nothing on this rack yet.
          </p>
          <p style={{ marginTop: '.5rem', fontSize: '.875rem' }}>
            Try another word, or wander a different department.
          </p>
        </div>
      );
    }

    return slice.map(p => (
      <article key={p.id} className="card" onClick={() => openModal(p)}>
        <div className="media">
          <div className="img" style={{ background: grad(p.g) }} />
          <div className="flags">
            {p.off > 0 && <span className="flag sale">−{p.off}%</span>}
            {p.badge === 'new' && <span className="flag new">New</span>}
          </div>
          <button className="quick" onClick={(e) => { e.stopPropagation(); openModal(p); }}>
            Quick view
          </button>
        </div>
        <div className="card-body">
          <p className="card-kicker">{p.cat} · {p.sub}</p>
          <h3 className="card-title">{p.title}</h3>
          <div className="card-foot">
            <span className="price">
              {money(p.price)}
              {p.was && <s>{money(p.was)}</s>}
            </span>
            <span className="rating" dangerouslySetInnerHTML={{ __html: star + p.rating.toFixed(1) }} />
          </div>
        </div>
      </article>
    ));
  };

  // Scroll to top
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Get aura result
  const getAuraResult = () => {
    const tally: Record<string, number> = {};
    auras.forEach(a => { tally[a] = (tally[a] || 0) + 1; });
    return Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Rose Gold';
  };

  // Get aura code
  const getAuraCode = () => {
    const aura = getAuraResult();
    return 'SHINE10-' + aura.split(' ')[0].toUpperCase().slice(0, 4);
  };

  return (
    <div className="grain">
      <Head>
        <title>Shiny Shades — Wear Your Story</title>
        <meta name="description" content="Shiny Shades — premium women's fashion from Bangladesh. Traditional wear, saree, burqa, garara, nightwear and more." />
        <meta name="theme-color" content="#0e0b09" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Allura&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* SVG Sprite */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <symbol id="i-search" viewBox="0 0 24 24">
          <path d="M21 21l-4.3-4.3" />
          <circle cx="11" cy="11" r="7" />
        </symbol>
        <symbol id="i-heart" viewBox="0 0 24 24">
          <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.500-2A5.5 5.5 0 0 0 2 8.500c0 2.300 1.500 4 3 5.500l7 7Z" />
        </symbol>
        <symbol id="i-user" viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 3.600-7 8-7s8 3 8 7" />
        </symbol>
        <symbol id="i-bag" viewBox="0 0 24 24">
          <path d="M5 7h14l1 14H4z" />
          <path d="M9 7a3 3 0 0 1 6 0" />
        </symbol>
        <symbol id="i-menu" viewBox="0 0 24 24">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </symbol>
        <symbol id="i-arrow" viewBox="0 0 24 24">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </symbol>
        <symbol id="i-left" viewBox="0 0 24 24">
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </symbol>
        <symbol id="i-play" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </symbol>
        <symbol id="i-gem" viewBox="0 0 24 24">
          <path d="M6 3h12l4 6-10 12L2 9z" />
          <path d="M2 9h20M9 3l3 6 3-6M12 21 9 9m3 12 3-12" />
        </symbol>
        <symbol id="i-truck" viewBox="0 0 24 24">
          <path d="M2 6h12v10H2zM14 10h4l3 3v3h-7" />
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
        </symbol>
        <symbol id="i-shield" viewBox="0 0 24 24">
          <path d="M12 3 4 6v6c0 5 3.500 8 8 9 4.500-1 8-4 8-9V6z" />
          <path d="m9 12 2 2 4-4" />
        </symbol>
        <symbol id="i-up" viewBox="0 0 24 24">
          <path d="M12 19V5M6 11l6-6 6 6" />
        </symbol>
        <symbol id="torn" viewBox="0 0 1440 60" preserveAspectRatio="none">
          <path d="M0 60V24l40 6 50-16 60 14 60-18 70 16 60-10 80 14 80-18 70 12 80-16 70 18 80-12 80 16 80-18 80 14 80-10 80 14 80-16 70 14 60-12V60z" />
        </symbol>
      </svg>

      {/* HEADER */}
      <header className={`site-header ${scrolled ? 'scrolled' : ''}`} id="header">
        <div className="announce micro">Free delivery across Bangladesh on orders over ৳5,000</div>
        <div className="shell">
          <nav className="navbar wrap" aria-label="Primary">
            <Link className="brand" href="/" aria-label="Shiny Shades — home">
              <b>
                Shiny <em className="gold-text">Shades</em>
              </b>
              <small>wear your story</small>
            </Link>
            <ul className="nav-links">
              <li>
                <Link className="on" href="#top">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/shop">Shop</Link>
              </li>
              <li>
                <Link href="#featured">Collections</Link>
              </li>
              <li>
                <Link href="#oracle">Style Oracle</Link>
              </li>
              <li>
                <Link href="#drape">Drape Studio</Link>
              </li>
              <li>
                <Link href="#lookbook">Lookbook</Link>
              </li>
              <li>
                <Link href="#why">About</Link>
              </li>
              <li>
                <Link href="#contact">Contact</Link>
              </li>
            </ul>
            <div className="actions">
              <button className="icon-btn" aria-label="Search" onClick={() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })}>
                <svg className="i">
                  <use href="#i-search" />
                </svg>
              </button>
              <button className="icon-btn" aria-label="Wishlist" onClick={() => showToast('Wishlist: ' + wishlist.size + ' piece(s) saved')}>
                <svg className="i">
                  <use href="#i-heart" />
                </svg>
                {wishlist.size > 0 && <span className="badge">{wishlist.size}</span>}
              </button>
              <button className="icon-btn" aria-label="Account" onClick={() => showToast('Sign in coming soon')}>
                <svg className="i">
                  <use href="#i-user" />
                </svg>
              </button>
              <button className="icon-btn" aria-label="Bag" onClick={() => showToast(bag.size ? bag.size + ' piece(s) in your bag' : 'Your bag is empty')}>
                <svg className="i">
                  <use href="#i-bag" />
                </svg>
                {bag.size > 0 && <span className="badge">{bag.size}</span>}
              </button>
              <button className="icon-btn burger" aria-label="Menu" onClick={() => document.getElementById('mm')?.classList.toggle('open')}>
                <svg className="i">
                  <use href="#i-menu" />
                </svg>
              </button>
            </div>
          </nav>
          <div className="mobile-menu" id="mm">
            <Link href="#top" onClick={() => document.getElementById('mm')?.classList.remove('open')}>Home</Link>
            <Link href="/shop" onClick={() => document.getElementById('mm')?.classList.remove('open')}>Shop</Link>
            <Link href="#featured" onClick={() => document.getElementById('mm')?.classList.remove('open')}>Collections</Link>
            <Link href="#oracle" onClick={() => document.getElementById('mm')?.classList.remove('open')}>Style Oracle</Link>
            <Link href="#drape" onClick={() => document.getElementById('mm')?.classList.remove('open')}>Drape Studio</Link>
            <Link href="#lookbook" onClick={() => document.getElementById('mm')?.classList.remove('open')}>Lookbook</Link>
            <Link href="#why" onClick={() => document.getElementById('mm')?.classList.remove('open')}>About</Link>
            <Link href="#contact" onClick={() => document.getElementById('mm')?.classList.remove('open')}>Contact</Link>
          </div>
        </div>
      </header>

      <main id="top">
        {/* HERO */}
        <section className="hero" aria-label="Shiny Shades">
          <div className="glow glow-a" aria-hidden="true" />
          <div className="glow glow-b" aria-hidden="true" />
          <div className="script-tag" aria-hidden="true">
            Style<br />&nbsp;Grace<br />&nbsp;&nbsp;You ♥
          </div>
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <p className="micro" style={{ color: 'var(--gold)' }} data-in>
                more than just clothes • women&apos;s fashion
              </p>
              <h1 data-in style={{ '--d': '.1s' }}>
                A new chapter for<br />
                <em className="gold-text">your style</em>
              </h1>
              <p className="hero-lead" data-in style={{ '--d': '.2s' }}>
                Discover timeless pieces that match your mood, your moments and your unique you — from heritage saree to everyday lux, made for the woman who enters a room and improves it.
              </p>
              <div className="hero-cta" data-in style={{ '--d': '.3s' }}>
                <Link className="btn-gold" href="/shop">
                  Explore Collections
                  <svg className="i">
                    <use href="#i-arrow" />
                  </svg>
                </Link>
                <Link className="btn-ghost micro" href="#featured">
                  See the featured edit
                </Link>
              </div>
              <dl className="hero-stats" data-in style={{ '--d': '.4s' }}>
                <div>
                  <dt>40+</dt>
                  <dd>curated pieces</dd>
                </div>
                <div>
                  <dt>4.9★</dt>
                  <dd>customer rating</dd>
                </div>
                <div>
                  <dt>2–4d</dt>
                  <dd>fast delivery</dd>
                </div>
              </dl>
            </div>
            <div className="hero-visual" data-in style={{ '--d': '.25s' }}>
              <div className="panels" aria-hidden="true">
                <div className="panel pa">
                  <div className="cloth ph" style={{ '--grad': 'linear-gradient(150deg,#c9a227,#8b6b16 45%,#1b1510)' }} />
                </div>
                <div className="panel pb">
                  <div className="cloth ph" style={{ '--grad': 'linear-gradient(150deg,#f0e2b6,#b76e79 50%,#5e2233)' }} />
                </div>
                <div className="panel pc">
                  <div className="cloth ph" style={{ '--grad': 'linear-gradient(150deg,#f0b8c4,#5e2233 55%,#0e0b09)' }} />
                </div>
              </div>
              <div className="seal" aria-hidden="true">
                <div className="ring">
                  <svg viewBox="0 0 100 100">
                    <defs>
                      <path id="sc" d="M 50,50 m -36,0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0" />
                    </defs>
                    <text>
                      <textPath href="#sc">SHINY SHADES • WEAR YOUR STORY • EST 2023 •</textPath>
                    </text>
                  </svg>
                </div>
                <div className="ini">S</div>
              </div>
              <div className="ritual">
                <p className="micro">new arrivals</p>
                <p>New drops, every week</p>
              </div>
            </div>
          </div>
          <Link className="scroll-cue" href="#collection" aria-label="Scroll down">
            <span className="micro">scroll</span>
            <svg className="i">
              <use href="#i-arrow" transform="rotate(90 12 12)" />
            </svg>
          </Link>
          <svg className="torn bottom" aria-hidden="true">
            <use href="#torn" />
          </svg>
        </section>

        {/* SHOP BY CATEGORY */}
        <section className="paper cats" id="shop" aria-label="Shop by category">
          <div className="wrap cats-grid">
            <div>
              <h2>Shop By<br />Category</h2>
              <p>From traditional to trendy, find your perfect style in every category.</p>
              <Link className="view-all" href="/shop">
                View All
                <svg className="i" style={{ width: '.9rem', height: '.9rem' }}>
                  <use href="#i-arrow" />
                </svg>
              </Link>
            </div>
            <div className="rail" id="catRail">
              {CATEGORIES.map((c, i) => (
                <Link key={i} className="cat" href="/shop" data-cat={c.name}>
                  <div className="arch ph" style={{ background: c.grad }} />
                  <b>{c.name}</b>
                  <i />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURED COLLECTION */}
        <section className="featured" id="featured" aria-label="Featured collection">
          <svg className="torn top" aria-hidden="true">
            <use href="#torn" />
          </svg>
          <div className="wrap feat-grid">
            <div className="polaroid">
              <div className="ph" style={{ '--grad': 'linear-gradient(160deg,#2a2220,#0e0b09 60%,#5e2233)' }} />
              <div className="note">
                Elegance<br />in every<br />detail ♥
              </div>
            </div>
            <div className="feat-copy">
              <p className="micro" style={{ color: 'var(--gold)' }}>
                featured collection
              </p>
              <h2>
                Timeless<br />
                <em className="gold-text">Traditional</em>
              </h2>
              <p>Graceful designs, rich details, crafted for your most special moments.</p>
              <Link className="btn-gold" href="/shop">
                Explore Now
                <svg className="i">
                  <use href="#i-arrow" />
                </svg>
              </Link>
              <button className="watch" onClick={() => showToast('Story video coming soon')}>
                <span>
                  <svg className="i" style={{ fill: 'currentColor', width: '.9rem', height: '.9rem' }}>
                    <use href="#i-play" />
                  </svg>
                </span>
                Watch<br />The Story
              </button>
            </div>
            <div className="feat-side">
              <div className="slide" id="slide" aria-live="polite">
                {renderSlide()}
              </div>
              <div className="ctrl">
                <button id="prev" aria-label="Previous" onClick={handlePrev}>
                  <svg className="i">
                    <use href="#i-left" />
                  </svg>
                </button>
                <button id="next" aria-label="Next" onClick={handleNext}>
                  <svg className="i">
                    <use href="#i-arrow" />
                  </svg>
                </button>
                <small id="count">
                  {String(pg + 1).padStart(2, '0')} / {String(pages).padStart(2, '0')}
                </small>
              </div>
            </div>
          </div>
          <svg className="torn bottom" aria-hidden="true">
            <use href="#torn" />
          </svg>
        </section>

        {/* COLLECTION */}
        <section className="sec sec-lg collection" id="collection" aria-label="The collection">
          <div className="wrap">
            <div className="centered">
              <p className="micro">the collection</p>
              <h2 className="sec-head" style={{ display: 'block' }}>
                Pieces with <em className="gold-text">a pulse</em>
              </h2>
              <div className="gold-rule" />
              <p className="sec-sub" style={{ color: '#17131099' }}>
                Every rack is a rumor of shine — hover to peek, tap to meet the piece up close.
              </p>
            </div>

            <div className="toolbar">
              <label className="search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="m21 21-4.34-4.34" />
                  <circle cx="11" cy="11" r="8" />
                </svg>
                <input
                  id="searchInput"
                  type="search"
                  placeholder="Try “satin”, “saree”, “sequin”…"
                  aria-label="Search the collection"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setVisible(10); }}
                />
              </label>
              <div className="chips" role="tablist" aria-label="Quick filters">
                {['all', 'new', 'trending', 'sale', 'featured'].map(f => (
                  <button
                    key={f}
                    className={`chip ${activeFilter === f ? 'active' : ''}`}
                    role="tab"
                    aria-selected={activeFilter === f}
                    data-filter={f}
                    onClick={() => { setActiveFilter(f as any); setVisible(10); }}
                  >
                    {f === 'all' ? 'All pieces' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <label className="sort">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4" />
                </svg>
                <span className="sr-only">Sort pieces</span>
                <select
                  id="sortSelect"
                  aria-label="Sort pieces"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="featured">Curator’s order</option>
                  <option value="price-asc">Price · low to high</option>
                  <option value="price-desc">Price · high to low</option>
                  <option value="rating">Most adored</option>
                </select>
              </label>
            </div>

            <div className="grid" id="productGrid">
              {renderProductCards()}
            </div>
            <div className="more-wrap" hidden={visible >= filteredProducts.length}>
              <button className="btn-ink" id="moreBtn" onClick={revealMore}>
                Reveal more pieces ({filteredProducts.length - visible})
              </button>
            </div>
          </div>
        </section>

        {/* STYLE ORACLE */}
        <section className="sec sec-lg oracle" id="oracle" aria-label="The Style Oracle">
          <svg className="torn top" aria-hidden="true">
            <use href="#torn" />
          </svg>
          <div className="oracle-glow" aria-hidden="true" />
          <div className="wrap oracle-inner">
            <div className="centered">
              <p className="micro" style={{ color: 'var(--gold)' }}>
                the style oracle
              </p>
              <h2 className="sec-head" style={{ display: 'block' }}>
                Four questions. <em className="gold-text">One aura.</em>
              </h2>
              <div className="gold-rule" />
              <p className="sec-sub">
                Answer with your gut, not your closet. The Oracle reads your aura and unlocks a secret code along the way.
              </p>
            </div>
            <div className="oracle-bar">
              <div className="row">
                <span id="qLabel">Question {step + 1}</span>
                <span id="qCount">4</span>
              </div>
              <div className="track">
                <i id="qBar" style={{ width: `${((step + 1) / 4) * 100}%` }} />
              </div>
            </div>
            <div id="oracleBody">
              {step < QUESTIONS.length ? (
                <div className="q-block">
                  <h3>{QUESTIONS[step].q}</h3>
                  <p className="q-whisper">{QUESTIONS[step].whisper}</p>
                  <div className="options">
                    {QUESTIONS[step].options.map((o, i) => (
                      <button
                        key={i}
                        className="opt"
                        data-opt={i}
                        onClick={() => {
                          setAuras([...auras, o.aura]);
                          setStep(step + 1);
                          document.getElementById('oracle')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                      >
                        <span dangerouslySetInnerHTML={{ __html: svg(icons[o.icon as keyof typeof icons], 24) }} />
                        <b>{o.t}</b>
                        <span>{o.s}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="oracle-result">
                  <p className="micro" style={{ color: '#f7f2e880' }}>
                    the oracle has read you
                  </p>
                  <p className="aura gold-text">{getAuraResult()}</p>
                  <p className="sec-sub" style={{ maxWidth: '32rem' }}>
                    You are a woman — equal parts heritage and heat. The Oracle has unlocked 10% off your first piece.
                  </p>
                  <div className="code-pill micro">{getAuraCode()}</div>
                  <div style={{ marginTop: '2rem', display: 'flex', gap: '.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link className="btn-gold" href="/shop">
                      <span>Shop your aura</span>
                    </Link>
                    <button
                      className="btn-ghost micro"
                      onClick={() => {
                        setStep(0);
                        setAuras([]);
                      }}
                    >
                      Retake the reading
                    </button>
                  </div>
                  <Link className="link-btn" href="#drape">
                    Now drape your colours in the studio ↓
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* DRAPE STUDIO */}
        <section className="sec sec-lg on-noir" id="drape" aria-label="The Drape Studio">
          <div className="wrap drape-grid">
            <div>
              <p className="micro" style={{ color: 'var(--gold)' }}>
                the drape studio
              </p>
              <h2 className="sec-head" style={{ display: 'block' }}>
                Your world, <em className="gold-text">in one drape</em>
              </h2>
              <div className="gold-rule" />
              <p className="sec-sub" style={{ textAlign: 'left', marginInline: 0, marginTop: '1.25rem' }}>
                One ivory gown. Infinite temperaments. Pick a shade and watch it re-dye before your eyes — then pin the ones that feel like you.
              </p>

              <div className="controls">
                <div className="label">
                  <span>Dye intensity</span>
                  <span id="intensityVal">{intensity}%</span>
                </div>
                <input
                  id="intensity"
                  type="range"
                  min="10"
                  max="100"
                  value={intensity}
                  aria-label="Dye intensity"
                  onChange={(e) => setIntensity(Number(e.target.value))}
                />
                <div className="swatches" id="swatches">
                  {SHADES.map((s, i) => (
                    <button
                      key={i}
                      className={`swatch ${i === shadeIndex ? 'active' : ''}`}
                      data-shade={i}
                      title={s.name}
                      aria-label={s.name}
                      style={{ background: s.hex }}
                      onClick={() => setShadeIndex(i)}
                    />
                  ))}
                </div>
                <div className="control-row">
                  <button className="btn-gold" id="pinBtn" onClick={() => {
                    const s = SHADES[shadeIndex];
                    if (pins.some(p => p.name === s.name)) return showToast(s.name + ' is already pinned ✧');
                    setPins([...pins, s]);
                    showToast(s.name + ' pinned to your moodboard ✧');
                  }}>
                    <span>Pin to moodboard</span>
                  </button>
                  <button
                    className="btn-ghost micro"
                    id="surpriseBtn"
                    onClick={() => {
                      setShadeIndex(Math.floor(Math.random() * SHADES.length));
                      setIntensity(40 + Math.floor(Math.random() * 61));
                      showToast('The atelier chose ' + SHADES[Math.floor(Math.random() * SHADES.length)].name);
                    }}
                  >
                    Surprise me
                  </button>
                </div>
              </div>

              <div className="moodboard">
                <p className="micro">your moodboard</p>
                {pins.length === 0 ? (
                  <p className="empty-note">Empty for now — pin a shade that feels like Friday.</p>
                ) : (
                  <div className="pins" id="pins">
                    {pins.map((p, i) => (
                      <span key={i} className="pin">
                        <i style={{ background: p.hex }} />
                        {p.name}
                        <button
                          data-unpin={i}
                          aria-label={`Remove ${p.name}`}
                          style={{ opacity: .6 }}
                          onClick={() => {
                            const newPins = [...pins];
                            newPins.splice(i, 1);
                            setPins(newPins);
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ marginTop: '1.75rem' }}>
                <Link className="btn-ghost micro" href="/shop">
                  Shop dresses in your mood
                </Link>
              </div>
            </div>

            <div>
              <div className="drape-stage">
                <div
                  className="gown"
                  id="gown"
                  style={{
                    background: `linear-gradient(160deg, rgba(255, 255, 255, ${0.35 * (1 - intensity / 100)}) ${intensity / 100 * 0.92 + 0.08}, ${SHADES[shadeIndex].hex})`,
                  }}
                >
                  <div className="bodice" />
                  <div className="skirt" />
                  <div className="sheen" />
                </div>
                <div className="stage-label">now draping</div>
                <div className="stage-shade">
                  <small>shade</small>
                  <b id="shadeName">{SHADES[shadeIndex].name}</b>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LOOKBOOK */}
        <section className="sec sec-lg lookbook" id="lookbook" aria-label="The lookbook">
          <div className="wrap">
            <div className="sec-head">
              <div style={{ maxWidth: '48rem' }}>
                <p className="micro" style={{ color: 'var(--gold)' }}>
                  the lookbook · issue n° 12
                </p>
                <h2>
                  Worn <em className="gold-text">six ways</em>
                </h2>
                <div className="gold-rule" />
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="micro" style={{ color: '#f7f2e880' }}>
                  drag or scroll sideways
                </p>
                <div className="rail-nav" style={{ justifyContent: 'flex-end', marginTop: '.75rem' }}>
                  <button
                    aria-label="Scroll lookbook left"
                    data-rail="lookRail"
                    data-dir="-1"
                    onClick={() => {
                      const el = document.getElementById('lookRail');
                      if (el) el.scrollBy({ left: -1 * Math.min(el.clientWidth * 0.8, 520), behavior: 'smooth' });
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    aria-label="Scroll lookbook right"
                    data-rail="lookRail"
                    data-dir="1"
                    onClick={() => {
                      const el = document.getElementById('lookRail');
                      if (el) el.scrollBy({ left: Math.min(el.clientWidth * 0.8, 520), behavior: 'smooth' });
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="snap-rail dept-rail look-rail" id="lookRail">
            {LOOKS.map((l, i) => (
              <button key={i} className="look" onClick={() => showToast('Look saved to your moodboard ✧')}>
                <span className="bg" style={{ background: grad(l.g) }} />
                <span className="shade" />
                <span className="txt">
                  <span className="no">{l.no}</span>
                  <b>{l.name}</b>
                  <span>{l.note}</span>
                  <span className="cta">Steal this look →</span>
                </span>
              </button>
            ))}
            <div className="look-end atelier-frame">
              <p>The next look is yours.</p>
              <small>write it in the collection</small>
            </div>
          </div>
          <svg className="torn bottom" aria-hidden="true">
            <use href="#torn" />
          </svg>
        </section>

        {/* WHY SHOP */}
        <section className="paper why" id="why" aria-label="Why shop with us" style={{ position: 'relative' }}>
          <div className="note n1" aria-hidden="true">
            Fashion is a way of expressing yourself ♥
          </div>
          <div className="note n2" aria-hidden="true">
            Because you deserve the best ♥
          </div>
          <div className="wrap">
            <p className="micro">why shop with us</p>
            <h2>Your Style, Our Priority</h2>
            <div className="why-row">
              <div>
                <span dangerouslySetInnerHTML={{ __html: svg(icons.gem, 24) }} />
                Premium<br />Quality
              </div>
              <div>
                <span dangerouslySetInnerHTML={{ __html: svg(icons.truck, 24) }} />
                Fast &amp; Secure<br />Delivery
              </div>
              <div>
                <span dangerouslySetInnerHTML={{ __html: svg(icons.shield, 24) }} />
                Easy<br />Return Policy
              </div>
              <div>
                <span dangerouslySetInnerHTML={{ __html: svg(icons.heart, 24) }} />
                Always<br />Here for You
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer" id="contact">
        <div className="wrap">
          <div className="foot-grid">
            <Link className="brand" href="/">
              <b style={{ fontSize: '2rem' }}>
                Shiny <em className="gold-text">Shades</em>
              </b>
              <small>wear your story</small>
            </Link>
            <div className="news" id="blog">
              <h3>Join Our Style Community</h3>
              <p>Be the first to know about new arrivals, exclusive offers &amp; more.</p>
              <form
                id="newsForm"
                onSubmit={(e) => {
                  e.preventDefault();
                  (e.target as HTMLFormElement).reset();
                  showToast('Welcome to the Shiny Shades community ✧');
                }}
              >
                <input type="email" required placeholder="Enter your email address" aria-label="Email address" />
                <button type="submit">Subscribe</button>
              </form>
            </div>
            <div className="social">
              <p>Follow Us</p>
              <div>
                <a href="#" aria-label="Facebook">
                  f
                </a>
                <a href="#" aria-label="Instagram">
                  ig
                </a>
                <a href="#" aria-label="TikTok">
                  tt
                </a>
                <a href="#" aria-label="YouTube">
                  yt
                </a>
              </div>
            </div>
          </div>
          <div className="legal">
            <span>© 2026 Shiny Shades. All rights reserved.</span>
            <nav>
              <Link href="#">Privacy Policy</Link>
              <Link href="#">Shipping Policy</Link>
              <Link href="#">Return Policy</Link>
              <Link href="#contact">Contact</Link>
            </nav>
          </div>
        </div>
      </footer>

      <button className={`totop ${showTotop ? 'show' : ''}`} id="totop" aria-label="Back to top" onClick={scrollToTop}>
        <svg className="i">
          <use href="#i-up" />
        </svg>
      </button>

      {/* QUICK VIEW MODAL */}
      {showModal && modalProduct && (
        <div className="modal open" id="modal" role="dialog" aria-modal="true" aria-label="Quick view">
          <div className="modal-bg" onClick={closeModal} data-close />
          <div className="modal-card">
            <button className="modal-close" onClick={closeModal} data-close aria-label="Close quick view">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            <div className="modal-grid">
              <div className="modal-media" id="modalMedia" style={{ background: grad(modalProduct.g) }} />
              <div className="modal-info">
                <p className="card-kicker">{modalProduct.cat} · {modalProduct.sub}</p>
                <h3 id="modalTitle">{modalProduct.title}</h3>
                <div className="price" id="modalPrice">
                  {money(modalProduct.price)}
                  {modalProduct.was && <s>{money(modalProduct.was)}</s>}
                  {modalProduct.off > 0 && (
                    <span style={{ color: '#5e2233', fontSize: '.8rem', fontWeight: 800 }}>
                      −{modalProduct.off}%
                    </span>
                  )}
                </div>
                <p className="desc" id="modalDesc">
                  A {modalProduct.sub.toLowerCase()} piece from the {modalProduct.cat} department — cut, finished and pressed in our Mohammadpur atelier before it travels to you.
                </p>
                <div className="spec">
                  <div>
                    Fabric &amp; finish — <b id="modalFabric">{modalProduct.fabric}</b>
                  </div>
                  <div>Delivery — <b>2–4 days across Dhaka</b></div>
                  <div>Returns — <b>free within 7 days</b></div>
                </div>
                <div className="modal-actions">
                  <button className="btn-gold" id="modalAdd" onClick={() => addToBag(modalProduct.id)}>
                    <span>Add to bag</span>
                  </button>
                  <button className="btn-ghost micro" id="modalWish" onClick={() => addToWishlist(modalProduct.id)}>
                    Save to wishlist
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {showToast && (
        <div className="toast show" id="toast" role="status">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default TemplateHomePage;

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
  };
};
