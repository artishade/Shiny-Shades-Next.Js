/**
 * Website Connection API — entry point for external AI agents.
 *
 * AI agents (Claude, Codex, etc.) call this endpoint with their API key to:
 *  - Analyze site structure, SEO metadata, product catalog
 *  - Read traffic/performance signals from store data
 *  - Create/update/delete products, categories, coupons
 *  - Read order data, inventory levels, customer summaries
 *
 * Supported actions (POST body.action):
 *  - 'analyze'  → returns site overview + catalog health
 *  - 'products' → read/list products (filters supported)
 *  - 'orders'   → read order data (date range supported)
 *  - 'metrics'  → site performance signals from store data
 *  - 'create'   → create a product, category, or coupon
 *  - 'update'   → update a product, category, or coupon by id
 *  - 'delete'   → soft-delete a product, category, or coupon by id
 *  - 'config'   → read site configuration (branding, payments, shipping)
 */

import { requireAgent, hasPermission, logAgentAction } from '../_lib/agentAuth.js';
import { checkRateLimitStrict } from '../_lib/rateLimit.js';

export const config = { maxDuration: 60 };

function getClientIp(req) {
    const fwd = req.headers['x-forwarded-for'];
    if (fwd) return fwd.split(',')[0].trim();
    return req.socket?.remoteAddress || 'unknown';
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed', code: 'method_not_allowed' });
    }

    const auth = await requireAgent(req, res);
    if (!auth.ok) return;

    const ip = getClientIp(req);
    const { action, resource, resourceId, params = {} } = req.body || {};

    // Rate limit: 60 requests per minute per key
    const allowed = await checkRateLimitStrict(
        `agent-key:${auth.apiKey.id}`,
        60,
        60,
    );
    if (!allowed) {
        return res.status(429).json({
            error: 'Rate limit exceeded. Slow down.',
            code: 'rate_limited',
        });
    }

    try {
        const result = await dispatch(auth, action, resource, resourceId, params, ip);
        return res.status(200).json(result);
    } catch (err) {
        console.error('[agent/website]', err);
        return res.status(500).json({ error: 'Internal error.', code: 'server_error' });
    }
}

async function dispatch(auth, action, resource, resourceId, params, ip) {
    const { supabase, apiKey, permissions } = auth;

    // --- Read actions ---
    if (action === 'analyze') {
        return handleAnalyze(supabase, params, apiKey, ip);
    }

    if (action === 'metrics') {
        if (!hasPermission(permissions, 'analytics')) {
            return { error: 'Permission denied: analytics', code: 'forbidden' };
        }
        return handleMetrics(supabase, params, apiKey, ip);
    }

    if (action === 'products') {
        if (!hasPermission(permissions, 'read')) {
            return { error: 'Permission denied: read', code: 'forbidden' };
        }
        return handleReadProducts(supabase, params, apiKey, ip);
    }

    if (action === 'orders') {
        if (!hasPermission(permissions, 'read')) {
            return { error: 'Permission denied: read', code: 'forbidden' };
        }
        return handleReadOrders(supabase, params, apiKey, ip);
    }

    if (action === 'categories') {
        if (!hasPermission(permissions, 'read')) {
            return { error: 'Permission denied: read', code: 'forbidden' };
        }
        return handleReadCategories(supabase, params, apiKey, ip);
    }

    if (action === 'config') {
        if (!hasPermission(permissions, 'read')) {
            return { error: 'Permission denied: read', code: 'forbidden' };
        }
        return handleReadConfig(supabase, apiKey, ip);
    }

    // --- Write actions ---
    if (action === 'create') {
        if (!hasPermission(permissions, 'write')) {
            return { error: 'Permission denied: write', code: 'forbidden' };
        }
        return handleCreate(supabase, resource, params, apiKey, ip);
    }

    if (action === 'update') {
        if (!hasPermission(permissions, 'write')) {
            return { error: 'Permission denied: write', code: 'forbidden' };
        }
        return handleUpdate(supabase, resource, resourceId, params, apiKey, ip);
    }

    if (action === 'delete') {
        if (!hasPermission(permissions, 'write')) {
            return { error: 'Permission denied: write', code: 'forbidden' };
        }
        return handleDelete(supabase, resource, resourceId, apiKey, ip);
    }

    return {
        error: `Unknown action "${action}". Supported: analyze, metrics, products, orders, categories, config, create, update, delete.`,
        code: 'bad_request',
    };
}

