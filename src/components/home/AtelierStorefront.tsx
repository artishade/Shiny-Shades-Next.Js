import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import type { Category, Product } from '@/types';
import { SITE } from '@/config/siteConfig';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/uiStore';

type Filter = 'all' | 'new' | 'trending' | 'sale' | 'featured';
type DrapeStyle = CSSProperties & {
  '--drape-color': string;
  '--drape-opacity': number;
};

const filters: { label: string; value: Filter }[] = [
  { label: 'All pieces', value: 'all' },
  { label: 'New in', value: 'new' },
  { label: 'Trending', value: 'trending' },
  { label: 'On sale', value: 'sale' },
  { label: 'Featured', value: 'featured' },
];

const looks = [
  { number: '01', title: 'The Heritage', note: 'Banarasi silk & undivided attention', colors: ['#c9a227', '#8b6b16', '#0e0b09'] },
  { number: '02', title: 'The Maverick', note: 'Leather, studs & zero apologies', colors: ['#2b2118', '#5e2233', '#0e0b09'] },
  { number: '03', title: 'The Flâneuse', note: 'Denim days, cream-skirt reveries', colors: ['#cfd6dd', '#c9a227', '#3a2f24'] },
  { number: '04', title: 'The Showstopper', note: 'Sequins tuned to catch every light', colors: ['#e4c96b', '#b76e79', '#171310'] },
  { number: '05', title: 'The Minimalist', note: 'One silhouette, infinite presence', colors: ['#efe6d4', '#8b6b16', '#171310'] },
  { number: '06', title: 'The Muse', note: 'White lace, unhurried mornings', colors: ['#f7f2e8', '#e9dcc3', '#8b6b16'] },
];

const shades = [
  { name: 'Rose Gold', color: '#b76e79' },
  { name: 'Champagne', color: '#e4c96b' },
  { name: 'Antique Gold', color: '#8b6b16' },
  { name: 'Bordeaux', color: '#5e2233' },
  { name: 'Ivory', color: '#efe6d4' },
  { name: 'Midnight', color: '#1b1510' },
  { name: 'Emerald', color: '#1f5c48' },
  { name: 'Lilac Mist', color: '#a89cc8' },
];

const questions = [
  {
    title: 'How should a room learn your name?',
    whisper: 'Silhouettes speak before you do.',
    answers: ['A sweeping train', 'A cascading whisper', 'A bias-cut murmur', 'A precise line'],
    auras: ['Rose Gold', 'Champagne Ivory', 'Midnight Bordeaux', 'Antique Gold'],
  },
  {
    title: 'What does your Friday evening sound like?',
    whisper: 'The light tells the truth.',
    answers: ['Candlelight and low jazz', 'A rooftop and a playlist', 'Silk sheets and a novel', 'A launch and a list'],
    auras: ['Champagne Ivory', 'Rose Gold', 'Midnight Bordeaux', 'Antique Gold'],
  },
  {
    title: 'Choose the detail you never skip.',
    whisper: 'God is in the finishing.',
    answers: ['The zari at the hem', 'The sequin that catches', 'The shoulder line', 'The weight of the silk'],
    auras: ['Antique Gold', 'Rose Gold', 'Midnight Bordeaux', 'Champagne Ivory'],
  },
  {
    title: 'Your shine, in one word?',
    whisper: 'Say it without flinching.',
    answers: ['Commanding', 'Luminous', 'Enigmatic', 'Timeless'],
    auras: ['Antique Gold', 'Rose Gold', 'Midnight Bordeaux', 'Champagne Ivory'],
  },
];

const money = (amount: number) =>
  `${SITE.currency.symbol}${amount.toLocaleString('en-BD')}`;

const productGradient = (index: number) => {
  const palettes = [
    ['#c9a227', '#8b6b16', '#1b1510'],
    ['#e4c96b', '#8b6b16', '#3a2f24'],
    ['#b76e79', '#5e2233', '#0e0b09'],
    ['#e9c2c4', '#b76e79', '#5e2233'],
    ['#f0e2b6', '#c9a227', '#5e2233'],
    ['#efe3cd', '#c9a227', '#8b6b16'],
    ['#cfd6dd', '#8b6b16', '#171310'],
    ['#c98fa0', '#5e2233', '#0e0b09'],
  ][index % 8];
  return `linear-gradient(145deg, ${palettes[0]}, ${palettes[1]} 52%, ${palettes[2]})`;
};

