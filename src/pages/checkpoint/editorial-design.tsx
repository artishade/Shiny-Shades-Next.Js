import React from 'react';
import Head from 'next/head';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Link } from '@/lib/routerCompat';
import {
  AtelierStyleStudio,
  EditorialLookbookSpread,
  SensoryFabricLens,
  InteractiveColorDrape,
  AuraPersonaQuiz,
} from '@/components/checkpoints/editorial-atelier';
import { Sparkles, ArrowLeft, BookmarkCheck } from 'lucide-react';
import { BRAND } from '@/config/brandingConfig';

export default function EditorialDesignCheckpointPage() {
  return (
    <>
      <Head>
        <title>UI/UX Design Checkpoint — Haute Couture Atelier | {BRAND.fullName}</title>
        <meta
          name="description"
          content="Archived checkpoint of the interactive haute-couture and atelier editorial UI/UX experience."
        />
      </Head>

      <main id="main-content" className="min-h-screen bg-[#FAF8F3]">
        {/* Checkpoint Header Banner */}
        <div className="bg-stone-950 text-stone-200 border-b border-amber-500/30 py-4 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-400/20 text-amber-300">
                <BookmarkCheck size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-widest font-bold text-amber-300">
                    UI/UX Design Checkpoint
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 text-[10px] font-mono">
                    v1.0-editorial
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  Archived interactive atelier, fabric lens, editorial lookbook & color draping showcase.
                </p>
              </div>
            </div>

            <Link
              to="/"
              className="px-4 py-2 rounded-full bg-white text-stone-950 hover:bg-amber-400 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Main Store</span>
            </Link>
          </div>
        </div>

        {/* The 5 Interactive Checkpoint Experiences */}
        <AtelierStyleStudio />
        <EditorialLookbookSpread />
        <SensoryFabricLens />
        <InteractiveColorDrape />
        <AuraPersonaQuiz />

        {/* Footer info note */}
        <div className="py-12 bg-white border-t border-stone-200 text-center">
          <div className="max-w-md mx-auto px-4">
            <Sparkles size={20} className="mx-auto text-amber-600 mb-2" />
            <h4 className="text-base font-editorial text-stone-900 mb-1">
              Design Checkpoint Preserved
            </h4>
            <p className="text-xs text-stone-500 mb-4 leading-relaxed">
              This route is preserved so you can inspect, review, or re-enable these editorial features whenever desired.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-stone-900 text-white text-xs font-medium hover:bg-amber-600 transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>Return to Standard Storefront</span>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

EditorialDesignCheckpointPage.getLayout = function getLayout(page: React.ReactElement) {
  return <CustomerLayout>{page}</CustomerLayout>;
};
