/* ===================================================
   Customer Floating Live Chatbox Widget
   Renders a floating chat widget on customer-facing pages.
   Allows customers to chat with AI or live human support agents,
   with real-time updates when admin switches modes or replies.
   =================================================== */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, X, Send, Bot, User, Sparkles, RefreshCw,
  CheckCheck, Headphones, ShieldCheck, ArrowRight, Minimize2, ChevronDown
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'agent' | 'system';
  text: string;
  timestamp: string;
}

interface Conversation {
  sessionId: string;
  customerName: string;
  mode: 'ai' | 'manual';
  messages: ChatMessage[];
  unreadForCustomer: number;
}

const QUICK_ACTIONS = [
  { label: '📦 Track My Order', text: 'I want to track my order status.' },
  { label: '🚚 Delivery & Charges', text: 'What are your delivery charges and shipping time?' },
  { label: '✨ Bestselling Sarees', text: 'Can you show me your bestselling saree collections?' },
  { label: '👤 Talk to Human Agent', text: 'I would like to speak directly with a human customer support agent.' },
];

export const CustomerFloatingChatbox: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [unreadBadge, setUnreadBadge] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize persistent session ID
  useEffect(() => {
    let sid = localStorage.getItem('shiny_customer_chat_session_id');
    if (!sid) {
      sid = 'session_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('shiny_customer_chat_session_id', sid);
    }
    setSessionId(sid);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch conversation state
  const fetchConversation = useCallback(async () => {
    if (!sessionId) return;
    try {
      setPolling(true);
      const res = await fetch(`/api/customer-chat?sessionId=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.conversation) {
          setConversation(data.conversation);
          if (!isOpen && data.conversation.unreadForCustomer > 0) {
            setUnreadBadge(data.conversation.unreadForCustomer);
          } else if (isOpen) {
            setUnreadBadge(0);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch chat conversation:', err);
    } finally {
      setPolling(false);
    }
  }, [sessionId, isOpen]);

  // Initial fetch and polling loop
  useEffect(() => {
    if (!sessionId) return;
    fetchConversation();

    // Poll every 4 seconds for live updates (e.g. when admin replies)
    const interval = setInterval(fetchConversation, 4000);
    return () => clearInterval(interval);
  }, [sessionId, fetchConversation]);

  // Scroll on message updates
  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [conversation?.messages, isOpen, isMinimized]);

  // Handle message submission
  const handleSend = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || !sessionId || loading) return;

    if (!customText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/customer-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: textToSend,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.conversation) {
          setConversation(data.conversation);
        }
      }
    } catch (err) {
      console.error('Error sending customer message:', err);
    } finally {
      setLoading(false);
    }
  };

  const isManual = conversation?.mode === 'manual';

  return (
    <div className="fixed bottom-5 right-5 z-[999] flex flex-col items-end">
      {/* Expanded Floating Chatbox Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`w-[350px] sm:w-[400px] rounded-3xl bg-white border border-rose-gold/30 shadow-2xl flex flex-col overflow-hidden mb-3 transition-all ${
              isMinimized ? 'h-16' : 'h-[520px] sm:h-[560px]'
            }`}
          >
            {/* Header Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#1A1215] via-[#2A1D22] to-[#1A1215] text-white border-b border-rose-gold/20">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-gold to-purple-600 flex items-center justify-center text-white shadow-md">
                    {isManual ? <Headphones size={18} /> : <Sparkles size={18} />}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#1A1215]" />
                </div>

                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-white tracking-wide truncate flex items-center gap-1.5">
                    <span>Shiny Shades Support</span>
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span
                      className={`px-1.5 py-0.2 rounded-full font-mono font-medium ${
                        isManual
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                          : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                      }`}
                    >
                      {isManual ? '👤 Human Agent Mode' : '🤖 AI Assistant Mode'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  title={isMinimized ? 'Expand Chatbox' : 'Minimize Chatbox'}
                >
                  {isMinimized ? <ChevronDown size={16} /> : <Minimize2 size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-300 hover:text-rose-300 hover:bg-white/10 rounded-xl transition-colors"
                  title="Close Chatbox"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Content Area (Hidden if Minimized) */}
            {!isMinimized && (
              <div className="flex-1 flex flex-col min-h-0 bg-[#FFFDFE]">
                {/* Mode Indicator Banner */}
                <div
                  className={`px-4 py-2 text-[11px] font-medium flex items-center justify-between border-b ${
                    isManual
                      ? 'bg-amber-50 text-amber-800 border-amber-200/60'
                      : 'bg-rose-50/70 text-rose-900 border-rose-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {isManual ? (
                      <>
                        <Headphones size={13} className="text-amber-600 shrink-0" />
                        <span className="truncate">Connected to Live Support Agent. We are ready to help!</span>
                      </>
                    ) : (
                      <>
                        <Bot size={13} className="text-rose-gold shrink-0" />
                        <span className="truncate">AI Assistant active. Instant answers for products & orders.</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Messages Transcript */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
                  {conversation?.messages.map((msg) => {
                    const isUser = msg.sender === 'user';
                    const isSystem = msg.sender === 'system';
                    const isAgent = msg.sender === 'agent';

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="my-2 text-center">
                          <span className="inline-block px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] text-slate-600 font-medium shadow-xs">
                            {msg.text}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2 max-w-[88%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                      >
                        {/* Avatar */}
                        <div
                          className={`w-6 h-6 rounded-xl flex-shrink-0 flex items-center justify-center text-[10px] font-bold shadow-xs ${
                            isUser
                              ? 'bg-gradient-to-tr from-rose-gold to-purple-600 text-white'
                              : isAgent
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-800 text-rose-gold border border-slate-700'
                          }`}
                        >
                          {isUser ? <User size={12} /> : isAgent ? <Headphones size={12} /> : <Bot size={12} />}
                        </div>

                        {/* Content */}
                        <div className="space-y-1 min-w-0">
                          <div
                            className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                              isUser
                                ? 'bg-gradient-to-r from-rose-gold via-[#B76E79] to-purple-600 text-white rounded-tr-none shadow-md'
                                : isAgent
                                ? 'bg-amber-500 text-white rounded-tl-none shadow-md font-medium'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-xs'
                            }`}
                          >
                            {msg.text}
                          </div>

                          <div
                            className={`flex items-center gap-1 text-[9px] text-slate-400 font-mono px-1 ${
                              isUser ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            {!isUser && (
                              <span className="font-semibold text-slate-500">
                                {isAgent ? 'Support Agent' : 'AI Assistant'} ·
                              </span>
                            )}
                            <span>{msg.timestamp}</span>
                            {isUser && <CheckCheck size={11} className="text-rose-gold" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing Indicator */}
                  {loading && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 p-2.5 bg-white rounded-2xl border border-slate-200 shadow-xs w-fit">
                      <RefreshCw size={12} className="animate-spin text-rose-gold" />
                      <span>{isManual ? 'Support agent typing...' : 'AI thinking...'}</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Action Prompt Chips */}
                {(!conversation?.messages || conversation.messages.length <= 2) && (
                  <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        onClick={() => handleSend(action.text)}
                        disabled={loading}
                        className="px-2.5 py-1 rounded-xl bg-white border border-rose-gold/20 hover:border-rose-gold text-[10px] text-slate-700 font-medium whitespace-nowrap shadow-xs hover:shadow-sm transition-all flex items-center gap-1 shrink-0"
                      >
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Input Controls */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      isManual
                        ? 'Type message for support agent...'
                        : 'Ask AI about sarees, orders, shipping...'
                    }
                    disabled={loading}
                    className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="p-2.5 rounded-2xl bg-gradient-to-r from-rose-gold to-purple-600 text-white hover:opacity-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-md shadow-rose-gold/20"
                    title="Send Message"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (FAB) Launcher */}
      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          type="button"
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
            setUnreadBadge(0);
          }}
          className="relative group p-3.5 sm:p-4 rounded-3xl bg-gradient-to-tr from-rose-gold via-[#B76E79] to-purple-600 text-white shadow-xl shadow-rose-gold/30 hover:shadow-2xl hover:shadow-rose-gold/50 border border-white/30 transition-all flex items-center gap-2.5"
        >
          {/* Live Ping Pulse */}
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full" />

          {/* Unread Badge Count */}
          {unreadBadge > 0 && (
            <span className="absolute -top-2 -left-2 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold shadow-md border border-white animate-bounce">
              {unreadBadge}
            </span>
          )}

          <div className="p-1 rounded-xl bg-white/20">
            <MessageSquare size={20} className="group-hover:rotate-6 transition-transform duration-300" />
          </div>

          <div className="text-left hidden sm:block pr-1">
            <p className="text-xs font-bold leading-tight tracking-wide">Live Chat</p>
            <p className="text-[10px] opacity-80 font-mono">Ask AI or Agent</p>
          </div>
        </motion.button>
      )}
    </div>
  );
};
