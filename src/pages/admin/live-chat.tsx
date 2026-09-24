/* ===================================================
   Admin Live Customer Chat Console
   Full-screen management dashboard for live customer conversations.
   Features custom per-conversation mode toggle (AI Mode vs Manual Mode),
   global mode switch, live message stream, quick reply templates,
   and unread badge monitoring.
   =================================================== */

import React, { useState, useEffect, useCallback, useRef, type ReactElement } from 'react';
import { AdminAuthLayout } from '@/components/layout/AdminAuthLayout';
import { Button } from '@/components/ui';
import {
  MessageSquare, Bot, Headphones, Search, Send, RefreshCw, Trash2, Sparkles,
  User, CheckCheck, AlertCircle, ShieldCheck, Clock, Settings, ShieldAlert, Zap
} from 'lucide-react';
import type { NextPageWithLayout } from '@/types/layout';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'agent' | 'system';
  text: string;
  timestamp: string;
}

interface Conversation {
  sessionId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  mode: 'ai' | 'manual';
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  unreadForAdmin: number;
}

const PRESET_REPLIES = [
  'Hello! Welcome to Shiny Shades support. How can I assist you with your order today?',
  'Could you please share your Order Number or registered Phone Number so I can check your status?',
  'Our inside Dhaka delivery fee is ৳80 (1-2 days) and outside Dhaka is ৳150 (2-4 days via courier).',
  'We accept Cash on Delivery (COD), bKash, and Nagad. All items come with 7-day exchange guarantee.',
  'Your order has been confirmed and is currently being processed for delivery!',
];

