/**
 * Agent API key authentication.
 *
 * External AI agents (Claude, Codex, etc.) call the connection endpoints
 * with a bearer token. The key is hashed (sha256) before lookup so the raw
 * key never appears in logs or Supabase.
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

let serviceClient = null;
function getClient() {
    if (!serviceClient) {
        serviceClient = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
        );
    }
    return serviceClient;
}

function hashKey(raw) {
    return crypto.createHash('sha256').update(raw).digest('hex');
}

/** Returns { ok, apiKey, supabase } on success, sends 401 and returns { ok: false } on failure. */
export async function requireAgent(req, res) {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';

    if (!token) {
        res.status(401).json({ error: 'Missing API key.', code: 'unauthorized' });
        return { ok: false };
    }

    const supabase = getClient();
    const keyHash = hashKey(token);

    const { data: key, error } = await supabase
        .from('agent_api_keys')
        .select('id, label, permissions, is_active, created_at')
        .eq('key_hash', keyHash)
        .maybeSingle();

    if (error || !key) {
        console.error('[agentAuth] key lookup failed:', error?.message || 'no key');
        res.status(401).json({ error: 'Invalid API key.', code: 'unauthorized' });
        return { ok: false };
    }

    if (!key.is_active) {
        res.status(403).json({ error: 'API key is disabled.', code: 'forbidden' });
        return { ok: false };
    }

    // Update last_used_at (fire and forget — don't fail the request if this errors)
    supabase.from('agent_api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', key.id).then(() => {});

    // Default permissions if column missing or null
    const permissions = key.permissions || { read: true, write: false, analytics: true };

    return { ok: true, apiKey: key, permissions, supabase };
}

/**
 * Check if the agent has the given permission level.
 * permissions: { read: boolean, write: boolean, analytics: boolean }
 */
export function hasPermission(permissions, level) {
    return Boolean(permissions?.[level]);
}

/** Log an agent action to the audit trail. */
export async function logAgentAction(apiKeyId, action, resource, resourceId, details, ip) {
    const supabase = getClient();
    await supabase.from('agent_actions_log').insert({
        agent_key_id: apiKeyId,
        action,
        resource_type: resource,
        resource_id: resourceId,
        details,
        ip_address: ip,
    }).catch((err) => {
        console.error('[agentAuth] log write failed:', err?.message || err);
    });
}
