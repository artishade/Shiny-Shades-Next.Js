/* ===================================================
   - Admin AI Agent API Keys
   Manage API keys for external AI agents that connect
   to the website via /api/agent/website
   =================================================== */

import React, { useEffect, useState, type ReactElement } from 'react';
import { AdminAuthLayout } from '@/components/layout/AdminAuthLayout';
import { Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { Copy, Key, Shield, Eye, EyeOff, Trash2, Plus, Check } from 'lucide-react';
import type { NextPageWithLayout } from '@/types/layout';

interface AgentKey {
  id: string;
  label: string;
  permissions: { read: boolean; write: boolean; analytics: boolean };
  created_at: string;
  created_by?: { email: string };
  last_used_at?: string | null;
  is_active: boolean;
}

interface NewKeyResponse {
  ok: boolean;
  key: { id: string; label: string; created_at: string };
  apiKey: string;
}

const AgentKeysPage: NextPageWithLayout = () => {
  const [keys, setKeys] = useState<AgentKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewKey, setShowNewKey] = useState<NewKeyResponse | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newWrite, setNewWrite] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copyOk, setCopyOk] = useState(false);
  const [error, setError] = useState('');

  const loadKeys = async () => {
    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    if (!token) return;

    try {
      const res = await fetch('/api/agent-keys', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) setKeys(json.keys || []);
      else setError(json.error || 'Failed to load keys');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const createKey = async () => {
    if (!newLabel.trim()) return;
    setCreating(true);
    setError('');

    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;

    try {
      const res = await fetch('/api/agent-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          label: newLabel,
          permissions: { read: true, write: newWrite, analytics: true },
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setShowNewKey(json);
        setNewLabel('');
        setNewWrite(false);
        loadKeys();
      } else {
        setError(json.error || 'Failed to create key');
      }
    } catch {
      setError('Network error.');
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (key: AgentKey) => {
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;

    try {
      const res = await fetch('/api/agent-keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: key.id, isActive: !key.is_active }),
      });
      const json = await res.json();
      if (res.ok) {
        setKeys(keys.map((k) => (k.id === key.id ? { ...k, is_active: json.key.is_active } : k)));
      } else {
        setError(json.error || 'Failed to update key');
      }
    } catch {
      setError('Network error.');
    }
  };

  const deleteKey = async (key: AgentKey) => {
    if (!confirm(`Delete API key "${key.label}"? This cannot be undone.`)) return;

    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;

    try {
      const res = await fetch('/api/agent-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: key.id }),
      });
      const json = await res.json();
      if (res.ok) {
        setKeys(keys.filter((k) => k.id !== key.id));
      } else {
        setError(json.error || 'Failed to delete key');
      }
    } catch {
      setError('Network error.');
    }
  };

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopyOk(true);
    setTimeout(() => setCopyOk(false), 2000);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="heading-serif text-2xl md:text-3xl font-bold text-charcoal">
            AI Agent API Keys
          </h1>
          <p className="text-[#6B5B55] text-sm">
            Generate keys for external AI agents (Claude, Codex, etc.) to connect to your website
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
      )}

      {/* New Key Display (shown once after creation) */}
      {showNewKey && (
        <div className="mb-6 p-4 rounded-xl border-2 border-rose-gold bg-rose-gold/5">
          <h3 className="font-semibold text-charcoal mb-2">Your new API key</h3>
          <p className="text-xs text-[#6B5B55] mb-3">
            Store this securely — it will not be shown again.
          </p>
          <div className="flex items-center gap-2 mb-3">
            <code className="flex-1 px-3 py-2 bg-white border border-blush/30 rounded-lg text-xs font-mono break-all">
              {showNewKey.apiKey}
            </code>
            <Button size="sm" onClick={() => copyKey(showNewKey.apiKey)}>
              {copyOk ? <Check size={14} /> : <Copy size={14} />}
            </Button>
          </div>
          <p className="text-xs text-[#6B5B55]">
            Use this key as a bearer token: <code className="bg-white px-1 rounded">Authorization: Bearer</code>
          </p>
          <Button size="sm" variant="ghost" onClick={() => setShowNewKey(null)} className="mt-2">
            Dismiss
          </Button>
        </div>
      )}

      {/* Create New Key Form */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <h3 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
          <Plus size={16} />
          New API Key
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Label</label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Claude Code Agent, Claude.ai integration"
              className="w-full px-4 py-2.5 rounded-xl border border-blush/30 bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-rose-gold/30"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-charcoal mb-1">
              <Shield size={14} />
              Write permission
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newWrite}
                onChange={(e) => setNewWrite(e.target.checked)}
                className="rounded border-blush/40 text-rose-gold focus:ring-rose-gold"
              />
              Allow create/update/delete operations
            </label>
            <p className="text-xs text-[#6B5B55] mt-1">
              Read+analytics-only is safer for analysis tasks. Write is needed for
              products, categories, and coupons creation.
            </p>
          </div>
        </div>
        <Button
          onClick={createKey}
          loading={creating}
          disabled={!newLabel.trim() || creating}
          className="mt-4"
        >
          Generate Key
        </Button>
      </div>

      {/* Existing Keys */}
      <div className="bg-white rounded-2xl border border-blush/10 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-blush/10">
          <h3 className="font-semibold text-charcoal">Active Keys</h3>
        </div>

        {loading ? (
          <div className="p-6 text-center text-[#6B5B55]">Loading…</div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center text-[#6B5B55]">
            <Key size={32} className="mx-auto mb-2 opacity-30" />
            <p>No API keys yet. Create one above to let AI agents connect to your website.</p>
          </div>
        ) : (
          <div className="divide-y divide-blush/10">
            {keys.map((key) => (
              <div key={key.id} className="p-4 hover:bg-blush-light/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Key size={16} className="text-rose-gold" />
                    <div>
                      <span className="font-medium text-charcoal">{key.label}</span>
                      <span
                        className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                          key.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {key.is_active ? 'active' : 'disabled'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(key)}
                      title={key.is_active ? 'Disable key' : 'Enable key'}
                    >
                      {key.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteKey(key)}
                      title="Delete key"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#6B5B55]">
                  <span>
                    Permissions: read={key.permissions.read ? '✓' : '✗'},
                    analytics={key.permissions.analytics ? '✓' : '✗'},
                    write={key.permissions.write ? '✓' : '✗'}
                  </span>
                  <span>Created: {new Date(key.created_at).toLocaleString()}</span>
                  {key.last_used_at && <span>Last used: {new Date(key.last_used_at).toLocaleString()}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Docs Summary */}
      <div className="mt-6 glass-card rounded-2xl p-6">
        <h3 className="font-semibold text-charcoal mb-3">API Usage</h3>
        <p className="text-sm text-[#6B5B55] mb-2">
          External agents call <code className="bg-white px-1.5 py-0.5 rounded text-xs">/api/agent/website</code> with their bearer token.
        </p>
        <p className="text-xs text-[#6B5B55]">
          Actions: analyze, metrics, products, orders, categories, config, create, update, delete.
          See the docs at /agent-api.
        </p>
      </div>
    </div>
  );
};

AgentKeysPage.getLayout = function getLayout(page: ReactElement) {
  return <AdminAuthLayout>{page}</AdminAuthLayout>;
};

export default AgentKeysPage;
