/* ===================================================
   - Admin AI Chat (Copilot + Automatic Category & Catalog Engine)
   - Interactive Web3 Cyber-Luxe Terminal
   - Fully automated intent routing (Auto-detects category creation without manual mode switching)
   =================================================== */

import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { AdminAuthLayout } from '@/components/layout/AdminAuthLayout';
import { Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import {
  ImagePlus, Send, Sparkles, Trash2, UploadCloud, X, FolderTree,
  Cpu, Zap, ShieldCheck, Terminal, Layers, ArrowRight
} from 'lucide-react';
import {
  ProductDraftCard,
  type ProductDraftData,
  type ProductDraftMeta,
} from '@/components/admin/ProductDraftCard';
import {
  CategoryDraftCard,
  type CategoryDraftData,
  type CategoryDraftMeta,
} from '@/components/admin/CategoryDraftCard';
import { useCategoryStore } from '@/store';
import type { NextPageWithLayout } from '@/types/layout';

interface ChatMeta {
  model?: string;
  historyTrimmed?: number;
  ordersCovered?: number;
  ordersTotal?: number;
  totalTokens?: number;
  switchedFrom?: string[];
}

type TranscriptItem =
  | { id: string; kind: 'user'; content: string }
  | { id: string; kind: 'assistant'; content: string; meta?: ChatMeta }
  | {
      id: string;
      kind: 'productDraft';
      draft: ProductDraftData;
      meta?: ProductDraftMeta;
      files: File[];
      priceHint: string;
    }
  | { id: string; kind: 'categoryDraft'; draft: CategoryDraftData; meta?: CategoryDraftMeta };

const MAX_ATTACHMENTS = 8;
const MODEL_IMAGES_PER_DRAFT = 4;
const COVER_OPTS = { maxSizeMB: 0.35, maxWidthOrHeight: 1024 };
const EXTRA_OPTS = { maxSizeMB: 0.12, maxWidthOrHeight: 640 };

const FATAL_CODES = ['rate_limited', 'daily_limit', 'no_credentials'];

const QUICK_COMMANDS = [
  { label: '✨ Create Category: Silk Sarees', text: 'Create category: Silk Sarees with rich traditional aesthetic' },
  { label: '✨ New Category: Party Wear', text: 'Add category: Party Wear for evening designer dresses' },
  { label: '📊 Today & Weekly Revenue', text: 'How many orders came in today and this week?' },
  { label: '📦 Low Stock Alert (< 10 units)', text: 'Which products are out of stock or below 10 units?' },
];

const COMPOSER_CLASS =
  'w-full px-4 py-3 rounded-2xl border border-white/20 bg-white/80 text-charcoal text-sm ' +
  'placeholder:text-[#6B5B55]/50 backdrop-blur-xl transition-all duration-200 focus:outline-none ' +
  'focus:ring-2 focus:ring-rose-gold/40 focus:border-rose-gold resize-none shadow-sm';

const CHIP_BASE = 'px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 disabled:opacity-40 shadow-xs flex items-center gap-1.5';
const CHIP_ON = 'border-rose-gold bg-gradient-to-r from-rose-gold to-purple-600 text-white shadow-md shadow-rose-gold/25';
const CHIP_OFF = 'border-blush/30 bg-white/80 text-charcoal hover:bg-blush-light hover:border-blush';

const uid = () => Math.random().toString(36).slice(2, 10);

const readPriceHint = (text: string) => text.match(/\b(\d{2,7})\b/)?.[1] || '';

/** Intelligent detection of category creation or update intent from freeform text */
const isCategoryIntent = (text: string): boolean => {
  const t = text.toLowerCase().trim();
  if (!t) return false;

  // Bengali category commands
  if (/ক্যাটাগরি|কেটাগরি|কেটালগ/.test(t)) {
    if (/নতুন|বানা|তৈরি|এড|যোগ|আপলোড|ক্রিয়েট|edit|update|change|create|add|upload/.test(t) || t.startsWith('ক্যাটাগরি')) {
      return true;
    }
  }

  // English category patterns
  if (
    /^(new|create|add|make|draft|upload|insert|update|edit)\s+(a\s+|an\s+)?category/i.test(t) ||
    /category\s*:\s*.+/i.test(t) ||
    /category\s+(create|add|upload|new|draft|banao|make)/i.test(t) ||
    /(create|add|make|upload|draft)\s+(a\s+)?category/i.test(t) ||
    /category\s+for\s+/i.test(t) ||
    /^category\s+/i.test(t)
  ) {
    return true;
  }

  return false;
};

const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read the image file.'));
    reader.readAsDataURL(file);
  });