function ProductTile({ product, index }: { product: Product; index: number }) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const toggleWishlistItem = useWishlistStore((state) => state.toggleWishlistItem);
  const isWishlisted = useWishlistStore((state) => state.isWishlisted(product.id));
  const comparePrice = product.comparePrice && product.comparePrice > product.price
    ? product.comparePrice
    : undefined;

  const addToBag = () => {
    addItem(product, product.sizes[0] || 'One Size', product.colors[0]?.name || 'Default');
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <article className="atelier-product">
      <div className="atelier-product-media" style={{ background: productGradient(index) }}>
        {product.images[0] ? (
          <Image src={product.images[0]} alt={product.name} width={720} height={960} loading="lazy" unoptimized />
        ) : (
          <div className="atelier-product-art" aria-hidden="true" />
        )}
        <div className="atelier-flags">
          {comparePrice && <span className="atelier-flag atelier-flag-sale">Sale</span>}
          {product.isNewArrival && <span className="atelier-flag atelier-flag-new">New</span>}
        </div>
        <button
          type="button"
          className={`atelier-wish ${isWishlisted ? 'is-saved' : ''}`}
          onClick={() => toggleWishlistItem(product.id)}
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
        >
          <Heart size={17} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>
        <Link className="atelier-quick" href={`/product/${product.slug}`}>
          Meet the piece <ArrowRight size={14} />
        </Link>
      </div>
      <div className="atelier-product-copy">
        <p className="atelier-kicker">{product.category || 'The collection'}</p>
        <Link href={`/product/${product.slug}`} className="atelier-product-name">{product.name}</Link>
        <div className="atelier-product-meta">
          <span className="atelier-price">
            {money(product.price)}
            {comparePrice && <s>{money(comparePrice)}</s>}
          </span>
          {product.rating > 0 && (
            <span className="atelier-rating"><Star size={13} fill="currentColor" /> {product.rating.toFixed(1)}</span>
          )}
        </div>
        <button type="button" className="atelier-add" onClick={addToBag}>
          {added ? 'Added to your bag' : 'Add to bag'}
        </button>
      </div>
    </article>
  );
}

