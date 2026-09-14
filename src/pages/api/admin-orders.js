/**
 * GET /api/admin-orders — admin-only order listing.
 *
 * After migration 009 drops the public SELECT policy on `orders`, the
 * browser (anon key) can no longer read orders directly. The admin panel
 * fetches here instead; requireAdmin verifies the caller's Supabase token
 * and the admins table, then the service-role client does the read.
 *
 * Query params: none (returns the last 500 orders, newest first) — the
 * admin panel already filters/sorts client-side.
 */

import { requireAdmin } from './_lib/requireAdmin.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const auth = await requireAdmin(req, res);
    if (!auth.ok) return;

    try {
        const { data, error } = await auth.supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(500);

        if (error) throw error;
        return res.status(200).json({ orders: data ?? [] });
    } catch (err) {
        console.error('[admin-orders]', err);
        return res.status(500).json({ error: 'Failed to load orders.' });
    }
}
