/**
 * Agent API Keys management — admin-only.
 *
 * CRUD for the API keys external AI agents use to call /api/agent/website.
 * Key generation uses crypto.randomBytes; the raw key is returned once at
 * creation and never stored (only its sha256 hash is kept).
 */

import { requireAdmin } from '../_lib/requireAdmin.js';
import crypto from 'crypto';

function hashKey(raw) {
    return crypto.createHash('sha256').update(raw).digest('hex');
}

function generateKey() {
    return `sk_live_${crypto.randomBytes(24).toString('hex')}`;
}

export default async function handler(req, res) {
    const method = req.method;
    if (method !== 'GET' && method !== 'POST' && method !== 'PUT' && method !== 'DELETE') {
        res.setHeader('Allow', 'GET, POST, PUT, DELETE');
        return res.status(405).json({ error: 'Method not allowed', code: 'method_not_allowed' });
    }

    const auth = await requireAdmin(req, res);
    if (!auth.ok) return;

    const { supabase, admin } = auth;

    if (method === 'GET') {
        // List all keys (masked)
        const { data, error } = await supabase
            .from('agent_api_keys')
            .select('id, label, permissions, created_by, created_at, last_used_at, is_active')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[agent-keys] list failed:', error);
            return res.status(500).json({ error: 'Failed to list keys.', code: 'server_error' });
        }

        return res.status(200).json({ keys: data || [] });
    }

    if (method === 'POST') {
        // Create a new key
        const { label, permissions } = req.body || {};
        if (!label) {
            return res.status(400).json({ error: 'label is required', code: 'bad_request' });
        }

        const rawKey = generateKey();
        const keyHash = hashKey(rawKey);

        const keyPermissions = permissions || { read: true, write: false, analytics: true };
        // Only super_admins can create write-capable keys
        if (keyPermissions.write && admin.role !== 'super_admin') {
            return res.status(403).json({ error: 'Only super admins can create write keys.', code: 'forbidden' });
        }

        const { data, error } = await supabase
            .from('agent_api_keys')
            .insert({
                label: String(label),
                key_hash: keyHash,
                permissions: keyPermissions,
                created_by: admin.id,
            })
            .select('id, label, permissions, created_at')
            .single();

        if (error) {
            console.error('[agent-keys] create failed:', error);
            return res.status(500).json({ error: 'Failed to create key.', code: 'server_error' });
        }

        return res.status(201).json({
            ok: true,
            key: { id: data.id, label: data.label, created_at: data.created_at },
            apiKey: rawKey, // returned once, never again
        });
    }

    if (method === 'PUT') {
        const { id, label, permissions, isActive } = req.body || {};
        if (!id) {
            return res.status(400).json({ error: 'id is required', code: 'bad_request' });
        }

        const updates = {};
        if (label !== undefined) updates.label = String(label);
        if (permissions !== undefined) {
            // Only super_admins can grant write access
            if (permissions.write && admin.role !== 'super_admin') {
                return res.status(403).json({ error: 'Only super admins can grant write access.', code: 'forbidden' });
            }
            updates.permissions = permissions;
        }
        if (isActive !== undefined) updates.is_active = isActive;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'Nothing to update.', code: 'bad_request' });
        }

        const { data, error } = await supabase
            .from('agent_api_keys')
            .update(updates)
            .eq('id', id)
            .select('id, label, permissions, is_active, created_at')
            .single();

        if (error) {
            console.error('[agent-keys] update failed:', error);
            return res.status(500).json({ error: 'Failed to update key.', code: 'server_error' });
        }

        return res.status(200).json({ ok: true, key: data });
    }

    if (method === 'DELETE') {
        const { id } = req.body || {};
        if (!id) {
            return res.status(400).json({ error: 'id is required', code: 'bad_request' });
        }

        // Hard delete — key is immediately revoked, no recovery
        const { error } = await supabase.from('agent_api_keys').delete().eq('id', id);
        if (error) {
            console.error('[agent-keys] delete failed:', error);
            return res.status(500).json({ error: 'Failed to delete key.', code: 'server_error' });
        }

        return res.status(200).json({ ok: true, deleted: id });
    }

    return res.status(405).json({ error: 'Method not allowed', code: 'method_not_allowed' });
}
