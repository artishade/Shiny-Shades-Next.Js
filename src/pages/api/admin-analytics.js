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
 *
 * Gracefully returns empty data if the visitors/page_views tables haven't
 * been created yet (migration 011 not applied).
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

        // ── Check if tables exist (migration 011 may not have been applied) ──
        // We catch the "relation does not exist" error and return empty data
        // instead of crashing the admin page.
        let tableCheck = true;
        try {
            const { error: checkErr } = await supabase
                .from('visitors')
                .select('id', { count: 'exact', head: true })
                .limit(1);

            if (checkErr && checkErr.code === 'PGRST116') {
                // PGRST116 = no rows — but the table DOES exist
            } else if (checkErr && checkErr.message?.includes('relation') && checkErr.message?.includes('does not exist')) {
                tableCheck = false;
            } else if (checkErr && checkErr.code === '42P01') {
                // 42P01 = undefined_table
                tableCheck = false;
            }
        } catch (err) {
            tableCheck = false;
        }

        // If tables don't exist, return empty analytics data
        if (!tableCheck) {
            return res.status(200).json({
                totalVisitors: 0,
                totalPageViews: 0,
                visitorsOverTime: buildEmptyTimeSeries(days),
                deviceBreakdown: [],
                topCountries: [],
                topPages: [],
                browserBreakdown: [],
                days,
                warning: 'Analytics tables not yet created. Apply migration 011_create_visitors_table.sql.',
            });
        }

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

        // Aggregate into daily buckets
        const dailyMap = {};
        (timeData || []).forEach((row) => {
            const date = row.first_seen.slice(0, 10); // YYYY-MM-DD
            dailyMap[date] = (dailyMap[date] || 0) + 1;
        });

        const visitorsOverTime = buildTimeSeries(days, dailyMap);

        // ── Device breakdown ──
        const { data: deviceData } = await supabase
            .from('visitors')
            .select('device_type')
            .gte('last_seen', since);

        const deviceBreakdown = aggregateBreakdown(
            (deviceData || []).map((r) => r.device_type || 'unknown')
        );

        // ── Top countries ──
        const { data: countryData } = await supabase
            .from('visitors')
            .select('country')
            .gte('last_seen', since)
            .not('country', 'is', null);

        const topCountries = aggregateBreakdown(
            (countryData || []).map((r) => r.country || 'Unknown'),
            10
        );

        // ── Top pages ──
        const { data: pageData } = await supabase
            .from('page_views')
            .select('pathname')
            .gte('created_at', since);

        const topPages = aggregateBreakdown(
            (pageData || []).map((r) => r.pathname || '/'),
            10
        );

        // ── Browser breakdown ──
        const { data: browserData } = await supabase
            .from('visitors')
            .select('browser')
            .gte('last_seen', since)
            .not('browser', 'is', null);

        const browserBreakdown = aggregateBreakdown(
            (browserData || []).map((r) => r.browser || 'Unknown'),
            10
        );

        return res.status(200).json({
            totalVisitors: totalVisitors || 0,
            totalPageViews: totalPageViews || 0,
            visitorsOverTime,
            deviceBreakdown,
            topCountries,
            topPages,
            browserBreakdown,
            days,
        });
    } catch (err) {
        console.error('[admin-analytics]', err);

        // If the error is about missing tables, return empty data
        if (err.message?.includes('relation') && err.message?.includes('does not exist')) {
            return res.status(200).json({
                totalVisitors: 0,
                totalPageViews: 0,
                visitorsOverTime: buildEmptyTimeSeries(days),
                deviceBreakdown: [],
                topCountries: [],
                topPages: [],
                browserBreakdown: [],
                days,
                warning: 'Analytics tables not yet created. Apply migration 011.',
            });
        }

        return res.status(500).json({ error: 'Failed to load analytics data.' });
    }
};

// ─── Helpers ───────────────────────────────────────────────────────────

/**
 * Builds a time series with `days` entries, filling from the daily map.
 */
function buildTimeSeries(days, dailyMap) {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().slice(0, 10);
        result.push({
            date: dateStr,
            count: dailyMap[dateStr] || 0,
        });
    }
    return result;
}

/**
 * Builds an empty time series (for when tables don't exist yet).
 */
function buildEmptyTimeSeries(days) {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        result.push({
            date: d.toISOString().slice(0, 10),
            count: 0,
        });
    }
    return result;
}

/**
 * Aggregates an array of string values into count + percentage buckets.
 * Returns a name/count/percentage array (sorted by count descending).
 */
function aggregateBreakdown(values, limit = 0) {
    const counts = {};
    values.forEach((v) => {
        counts[v] = (counts[v] || 0) + 1;
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    const result = Object.entries(counts)
        .map(([name, count]) => ({
            name: name,
            count: Number(count),
            percentage: Math.round((Number(count) / total) * 100),
        }))
        .sort((a, b) => b.count - a.count);

    if (limit > 0) result = result.slice(0, limit);

    return result;
}
