/**
 * The editable category draft the admin AI chat renders in the transcript.
 *
 * Enhanced with:
 * 1. 1-Click Auto SEO Generator for Categories (SEO Title, Description & Keywords)
 * 2. Web3 Cyber-Luxe Glassmorphic Styling
 */

import React, { useMemo, useState } from 'react';
import { Button, Input, Select } from '@/components/ui';
import { Check, FolderTree, Sparkles, Wand2 } from 'lucide-react';
import { useCategoryStore } from '@/store';
import { generateCategorySeo } from '@/lib/seoGenerator';

export interface CategoryDraftData {
    action: 'create' | 'update';
    targetId: string;
    targetSlug: string;
    name: string;
    description: string;
    parentId: string;
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string;
}

export interface CategoryDraftMeta {
    model?: string;
    credentialLabel?: string;
    switchedFrom?: string[];
}

const GRADIENTS = [
    'linear-gradient(135deg, #F4C2C2, #E6E6FA)',
    'linear-gradient(135deg, #F7E7CE, #F4C2C2)',
    'linear-gradient(135deg, #E3BCA4, #FADBD8)',
    'linear-gradient(135deg, #B76E79, #F4C2C2)',
    'linear-gradient(135deg, #D4949E, #E6E6FA)',
    'linear-gradient(135deg, #FADBD8, #F7E7CE)',
    'linear-gradient(135deg, #C8C8E0, #E3BCA4)',
];

const FIELD_CLASS =
    'w-full px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/70 text-sm text-charcoal ' +
    'backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-rose-gold/40 focus:border-rose-gold resize-none shadow-sm';

const slugify = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

interface CategoryDraftCardProps {
    draft: CategoryDraftData;
    meta?: CategoryDraftMeta;
}

type ApplyStatus = 'idle' | 'saving' | 'saved' | 'failed';

