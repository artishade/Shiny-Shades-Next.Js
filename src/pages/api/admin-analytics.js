/**
 * GET /api/admin-analytics
 *
 * Admin-only endpoint that returns aggregated visitor analytics data
 * for the admin dashboard charts.
 *
 * Query params:
 *   days=7       Number of days to look back (default: 30, max: 90)
 *
 * Returns:
 *   {
 *     totalVisitors: number,
 *     totalPageViews: number,
 *     visitorsOverTime: [{ date, count }],
 *     deviceBreakdown: [{ device_type, count, percentage }],
 *     topCountries: [{ country, count, percentage }],
 *     topPages: [{ pathname, count }],
 *     browserBreakdown: [{ browser, count, percentage }],
 *   }
 */

const { requireAdmin } = require('./_lib/requireAdmin.js');

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const auth = await requireAdmin(req, res);
    if (!auth.ok) return;

    // Parse query params
    const days = Math.max(1, Math.min(90, parseInt(req.query.days || '30', 10)));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    try {
        const { supabase } = auth;

        // ── Total unique visitors in range ──
        const { count: totalVisitors, error: vErr } = await supabase
            .from('visitors')
            .select('*', { count: 'exact', head: true })
            .gte('last_seen', since);

        if (vErr) throw vErr;

        // ── Total page views in range ──
        const { count: totalPageViews, error: pvErr } = await supabase
            .from('page_views')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', since);

        if (pvErr) throw pvErr;

        // ── Visitors over time (grouped by day) ──
        const { data: timeData, error: timeErr } = await supabase
            .from('visitors')
            .select('first_seen')
            .gte('first_seen', since)
            .order('first_seen', { ascending: true });

        // Aggregate into daily buckets client-side (Supabase doesn't support DATE_TRUNC in select)
        const dailyMap = {};
        (timeData || []).forEach((row) => {
            const date = row.first_seen.slice(0, 10); // YYYY-MM-DD
            dailyMap[date] = (dailyMap[date] || 0) + 1;
        });

        // Fill in missing days with 0
        const visitorsOverTime = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const dateStr = d.toISOString().slice(0, 10);
            visitorsOverTime.push({
                date: dateStr,
                count: dailyMap[dateStr] || 0,
            });
        }

        if (timeErr) {
            console.error('[admin-analytics] time series error:', timeErr);
        }

        // ── Device breakdown ──
        const { data: deviceData, error: deviceErr } = await supabase
            .from('visitors')
            .select('device_type')
            .gte('last_seen', since);

        const deviceCounts = {};
        (deviceData || []).forEach((row) => {
            const key = row.device_type || 'unknown';
            deviceCounts[key] = (deviceCounts[key] || 0) + 1;
        });
        const deviceTotal = Object.values(deviceCounts).reduce((a, b) => a + b, 0) || 1;
        const deviceBreakdown = Object.entries(deviceCounts)
            .map(([deviceType, count]) => ({
                device_type: deviceType,
                count: Number(count),
                percentage: Math.round((Number(count) / deviceTotal) * 100),
            }))
            .sort((a, b) => b.count - a.count);

        if (deviceErr) console.error('[admin-analytics] device error:', deviceErr);

        // ── Top countries ──
        const { data: countryData, error: countryErr } = await supabase
            .from('visitors')
            .select('country')
            .gte('last_seen', since)
            .not('country', 'is', null);

        const countryCounts = {};
        (countryData || []).forEach((row) => {
            const key = row.country || 'Unknown';
            countryCounts[key] = (countryCounts[key] || 0) + 1;
        });
        const countryTotal = Object.values(countryCounts).reduce((a, b) => a + b, 0) || 1;
        const topCountries = Object.entries(countryCounts)
            .map(([country, count]) => ({
                country,
                count: Number(count),
                percentage: Math.round((Number(count) / countryTotal) * 100),
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        if (countryErr) console.error('[admin-analytics] country error:', countryErr);

        // ── Top pages ──
        const { data: pageData, error: pageErr } = await supabase
            .from('page_views')
            .select('pathname')
            .gte('created_at', since);

        const pageCounts = {};
        (pageData || []).forEach((row) => {
            const key = row.pathname || '/';
            pageCounts[key] = (pageCounts[key] || 0) + 1;
        });
        const pageTotal = Object.values(pageCounts).reduce((a, b) => a + b, 0) || 1;
        const topPages = Object.entries(pageCounts)
            .map(([pathname, count]) => ({
                pathname,
                count: Number(count),
                percentage: Math.round((Number(count) / pageTotal) * 100),
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        if (pageErr) console.error('[admin-analytics] pages error:', pageErr);

        // ── Browser breakdown ──
        const { data: browserData, error: browserErr } = await supabase
            .from('visitors')
            .select('browser')
            .gte('last_seen', since)
            .not('browser', 'is', null);

        const browserCounts = {};
        (browserData || []).forEach((row) => {
            const key = row.browser || 'Unknown';
            browserCounts[key] = (browserCounts[key] || 0) + 1;
        });
        const browserTotal = Object.values(browserCounts).reduce((a, b) => a + b, 0) || 1;
        const browserBreakdown = Object.entries(browserCounts)
            .map(([browser, count]) => ({
                browser,
                count: Number(count),
                percentage: Math.round((Number(count) / browserTotal) * 100),
            }))
            .sort((a, b) => b.count - a.count);

        if (browserErr) console.error('[admin-analytics] browser error:', browserErr);

        return res.status(200).json({
            totalVisitors: totalVisitors || 0,
            totalPageViews: totalPageViews || 0,
            visitorsOverTime,
            deviceBreakdown,
            topCountries,
            topPages,
            browserBreakdown,
        });
    } catch (err) {
        console.error('[admin-analytics]', err);
        return res.status(500).json({ error: 'Failed to load analytics data.' });
    }
};