const prepareForModel = async (files: File[]) => {
  const { default: imageCompression } = await import('browser-image-compression');
  const out: string[] = [];
  for (let i = 0; i < files.length; i += 1) {
    const opts = i === 0 ? COVER_OPTS : EXTRA_OPTS;
    const small = await imageCompression(files[i], { ...opts, fileType: 'image/webp', useWebWorker: false });
    out.push(await toDataUrl(small));
  }
  return out;
};

const postJson = async (url: string, body: unknown) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Session expired. Sign in again.');

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json?.error || `Request failed (${res.status})`) as Error & { code?: string };
    err.code = json?.code;
    throw err;
  }
  return json;
};

const Bubble: React.FC<{ role: 'user' | 'assistant'; content: string; meta?: ChatMeta }> = ({
  role,
  content,
  meta,
}) => {
  const isUser = role === 'user';

  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 transition-all duration-200 ${
          isUser
            ? 'bg-gradient-to-r from-rose-gold to-purple-600 text-white shadow-lg shadow-rose-gold/20'
            : 'bg-white/90 border border-white/60 text-charcoal shadow-md backdrop-blur-xl'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
        {meta && (
          <div className="mt-2.5 pt-2 border-t border-black/5 flex flex-wrap items-center gap-2 text-[10px] text-[#6B5B55]/70 font-mono">
            {meta.model && <span>Node: {meta.model}</span>}
            {meta.ordersCovered !== undefined && (
              <span>· {meta.ordersCovered} orders analyzed</span>
            )}
            {meta.switchedFrom && meta.switchedFrom.length > 0 && (
              <span>· Failover: {meta.switchedFrom.join(', ')}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const carriesFiles = (event: DragEvent) =>
  Array.from(event.dataTransfer?.types || []).includes('Files');

export const AdminAiChatPage: NextPageWithLayout = () => {
  const [items, setItems] = useState<TranscriptItem[]>([]);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [pendingLabel, setPendingLabel] = useState('');
  const [batch, setBatch] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  
  // Default to 'auto' so user doesn't have to manually select category feature
  const [intent, setIntent] = useState<'auto' | 'ask' | 'category'>('auto');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const dragDepth = useRef(0);

  const hasImages = attachments.length > 0;

  const scrollToBottom = () => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [items, pendingLabel]);

  const addFiles = useCallback(
    (files: File[]) => {
      const images = files.filter((f) => f.type.startsWith('image/'));
      if (!images.length) return;
      setAttachments((prev) => [...prev, ...images].slice(0, MAX_ATTACHMENTS));
      setError('');
    },
    [],
  );

  useEffect(() => {
    const onDragEnter = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      dragDepth.current += 1;
      setDragActive(true);
    };

    const onDragOver = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    };

    const onDragLeave = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (!dragDepth.current) setDragActive(false);
    };

    const onDrop = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      dragDepth.current = 0;
      setDragActive(false);
      if (sending) {
        setError('Working on current message. Please wait a moment.');
        return;
      }
      addFiles(Array.from(event.dataTransfer?.files || []));
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [addFiles, sending]);

  const runAsk = async (history: TranscriptItem[]) => {
    const json = await postJson('/api/ai-chat', {
      messages: history
        .filter((item) => item.kind === 'user' || item.kind === 'assistant')
        .map((item) => ({ role: item.kind, content: 'content' in item ? item.content : '' })),
    });
    setItems((prev) => [...prev, { id: uid(), kind: 'assistant', content: json.reply, meta: json.meta }]);
  };

  const runCategory = async (instruction: string) => {
    const json = await postJson('/api/ai-category-draft', { instruction });
    setItems((prev) => [...prev, { id: uid(), kind: 'categoryDraft', draft: json.data, meta: json.meta }]);
  };

  const runProduct = async (text: string, files: File[], bulk: boolean) => {
    const priceHint = readPriceHint(text);
    const groups = bulk ? files.map((file) => [file]) : [files];

    for (let i = 0; i < groups.length; i += 1) {
      const group = groups[i];
      if (groups.length > 1) setBatch({ done: i, total: groups.length });

      try {
        const images = await prepareForModel(group.slice(0, MODEL_IMAGES_PER_DRAFT));
        const json = await postJson('/api/ai-product-draft', { images, priceHint, notes: text });
        setItems((prev) => [
          ...prev,
          { id: uid(), kind: 'productDraft', draft: json.data, meta: json.meta, files: group, priceHint },
        ]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Drafting failed.';
        const code = (err as { code?: string }).code || '';
        setItems((prev) => [
          ...prev,
          {
            id: uid(),
            kind: 'assistant',
            content: groups.length > 1 ? `Photo ${i + 1}: ${message}` : message,
          },
        ]);
        if (FATAL_CODES.includes(code)) {
          if (bulk) setAttachments(files.slice(i + 1));
          break;
        }
      }
    }
    setBatch(null);
  };

  const send = useCallback(
    async (override?: string) => {
      if (sending) return;

      const text = (override ?? input).trim();
      const files = attachments;
      if (!text && !files.length) return;

      const label = text || `${files.length} photo${files.length > 1 ? 's' : ''} attached`;
      const history: TranscriptItem[] = [...items, { id: uid(), kind: 'user', content: label }];
      setItems(history);
      setInput('');
      setAttachments([]);
      setError('');
      setSending(true);

      // AUTOMATED INTENT ROUTING
      // If photos attached -> draft product
      // If intent is 'category' OR (intent is 'auto' and text specifies category command) -> draft category!
      const isAutoCategory = intent === 'auto' && isCategoryIntent(text);
      const shouldRunCategory = intent === 'category' || isAutoCategory;

      setPendingLabel(
        files.length
          ? 'Analyzing product photos with Vision AI…'
          : shouldRunCategory
            ? 'Auto-drafting category with rich SEO tags…'
            : 'Querying store analytics & live data…',
      );

      try {
        if (files.length) {
          await runProduct(text, files, mode === 'bulk');
        } else if (shouldRunCategory) {
          await runCategory(text);
        } else {
          await runAsk(history);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not reach the assistant.');
      } finally {
        setSending(false);
        setBatch(null);
      }
    },
    [attachments, input, intent, items, mode, sending],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  const pending = batch && batch.total > 1 ? `Reading photo ${batch.done + 1} of ${batch.total}…` : pendingLabel;

  return (
    <div className="space-y-5">
      {/* ── Web3 Cyber Terminal Header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0E101A] border border-rose-gold/30 p-6 text-white shadow-2xl backdrop-blur-2xl">
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-gradient-to-bl from-rose-gold/20 via-purple-600/20 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-rose-gold to-purple-600 text-white shadow-md shadow-rose-gold/30">
                <Terminal size={18} />
              </div>
              <div>
                <h1 className="heading-serif text-2xl font-bold tracking-wide flex items-center gap-2">
                  AI Neural Terminal
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-400/15 border border-emerald-400/30 text-emerald-400">
                    ONLINE v3.5
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Autonomous Category Upload, Multi-photo Product Vision, and Live Store Analytics.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <div className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1.5 text-slate-300">
              <Cpu size={12} className="text-rose-gold" />
              <span>FAILOVER: 3 PROVIDERS</span>
            </div>
            <div className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1.5 text-emerald-400">
              <Zap size={12} />
              <span>LATENCY: ~25ms</span>
            </div>
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => setItems([])}
                className="px-3 py-1 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/10 transition-colors flex items-center gap-1.5"
                title="Clear transcript"
              >
                <Trash2 size={12} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Holographic Drag & Drop Overlay ── */}
      {dragActive && (
        <div className="fixed inset-0 z-50 bg-[#0B0D17]/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
          <div className="w-24 h-24 rounded-3xl bg-rose-gold/20 border-2 border-dashed border-rose-gold flex items-center justify-center text-rose-gold mb-4 shadow-2xl shadow-rose-gold/40 animate-bounce">
            <UploadCloud size={44} />
          </div>
          <h3 className="text-xl font-bold text-white tracking-wide">Drop Product Photos</h3>
          <p className="text-sm text-slate-300 mt-1 max-w-sm">
            AI Vision will analyze fabric, colors, style, and generate instant SEO-optimized catalog entries.
          </p>
        </div>
      )}

      {/* ── Main Chat Area ── */}
      <div className="rounded-3xl border border-blush/30 bg-white/70 backdrop-blur-xl shadow-xl flex flex-col min-h-[580px] overflow-hidden">
        {/* Transcript Message Scroll */}
        <div ref={transcriptRef} className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[620px]">
          {items.length === 0 && (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-gold/10 border border-rose-gold/30 flex items-center justify-center text-rose-gold shadow-md">
                <Sparkles size={24} />
              </div>
              <div className="max-w-md">
                <h3 className="text-base font-semibold text-charcoal">Autonomous AI Store Copilot</h3>
                <p className="text-xs text-[#6B5B55] mt-1 leading-relaxed">
                  Type naturally to upload categories, drop photos to draft products with rich SEO tags, or ask any real-time question about sales and inventory.
                </p>
              </div>

              {/* Quick Commands Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg pt-2 text-left">
                {QUICK_COMMANDS.map((cmd) => (
                  <button
                    key={cmd.label}
                    type="button"
                    onClick={() => {
                      setInput(cmd.text);
                      send(cmd.text);
                    }}
                    className="p-3 rounded-2xl bg-white/90 border border-blush/30 hover:border-rose-gold hover:shadow-md hover:bg-white text-xs text-charcoal transition-all group flex items-center justify-between"
                  >
                    <span className="font-medium group-hover:text-rose-gold transition-colors">{cmd.label}</span>
                    <ArrowRight size={12} className="text-[#6B5B55]/50 group-hover:text-rose-gold group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {items.map((item) => {
            if (item.kind === 'user') {
              return <Bubble key={item.id} role="user" content={item.content} />;
            }
            if (item.kind === 'assistant') {
              return <Bubble key={item.id} role="assistant" content={item.content} meta={item.meta} />;
            }
            if (item.kind === 'categoryDraft') {
              return <CategoryDraftCard key={item.id} draft={item.draft} meta={item.meta} />;
            }
            if (item.kind === 'productDraft') {
              return (
                <ProductDraftCard
                  key={item.id}
                  draft={item.draft}
                  meta={item.meta}
                  files={item.files}
                  priceHint={item.priceHint}
                />
              );
            }
            return null;
          })}

          {sending && (
            <div className="flex justify-start">
              <div className="p-3.5 rounded-2xl bg-white/90 border border-blush/30 shadow-sm flex items-center gap-2.5 text-xs text-charcoal font-medium backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-rose-gold animate-ping" />
                <span>{pending}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Composer Dock ── */}
        <div className="p-4 border-t border-blush/20 bg-white/80 backdrop-blur-xl">
          {/* Attached Photos Chips */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 p-2.5 rounded-2xl bg-white/60 border border-blush/20">
              {attachments.map((file, index) => (
                <div key={index} className="relative group rounded-xl overflow-hidden border border-blush/30 shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Attachment ${index + 1}`}
                    className="w-12 h-14 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== index))}
                    disabled={sending}
                    aria-label={`Remove photo ${index + 1}`}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-charcoal hover:text-red-500 shadow-sm border border-blush/40 flex items-center justify-center transition-colors"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              <span className="text-[11px] self-center text-[#6B5B55] font-mono px-2">
                {attachments.length}/{MAX_ATTACHMENTS} photos attached
              </span>
            </div>
          )}

          {/* Mode Chips with Smart Auto-Detect default */}
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <button
              type="button"
              disabled={hasImages || sending}
              onClick={() => setIntent('auto')}
              className={`${CHIP_BASE} ${!hasImages && intent === 'auto' ? CHIP_ON : CHIP_OFF}`}
              title="Automatically routes between category drafting and store chat"
            >
              <Sparkles size={12} />
              <span>✨ Smart Auto-Detect (Active)</span>
            </button>

            <button
              type="button"
              disabled={hasImages || sending}
              onClick={() => setIntent('category')}
              className={`${CHIP_BASE} ${!hasImages && intent === 'category' ? CHIP_ON : CHIP_OFF}`}
            >
              <FolderTree size={12} />
              <span>Category Engine</span>
            </button>

            <button
              type="button"
              disabled={hasImages || sending}
              onClick={() => setIntent('ask')}
              className={`${CHIP_BASE} ${!hasImages && intent === 'ask' ? CHIP_ON : CHIP_OFF}`}
            >
              <span>Store Analytics</span>
            </button>

            <span className="w-px h-4 bg-blush/40" />

            {hasImages ? (
              <>
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => setMode('single')}
                  className={`${CHIP_BASE} ${mode === 'single' ? CHIP_ON : CHIP_OFF}`}
                >
                  1 Product Draft
                </button>
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => setMode('bulk')}
                  className={`${CHIP_BASE} ${mode === 'bulk' ? CHIP_ON : CHIP_OFF}`}
                >
                  Bulk · {attachments.length} products
                </button>
              </>
            ) : (
              <span className="text-[11px] text-[#6B5B55]/70 hidden sm:inline">
                💡 Tip: Type “Create category: [Name]” or drop product photos directly!
              </span>
            )}
          </div>

          {/* Input & Send Area */}
          <div className="flex items-end gap-2 relative">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(Array.from(e.target.files));
                e.target.value = '';
              }}
            />

            <button
              type="button"
              disabled={sending}
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-2xl bg-white border border-blush/30 hover:border-rose-gold text-[#6B5B55] hover:text-rose-gold transition-all shadow-sm hover:shadow-md disabled:opacity-40 shrink-0"
              title="Attach product photos"
            >
              <ImagePlus size={18} />
            </button>

            <textarea
              rows={2}
              value={input}
              disabled={sending}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={
                hasImages
                  ? 'Add optional instructions e.g. "Price 1850 tk, colors Red & Black" or press Send...'
                  : intent === 'category'
                    ? 'Type category name & details e.g. "Silk Sarees for traditional collection"...'
                    : 'Ask anything or type e.g. "Create category: Linen Sarees" (Auto-Detects)...'
              }
              className={COMPOSER_CLASS}
            />

            <Button
              type="button"
              size="md"
              onClick={() => send()}
              loading={sending}
              disabled={sending || (!input.trim() && !attachments.length)}
              className="h-11 px-5 rounded-2xl shadow-lg shadow-rose-gold/25 shrink-0"
            >
              <Send size={15} />
            </Button>
          </div>

          {error && (
            <p className="text-xs text-red-600 mt-2 font-medium bg-red-50 p-2 rounded-xl border border-red-200">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

AdminAiChatPage.getLayout = (page: ReactElement) => <AdminAuthLayout>{page}</AdminAuthLayout>;

export default AdminAiChatPage;
