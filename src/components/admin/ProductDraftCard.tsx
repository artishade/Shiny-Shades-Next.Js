/**
 * The editable product draft the admin AI chat renders in the transcript.
 *
 * Enhanced with:
 * 1. Live Dynamic Recently-Used Sizes (no hardcoded presets; saves & learns user size combos like M-XL, XXL)
 * 2. Custom Color Selection (interactive hex color picker + custom name + boutique palette)
 * 3. Guaranteed Rich SEO Tags Generation (auto-generates high-converting keywords & meta title)
 * 4. Web3 Cyber-Luxe Glassmorphic Aesthetic
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from '@/lib/routerCompat';
import { Button, Input, Select } from '@/components/ui';
import { Check, Loader2, Plus, Sparkles, Wand2, X, Palette, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { applyWatermark, loadWmSettings, resolveCustomLogoWm } from '@/lib/watermark';
import { SIMPLE_COLORS } from '@/lib/simpleColors';
import { useCategoryStore, useContentStore, useProductStore } from '@/store';
import {
    getRecentIndividualSizes,
    getRecentSizeGroups,
    recordUsedSizes,
    seedSizesFromProducts,
    removeRecentGroup,
    type SizeGroup,
} from '@/lib/recentSizes';
import { generateProductSeo } from '@/lib/seoGenerator';
import type { Product } from '@/types';

export interface ProductDraftData {
    name: string;
    seoTitle: string;
    shortDescription: string;
    description: string;
    tags: string[];
    colors: string[];
    categoryName: string;
    categorySlug: string;
    suggestedCategory: string;
}

export interface ProductDraftMeta {
    model?: string;
    credentialLabel?: string;
    droppedColors?: string[];
    imagesAnalyzed?: number;
    switchedFrom?: string[];
}

const BOUTIQUE_PALETTE = [
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Red', hex: '#E53E3E' },
    { name: 'Maroon', hex: '#800000' },
    { name: 'Navy', hex: '#001F5B' },
    { name: 'Pink', hex: '#FFC0CB' },
    { name: 'Rose Gold', hex: '#B76E79' },
    { name: 'Emerald', hex: '#008055' },
    { name: 'Champagne', hex: '#F7E7CE' },
    { name: 'Lavender', hex: '#E6E6FA' },
    { name: 'Beige', hex: '#F5F5DC' },
    { name: 'Royal Blue', hex: '#4169E1' },
    { name: 'Peach', hex: '#FFDAB9' },
    { name: 'Olive', hex: '#808000' },
];

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #F4C2C2, #E6E6FA)';
const FIELD_CLASS =
    'w-full px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/70 text-sm text-charcoal ' +
    'placeholder:text-[#6B5B55]/50 backdrop-blur-md transition-all duration-200 focus:outline-none ' +
    'focus:ring-2 focus:ring-rose-gold/40 focus:border-rose-gold resize-none shadow-sm';

const slugify = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const makeSku = (name: string) => {
    if (!name.trim()) return '';
    const prefix = name.trim().toUpperCase().split(/\s+/).slice(0, 2).map((w) => w.slice(0, 2)).join('');
    return `${prefix}${Math.floor(100 + Math.random() * 900)}`;
};

const swatch = (color: string) => {
    if (color.startsWith('#')) return color;
    return SIMPLE_COLORS[color] || '#D9CFCB';
};

interface DraftForm {
    name: string;
    seoTitle: string;
    price: string;
    comparePrice: string;
    stock: string;
    sku: string;
    categoryName: string;
    tags: string[];
    colors: string[];
    sizes: string[];
    shortDescription: string;
    description: string;
    isFeatured: boolean;
    isTrending: boolean;
    isNewArrival: boolean;
    isOnSale: boolean;
}

interface ProductDraftCardProps {
    draft: ProductDraftData;
    meta?: ProductDraftMeta;
    files: File[];
    priceHint?: string;
}

type PublishStatus = 'idle' | 'publishing' | 'published' | 'failed';

export const ProductDraftCard: React.FC<ProductDraftCardProps> = ({ draft, meta, files, priceHint }) => {
    const { categories, addCategory } = useCategoryStore();
    const { addProduct, products } = useProductStore();

    // Auto-fill tags if draft returned minimal tags
    const initialTags = useMemo(() => {
        if (draft.tags && draft.tags.length >= 4) return draft.tags;
        const generated = generateProductSeo({
            name: draft.name,
            categoryName: draft.categoryName,
            colors: draft.colors,
            price: priceHint,
        });
        return generated.tags;
    }, [draft.tags, draft.name, draft.categoryName, draft.colors, priceHint]);

    const initialSeoTitle = useMemo(() => {
        if (draft.seoTitle && draft.seoTitle.trim()) return draft.seoTitle;
        const generated = generateProductSeo({
            name: draft.name,
            categoryName: draft.categoryName,
            colors: draft.colors,
            price: priceHint,
        });
        return generated.seoTitle;
    }, [draft.seoTitle, draft.name, draft.categoryName, draft.colors, priceHint]);

    const [form, setForm] = useState<DraftForm>(() => ({
        name: draft.name,
        seoTitle: initialSeoTitle,
        price: priceHint || '',
        comparePrice: '',
        stock: '150',
        sku: makeSku(draft.name),
        categoryName: draft.categoryName,
        tags: initialTags,
        colors: draft.colors || [],
        sizes: [],
        shortDescription: draft.shortDescription,
        description: draft.description,
        isFeatured: false,
        isTrending: false,
        isNewArrival: true,
        isOnSale: false,
    }));

    // Dynamic sizes management
    const [recentGroups, setRecentGroups] = useState<SizeGroup[]>([]);
    const [recentIndividual, setRecentIndividual] = useState<string[]>([]);
    const [customSizeInput, setCustomSizeInput] = useState('');

    // Custom color tool state
    const [customColorName, setCustomColorName] = useState('');
    const [customColorHex, setCustomColorHex] = useState('#B76E79');
    const [showColorPicker, setShowColorPicker] = useState(false);

    const [status, setStatus] = useState<PublishStatus>('idle');
    const [error, setError] = useState('');
    const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
    const [publishedSlug, setPublishedSlug] = useState('');
    const [creatingCategory, setCreatingCategory] = useState(false);
    const [seoNotice, setSeoNotice] = useState(false);

    // Sync recently used sizes from localStorage and store catalog
    const refreshRecentSizes = () => {
        setRecentGroups(getRecentSizeGroups());
        setRecentIndividual(getRecentIndividualSizes());
    };

    useEffect(() => {
        refreshRecentSizes();
        if (products && products.length > 0) {
            seedSizesFromProducts(products);
            refreshRecentSizes();
        }

        const handleUpdate = () => refreshRecentSizes();
        window.addEventListener('shiny_recent_sizes_changed', handleUpdate);
        return () => window.removeEventListener('shiny_recent_sizes_changed', handleUpdate);
    }, [products]);

    const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
    useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

    const categoryOptions = useMemo(
        () => [
            { value: '', label: 'Choose a category…' },
            ...categories.map((c) => ({ value: c.name, label: c.name })),
        ],
        [categories],
    );

    const frozen = status === 'published' || status === 'publishing';
    const set = <K extends keyof DraftForm>(key: K, value: DraftForm[K]) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const addSizes = (sizes: string[]) => {
        const cleaned = sizes.map((s) => s.trim()).filter(Boolean);
        if (!cleaned.length) return;
        setForm((prev) => ({ ...prev, sizes: [...new Set([...prev.sizes, ...cleaned])] }));
        recordUsedSizes(cleaned);
    };

    const handleAddCustomSize = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!customSizeInput.trim()) return;
        const splitted = customSizeInput.split(',').map((s) => s.trim()).filter(Boolean);
        if (splitted.length) {
            addSizes(splitted);
            setCustomSizeInput('');
        }
    };

    const handleAddColor = (nameOrHex: string) => {
        const trimmed = nameOrHex.trim();
        if (!trimmed) return;
        if (!form.colors.includes(trimmed)) {
            setForm((prev) => ({ ...prev, colors: [...prev.colors, trimmed] }));
        }
        setCustomColorName('');
    };

    const triggerAutoSeo = () => {
        const seo = generateProductSeo({
            name: form.name,
            categoryName: form.categoryName,
            colors: form.colors,
            price: form.price,
            shortDescription: form.shortDescription,
            description: form.description,
        });
        setForm((prev) => ({
            ...prev,
            seoTitle: seo.seoTitle,
            tags: seo.tags,
        }));
        setSeoNotice(true);
        setTimeout(() => setSeoNotice(false), 3000);
    };

    const createSuggestedCategory = async () => {
        const name = draft.suggestedCategory.trim();
        if (!name || creatingCategory) return;
        setCreatingCategory(true);
        try {
            await addCategory({
                id: crypto.randomUUID(),
                name,
                slug: slugify(name),
                description: '',
                image: '',
                productCount: 0,
                gradient: DEFAULT_GRADIENT,
                parentId: null,
            });
            set('categoryName', name);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not create that category.');
        } finally {
            setCreatingCategory(false);
        }
    };

    const uploadImages = async (): Promise<{ urls: string[]; failed: number }> => {
        const wm = loadWmSettings();
        const site = useContentStore.getState().content.siteSettings;
        const customLogoWm = await resolveCustomLogoWm(
            undefined,
            site.watermarkLogoUrl || site.logoUrl,
        );
        const urls: string[] = [];
        let failed = 0;

        for (let i = 0; i < files.length; i += 1) {
            setProgress({ done: i, total: files.length });

            let file = files[i];
            if (wm.wmEnabled) {
                try {
                    file = await applyWatermark(files[i], {
                        sizeMultiplier: wm.wmSize,
                        textWm: {
                            enabled: wm.textWmEnabled,
                            text: wm.textWmText,
                            opacity: wm.textWmOpacity,
                            size: wm.textWmSize,
                            angle: wm.textWmAngle,
                            color: wm.textWmColor,
                            spacingX: wm.textWmSpacingX,
                            spacingY: wm.textWmSpacingY,
                        },
                        logoWm: { text: wm.agLogoText, colorLeft: wm.agLogoColorLeft, colorRight: wm.agLogoColorRight },
                        customLogoWm,
                        pos: wm.wmPos,
                    });
                } catch {
                    file = files[i];
                }
            }

            let uploaded = false;
            for (let attempt = 1; attempt <= 3 && !uploaded; attempt += 1) {
                try {
                    const url = await uploadToCloudinary(file);
                    if (url) {
                        urls.push(url);
                        uploaded = true;
                        break;
                    }
                } catch (err) {
                    console.warn(`Upload attempt ${attempt}/3 failed for "${files[i].name}":`, err);
                }
                if (attempt < 3) await new Promise((r) => setTimeout(r, 1500));
            }
            if (!uploaded) failed += 1;

            setProgress({ done: i + 1, total: files.length });
        }

        return { urls, failed };
    };

    const publish = async () => {
        if (status === 'publishing' || status === 'published') return;

        const price = Number(form.price);
        if (!form.name.trim()) return setError('Give the product a name.');
        if (!Number.isFinite(price) || price <= 0) return setError('Set a price above 0.');
        if (!form.categoryName) return setError('Pick a category.');
        if (!files.length) return setError('This draft has no images left to upload.');

        setStatus('publishing');
        setError('');

        // Ensure SEO tags & title are guaranteed
        let finalTags = form.tags.filter(Boolean);
        let finalSeoTitle = form.seoTitle.trim();
        if (!finalTags.length || !finalSeoTitle) {
            const autoSeo = generateProductSeo({
                name: form.name,
                categoryName: form.categoryName,
                colors: form.colors,
                price: form.price,
            });
            if (!finalTags.length) finalTags = autoSeo.tags;
            if (!finalSeoTitle) finalSeoTitle = autoSeo.seoTitle;
        }

        // Record any used sizes into recent suggestions
        if (form.sizes.length > 0) {
            recordUsedSizes(form.sizes);
        }

        try {
            const { urls, failed } = await uploadImages();
            if (!urls.length) throw new Error('Every image failed to upload. Nothing was published.');

            const cat = categories.find((c) => c.name === form.categoryName);
            const slug = `${slugify(form.name)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
            const now = new Date().toISOString();
            const comparePrice = Number(form.comparePrice);

            const payload = {
                name: form.name.trim(),
                slug,
                description: form.description.trim() || null,
                short_description: form.shortDescription.trim() || null,
                images: urls,
                video_url: null,
                price,
                compare_price: Number.isFinite(comparePrice) && comparePrice > 0 ? comparePrice : null,
                category_name: form.categoryName,
                category_slug: cat?.slug || draft.categorySlug || '',
                sizes: form.sizes,
                colors: form.colors,
                stock: Number(form.stock) || 0,
                sku: form.sku.trim() || null,
                tags: finalTags,
                seo_title: finalSeoTitle || null,
                seo_keywords: finalTags.join(', ') || null,
                custom_text: '',
                is_featured: form.isFeatured,
                is_trending: form.isTrending,
                is_new_arrival: form.isNewArrival,
                is_on_sale: form.isOnSale,
                updated_at: now,
            };

            const { data, error: insertError } = await supabase
                .from('products')
                .insert([{ ...payload, is_active: true, rating: 0, review_count: 0, created_at: now }])
                .select();
            if (insertError) throw insertError;

            addProduct({
                id: data[0].id,
                name: payload.name,
                slug,
                description: form.description,
                shortDescription: form.shortDescription,
                price,
                comparePrice: payload.compare_price ?? undefined,
                images: urls,
                category: form.categoryName,
                categorySlug: payload.category_slug,
                sizes: form.sizes,
                colors: form.colors,
                stock: Number(form.stock) || 0,
                sku: form.sku,
                tags: finalTags,
                seoTitle: finalSeoTitle,
                seoKeywords: finalTags.join(', '),
                customText: '',
                isFeatured: form.isFeatured,
                isTrending: form.isTrending,
                isNewArrival: form.isNewArrival,
                isOnSale: form.isOnSale,
                rating: 0,
                reviewCount: 0,
                createdAt: now,
                updatedAt: now,
            } as unknown as Product);

            setPublishedSlug(slug);
            setStatus('published');
            setError(
                failed > 0
                    ? `Published, but ${failed} image(s) failed to upload. Add them from the products page.`
                    : '',
            );
        } catch (err) {
            console.error('[ProductDraftCard] publish failed:', err);
            setStatus('failed');
            setError(err instanceof Error ? err.message : 'Publishing failed. Nothing was saved.');
        } finally {
            setProgress(null);
        }
    };

    return (
        <div className="relative overflow-hidden rounded-3xl border border-rose-gold/30 bg-white/85 p-5 shadow-xl backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:border-rose-gold/50 space-y-5">
            {/* Top Web3 Ambient Glow Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-gold via-deep-rose to-purple-500" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-gold/15 text-rose-gold shadow-sm">
                            <Sparkles size={14} />
                        </span>
                        <p className="text-sm font-semibold tracking-wide text-charcoal font-sans">
                            AI Catalog Draft
                        </p>
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-700">
                            ● AUTO-SEO READY
                        </span>
                    </div>
                    <p className="text-[11px] text-[#6B5B55]/80 mt-1">
                        {meta?.model || 'Gemini'}
                        {meta?.credentialLabel && ` · ${meta.credentialLabel}`}
                        {!!meta?.imagesAnalyzed && ` · ${meta.imagesAnalyzed} photo(s) analyzed`}
                    </p>
                </div>
                {status === 'published' && (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 shrink-0">
                        <Check size={14} /> Published Live
                    </span>
                )}
            </div>

            {/* Image Previews */}
            {previews.length > 0 && (
                <div className="flex flex-wrap gap-2.5 p-2 rounded-2xl bg-white/50 border border-blush/20">
                    {previews.map((url, index) => (
                        <div key={url} className="relative group overflow-hidden rounded-xl border border-blush/40 shadow-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={url}
                                alt={`Draft photo ${index + 1}`}
                                className="w-16 h-20 object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-white font-mono">
                                #{index + 1}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Main Form Fields */}
            <div className="space-y-4">
                <Input
                    label="Product Name"
                    value={form.name}
                    disabled={frozen}
                    onChange={(e) => set('name', e.target.value)}
                    className="py-2.5 text-sm font-medium"
                />

                {/* SEO Meta Title with Auto-Gen Action */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-[#6B5B55] flex items-center gap-1.5">
                            SEO Meta Title
                            <span className="text-[10px] text-[#6B5B55]/60">({form.seoTitle.length}/70 chars)</span>
                        </label>
                        <button
                            type="button"
                            onClick={triggerAutoSeo}
                            disabled={frozen}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-gold hover:text-deep-rose transition-colors"
                        >
                            <Wand2 size={12} /> Auto-Generate SEO
                        </button>
                    </div>
                    <input
                        value={form.seoTitle}
                        disabled={frozen}
                        onChange={(e) => set('seoTitle', e.target.value)}
                        placeholder="e.g. Exclusive Embroidered Silk Saree | Shiny Shades BD"
                        className={FIELD_CLASS}
                    />
                </div>

                {/* Price, Stock, SKU */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Input
                        label="Price (BDT)"
                        type="number"
                        min={0}
                        value={form.price}
                        disabled={frozen}
                        onChange={(e) => set('price', e.target.value)}
                        className="py-2 text-sm"
                    />
                    <Input
                        label="Compare Price"
                        type="number"
                        min={0}
                        value={form.comparePrice}
                        disabled={frozen}
                        onChange={(e) => set('comparePrice', e.target.value)}
                        className="py-2 text-sm"
                    />
                    <Input
                        label="Stock"
                        type="number"
                        min={0}
                        value={form.stock}
                        disabled={frozen}
                        onChange={(e) => set('stock', e.target.value)}
                        className="py-2 text-sm"
                    />
                    <Input
                        label="SKU"
                        value={form.sku}
                        disabled={frozen}
                        onChange={(e) => set('sku', e.target.value)}
                        className="py-2 text-sm uppercase"
                    />
                </div>

                {/* Category Selection */}
                <div>
                    <Select
                        label="Category"
                        options={categoryOptions}
                        value={form.categoryName}
                        disabled={frozen}
                        onChange={(e) => set('categoryName', e.target.value)}
                        className="py-2 text-sm"
                    />
                    {!form.categoryName && !!draft.suggestedCategory && (
                        <button
                            type="button"
                            disabled={creatingCategory || frozen}
                            onClick={createSuggestedCategory}
                            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-rose-gold/40 bg-rose-gold/10 text-xs font-medium text-rose-gold hover:bg-rose-gold/20 transition-all disabled:opacity-50"
                        >
                            {creatingCategory ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                            Create category “{draft.suggestedCategory}”
                        </button>
                    )}
                </div>

                {/* ── SEO TAGS & KEYWORDS ── */}
                <div className="p-3.5 rounded-2xl bg-white/60 border border-blush/30 space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-charcoal flex items-center gap-1.5">
                            <Sparkles size={13} className="text-rose-gold" />
                            SEO Tags & Search Keywords
                            <span className="text-[10px] text-rose-gold font-mono font-semibold">({form.tags.length} active)</span>
                        </label>
                        <button
                            type="button"
                            onClick={triggerAutoSeo}
                            disabled={frozen}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-gold hover:text-deep-rose"
                        >
                            <Wand2 size={12} /> Refresh SEO Tags
                        </button>
                    </div>

                    <input
                        value={form.tags.join(', ')}
                        disabled={frozen}
                        onChange={(e) =>
                            set('tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))
                        }
                        placeholder="e.g. silk saree, party wear bd, eid collection 2026, designer kurti"
                        className={FIELD_CLASS}
                    />

                    {seoNotice && (
                        <p className="text-[11px] text-emerald-600 font-medium animate-pulse">
                            ✓ Generated high-ranking SEO meta & search tags!
                        </p>
                    )}

                    {/* Quick Tag Pills */}
                    {form.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {form.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-gold/10 text-charcoal text-[11px] border border-rose-gold/20"
                                >
                                    #{tag}
                                    {!frozen && (
                                        <button
                                            type="button"
                                            onClick={() => set('tags', form.tags.filter((t) => t !== tag))}
                                            className="text-[#6B5B55] hover:text-red-500 transition-colors"
                                        >
                                            <X size={10} />
                                        </button>
                                    )}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── CUSTOM COLOR SELECTION ── */}
                <div className="p-3.5 rounded-2xl bg-white/60 border border-blush/30 space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-charcoal flex items-center gap-1.5">
                            <Palette size={13} className="text-rose-gold" />
                            Color Selection & Custom Palette
                        </label>
                        <button
                            type="button"
                            disabled={frozen}
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            className="text-[11px] text-rose-gold font-medium hover:text-deep-rose transition-colors"
                        >
                            {showColorPicker ? 'Hide Color Tool' : '+ Add Custom Color'}
                        </button>
                    </div>

                    {/* Selected Color Badges */}
                    {form.colors.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {form.colors.map((color) => (
                                <div
                                    key={color}
                                    className="flex items-center gap-2 bg-white border border-blush/30 rounded-full px-3 py-1.5 shadow-sm"
                                >
                                    <div
                                        className="w-4 h-4 rounded-full border border-gray-300 shadow-sm flex-shrink-0"
                                        style={{ backgroundColor: swatch(color) }}
                                    />
                                    <span className="text-xs text-charcoal font-medium">{color}</span>
                                    {!frozen && (
                                        <button
                                            type="button"
                                            onClick={() => set('colors', form.colors.filter((c) => c !== color))}
                                            className="text-[#6B5B55] hover:text-red-500 transition-colors ml-0.5"
                                        >
                                            <X size={11} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-[#6B5B55]/70 italic">No colors selected yet. Pick or add custom colors below.</p>
                    )}

                    {/* Custom Color Adder & Swatches */}
                    {(!frozen || showColorPicker) && (
                        <div className="pt-2 border-t border-blush/20 space-y-2">
                            {/* Quick Palettes */}
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] text-[#6B5B55] uppercase font-mono tracking-wider mr-1">Popular:</span>
                                {BOUTIQUE_PALETTE.map((c) => {
                                    const isSelected = form.colors.includes(c.name);
                                    return (
                                        <button
                                            key={c.name}
                                            type="button"
                                            onClick={() => handleAddColor(c.name)}
                                            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${
                                                isSelected
                                                    ? 'border-rose-gold bg-rose-gold/15 text-rose-gold font-medium'
                                                    : 'border-blush/30 bg-white hover:bg-blush-light text-charcoal'
                                            }`}
                                        >
                                            <span
                                                className="w-2.5 h-2.5 rounded-full border border-black/10 flex-shrink-0"
                                                style={{ backgroundColor: c.hex }}
                                            />
                                            {c.name}
                                            {isSelected && <Check size={10} />}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Custom Color Input Tool */}
                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="color"
                                    value={customColorHex}
                                    onChange={(e) => {
                                        setCustomColorHex(e.target.value);
                                        if (!customColorName) setCustomColorName(e.target.value);
                                    }}
                                    className="w-8 h-8 rounded-lg cursor-pointer border border-blush/40 p-0.5 bg-white shrink-0"
                                    title="Choose custom color"
                                />
                                <input
                                    type="text"
                                    value={customColorName}
                                    onChange={(e) => setCustomColorName(e.target.value)}
                                    placeholder="Type custom color (e.g. Dusty Rose, Mint Green, #E6E6FA)"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddColor(customColorName || customColorHex);
                                        }
                                    }}
                                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-blush/30 bg-white focus:outline-none focus:ring-1 focus:ring-rose-gold"
                                />
                                <Button
                                    size="sm"
                                    variant="outline"
                                    type="button"
                                    onClick={() => handleAddColor(customColorName || customColorHex)}
                                    disabled={!customColorName && !customColorHex}
                                    className="text-xs h-8"
                                >
                                    + Add
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── DYNAMIC RECENTLY USED SIZES ── */}
                <div className="p-3.5 rounded-2xl bg-white/60 border border-blush/30 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-xs font-semibold text-charcoal block">Sizes</label>
                            <p className="text-[11px] text-[#6B5B55]">
                                Suggestions learn dynamically from your manual entries and store catalog.
                            </p>
                        </div>
                    </div>

                    {/* Manual Size Input */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={customSizeInput}
                            disabled={frozen}
                            onChange={(e) => setCustomSizeInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddCustomSize();
                                }
                            }}
                            placeholder="Type sizes separated by commas: M, L, XL, XXL   or   Free Size"
                            className={FIELD_CLASS}
                        />
                        <Button
                            size="sm"
                            type="button"
                            disabled={frozen || !customSizeInput.trim()}
                            onClick={handleAddCustomSize}
                            className="shrink-0"
                        >
                            + Add Sizes
                        </Button>
                    </div>

                    {/* Recently Used Size Sets Suggestions */}
                    {recentGroups.length > 0 && (
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-medium text-[#6B5B55] uppercase tracking-wider font-mono">
                                    Recently Used Size Sets:
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {recentGroups.map((group) => (
                                    <div
                                        key={group.id}
                                        className="inline-flex items-center rounded-xl bg-white border border-blush/30 shadow-sm overflow-hidden"
                                    >
                                        <button
                                            type="button"
                                            disabled={frozen}
                                            onClick={() => addSizes(group.sizes)}
                                            className="text-xs px-3 py-1.5 font-medium text-charcoal hover:bg-rose-gold/10 hover:text-rose-gold transition-colors"
                                        >
                                            + {group.label}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeRecentGroup(group.id)}
                                            className="px-1.5 py-1.5 text-[#6B5B55]/50 hover:text-red-500 hover:bg-red-50 border-l border-blush/20 transition-colors"
                                            title="Remove suggestion"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Individual Quick Sizes */}
                    {recentIndividual.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] text-[#6B5B55] uppercase font-mono tracking-wider mr-1">Quick:</span>
                            {recentIndividual.map((size) => {
                                const isAdded = form.sizes.includes(size);
                                return (
                                    <button
                                        key={size}
                                        type="button"
                                        disabled={frozen}
                                        onClick={() => addSizes([size])}
                                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                                            isAdded
                                                ? 'bg-rose-gold/15 text-rose-gold border-rose-gold font-medium'
                                                : 'bg-white text-[#6B5B55] border-blush/20 hover:bg-blush-light'
                                        }`}
                                    >
                                        {isAdded ? `✓ ${size}` : `+ ${size}`}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Currently Selected Sizes */}
                    {form.sizes.length > 0 && (
                        <div className="pt-2 border-t border-blush/20">
                            <p className="text-[11px] font-medium text-[#6B5B55] mb-1.5">
                                Selected ({form.sizes.length}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {form.sizes.map((size) => (
                                    <div
                                        key={size}
                                        className="flex items-center gap-1.5 bg-rose-gold/15 text-rose-gold rounded-full px-3 py-1 border border-rose-gold/30 font-medium text-xs shadow-sm"
                                    >
                                        <span>{size}</span>
                                        {!frozen && (
                                            <button
                                                type="button"
                                                onClick={() => set('sizes', form.sizes.filter((s) => s !== size))}
                                                className="hover:text-red-500 transition-colors ml-0.5"
                                            >
                                                <X size={11} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Short Description */}
                <div>
                    <label className="block text-xs font-semibold text-[#6B5B55] mb-1.5">Short Description</label>
                    <textarea
                        rows={2}
                        value={form.shortDescription}
                        disabled={frozen}
                        onChange={(e) => set('shortDescription', e.target.value)}
                        className={FIELD_CLASS}
                    />
                </div>

                {/* Full Description */}
                <div>
                    <label className="block text-xs font-semibold text-[#6B5B55] mb-1.5">Full Description</label>
                    <textarea
                        rows={4}
                        value={form.description}
                        disabled={frozen}
                        onChange={(e) => set('description', e.target.value)}
                        className={FIELD_CLASS}
                    />
                </div>

                {/* Badges Toggle */}
                <div className="flex flex-wrap gap-4 pt-1">
                    {(['isFeatured', 'isTrending', 'isNewArrival', 'isOnSale'] as const).map((key) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={form[key]}
                                disabled={frozen}
                                onChange={(e) => set(key, e.target.checked)}
                                className="w-4 h-4 rounded accent-rose-gold"
                            />
                            <span className="text-xs font-medium text-charcoal">
                                {key.replace('is', '').replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Upload Progress Bar */}
            {progress && (
                <div className="rounded-xl bg-white/70 p-3 border border-blush/30 space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-charcoal">
                        <span>Watermarking and uploading to Cloudinary…</span>
                        <span className="font-mono text-rose-gold">
                            {progress.done} / {progress.total} photos
                        </span>
                    </div>
                    <div className="w-full bg-blush/20 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-rose-gold to-deep-rose h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(progress.done / progress.total) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {error && (
                <div className={`p-3 rounded-xl text-xs font-medium ${
                    status === 'published' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-600 border border-red-200'
                }`}>
                    {error}
                </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-blush/20">
                {status === 'published' ? (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-charcoal">Live on store:</span>
                        <Link
                            to={`/product/${publishedSlug}`}
                            className="text-xs font-semibold text-rose-gold hover:underline"
                        >
                            View Product Page →
                        </Link>
                    </div>
                ) : (
                    <p className="text-[11px] text-[#6B5B55]/70">
                        Nothing is published until you confirm below.
                    </p>
                )}

                {status !== 'published' && (
                    <Button
                        size="md"
                        onClick={publish}
                        loading={status === 'publishing'}
                        disabled={frozen}
                        className="shadow-lg shadow-rose-gold/25"
                    >
                        {status === 'failed' ? 'Retry Publish' : 'Publish to Store'}
                    </Button>
                )}
            </div>
        </div>
    );
};
