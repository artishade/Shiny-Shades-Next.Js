/**
 * POST /api/place-order — server-verified order placement.
 *
 * Checkout sends the same payload it always built (items with productId +
 * quantity, coupon code, customer fields, district/thana). The server
 * recomputes every money field from the live `products` and `coupons`
 * tables before inserting, so a tampered localStorage cart (price = 1,
 * stale coupon, fake shipping) can no longer produce a mispriced order.
 *
 * Response: { ok: true, order: {...} } — the caller gets back the
 * server-computed order with the authoritative order_number.
 */

import { checkRateLimit, getClientIp } from './_lib/rateLimit.js';

// Shipping rules must mirror src/pages/checkout.tsx exactly.
const DHAKA_SUB_THANAS = new Set([
    'Savar (সাভার)', 'Dhamrai (ধামরাই)', 'Keraniganj (কেরানীগঞ্জ)',
    'Dohar (দোহার)', 'Nawabganj (নবাবগঞ্জ)', 'Ashulia (আশুলিয়া)',
]);
const FREE_SHIPPING_THRESHOLD = 50000;

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const toNumber = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const cleanText = (v, max) =>
    typeof v === 'string' ? v.trim().slice(0, max) : '';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const ip = getClientIp(req);
    const allowed = await checkRateLimit(`place-order:${ip}`, 10, 60);
    if (!allowed) {
        return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
    }

    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({ error: 'Server is not configured.' });
    }

    const body = req.body || {};
    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length || items.length > 100) {
        return res.status(400).json({ error: 'Order must contain 1-100 items.' });
    }

    const customer = isPlainObject(body.customer) ? body.customer : {};
    const firstName = cleanText(customer.firstName, 80);
    const phone = String(customer.phone || '').replace(/[^\d+]/g, '');
    const notes = cleanText(body.notes, 500) || '-';
    const district = cleanText(customer.city || body.district, 120);
    const paymentMethod = ['cod', 'bkash', 'nagad', 'sslcommerz'].includes(body.paymentMethod)
        ? body.paymentMethod
        : 'cod';

    if (!firstName || !phone || !district) {
        return res.status(400).json({ error: 'Name, phone and district are required.' });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        // ── 1. Fetch every ordered product's live price + stock in one round trip ──
        const productIds = [...new Set(items.map((i) => String(i.productId || '')))].filter(Boolean);
        if (productIds.length !== items.map((i) => String(i.productId || '')).filter(Boolean).length) {
            return res.status(400).json({ error: 'Every item needs a productId.' });
        }

        const { data: products, error: prodError } = await supabase
            .from('products')
            .select('id, name, price, stock, images, is_active')
            .in('id', productIds);
        if (prodError) throw prodError;

        const byId = new Map((products ?? []).map((p) => [String(p.id), p]));

        // ── 2. Recompute subtotal from live prices, clamp quantity to stock ──
        let subtotal = 0;
        const itemsPayload = [];
        for (const item of items) {
            const p = byId.get(String(item.productId));
            if (!p || p.is_active === false) {
                return res.status(400).json({ error: `Product ${item.productId} is no longer available.` });
            }
            const qty = Math.max(1, Math.min(Math.floor(toNumber(item.quantity) || 1), Math.max(1, p.stock ?? 1)));
            const price = toNumber(p.price);
            if (price <= 0) {
                return res.status(400).json({ error: `Product ${p.name} has an invalid price.` });
            }
            subtotal += price * qty;
            itemsPayload.push({
                productId: String(p.id),
                productName: String(p.name || ''),
                productImage: Array.isArray(p.images) && p.images[0] ? p.images[0] : '',
                size: cleanText(item.size, 40),
                color: cleanText(item.color, 60),
                quantity: qty,
                price,
            });
        }

        // ── 3. Coupon: validate + recompute discount from the DB row ──
        let discount = 0;
        let couponCode = null;
        const rawCode = cleanText(body.couponCode, 40).toUpperCase();
        if (rawCode) {
            const { data: coupon } = await supabase
                .from('coupons')
                .select('code, discount, type, min_order_amount, max_uses, used_count, expires_at, is_active')
                .eq('code', rawCode)
                .maybeSingle();
            const valid =
                coupon &&
                coupon.is_active &&
                toNumber(coupon.used_count) < toNumber(coupon.max_uses) &&
                subtotal >= toNumber(coupon.min_order_amount) &&
                (!coupon.expires_at || new Date(`${String(coupon.expires_at).slice(0, 10)}T23:59:59.999Z`) >= new Date());
            if (valid) {
                couponCode = coupon.code;
                discount =
                    coupon.type === 'percentage'
                        ? Math.round((subtotal * toNumber(coupon.discount)) / 100)
                        : Math.min(toNumber(coupon.discount), subtotal);
            }
        }

        // ── 4. Shipping from the same zone rules as checkout ──
        const thana = cleanText(customer.state || '', 120);
        const insideDhaka = district.startsWith('Dhaka') && !DHAKA_SUB_THANAS.has(thana);
        const payable = subtotal - discount;
        const shippingCharge = payable >= FREE_SHIPPING_THRESHOLD ? 0 : insideDhaka ? 80 : 150;
        const total = Math.max(0, Math.round(subtotal - discount + shippingCharge));

        // ── 5. Insert with the server-computed amounts ──
        const orderNumber = body.orderNumber
            ? cleanText(body.orderNumber, 40)
            : null;

        const row = {
            order_number: orderNumber,
            status: 'pending',
            payment_method: paymentMethod,
            payment_status: 'pending',
            transaction_id: cleanText(body.transactionId, 60) || null,
            coupon_code: couponCode,
            subtotal: Math.round(subtotal),
            discount: Math.round(discount),
            shipping_charge: shippingCharge,
            total,
            notes,
            customer_first_name: firstName,
            customer_last_name: cleanText(customer.lastName, 80),
            customer_email: cleanText(customer.email, 160),
            customer_phone: phone,
            customer_address: cleanText(customer.address, 400),
            customer_city: district,
            customer_district: district,
            items: itemsPayload,
        };

        const { data: inserted, error: insertError } = await supabase
            .from('orders')
            .insert(row)
            .select('order_number, total')
            .single();
        if (insertError) throw insertError;

        // Count the coupon use atomically-ish; a failure here never blocks the order.
        if (couponCode) {
            await supabase.rpc('increment_coupon_usage', { p_code: couponCode }).then(
                () => {},
                () => {},
            );
        }

        return res.status(201).json({
            ok: true,
            order: {
                orderNumber: inserted.order_number,
                total: inserted.total,
                subtotal: row.subtotal,
                discount: row.discount,
                shippingCharge,
            },
        });
    } catch (err) {
        console.error('[place-order]', err);
        return res.status(500).json({ error: 'Could not place the order. Please try again.' });
    }
}