/**
 * Analyze — returns a site overview: product catalog health, categories,
 * recent orders, low stock, and site configuration summary.
 */
async function handleAnalyze(supabase, params, apiKey, ip) {
    const [productCount, categoryCount, orderCount, lowStockResult, siteContent] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.rpc('unused'),
        supabase.from('homepage_content').select('*'),
    ]);

    // Fallback: query products with stock if RPC not available
    const lowStock = await supabase
        .from('products')
        .select('name, stock')
        .lte('stock', 10)
        .eq('is_active', true)
        .limit(20);

    const lowStockItems = lowStock.data || [];

    const result = {
        summary: {
            totalProducts: productCount.count ?? 0,
            activeCategories: categoryCount.count ?? 0,
            totalOrders: orderCount.count ?? 0,
            lowStockCount: lowStockItems.length,
        },
        lowStockProducts: lowStockItems.map((p) => ({
            name: p.name,
            stock: p.stock,
        })),
        siteContent: siteContent.data || [],
        analyzedAt: new Date().toISOString(),
    };

    await logAgentAction(apiKey.id, 'analyze', 'site', null, null, ip);
    return { ok: true, data: result };
}

/**
 * Metrics — returns performance signals derived from store data:
 * revenue by period, payment method breakdown, order status flow,
 * product performance, inventory health.
 */
async function handleMetrics(supabase, params, apiKey, ip) {
    const days = Math.min(Math.max(Number(params.days) || 30, 1), 180);

    const [ordersResult, productsResult] = await Promise.all([
        supabase.from('orders').select(
            'status, payment_status, payment_method, subtotal, discount, total, created_at, items',
            { count: 'exact' }
        ),
        supabase.from('products').select(
            'name, price, compare_price, stock, is_active, is_featured, is_trending, is_on_sale, category_slug'
        ),
    ]);

    const orders = ordersResult.data || [];
    const products = productsResult.data || [];

    // Revenue by day
    const revenueByDay = new Map();
    let totalRevenue = 0;
    let totalOrders = 0;

    for (const order of orders) {
        if (order.status === 'cancelled') continue;
        const total = Number(order.total) || 0;
        totalRevenue += total;
        totalOrders += 1;

        const day = (order.created_at || '').slice(0, 10);
        if (day) {
            revenueByDay.set(day, (revenueByDay.get(day) || 0) + total);
        }
    }

    // Payment method breakdown
    const paymentMethods = new Map();
    const orderStatuses = new Map();
    for (const order of orders) {
        const method = order.payment_method || 'unknown';
        paymentMethods.set(
            method,
            (paymentMethods.get(method) || 0) + 1
        );

        const status = order.status || 'unknown';
        orderStatuses.set(
            status,
            (orderStatuses.get(status) || 0) + 1
        );
    }

    // Inventory health
    const activeProducts = products.filter((p) => p.is_active !== false);
    const outOfStock = activeProducts.filter((p) => (p.stock || 0) <= 0);
    const lowStock = activeProducts.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 10);
    const onSale = activeProducts.filter((p) => p.is_on_sale);
    const featured = activeProducts.filter((p) => p.is_featured);

    const result = {
        period: { days, totalOrders, totalRevenue: Math.round(totalRevenue) },
        revenueByDay: Array.from(revenueByDay.entries()).map(([day, revenue]) => ({
            day,
            revenue: Math.round(revenue),
        })),
        paymentMethods: Array.from(paymentMethods.entries()).map(([method, orders]) => ({
            method,
            orders,
        })),
        orderStatusFlow: Array.from(orderStatuses.entries()).map(([status, count]) => ({
            status,
            count,
        })),
        inventory: {
            totalActive: activeProducts.length,
            outOfStock: outOfStock.length,
            lowStock: lowStock.length,
            onSale: onSale.length,
            featured: featured.length,
        },
        computedAt: new Date().toISOString(),
    };

    await logAgentAction(apiKey.id, 'metrics', 'analytics', null, params, ip);
    return { ok: true, data: result };
}

/**
 * Read products — list products with optional filters.
 */