export function AtelierStorefront({
  products,
  categories,
  children,
}: {
  products: Product[];
  categories: Category[];
  children?: ReactNode;
}) {
  const [activeFilter, setActiveFilter] = useState<Filter>('all');
  const [activeCategory, setActiveCategory] = useState('Everything');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('curated');
  const [visible, setVisible] = useState(12);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shadeIndex, setShadeIndex] = useState(0);
  const [intensity, setIntensity] = useState(72);
  const [oracleStep, setOracleStep] = useState(0);
  const [auras, setAuras] = useState<string[]>([]);
  const [toast, setToast] = useState('');
  const cartCount = useCartStore((state) => state.items.reduce((count, item) => count + item.quantity, 0));
  const wishlistCount = useWishlistStore((state) => state.wishlistIds.length);

  useEffect(() => {
    const progress = document.querySelector<HTMLElement>('.atelier-progress');
    const updateProgress = () => {
      if (!progress) return;
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
      progress.style.transform = `scaleX(${percentage})`;
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  const categoriesWithProducts = useMemo(() => {
    const names = [...new Set(products.map((product) => product.category).filter(Boolean))];
    return names.map((name) => ({
      name,
      count: products.filter((product) => product.category === name).length,
    }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = products.filter((product) => {
      if (activeCategory !== 'Everything' && product.category !== activeCategory) return false;
      if (activeFilter === 'new' && !product.isNewArrival) return false;
      if (activeFilter === 'trending' && !product.isTrending) return false;
      if (activeFilter === 'sale' && !product.isOnSale && !(product.comparePrice && product.comparePrice > product.price)) return false;
      if (activeFilter === 'featured' && !product.isFeatured) return false;
      if (term && !`${product.name} ${product.category} ${product.description} ${product.tags.join(' ')}`.toLowerCase().includes(term)) return false;
      return true;
    });
    if (sort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    if (sort === 'rating') filtered.sort((a, b) => b.rating - a.rating);
    return filtered;
  }, [products, activeCategory, activeFilter, query, sort]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const answerOracle = (answerIndex: number) => {
    const nextAuras = [...auras, questions[oracleStep].auras[answerIndex]];
    setAuras(nextAuras);
    if (oracleStep + 1 === questions.length) {
      const counts = nextAuras.reduce<Record<string, number>>((result, aura) => {
        result[aura] = (result[aura] || 0) + 1;
        return result;
      }, {});
      const winner = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
      showToast(`Your aura is ${winner} ✦`);
    }
    setOracleStep(oracleStep + 1);
  };

  const resetOracle = () => {
    setOracleStep(0);
    setAuras([]);
  };

  const auraResult = auras.reduce<Record<string, number>>((result, aura) => {
    result[aura] = (result[aura] || 0) + 1;
    return result;
  }, {});
  const winningAura = Object.keys(auraResult).sort((a, b) => auraResult[b] - auraResult[a])[0];
  const drapeStyle: DrapeStyle = {
    '--drape-color': shades[shadeIndex].color,
    '--drape-opacity': intensity / 100,
  };

  return (
    <>
      <div className="atelier-root">
        <div className="atelier-progress" aria-hidden="true" />
        <header className="atelier-header">
          <p className="atelier-announcement">Free delivery across Dhaka on orders over ৳5,000</p>
          <nav className="atelier-nav" aria-label="Primary navigation">
            <Link href="/" className="atelier-brand">
              <strong>Shiny <em>Shades</em></strong>
              <span>The atelier · Dhaka</span>
            </Link>
            <div className="atelier-nav-links">
              <a href="#collection">The Collection</a>
              <a href="#oracle">Style Oracle</a>
              <a href="#drape">Drape Studio</a>
              <a href="#lookbook">Lookbook</a>
              <a href="#atelier-story">Our Story</a>
            </div>
            <div className="atelier-nav-actions">
              <button className="atelier-icon" type="button" aria-label="Search collection" onClick={() => document.getElementById('atelier-search')?.focus()}>
                <Search size={18} />
              </button>
              <Link className="atelier-icon" href="/wishlist" aria-label={`Wishlist, ${wishlistCount} items`}>
                <Heart size={18} />{wishlistCount > 0 && <span className="atelier-badge">{wishlistCount}</span>}
              </Link>
              <Link className="atelier-icon" href="/cart" aria-label={`Shopping bag, ${cartCount} items`}>
                <ShoppingBag size={18} />{cartCount > 0 && <span className="atelier-badge">{cartCount}</span>}
              </Link>
              <button className="atelier-icon atelier-menu-toggle" type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X size={19} /> : <Menu size={19} />}
              </button>
            </div>
          </nav>
          {menuOpen && (
            <div className="atelier-mobile-menu">
              {[
                ['The Collection', '#collection'],
                ['Style Oracle', '#oracle'],
                ['Drape Studio', '#drape'],
                ['Lookbook', '#lookbook'],
                ['Our Story', '#atelier-story'],
              ].map(([label, href]) => (
                <a href={href} key={href} onClick={() => setMenuOpen(false)}>{label}</a>
              ))}
            </div>
          )}
        </header>

        <section className="atelier-hero" aria-label="Shiny Shades — the atelier">
          <div className="atelier-hero-glow atelier-glow-one" />
          <div className="atelier-hero-glow atelier-glow-two" />
          <div className="atelier-wrap atelier-hero-grid">
            <div className="atelier-hero-copy">
              <p className="atelier-eyebrow">Est. Dhaka ✦ premium women&apos;s fashion</p>
              <h1>Dress like the<br /><em>main character</em></h1>
              <p className="atelier-hero-lead">
                A champagne-noir atelier where heritage sarees hang beside sequin dreams — curated for the woman who enters a room and improves it. Play with the Drape Studio, consult the Oracle, then claim your shine.
              </p>
              <div className="atelier-hero-ctas">
                <a className="atelier-button-gold" href="#collection">Enter the Collection <ArrowRight size={15} /></a>
                <a className="atelier-button-ghost" href="#oracle"><Sparkles size={15} /> Meet the Style Oracle</a>
              </div>
              <dl className="atelier-stats">
                <div><dt>{products.length}+</dt><dd>curated pieces</dd></div>
                <div><dt>4.9★</dt><dd>inner-circle rating</dd></div>
                <div><dt>2–4d</dt><dd>Dhaka delivery</dd></div>
              </dl>
            </div>
            <div className="atelier-hero-art" aria-hidden="true">
              <div className="atelier-fabric-panels">
                <div className="atelier-fabric-panel fabric-one" />
                <div className="atelier-fabric-panel fabric-two" />
                <div className="atelier-fabric-panel fabric-three" />
              </div>
              <div className="atelier-seal"><span>SHINY SHADES ✦ THE ATELIER ✦ EST 2023 ✦</span><b>S</b></div>
              <div className="atelier-ritual"><span>Friday ritual</span><p>New drops, every week</p></div>
            </div>
          </div>
          <a href="#departments" className="atelier-scroll-cue"><span>Scroll</span><ArrowDown size={15} /></a>
        </section>

        <div className="atelier-marquee" aria-hidden="true">
          <div className="atelier-marquee-track">
            {[0, 1].map((copy) => (
              <span className="atelier-marquee-group" key={copy}>
                {['Draped in intention', 'Cut in Dhaka', 'Made to be remembered', 'A little extra, always', 'Wear your own legend'].map((line) => (
                  <span key={line}>{line}<i>✦</i></span>
                ))}
              </span>
            ))}
          </div>
        </div>

        <section className="atelier-section atelier-dark-section" id="departments">
          <div className="atelier-wrap">
            <div className="atelier-section-heading">
              <div><p className="atelier-eyebrow">The departments</p><h2>Wander the <em>departments</em></h2><span className="atelier-rule" /></div>
              <div className="atelier-rail-controls">
                <button type="button" aria-label="Scroll departments left" onClick={() => document.getElementById('atelier-departments')?.scrollBy({ left: -340, behavior: 'smooth' })}><ChevronLeft size={20} /></button>
                <button type="button" aria-label="Scroll departments right" onClick={() => document.getElementById('atelier-departments')?.scrollBy({ left: 340, behavior: 'smooth' })}><ChevronRight size={20} /></button>
              </div>
            </div>
          </div>
          <div className="atelier-department-rail" id="atelier-departments">
            {categoriesWithProducts.map((category, index) => (
              <button
                className="atelier-department"
                key={category.name}
                type="button"
                style={{ background: productGradient(index) }}
                onClick={() => {
                  setActiveCategory(category.name);
                  document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span className="atelier-department-count">{category.count} {category.count === 1 ? 'piece' : 'pieces'}</span>
                <span><strong>{category.name}</strong><small>{categories.find((item) => item.name === category.name)?.description || 'Made for your moment'}</small></span>
              </button>
            ))}
            <button className="atelier-department-all" type="button" onClick={() => { setActiveCategory('Everything'); document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' }); }}>
              <strong>all</strong><span>View everything</span>
            </button>
          </div>
        </section>

        <section className="atelier-section atelier-collection" id="collection">
          <div className="atelier-wrap">
            <div className="atelier-centered-heading">
              <p className="atelier-eyebrow">The collection</p>
              <h2>Pieces with <em>a pulse</em></h2>
              <span className="atelier-rule" />
              <p>Every rack is a rumor of shine — hover to peek, tap to meet the piece up close.</p>
            </div>
            <div className="atelier-toolbar">
              <label className="atelier-search">
                <Search size={17} />
                <input id="atelier-search" value={query} onChange={(event) => { setQuery(event.target.value); setVisible(12); }} placeholder="Try “satin”, “saree”, “sequin”…" aria-label="Search the collection" />
              </label>
              <div className="atelier-filter-chips" role="tablist" aria-label="Quick filters">
                {filters.map((filter) => (
                  <button type="button" role="tab" aria-selected={activeFilter === filter.value} className={activeFilter === filter.value ? 'is-active' : ''} key={filter.value} onClick={() => { setActiveFilter(filter.value); setVisible(12); }}>
                    {filter.label}
                  </button>
                ))}
              </div>
              <label className="atelier-sort"><span>Sort</span>
                <select aria-label="Sort products" value={sort} onChange={(event) => setSort(event.target.value)}>
                  <option value="curated">Curator&apos;s order</option>
                  <option value="price-asc">Price · low to high</option>
                  <option value="price-desc">Price · high to low</option>
                  <option value="rating">Most adored</option>
                </select>
              </label>
            </div>
            <div className="atelier-category-chips">
              {['Everything', ...categoriesWithProducts.map((category) => category.name)].map((name) => (
                <button type="button" key={name} className={activeCategory === name ? 'is-active' : ''} onClick={() => { setActiveCategory(name); setVisible(12); }}>{name}</button>
              ))}
            </div>
            {filteredProducts.length > 0 ? (
              <div className="atelier-product-grid">
                {filteredProducts.slice(0, visible).map((product, index) => <ProductTile key={product.id} product={product} index={index} />)}
              </div>
            ) : (
              <div className="atelier-empty"><p>Nothing on this rack yet.</p><span>Try another word, or wander a different department.</span></div>
            )}
            {filteredProducts.length > visible && (
              <div className="atelier-show-more"><button type="button" onClick={() => setVisible((count) => count + 8)}>Reveal more pieces <ArrowDown size={14} /></button></div>
            )}
          </div>
        </section>

        <section className="atelier-section atelier-oracle" id="oracle">
          <div className="atelier-oracle-glow" />
          <div className="atelier-wrap atelier-oracle-content">
            <div className="atelier-centered-heading">
              <p className="atelier-eyebrow">The Style Oracle</p>
              <h2>Four questions. <em>One aura.</em></h2>
              <span className="atelier-rule" />
              <p>Answer with your gut, not your closet. The Oracle reads your aura and finds your next signature.</p>
            </div>
            <div className="atelier-oracle-progress">
              <div><span>{oracleStep < 4 ? `Question ${oracleStep + 1}` : 'Your aura'}</span><span>{oracleStep < 4 ? '4' : '✦'}</span></div>
              <i><b style={{ width: `${Math.min(((oracleStep + 1) / 4) * 100, 100)}%` }} /></i>
            </div>
            {oracleStep < 4 ? (
              <div className="atelier-question">
                <h3>{questions[oracleStep].title}</h3>
                <p>{questions[oracleStep].whisper}</p>
                <div className="atelier-answer-grid">
                  {questions[oracleStep].answers.map((answer, index) => (
                    <button type="button" key={answer} onClick={() => answerOracle(index)}>
                      <Sparkles size={22} /><strong>{answer}</strong><span>{['A little theatre, all yours', 'Soft light and a little wonder', 'A feeling that stays with you', 'A line that needs no introduction'][index]}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="atelier-oracle-result">
                <p className="atelier-eyebrow">The Oracle has read you</p>
                <h3>{winningAura}</h3>
                <p>You are a {winningAura} woman — equal parts heritage and heat. Your style, your rules.</p>
                <button type="button" className="atelier-button-ghost" onClick={resetOracle}>Retake the reading</button>
                <a href="#drape">Now drape your colours in the studio ↓</a>
              </div>
            )}
          </div>
        </section>

        <section className="atelier-section atelier-drape" id="drape">
          <div className="atelier-wrap atelier-drape-grid">
            <div className="atelier-drape-copy">
              <p className="atelier-eyebrow">The Drape Studio</p>
              <h2>Your world, <em>in one drape</em></h2>
              <span className="atelier-rule" />
              <p>One ivory gown. Infinite temperaments. Pick a shade and watch it re-dye before your eyes — then pin the ones that feel like you.</p>
              <div className="atelier-intensity-label"><span>Dye intensity</span><b>{intensity}%</b></div>
              <input type="range" min="10" max="100" value={intensity} onChange={(event) => setIntensity(Number(event.target.value))} aria-label="Dye intensity" />
              <div className="atelier-swatches" aria-label="Choose a drape colour">
                {shades.map((shade, index) => (
                  <button type="button" key={shade.name} title={shade.name} aria-label={shade.name} aria-pressed={shadeIndex === index} className={shadeIndex === index ? 'is-active' : ''} style={{ backgroundColor: shade.color }} onClick={() => setShadeIndex(index)} />
                ))}
              </div>
              <p className="atelier-shade-caption">Now draped in <strong>{shades[shadeIndex].name}</strong></p>
            </div>
            <div className="atelier-drape-stage" style={drapeStyle}>
              <div className="atelier-drape-halo" />
              <div className="atelier-drape-gown"><span /><i /><b /></div>
              <div className="atelier-stage-caption">Your shade, your story <Sparkles size={15} /></div>
            </div>
          </div>
        </section>

        <section className="atelier-section atelier-dark-section atelier-lookbook" id="lookbook">
          <div className="atelier-wrap">
            <div className="atelier-section-heading">
              <div><p className="atelier-eyebrow">The lookbook</p><h2>Six ways to <em>enter a room</em></h2><span className="atelier-rule" /></div>
              <p>Not trends. Temperaments. Find the one that feels like your name.</p>
            </div>
            <div className="atelier-lookbook-grid">
              {looks.map((look) => (
                <article className="atelier-look" key={look.number}>
                  <div className="atelier-look-art" style={{ background: `linear-gradient(150deg, ${look.colors[0]}, ${look.colors[1]} 55%, ${look.colors[2]})` }}>
                    <span>{look.number}</span><i>{look.title.replace('The ', '')}</i>
                  </div>
                  <p>{look.note}</p>
                  <a href="#collection">Explore the mood <ArrowRight size={14} /></a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="atelier-section atelier-story" id="atelier-story">
          <div className="atelier-wrap atelier-story-grid">
            <div className="atelier-story-art"><span>Made slowly.<br /><em>Worn forever.</em></span><i>✦</i></div>
            <div className="atelier-story-copy">
              <p className="atelier-eyebrow">Our atelier · Dhaka</p>
              <h2>Clothes with a <em>point of view.</em></h2>
              <span className="atelier-rule" />
              <p>Shiny Shades is for the woman who knows that getting dressed can be a kind of authorship. We bring heritage craft and modern silhouettes into the same conversation — with care in every seam and a little theatre in every detail.</p>
              <Link href="/about" className="atelier-button-dark">A little more about us <ArrowRight size={15} /></Link>
            </div>
          </div>
        </section>

        <section className="atelier-newsletter">
          <div className="atelier-wrap atelier-newsletter-inner">
            <div><p className="atelier-eyebrow">The Inner Circle</p><h2>A little shine in your inbox.</h2><p>New drops, atelier notes, and first looks — only when there is something worth saying.</p></div>
            <Link className="atelier-button-gold" href="/contact">Join the conversation <ArrowRight size={15} /></Link>
          </div>
        </section>

        {children}

        <footer className="atelier-footer">
          <div className="atelier-wrap">
            <div className="atelier-footer-top">
              <div><Link href="/" className="atelier-brand"><strong>Shiny <em>Shades</em></strong><span>The atelier · Dhaka</span></Link><p>Dress like the main character.<br />Made with care in Dhaka, Bangladesh.</p></div>
              <div className="atelier-footer-links"><div><strong>Explore</strong><a href="#collection">The Collection</a><a href="#oracle">Style Oracle</a><a href="#lookbook">Lookbook</a></div><div><strong>Atelier</strong><Link href="/about">Our Story</Link><Link href="/contact">Contact</Link><Link href="/return-policy">Returns &amp; exchanges</Link></div><div><strong>Your account</strong><Link href="/cart">Shopping bag</Link><Link href="/wishlist">Wishlist</Link><Link href="/track-order">Track an order</Link></div></div>
            </div>
            <div className="atelier-footer-bottom"><span>© {new Date().getFullYear()} Shiny Shades. Made with intention.</span><span>Dhaka, Bangladesh · ৳ BDT</span><div><Link href="/privacy-policy">Privacy</Link><Link href="/terms">Terms</Link></div></div>
          </div>
        </footer>
        {toast && <div className="atelier-toast" role="status" aria-live="polite">{toast}</div>}
      </div>
    </>
  );
}