export const CategoryDraftCard: React.FC<CategoryDraftCardProps> = ({ draft, meta }) => {
    const { categories, addCategory, updateCategory } = useCategoryStore();

    const existing = useMemo(
        () => (draft.targetId ? categories.find((c) => c.id === draft.targetId) || null : null),
        [categories, draft.targetId],
    );

    // Ensure initial SEO is filled
    const initialSeo = useMemo(() => {
        if (draft.seoTitle && draft.seoKeywords) {
            return {
                seoTitle: draft.seoTitle,
                seoDescription: draft.seoDescription,
                seoKeywords: draft.seoKeywords,
            };
        }
        return generateCategorySeo(draft.name);
    }, [draft.name, draft.seoTitle, draft.seoDescription, draft.seoKeywords]);

    const [form, setForm] = useState(() => ({
        name: draft.name,
        description: draft.description,
        parentId: draft.parentId,
        gradient: existing?.gradient || GRADIENTS[0],
        seoTitle: initialSeo.seoTitle,
        seoDescription: initialSeo.seoDescription,
        seoKeywords: initialSeo.seoKeywords,
    }));
    const [status, setStatus] = useState<ApplyStatus>('idle');
    const [error, setError] = useState('');
    const [seoNotice, setSeoNotice] = useState(false);

    const isUpdate = draft.action === 'update' && !!existing;
    const frozen = status === 'saving' || status === 'saved';

    const parentOptions = useMemo(
        () => [
            { value: '', label: 'No parent (top level)' },
            ...categories
                .filter((c) => c.id !== draft.targetId)
                .map((c) => ({ value: c.id, label: c.name })),
        ],
        [categories, draft.targetId],
    );

    const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const triggerAutoSeo = () => {
        const parent = categories.find((c) => c.id === form.parentId);
        const seo = generateCategorySeo(form.name, parent?.name);
        setForm((prev) => ({
            ...prev,
            seoTitle: seo.seoTitle,
            seoDescription: seo.seoDescription,
            seoKeywords: seo.seoKeywords,
        }));
        setSeoNotice(true);
        setTimeout(() => setSeoNotice(false), 2500);
    };

    const apply = async () => {
        if (frozen) return;
        if (!form.name.trim()) return setError('Give the category a name.');

        setStatus('saving');
        setError('');

        let finalSeoTitle = form.seoTitle.trim();
        let finalSeoDesc = form.seoDescription.trim();
        let finalSeoKeywords = form.seoKeywords.trim();

        if (!finalSeoTitle || !finalSeoKeywords) {
            const auto = generateCategorySeo(form.name);
            if (!finalSeoTitle) finalSeoTitle = auto.seoTitle;
            if (!finalSeoDesc) finalSeoDesc = auto.seoDescription;
            if (!finalSeoKeywords) finalSeoKeywords = auto.seoKeywords;
        }

        const shared = {
            name: form.name.trim(),
            slug: slugify(form.name),
            description: form.description.trim(),
            gradient: form.gradient,
            parentId: form.parentId || null,
            seoTitle: finalSeoTitle,
            seoDescription: finalSeoDesc,
            seoKeywords: finalSeoKeywords,
        };

        try {
            if (isUpdate) {
                await updateCategory(existing!.id, { ...shared, image: existing!.image });
            } else {
                await addCategory({
                    ...shared,
                    id: crypto.randomUUID(),
                    image: '',
                    productCount: 0,
                });
            }
            setStatus('saved');
        } catch (err) {
            console.error('[CategoryDraftCard] apply failed:', err);
            setStatus('failed');
            setError(err instanceof Error ? err.message : 'Save failed — check Supabase permissions.');
        }
    };

    return (
        <div className="relative overflow-hidden rounded-3xl border border-rose-gold/30 bg-white/85 p-5 shadow-xl backdrop-blur-xl transition-all duration-300 space-y-4">
            {/* Ambient top glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-rose-gold to-deep-rose" />

            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-gold/15 text-rose-gold shadow-sm">
                            <FolderTree size={14} />
                        </span>
                        <p className="text-sm font-semibold tracking-wide text-charcoal">
                            {isUpdate ? `Editing Category “${existing!.name}”` : 'New Category Draft'}
                        </p>
                        <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[10px] font-mono text-purple-700">
                            ● AUTO-SEO ACTIVATED
                        </span>
                    </div>
                    <p className="text-[11px] text-[#6B5B55]/80 mt-1">
                        {meta?.model || 'Gemini'}
                        {meta?.credentialLabel && ` · ${meta.credentialLabel}`}
                        {!!meta?.switchedFrom?.length && ` · switched after ${meta.switchedFrom.join(', ')} failed`}
                    </p>
                </div>
                {status === 'saved' && (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 shrink-0">
                        <Check size={14} /> Saved Live
                    </span>
                )}
            </div>

            <div className="space-y-3.5">
                <Input
                    label="Category Name"
                    value={form.name}
                    disabled={frozen}
                    onChange={(e) => set('name', e.target.value)}
                    className="py-2.5 text-sm font-medium"
                />
                <p className="text-[11px] text-[#6B5B55]/80 -mt-2">
                    URL Slug: <span className="font-mono text-rose-gold">/category/{slugify(form.name) || '…'}</span>
                </p>

                <div>
                    <label className="block text-xs font-semibold text-[#6B5B55] mb-1.5">Description</label>
                    <textarea
                        rows={2}
                        value={form.description}
                        disabled={frozen}
                        onChange={(e) => set('description', e.target.value)}
                        placeholder="Brief overview of this category for shoppers..."
                        className={FIELD_CLASS}
                    />
                </div>

                <Select
                    label="Parent Category"
                    options={parentOptions}
                    value={form.parentId}
                    disabled={frozen}
                    onChange={(e) => set('parentId', e.target.value)}
                    className="py-2 text-sm"
                />

                <div>
                    <label className="block text-xs font-semibold text-[#6B5B55] mb-1.5">Card Ambient Gradient</label>
                    <div className="flex flex-wrap gap-2">
                        {GRADIENTS.map((gradient) => (
                            <button
                                key={gradient}
                                type="button"
                                disabled={frozen}
                                onClick={() => set('gradient', gradient)}
                                aria-label="Choose gradient"
                                aria-pressed={form.gradient === gradient}
                                style={{ background: gradient }}
                                className={`w-9 h-9 rounded-xl border-2 transition-all disabled:opacity-50 ${
                                    form.gradient === gradient
                                        ? 'border-rose-gold scale-110 shadow-md ring-2 ring-rose-gold/20'
                                        : 'border-white shadow-sm hover:scale-105'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* ── SEO SECTION ── */}
                <div className="p-3.5 rounded-2xl bg-white/60 border border-blush/30 space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-charcoal flex items-center gap-1.5">
                            <Sparkles size={13} className="text-rose-gold" />
                            Category SEO Meta & Search Tags
                        </label>
                        <button
                            type="button"
                            onClick={triggerAutoSeo}
                            disabled={frozen}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-gold hover:text-deep-rose transition-colors"
                        >
                            <Wand2 size={12} /> Auto-Generate Category SEO
                        </button>
                    </div>

                    {seoNotice && (
                        <p className="text-[11px] text-emerald-600 font-medium animate-pulse">
                            ✓ Generated search-optimized category title, meta description & keywords!
                        </p>
                    )}

                    <Input
                        label="SEO Meta Title"
                        value={form.seoTitle}
                        disabled={frozen}
                        onChange={(e) => set('seoTitle', e.target.value)}
                        className="py-2 text-sm"
                    />

                    <div>
                        <label className="block text-xs font-semibold text-[#6B5B55] mb-1.5">SEO Meta Description</label>
                        <textarea
                            rows={2}
                            value={form.seoDescription}
                            disabled={frozen}
                            onChange={(e) => set('seoDescription', e.target.value)}
                            className={FIELD_CLASS}
                        />
                    </div>

                    <Input
                        label="SEO Search Keywords (comma-separated)"
                        value={form.seoKeywords}
                        disabled={frozen}
                        onChange={(e) => set('seoKeywords', e.target.value)}
                        className="py-2 text-sm"
                    />
                </div>
            </div>

            {error && (
                <div className="p-3 rounded-xl text-xs font-medium bg-red-50 text-red-600 border border-red-200">
                    {error}
                </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-blush/20">
                {status === 'saved' ? (
                    <p className="text-xs font-medium text-charcoal">
                        {isUpdate ? 'Category updated.' : 'Category created.'} Live in storefront now.
                    </p>
                ) : (
                    <p className="text-[11px] text-[#6B5B55]/70">Review and apply to save into Supabase.</p>
                )}

                {status !== 'saved' && (
                    <Button
                        size="md"
                        onClick={apply}
                        loading={status === 'saving'}
                        disabled={frozen}
                        className="shadow-lg shadow-rose-gold/25"
                    >
                        {status === 'failed' ? 'Retry Save' : isUpdate ? 'Apply Changes' : 'Create Category'}
                    </Button>
                )}
            </div>
        </div>
    );
};