async function handleReadProducts(supabase, params, apiKey, ip) {
    const { limit = 50, category, feature, search, includeInactive = false } = params;
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);

    let query = supabase
        .from('products')
        .select(`
            id, name, slug, description, short_description, price, compare_price,
            category_name, category_slug, sku, stock, is_active, is_featured,
            is_trending, is_new_arrival, is_on_sale, seo_title, seo_keywords,
            created_at, updated_at
        `);

    if (!includeInactive) {
        query = query.eq('is_active', true);
    }
    if (category) {
        query = query.eq('category_slug', category);
    }
    if (feature) {
        const featureColumn = {
            featured: 'is_featured',
            trending: 'is_trending',
            sale: 'is_on_sale',
            new: 'is_new_arrival',
        }[feature];
        if (featureColumn) query = query.eq(featureColumn, true);
    }
    if (search) {
        query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query.limit(safeLimit);

    if (error) {
        console.error('[agent/products]', error);
        return { error: error.message, code: 'query_failed' };
    }

    await logAgentAction(apiKey.id, 'read', 'products', null, params, ip);
    return { ok: true, data: data || [] };
}

/**
 * Read orders — list orders with optional date range filter.
 */
async function handleReadOrders(supabase, params, apiKey, ip) {
    const { limit = 50, days, status, paymentStatus } = params;
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);

    let query = supabase
        .from('orders')
        .select(`
            order_number, status, payment_method, payment_status,
            subtotal, discount, total, created_at, customer_city,
            customer_district, shipping_cost
        `);

    if (days) {
        const cutoff = new Date(Date.now() - Number(days) * 86400000).toISOString();
        query = query.gte('created_at', cutoff);
    }
    if (status) query = query.eq('status', status);
    if (paymentStatus) query = query.eq('payment_status', paymentStatus);

    const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(safeLimit);

    if (error) {
        console.error('[agent/orders]', error);
        return { error: error.message, code: 'query_failed' };
    }

    await logAgentAction(apiKey.id, 'read', 'orders', null, params, ip);
    return { ok: true, data: data || [] };
}

/**
 * Read categories.
 */
async function handleReadCategories(supabase, params, apiKey, ip) {
    const { limit = 50, includeInactive = false } = params;
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);

    let query = supabase.from('categories').select('id, name, slug, description, is_active, sort_order');
    if (!includeInactive) query = query.eq('is_active', true);

    const { data, error } = await query.limit(safeLimit);

    if (error) {
        console.error('[agent/categories]', error);
        return { error: error.message, code: 'query_failed' };
    }

    await logAgentAction(apiKey.id, 'read', 'categories', null, params, ip);
    return { ok: true, data: data || [] };
}

/**
 * Read site config — branding, payment methods, shipping rules.
 */
async function handleReadConfig(supabase, apiKey, ip) {
    const [siteContentResult, categoriesResult, couponsResult] = await Promise.all([
        supabase.from('homepage_content').select('*'),
        supabase.from('categories').select('name, slug, is_active').eq('is_active', true).limit(20),
        supabase.from('coupons').select('code, discount, type, min_order_amount, is_active, expires_at').eq('is_active', true).limit(20),
    ]);

    const result = {
        siteContent: siteContentResult.data || [],
        categories: categoriesResult.data || [],
        activeCoupons: couponsResult.data || [],
        configAt: new Date().toISOString(),
    };

    await logAgentAction(apiKey.id, 'read', 'config', null, null, ip);
    return { ok: true, data: result };
}

/**
 * Create — products, categories, coupons.
 */
async function handleCreate(supabase, resource, params, apiKey, ip) {
    if (!resource || !params) {
        return { error: 'resource and params are required for create.', code: 'bad_request' };
    }

    if (resource === 'product') {
        const product = await createProduct(supabase, params);
        if (product.error) return product;
        await logAgentAction(apiKey.id, 'create', 'product', product.data?.id, params, ip);
        return { ok: true, data: product.data, action: 'created' };
    }

    if (resource === 'category') {
        const category = await createCategory(supabase, params);
        if (category.error) return category;
        await logAgentAction(apiKey.id, 'create', 'category', category.data?.id, params, ip);
        return { ok: true, data: category.data, action: 'created' };
    }

    if (resource === 'coupon') {
        const coupon = await createCoupon(supabase, params);
        if (coupon.error) return coupon;
        await logAgentAction(apiKey.id, 'create', 'coupon', coupon.data?.id, params, ip);
        return { ok: true, data: coupon.data, action: 'created' };
    }

    return { error: `Cannot create resource "${resource}".`, code: 'bad_request' };
}

/**
 * Update — products, categories, coupons by ID.
 */
