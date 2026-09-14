// api/log-order.js
// Server-side Google Sheets logger — keeps the webhook URL out of client JS
//
// The body is validated against the orders table before it is forwarded:
// this endpoint is reachable by anyone, and without that check anyone
// could inject fake rows into the ops sheet the business fulfils from.

import { checkRateLimit } from './_lib/rateLimit.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const GOOGLE_SHEET_URL = process.env.GOOGLE_SHEET_URL; // NOT VITE_ prefix
    if (!GOOGLE_SHEET_URL) {
        // Silently skip if not configured — don't break checkout
        return res.status(200).json({ ok: true, skipped: true });
    }

    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        // Can't validate — refuse to relay rather than forward unverified data.
        return res.status(200).json({ ok: true, skipped: true });
    }

    try {
        const payload = req.body || {};
        const orderNumber = String(payload.orderNumber || '');

        const ip = req.headers['x-forwarded-for']
            ? String(req.headers['x-forwarded-for']).split(',')[0].trim()
            : 'unknown';
        const allowed = await checkRateLimit(`log-order:${ip}`, 10, 60);
        if (!allowed) {
            return res.status(429).json({ error: 'Too many requests.' });
        }

        // Only forward payloads that reference a real order.
        if (orderNumber) {
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
            const { data } = await supabase
                .from('orders')
                .select('order_number')
                .eq('order_number', orderNumber)
                .maybeSingle();
            if (!data) {
                return res.status(404).json({ error: 'Unknown order number.' });
            }
        } else {
            return res.status(400).json({ error: 'orderNumber is required.' });
        }

        await fetch(GOOGLE_SHEET_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('[log-order] Google Sheets sync failed:', err);
        return res.status(200).json({ ok: true, warning: 'Sheet sync failed' });
    }
}
