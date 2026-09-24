/* ===================================================
   Shiny Shades - Executive Operations Dashboard
   High-density, interactive B2B SaaS control panel
   Inspired by Stripe & Linear Insights
   =================================================== */

import { AdminAuthLayout } from '@/components/layout/AdminAuthLayout';
import React, { useState, useMemo } from 'react';
import { Link } from '@/lib/routerCompat';
import { m as motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, ShoppingCart, Package, AlertTriangle, TrendingUp,
  ShoppingBag, ArrowUpRight, Download, Filter, Search, Eye,
  Clock, CheckCircle2, Truck, RefreshCw, Sparkles, ChevronRight,
  BarChart2, FileSpreadsheet, Layers
} from 'lucide-react';
import { useOrderStore, useProductStore, useCategoryStore } from '@/store';
import { SITE } from '@/config/siteConfig';
import type { RealOrder } from '@/store';

type PeriodOption = '7d' | '30d' | '90d' | 'all';

export const AdminDashboard: React.FC = () => {
  const { orders } = useOrderStore();
  const { products } = useProductStore();
  const { categories } = useCategoryStore();

  const [period, setPeriod] = useState<PeriodOption>('30d');
  const [chartMode, setChartMode] = useState<'revenue' | 'orders'>('revenue');
  const [recentSearch, setRecentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrderModal, setSelectedOrderModal] = useState<RealOrder | null>(null);

  // --- Filter orders by period ---
  const filteredOrdersByPeriod = useMemo(() => {
    if (period === 'all') return orders;
    const now = new Date();
    const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
    const cutoff = new Date(now.getTime() - (daysMap[period] || 30) * 24 * 60 * 60 * 1000);
    return orders.filter(o => new Date(o.createdAt) >= cutoff);
  }, [orders, period]);

  // Non-cancelled revenue orders
  const revenueOrders = useMemo(() => {
    return filteredOrdersByPeriod.filter(o => o.status !== 'cancelled');
  }, [filteredOrdersByPeriod]);

  // Key metrics calculations
  const totalRevenue = useMemo(() => {
    return revenueOrders.reduce((sum, o) => sum + o.total, 0);
  }, [revenueOrders]);

  const totalOrders = filteredOrdersByPeriod.length;
  const pendingOrders = filteredOrdersByPeriod.filter(o => o.status === 'pending' || o.status === 'processing');
  const deliveredOrders = filteredOrdersByPeriod.filter(o => o.status === 'delivered');
  const cancelledOrders = filteredOrdersByPeriod.filter(o => o.status === 'cancelled');

  const averageOrderValue = useMemo(() => {
    return revenueOrders.length > 0 ? totalRevenue / revenueOrders.length : 0;
  }, [revenueOrders, totalRevenue]);

  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock <= 10).sort((a, b) => a.stock - b.stock);
  }, [products]);

  // Monthly aggregated data for last 6 months
  const monthlyData = useMemo(() => {
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const mOrders = orders.filter(o => {
        if (o.status === 'cancelled') return false;
        const od = new Date(o.createdAt);
        return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth();
      });
      return {
        month: monthNames[d.getMonth()],
        year: d.getFullYear(),
        revenue: mOrders.reduce((sum, o) => sum + o.total, 0),
        count: mOrders.length,
      };
    });
  }, [orders]);

  const maxChartRevenue = Math.max(...monthlyData.map(d => d.revenue), 1);
  const maxChartOrders = Math.max(...monthlyData.map(d => d.count), 1);

  // Recent transactions search & filter
  const filteredRecentOrders = useMemo(() => {
    return orders.filter(o => {
      const q = recentSearch.toLowerCase();
      const matchesQuery =
        !recentSearch ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customer.firstName.toLowerCase().includes(q) ||
        o.customer.lastName.toLowerCase().includes(q) ||
        o.customer.phone.includes(q);
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchesQuery && matchesStatus;
    }).slice(0, 8);
  }, [orders, recentSearch, statusFilter]);

  // Export CSV function
  const exportExecutiveCSV = () => {
    const headers = ['Order Number', 'Date', 'Customer Name', 'Phone', 'Total', 'Payment Status', 'Fulfillment Status'];
    const rows = orders.map(o => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleDateString('en-US'),
      `"${o.customer.firstName} ${o.customer.lastName}"`,
      o.customer.phone,
      o.total.toFixed(2),
      o.paymentStatus,
      o.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `store_performance_summary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusBadgeStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'confirmed':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'processing':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'shipped':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'delivered':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'cancelled':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      {/* Executive Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Executive Dashboard</h1>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE DATA
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time performance metrics and store operations summary.
          </p>
        </div>

        {/* Toolbar: Time Period Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period selector */}
          <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            {(['7d', '30d', '90d', 'all'] as PeriodOption[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs font-mono font-medium rounded-lg transition-all ${
                  period === p
                    ? 'bg-rose-gold text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : 'All Time'}
              </button>
            ))}
          </div>

          <button
            onClick={exportExecutiveCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium text-slate-200 hover:text-white transition-all"
          >
            <Download size={13} className="text-slate-400" />
            <span>Export CSV</span>
          </button>

          <Link
            to="/admin/products"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-gold text-white text-xs font-semibold hover:bg-rose-gold/90 transition-all shadow-sm"
          >
            <span>+ Add Product</span>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="p-5 rounded-2xl bg-[#121520] border border-white/[0.08] relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Gross Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
              {SITE.currency.symbol}{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="text-emerald-400 font-mono font-medium">{revenueOrders.length}</span>
              <span>paid transactions</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-5 rounded-2xl bg-[#121520] border border-white/[0.08] relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <ShoppingCart size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
              {totalOrders}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="text-amber-400 font-mono font-medium">{pendingOrders.length} pending</span>
              <span>·</span>
              <span className="text-emerald-400 font-mono font-medium">{deliveredOrders.length} delivered</span>
            </div>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="p-5 rounded-2xl bg-[#121520] border border-white/[0.08] relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Average Order Value</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <BarChart2 size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
              {SITE.currency.symbol}{averageOrderValue.toFixed(2)}
            </p>
            <p className="text-[11px] text-slate-400">Per completed basket</p>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="p-5 rounded-2xl bg-[#121520] border border-white/[0.08] relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Critical Inventory</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
              {lowStockProducts.length}
            </p>
            <p className="text-[11px] text-slate-400">Items with stock ≤ 10 units</p>
          </div>
        </div>
      </div>

      {/* Analytics Chart & Operations Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Order Velocity Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#121520] border border-white/[0.08] flex flex-col justify-between space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Sales & Order Velocity</h3>
              <p className="text-xs text-slate-400">6-month revenue and order volume trajectory</p>
            </div>

            {/* Mode switch */}
            <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] self-start sm:self-auto">
              <button
                onClick={() => setChartMode('revenue')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  chartMode === 'revenue'
                    ? 'bg-rose-gold text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Revenue ({SITE.currency.symbol})
              </button>
              <button
                onClick={() => setChartMode('orders')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  chartMode === 'orders'
                    ? 'bg-rose-gold text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Orders (#)
              </button>
            </div>
          </div>

          {/* Bar chart visualization */}
          <div className="flex items-end gap-3 sm:gap-6 h-52 pt-4 px-2">
            {monthlyData.map((data, index) => {
              const val = chartMode === 'revenue' ? data.revenue : data.count;
              const maxVal = chartMode === 'revenue' ? maxChartRevenue : maxChartOrders;
              const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;

              return (
                <div key={data.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-white/10 px-2 py-1 rounded text-[10px] font-mono text-slate-200 whitespace-nowrap pointer-events-none mb-1">
                    {chartMode === 'revenue' ? `${SITE.currency.symbol}${data.revenue.toFixed(2)}` : `${data.count} orders`}
                  </div>

                  <div className="w-full flex items-end h-full bg-white/[0.02] rounded-t-lg p-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(pct, val > 0 ? 6 : 2)}%` }}
                      transition={{ duration: 0.6, delay: index * 0.08 }}
                      className="w-full rounded-t-md bg-gradient-to-t from-rose-gold/60 to-rose-gold hover:brightness-125 transition-all"
                    />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 group-hover:text-white transition-colors">
                    {data.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fulfillment Pipeline */}
        <div className="p-6 rounded-2xl bg-[#121520] border border-white/[0.08] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-white">Order Pipeline</h3>
              <Link to="/admin/orders" className="text-xs text-rose-gold hover:underline flex items-center gap-0.5">
                <span>Manage</span>
                <ChevronRight size={12} />
              </Link>
            </div>
            <p className="text-xs text-slate-400 mb-4">Current order fulfillment status breakdown</p>

            <div className="space-y-2.5">
              {[
                { status: 'pending', label: 'Pending Review', count: orders.filter(o => o.status === 'pending').length, color: 'text-amber-400 bg-amber-500/10' },
                { status: 'processing', label: 'Processing & Packing', count: orders.filter(o => o.status === 'processing').length, color: 'text-purple-400 bg-purple-500/10' },
                { status: 'shipped', label: 'In Transit / Shipped', count: orders.filter(o => o.status === 'shipped').length, color: 'text-indigo-400 bg-indigo-500/10' },
                { status: 'delivered', label: 'Delivered Successfully', count: orders.filter(o => o.status === 'delivered').length, color: 'text-emerald-400 bg-emerald-500/10' },
                { status: 'cancelled', label: 'Cancelled / Refunded', count: cancelledOrders.length, color: 'text-rose-400 bg-rose-500/10' },
              ].map((st) => (
                <Link
                  key={st.status}
                  to={`/admin/orders`}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${st.color.split(' ')[0].replace('text-', 'bg-')}`} />
                    <span className="text-xs text-slate-300 group-hover:text-white transition-colors">{st.label}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${st.color}`}>
                    {st.count}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
            <span>Fulfillment Health</span>
            <span className="font-mono text-emerald-400 font-semibold">
              {orders.length > 0 ? `${((deliveredOrders.length / orders.length) * 100).toFixed(0)}% delivered` : '100% nominal'}
            </span>
          </div>
        </div>
      </div>

      {/* Stock Watchlist & High-Density Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Inventory Watchlist */}
        <div className="p-6 rounded-2xl bg-[#121520] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-400" />
              <span>Low Inventory Watchlist</span>
            </h3>
            <Link to="/admin/inventory" className="text-xs text-rose-gold hover:underline">
              View All
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="py-8 text-center text-slate-500 space-y-2">
              <CheckCircle2 size={24} className="mx-auto text-emerald-400" />
              <p className="text-xs text-slate-400 font-medium">All items well stocked</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-black/40 overflow-hidden flex-shrink-0 border border-white/10 flex items-center justify-center text-slate-500">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={16} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white truncate">{p.name}</p>
                      <p className="text-[10px] font-mono text-slate-400">
                        {SITE.currency.symbol}{p.price.toFixed(2)} · {p.category}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                      p.stock <= 3 ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {p.stock} left
                    </span>
                    <div className="w-16 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${p.stock <= 3 ? 'bg-rose-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min((p.stock / 10) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* High-Density Recent Transactions Table */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#121520] border border-white/[0.08] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
              <p className="text-xs text-slate-400">Live order activity and customer details</p>
            </div>

            {/* Search filter */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter by customer or order..."
                  value={recentSearch}
                  onChange={e => setRecentSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-rose-gold w-44 sm:w-56"
                />
              </div>

              <Link
                to="/admin/orders"
                className="text-xs text-rose-gold hover:underline whitespace-nowrap"
              >
                View All Orders ↗
              </Link>
            </div>
          </div>

          {filteredRecentOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <ShoppingBag size={28} className="mx-auto text-slate-600" />
              <p className="text-xs text-slate-400">No orders match your filter criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-white/[0.08] text-slate-400 font-mono">
                    <th className="py-2.5 px-3">Order #</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {filteredRecentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-3 px-3 font-mono font-semibold text-white">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-medium text-slate-200">{order.customer.firstName} {order.customer.lastName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{order.customer.phone}</p>
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                        {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border capitalize ${statusBadgeStyle(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-white tabular-nums">
                        {SITE.currency.symbol}{order.total.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedOrderModal(order)}
                          className="p-1 rounded-lg bg-white/[0.05] hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                          title="Quick preview order details"
                        >
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Order Quick Preview Modal */}
      <AnimatePresence>
        {selectedOrderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121520] border border-white/10 rounded-2xl p-6 max-w-lg w-full text-slate-200 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="font-bold text-white text-base font-mono">{selectedOrderModal.orderNumber}</h3>
                  <p className="text-xs text-slate-400">
                    Placed on {new Date(selectedOrderModal.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrderModal(null)}
                  className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-white/10"
                >
                  ✕ Close
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                  <p className="text-slate-400 font-mono">CUSTOMER INFORMATION</p>
                  <p className="text-white font-semibold">{selectedOrderModal.customer.firstName} {selectedOrderModal.customer.lastName}</p>
                  <p className="text-slate-300 font-mono">{selectedOrderModal.customer.phone}</p>
                  <p className="text-slate-400">{selectedOrderModal.customer.address}, {selectedOrderModal.customer.city}</p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-slate-400 font-mono">ORDERED ITEMS ({selectedOrderModal.items.length})</p>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                    {selectedOrderModal.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-white/5">
                        <div>
                          <p className="text-white font-medium">{item.productName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {item.size ? `Size: ${item.size}` : ''} {item.color ? `· Color: ${item.color}` : ''}
                          </p>
                        </div>
                        <p className="font-mono text-white">{item.quantity} x {SITE.currency.symbol}{item.price.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-white/10 text-sm font-bold">
                  <span>Total Amount</span>
                  <span className="font-mono text-emerald-400">{SITE.currency.symbol}{selectedOrderModal.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Link
                  to="/admin/orders"
                  className="px-4 py-2 rounded-xl bg-rose-gold text-white font-semibold text-xs text-center w-full block hover:bg-rose-gold/90 transition-all"
                >
                  Full Order Details & Invoice Generator ↗
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

AdminDashboard.getLayout = function getLayout(page: React.ReactElement) {
  return <AdminAuthLayout>{page}</AdminAuthLayout>;
};

export default AdminDashboard;