async function handleUpdate(supabase, resource, resourceId, params, apiKey, ip) {
    if (!resource || !resourceId || !params) {
        return { error: 'resource, resourceId, and params are required for update.', code: 'bad_request' };
    }

    let table;
    if (resource === 'product') table = 'products';
    else if (resource === 'category') table = 'categories';
    else if (resource === 'coupon') table = 'coupons';
    else return { error: `Cannot update resource "${resource}".`, code: 'bad_request' };

    const updates = { ...params, updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from(table).update(updates).eq('id', resourceId).select().single();

    if (error) {
        console.error(`[agent/update ${resource}]`, error);
        return { error: error.message, code: 'update_failed' };
    }

    await logAgentAction(apiKey.id, 'update', resource, resourceId, params, ip);
    return { ok: true, data, action: 'updated' };
}

/**
 * Delete — soft delete by setting is_active = false (or deleting for coupons).
 */
async function handleDelete(supabase, resource, resourceId, apiKey, ip) {
    if (!resource || !resourceId) {
        return { error: 'resource and resourceId are required for delete.', code: 'bad_request' };
    }

    let table;
    if (resource === 'product') table = 'products';
    else if (resource === 'category') table = 'categories';
    else if (resource === 'coupon') table = 'coupons';
    else return { error: `Cannot delete resource "${resource}".`, code: 'bad_request' };

    // Soft-delete: set is_active = false
    const { data, error } = await supabase.from(table).update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', resourceId).select().single();

    if (error) {
        console.error(`[agent/delete ${resource}]`, error);
        return { error: error.message, code: 'delete_failed' };
    }

    await logAgentAction(apiKey.id, 'delete', resource, resourceId, null, ip);
    return { ok: true, data, action: 'deleted' };
}

/**
 * Helpers
 */
function generateSlug(name) {
    return String(name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

function generateProductSlug(name, id) {
    // Products expect slug to include the id prefix — check existing pattern
    return String(name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
}

async function createProduct(supabase, params) {
    const {
        name, price, description, shortDescription, categoryId,
        stock = 0, isFeatured = false, isTrending = false,
        isNewArrival = false, isOnSale = false, isActive = true,
        comparePrice, sku, isFeatured: _skip, ...rest
    } = params;

    if (!name || !price) {
        return { error: 'name and price are required for creating a product.', code: 'bad_request' };
    }

    const slug = rest.slug || generateProductSlug(name);
    const product = {
        name,
        slug: slug + '-' + (rest.slug ? '' : Math.random().toString(36).slice(2, 8)),
        description: description || '',
        short_description: shortDescription || '',
        price: Number(price),
        compare_price: comparePrice ? Number(comparePrice) : null,
        category_id: categoryId || null,
        category_name: rest.categoryName || '',
        category_slug: rest.categorySlug || slug,
        sku: sku || `${String(name).slice(0, 3).toUpperCase()}-${Date.now().toString(36).slice(-4)}`,
        stock: Number(stock) || 0,
        is_active: isActive !== false,
        is_featured: isFeatured,
        is_trending: isTrending,
        is_new_arrival: isNewArrival,
        is_on_sale: isOnSale,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('products').insert(product).select().single();
    if (error) return { error: error.message, code: 'create_failed' };
    return { data };
}

async function createCategory(supabase, params) {
    const { name, description, slug: customSlug, parent_id: parentId, is_active: isActive = true } = params;

    if (!name) {
        return { error: 'name is required for creating a category.', code: 'bad_request' };
    }

    const category = {
        name,
        slug: customSlug || generateSlug(name) || `cat-${Date.now().toString(36)}`,
        description: description || '',
        parent_id: parentId || null,
        is_active: isActive !== false,
        sort_order: params.sortOrder || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('categories').insert(category).select().single();
    if (error) return { error: error.message, code: 'create_failed' };
    return { data };
}

async function createCoupon(supabase, params) {
    const { code, discount, type = 'percentage', minOrderAmount = 0, maxUses = 100, expiresAt } = params;

    if (!code || !discount) {
        return { error: 'code and discount are required for creating a coupon.', code: 'bad_request' };
    }

    const coupon = {
        code: String(code).toUpperCase(),
        discount: Number(discount),
        type: type,
        min_order_amount: Number(minOrderAmount) || 0,
        max_uses: Number(maxUses) || 100,
        used_count: 0,
        expires_at: expiresAt || null,
        is_active: params.isActive !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('coupons').insert(coupon).select().single();
    if (error) return { error: error.message, code: 'create_failed' };
    return { data };
}
