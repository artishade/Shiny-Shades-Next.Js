/* ===================================================
   Shiny Shades - Floating AI Copilot Chatbox
   Floating widget in bottom-right corner of Admin Panel
   =================================================== */

import React, { useState, useRef, useEffect } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, X, Send, Bot, User, Minimize2, Maximize2, Trash2, RefreshCw, AlertCircle, MessageSquare
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'How many orders today?',
  'Which products are low in stock?',
  'What is our total revenue this month?',
  'Give me an operational summary',
];

export const FloatingAdminChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: 'Hello! I am your AI Store Copilot. Ask me anything about orders, products, revenue, or low stock alerts.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSend = async (customPrompt?: string) => {
    const text = (customPrompt || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!customPrompt) setInput('');
    setError(null);
    setLoading(true);

    try {
      // Build request body matching /api/ai-chat format
      const apiMessages = newMessages
        .filter((m) => m.id !== 'welcome-1')
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to communicate with AI Copilot');
      }

      const replyText = data.reply || data.text || data.message || 'No reply received.';

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setError(err.message || 'Error processing request');
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome-1',
        role: 'assistant',
        content: 'Chat cleared! How can I assist you with store operations?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setError(null);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Floating Chatbox Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`w-[360px] sm:w-[420px] rounded-2xl bg-[#0D0F17] border border-white/10 shadow-2xl flex flex-col overflow-hidden mb-3 ${
              isMinimized ? 'h-14' : 'h-[520px]'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#131622] border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-rose-gold to-purple-600 flex items-center justify-center text-white shadow-xs">
                  <Sparkles size={14} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span>AI Copilot</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </h3>
                  <p className="text-[9px] font-mono text-slate-400">STORE ASSISTANT</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={clearChat}
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/10 rounded-lg transition-colors"
                  title="Clear conversation"
                >
                  <Trash2 size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/10 rounded-lg transition-colors"
                  title={isMinimized ? 'Expand' : 'Minimize'}
                >
                  {isMinimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors"
                  title="Close chatbox"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Content (Hidden when minimized) */}
            {!isMinimized && (
              <div className="flex-1 flex flex-col min-h-0 bg-[#090A0F]">
                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 max-w-[88%] ${
                        msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${
                          msg.role === 'user'
                            ? 'bg-rose-gold text-white'
                            : 'bg-white/10 text-slate-300 border border-white/10'
                        }`}
                      >
                        {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                            msg.role === 'user'
                              ? 'bg-rose-gold text-white rounded-tr-none shadow-sm'
                              : 'bg-[#131622] text-slate-200 border border-white/[0.08] rounded-tl-none'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span
                          className={`block text-[9px] font-mono text-slate-500 px-1 ${
                            msg.role === 'user' ? 'text-right' : 'text-left'
                          }`}
                        >
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {loading && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 p-2 bg-[#131622] rounded-xl border border-white/5 w-fit">
                      <RefreshCw size={12} className="animate-spin text-rose-gold" />
                      <span>Copilot analyzing store data...</span>
                    </div>
                  )}

                  {/* Error notice */}
                  {error && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                      <AlertCircle size={14} className="flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Prompts Suggestions */}
                {messages.length < 4 && (
                  <div className="px-3 py-2 border-t border-white/[0.06] bg-[#0D0F17] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handleSend(prompt)}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[10px] text-slate-300 hover:text-white whitespace-nowrap transition-colors flex-shrink-0"
                      >
                        {prompt}
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
                  className="p-3 bg-[#131622] border-t border-white/[0.08] flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask Copilot about orders, revenue, inventory..."
                    disabled={loading}
                    className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-gold/50 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="p-2 rounded-xl bg-rose-gold text-white hover:bg-rose-gold/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-sm"
                  >
                    <Send size={13} />
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button (FAB) */}
      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="relative group p-3.5 rounded-2xl bg-gradient-to-tr from-rose-gold via-purple-600 to-indigo-600 text-white shadow-xl shadow-rose-gold/25 hover:shadow-2xl hover:shadow-rose-gold/40 border border-white/20 transition-all flex items-center gap-2"
        >
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-[#090A0F] rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-[#090A0F] rounded-full" />
          <Sparkles size={18} className="group-hover:rotate-12 transition-transform duration-300" />
          <span className="text-xs font-semibold tracking-wide pr-1 hidden sm:inline-block">AI Copilot</span>
        </motion.button>
      )}
    </div>
  );
};
