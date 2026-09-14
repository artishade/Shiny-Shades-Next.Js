/* ===================================================
   Track Order Page — lookup by order number
   Reads only the narrow status shape for the order the
   customer already knows (same policy as /payment/success),
   never the full orders table.
   =================================================== */
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import React, { useState } from 'react';
import { m as motion } from 'framer-motion';
import { Package, Search, Loader2, CheckCircle, Clock, XCircle } from 'lucide-react';
import Head from 'next/head';
import { Button, EmptyState } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { SITE } from '@/config/siteConfig';

type TrackedStatus = {
  order_number: string;
  status: string;
  payment_status: string;
} | null;

const STATUS_FLOW = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] as const;

const STATUS_LABELS: Record<string, string> = {
  pending: 'Order Placed',
  confirmed: 'Confirmed',
  processing: 'Preparing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const TrackOrderPage: React.FC = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackedStatus>(null);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = orderNumber.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    setResult(null);
    setSearched(false);

    try {
      const { data, error: rpcError } = await supabase
        .rpc('get_order_status', { p_order_number: trimmed })
        .single<NonNullable<TrackedStatus>>();

      if (rpcError || !data) {
        setError('We could not find that order number. Please check and try again.');
      } else {
        setResult(data);
      }
    } catch {
      setError('Something went wrong while looking up your order. Please try again.');
    } finally {
      setSearched(true);
      setLoading(false);
    }
  };

  const stepIndex = result
    ? STATUS_FLOW.indexOf(result.status as (typeof STATUS_FLOW)[number])
    : -1;
  const isCancelled = result?.status === 'cancelled';

  return (
    <>
      <Head>
        <title>Track Your Order | Shiny Shades</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-2">
            <Package size={26} className="text-rose-gold" />
            <h1 className="heading-serif text-3xl md:text-4xl font-bold text-charcoal">
              Track Order
            </h1>
          </div>
          <p className="text-[#6B5B55] mb-8">
            Enter the order number from your confirmation (e.g. SS-123456).
          </p>

          <form onSubmit={handleTrack} className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B5B55]" />
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="SS-123456"
                aria-label="Order number"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-blush/30 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold transition-all"
              />
            </div>
            <Button type="submit" size="lg" loading={loading}>
              Track
            </Button>
          </form>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-[#6B5B55] py-10">
              <Loader2 size={20} className="animate-spin" />
              Looking up your order…
            </div>
          )}

          {!loading && searched && error && (
            <EmptyState
              icon={<XCircle size={44} className="text-red-400" />}
              title="Order not found"
              description={error}
            />
          )}

          {!loading && result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs uppercase tracking-wider text-[#6B5B55]">
                  Order Number
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    isCancelled
                      ? 'bg-red-100 text-red-600'
                      : result.payment_status === 'verified'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {isCancelled
                    ? 'Cancelled'
                    : result.payment_status === 'verified'
                      ? 'Payment Verified'
                      : 'Payment Pending'}
                </span>
              </div>
              <p className="text-lg font-bold text-charcoal font-mono mb-6">
                {result.order_number}
              </p>

              {isCancelled ? (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-sm text-red-600 font-medium">
                  <XCircle size={16} /> This order was cancelled.
                </div>
              ) : (
                <ol className="space-y-4">
                  {STATUS_FLOW.map((status, i) => {
                    const done = i <= stepIndex;
                    const isCurrent = i === stepIndex;
                    return (
                      <li key={status} className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            done ? 'bg-rose-gold text-white' : 'bg-blush-light text-[#6B5B55]'
                          }`}
                        >
                          {done ? (
                            isCurrent ? <Clock size={14} /> : <CheckCircle size={14} />
                          ) : (
                            <span className="text-[10px] font-bold">{i + 1}</span>
                          )}
                        </span>
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              done ? 'text-charcoal' : 'text-[#6B5B55]/60'
                            }`}
                          >
                            {STATUS_LABELS[status]}
                          </p>
                          {isCurrent && (
                            <p className="text-xs text-rose-gold">Current status</p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

TrackOrderPage.getLayout = function getLayout(page: React.ReactElement) {
  return <CustomerLayout>{page}</CustomerLayout>;
};

export default TrackOrderPage;