export const AdminLiveChatPage: NextPageWithLayout = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [globalMode, setGlobalMode] = useState<'ai' | 'manual'>('ai');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'ai' | 'manual'>('all');

  const [inputReply, setInputReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.sessionId === activeSessionId);

  // Fetch all conversations from server API
  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch('/api/customer-chat/manage');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        if (data.globalMode) setGlobalMode(data.globalMode);

        // Auto select first conversation if none selected
        if (!activeSessionId && data.conversations && data.conversations.length > 0) {
          setActiveSessionId(data.conversations[0].sessionId);
        }
      }
    } catch (err) {
      console.error('Failed to load customer conversations:', err);
    }
  }, [activeSessionId]);

  // Initial load & Polling loop
  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 3000);
    return () => clearInterval(interval);
  }, [fetchChats]);

  // Scroll active chat thread on message updates
  useEffect(() => {
    if (activeConv?.messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConv?.messages]);

  // Toggle mode for the specific selected conversation (Custom AI vs Manual)
  const toggleConversationMode = async (targetSessionId: string, newMode: 'ai' | 'manual') => {
    try {
      setLoading(true);
      const res = await fetch('/api/customer-chat/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_mode',
          sessionId: targetSessionId,
          mode: newMode,
        }),
      });

      if (res.ok) {
        await fetchChats();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to switch mode');
      }
    } catch (err: any) {
      setError(err.message || 'Mode switch failed');
    } finally {
      setLoading(false);
    }
  };

  // Toggle global default chat mode
  const toggleGlobalMode = async (newMode: 'ai' | 'manual') => {
    try {
      setLoading(true);
      const res = await fetch('/api/customer-chat/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_global_mode',
          mode: newMode,
        }),
      });

      if (res.ok) {
        setGlobalMode(newMode);
        await fetchChats();
      }
    } catch (err: any) {
      setError(err.message || 'Global mode switch failed');
    } finally {
      setLoading(false);
    }
  };

  // Send admin reply
  const handleSendReply = async (customText?: string) => {
    const textToSend = (customText || inputReply).trim();
    if (!textToSend || !activeSessionId || sending) return;

    if (!customText) setInputReply('');
    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/customer-chat/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_reply',
          sessionId: activeSessionId,
          message: textToSend,
        }),
      });

      if (res.ok) {
        await fetchChats();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Could not send reply');
      }
    } catch (err: any) {
      setError(err.message || 'Error sending reply');
    } finally {
      setSending(false);
    }
  };

  // Clear conversation
  const handleClearChat = async (targetSessionId: string) => {
    if (!confirm('Clear message history for this conversation?')) return;
    try {
      await fetch('/api/customer-chat/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clear_chat',
          sessionId: targetSessionId,
        }),
      });
      fetchChats();
    } catch (err) {
      console.error(err);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.sessionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.messages.some((m) => m.text.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterMode === 'unread') return c.unreadForAdmin > 0;
    if (filterMode === 'ai') return c.mode === 'ai';
    if (filterMode === 'manual') return c.mode === 'manual';
    return true;
  });

  return (
    <div className="space-y-5">
      {/* ── Control Header Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0D0F17] border border-white/10 p-6 text-white shadow-2xl backdrop-blur-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-rose-gold via-[#B76E79] to-purple-600 text-white shadow-lg shadow-rose-gold/25">
                <MessageSquare size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Customer Live Chat Console
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-400 border border-emerald-400/30 font-semibold">
                    REAL-TIME SYNC
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage floating website chat queries. Toggle customly between AI Auto-Reply and Human Manual Mode.
                </p>
              </div>
            </div>
          </div>

          {/* Global Mode Toggle Button */}
          <div className="flex items-center gap-3 bg-white/[0.04] p-2 rounded-2xl border border-white/10">
            <span className="text-xs font-medium text-slate-300 font-mono pl-2">
              Default New Chat Mode:
            </span>
            <div className="flex items-center bg-[#090A0F] p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => toggleGlobalMode('ai')}
                disabled={loading}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  globalMode === 'ai'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bot size={13} />
                <span>🤖 AI Mode</span>
              </button>
              <button
                type="button"
                onClick={() => toggleGlobalMode('manual')}
                disabled={loading}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  globalMode === 'manual'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Headphones size={13} />
                <span>👤 Manual Mode</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Split View Console ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[620px]">
        {/* Left Pane: Conversations List (4 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 rounded-3xl bg-[#0D0F17] border border-white/10 shadow-xl flex flex-col overflow-hidden">
          {/* Search & Filter Header */}
          <div className="p-4 border-b border-white/10 space-y-3 bg-[#131622]">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search session ID or message..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-gold/50"
              />
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar font-mono text-[11px]">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  filterMode === 'all'
                    ? 'bg-rose-gold text-white font-semibold'
                    : 'bg-white/[0.05] text-slate-400 hover:text-white'
                }`}
              >
                All ({conversations.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('unread')}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  filterMode === 'unread'
                    ? 'bg-red-500 text-white font-semibold'
                    : 'bg-white/[0.05] text-slate-400 hover:text-white'
                }`}
              >
                Unread ({conversations.filter((c) => c.unreadForAdmin > 0).length})
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('ai')}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  filterMode === 'ai'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-white/[0.05] text-slate-400 hover:text-white'
                }`}
              >
                🤖 AI
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('manual')}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  filterMode === 'manual'
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'bg-white/[0.05] text-slate-400 hover:text-white'
                }`}
              >
                👤 Manual
              </button>
            </div>
          </div>

          {/* Conversations List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.06] custom-scrollbar">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No active conversations matching your filter.
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.sessionId === activeSessionId;
                const lastMsg = conv.messages[conv.messages.length - 1];

                return (
                  <button
                    key={conv.sessionId}
                    type="button"
                    onClick={() => {
                      setActiveSessionId(conv.sessionId);
                      // mark read
                      fetch('/api/customer-chat/manage', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'mark_read', sessionId: conv.sessionId }),
                      }).then(() => fetchChats());
                    }}
                    className={`w-full text-left p-3.5 transition-all flex items-start gap-3 relative ${
                      isSelected
                        ? 'bg-white/[0.09] border-l-4 border-rose-gold'
                        : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    {/* Mode Avatar */}
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white shrink-0 font-bold text-xs shadow-md ${
                        conv.mode === 'manual'
                          ? 'bg-gradient-to-tr from-amber-500 to-orange-600'
                          : 'bg-gradient-to-tr from-emerald-500 to-teal-600'
                      }`}
                    >
                      {conv.mode === 'manual' ? <Headphones size={16} /> : <Bot size={16} />}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-200 truncate flex items-center gap-1.5">
                          <span>{conv.customerName}</span>
                          {conv.unreadForAdmin > 0 && (
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          )}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">
                          {lastMsg ? lastMsg.timestamp : ''}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 truncate">
                        {lastMsg ? lastMsg.text : 'No messages'}
                      </p>

                      <div className="flex items-center gap-2 pt-0.5">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-medium ${
                            conv.mode === 'manual'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {conv.mode === 'manual' ? '👤 Manual Support' : '🤖 AI Auto-Reply'}
                        </span>

                        {conv.unreadForAdmin > 0 && (
                          <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 text-[9px] font-mono font-bold border border-red-500/30">
                            {conv.unreadForAdmin} NEW
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Conversation Thread (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-3xl bg-[#0D0F17] border border-white/10 shadow-xl flex flex-col overflow-hidden min-h-[580px]">
          {activeConv ? (
            <>
              {/* Thread Header with Custom AI/Manual Mode Switcher */}
              <div className="p-4 bg-[#131622] border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md ${
                      activeConv.mode === 'manual'
                        ? 'bg-gradient-to-tr from-amber-500 to-orange-600'
                        : 'bg-gradient-to-tr from-emerald-500 to-teal-600'
                    }`}
                  >
                    {activeConv.mode === 'manual' ? <Headphones size={20} /> : <Bot size={20} />}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{activeConv.customerName}</span>
                      <span className="text-[10px] font-mono text-slate-400 font-normal">
                        ({activeConv.sessionId})
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Status:{' '}
                      <span
                        className={
                          activeConv.mode === 'manual' ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'
                        }
                      >
                        {activeConv.mode === 'manual'
                          ? '👤 Manual Mode (Human support agent active)'
                          : '🤖 AI Mode (Gemini AI auto-reply active)'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* CRITICAL CUSTOM MODE TOGGLE SWITCH FOR THIS CHAT */}
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <div className="p-1 rounded-2xl bg-[#090A0F] border border-white/10 flex items-center">
                    <button
                      type="button"
                      onClick={() => toggleConversationMode(activeConv.sessionId, 'ai')}
                      disabled={loading}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeConv.mode === 'ai'
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Switch this chat to AI Mode"
                    >
                      <Bot size={14} />
                      <span>AI Mode</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleConversationMode(activeConv.sessionId, 'manual')}
                      disabled={loading}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeConv.mode === 'manual'
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Switch this chat to Manual Support Mode"
                    >
                      <Headphones size={14} />
                      <span>Manual Mode</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleClearChat(activeConv.sessionId)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded-xl transition-colors"
                    title="Clear history"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Messages Display */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#090A0F] custom-scrollbar">
                {activeConv.messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const isSystem = msg.sender === 'system';
                  const isAgent = msg.sender === 'agent';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="my-3 text-center">
                        <span className="inline-block px-3 py-1 rounded-xl bg-white/[0.05] border border-white/10 text-[11px] text-slate-300 font-mono">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-[80%] ${
                        isUser ? 'mr-auto' : 'ml-auto flex-row-reverse'
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0 text-xs font-bold shadow-sm ${
                          isUser
                            ? 'bg-slate-800 border border-white/10 text-slate-300'
                            : isAgent
                            ? 'bg-gradient-to-tr from-amber-500 to-orange-600'
                            : 'bg-gradient-to-tr from-emerald-500 to-teal-600'
                        }`}
                      >
                        {isUser ? <User size={13} /> : isAgent ? <Headphones size={13} /> : <Bot size={13} />}
                      </div>

                      {/* Content */}
                      <div className="space-y-1 min-w-0">
                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-md ${
                            isUser
                              ? 'bg-[#131622] text-slate-200 border border-white/10 rounded-tl-none'
                              : isAgent
                              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-tr-none font-medium'
                              : 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-tr-none'
                          }`}
                        >
                          {msg.text}
                        </div>

                        <div
                          className={`flex items-center gap-1.5 text-[10px] text-slate-500 font-mono px-1 ${
                            isUser ? 'justify-start' : 'justify-end'
                          }`}
                        >
                          <span>
                            {isUser ? 'Customer' : isAgent ? 'Admin Support Agent' : 'AI Assistant'}
                          </span>
                          <span>· {msg.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Preset Quick Replies Bar */}
              <div className="px-4 py-2 bg-[#0D0F17] border-t border-white/[0.08] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider shrink-0 pr-1">
                  Quick Reply:
                </span>
                {PRESET_REPLIES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendReply(preset)}
                    disabled={sending}
                    className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] text-[10px] text-slate-300 hover:text-white font-medium whitespace-nowrap transition-colors shrink-0"
                  >
                    {preset.slice(0, 32)}...
                  </button>
                ))}
              </div>

              {/* Reply Input Dock */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendReply();
                }}
                className="p-4 bg-[#131622] border-t border-white/10 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputReply}
                  onChange={(e) => setInputReply(e.target.value)}
                  placeholder={
                    activeConv.mode === 'manual'
                      ? 'Type admin response to customer (Manual Mode)...'
                      : 'Type admin response (Override or send message)...'
                  }
                  disabled={sending}
                  className="flex-1 px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-gold/50 disabled:opacity-50"
                />

                <Button
                  type="submit"
                  size="md"
                  disabled={!inputReply.trim() || sending}
                  loading={sending}
                  className="h-11 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold shadow-lg shadow-amber-500/20 shrink-0"
                >
                  <Send size={15} />
                  <span>Send</span>
                </Button>
              </form>

              {error && (
                <div className="p-2.5 bg-red-500/10 border-t border-red-500/20 text-red-400 text-xs px-4">
                  {error}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <MessageSquare size={36} className="text-slate-600 mb-2" />
              <p className="text-sm font-medium">Select a customer conversation from the list</p>
              <p className="text-xs text-slate-600 mt-1">
                You can toggle AI Mode vs Manual Mode customly per conversation or globally.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

AdminLiveChatPage.getLayout = (page: ReactElement) => <AdminAuthLayout>{page}</AdminAuthLayout>;

export default AdminLiveChatPage;
