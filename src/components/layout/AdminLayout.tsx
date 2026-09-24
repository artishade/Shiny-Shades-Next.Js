/* ===================================================
   - Admin Layout (Enterprise SaaS Command Center)
   - Inspired by Linear, Stripe & Raycast
   - High-density, dark-first, clean typographic hierarchy
   =================================================== */

import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from '@/lib/routerCompat';
import { m as motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, FolderOpen, ShoppingCart, Users,
  FileText, Ticket, BarChart3, AlertTriangle, LogOut, Menu, KeyRound, Sparkles, PenLine,
  ExternalLink, Search, CheckCircle, ChevronRight, Layers, Store, Command, MessageSquare
} from 'lucide-react';
import { useAdminAuthStore } from '@/store';
import { BRAND } from '@/config/brandingConfig';
import { FloatingAdminChat } from '@/components/admin/FloatingAdminChat';

interface NavGroup {
  groupName: string;
  items: {
    label: string;
    path: string;
    icon: React.ElementType;
    badge?: string | number | null;
  }[];
}

const navigationGroups: NavGroup[] = [
  {
    groupName: 'CORE OPERATIONS',
    items: [
      { label: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Customer Live Chat', path: '/admin/live-chat', icon: MessageSquare, badge: 'Live' },
      { label: 'Orders', path: '/admin/orders', icon: ShoppingCart },
      { label: 'Products', path: '/admin/products', icon: Package },
      { label: 'Categories', path: '/admin/categories', icon: FolderOpen },
      { label: 'Inventory Watch', path: '/admin/inventory', icon: AlertTriangle },
    ],
  },
  {
    groupName: 'COMMERCE & CONTENT',
    items: [
      { label: 'Customers', path: '/admin/customers', icon: Users },
      { label: 'Coupons', path: '/admin/coupons', icon: Ticket },
      { label: 'Content CMS', path: '/admin/content', icon: FileText },
      { label: 'Analytics Reports', path: '/admin/reports', icon: BarChart3 },
    ],
  },
  {
    groupName: 'INTELLIGENCE & CONFIG',
    items: [
      { label: 'AI Copilot Chat', path: '/admin/ai-chat', icon: Sparkles, badge: 'v3.5' },
      { label: 'AI Prompts', path: '/admin/ai-prompts', icon: PenLine },
      { label: 'API Keys', path: '/admin/api-keys', icon: KeyRound },
    ],
  },
];

export const AdminLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  const currentPageLabel = navigationGroups
    .flatMap((g) => g.items)
    .find((item) => item.path === location.pathname)?.label || 'Overview';

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0D0F17] text-slate-300 border-r border-white/[0.08] shadow-2xl selection:bg-rose-gold/30">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/[0.08]">
        <Link to="/admin/dashboard" className="block group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-gold via-purple-600 to-indigo-600 p-0.5 shadow-md shadow-rose-gold/20">
              <div className="w-full h-full bg-[#0D0F17] rounded-[10px] flex items-center justify-center">
                <Store size={15} className="text-rose-gold group-hover:scale-110 transition-transform duration-200" />
              </div>
            </div>
            <div>
              <h2 className="font-semibold text-sm text-white tracking-tight flex items-center gap-1.5">
                {BRAND.nameTop}
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-gold/20 text-rose-gold border border-rose-gold/30">
                  ADMIN
                </span>
              </h2>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                {BRAND.nameBottom}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Grouped Navigation */}
      <nav className="flex-1 p-3 space-y-6 overflow-y-auto custom-scrollbar">
        {navigationGroups.map((group) => (
          <div key={group.groupName} className="space-y-1">
            <div className="px-3 text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {group.groupName}
            </div>
            {group.items.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-white/[0.08] text-white font-semibold border border-white/10 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r-full bg-rose-gold shadow-[0_0_8px_#B76E79]" />
                  )}
                  <div className="flex items-center gap-2.5">
                    <Icon
                      size={15}
                      className={`transition-colors duration-150 ${
                        isActive ? 'text-rose-gold' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <span className="tracking-wide">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-rose-gold/20 text-rose-gold border border-rose-gold/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Admin User Footer */}
      <div className="p-3.5 border-t border-white/[0.08] bg-[#090B11]">
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-gold/30 to-purple-500/30 border border-white/10 flex items-center justify-center text-xs font-semibold text-white">
              {admin?.name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{admin?.name || 'Store Admin'}</p>
              <p className="text-[10px] text-slate-500 truncate font-mono">
                {admin?.email || 'admin@store.com'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors"
            title="Sign out of admin console"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#090A0F] text-slate-200 relative selection:bg-rose-gold/30 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed left-0 top-0 bottom-0 w-64 z-50 lg:hidden shadow-2xl"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="lg:pl-60 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-[#0D0F17]/90 backdrop-blur-xl border-b border-white/[0.08]">
          <div className="flex items-center justify-between h-14 px-4 sm:px-6">
            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Open navigation sidebar"
            >
              <Menu size={18} />
            </button>

            {/* Breadcrumb Trail */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="text-slate-500">Shiny Shades</span>
              <ChevronRight size={12} className="text-slate-600" />
              <span className="text-white font-medium">{currentPageLabel}</span>
            </div>

            {/* Status & Search Command Bar */}
            <div className="flex items-center gap-3 ml-auto">
              {/* Command bar shortcut */}
              <button
                type="button"
                onClick={() => navigate('/admin/products')}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-slate-400 transition-all"
              >
                <Search size={13} className="text-slate-500" />
                <span>Search catalog or orders...</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-slate-300">⌘K</kbd>
              </button>

              <Link
                to="/admin/ai-chat"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-gold to-purple-600 text-white text-xs font-medium shadow-md shadow-rose-gold/20 hover:opacity-95 transition-all"
              >
                <Sparkles size={13} />
                <span>AI Copilot</span>
              </Link>

              <Link
                to="/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium text-slate-300 hover:text-white transition-all"
              >
                <span>Storefront</span>
                <ExternalLink size={12} className="text-slate-500" />
              </Link>
            </div>
          </div>
        </header>

        {/* Page Main Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Floating AI Copilot Chatbox */}
      <FloatingAdminChat />
    </div>
  );
};
