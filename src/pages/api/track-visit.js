/**
 * POST /api/track-visit
 *
 * Records an anonymous page-view event for the visitor analytics dashboard.
 *
 * Visitor identity:
 *   The client sends a `visitorId` UUID (stored in a first-party cookie).
 *   On the server we also look up or create a `visitors` row for that ID.
 *
 * Location:
 *   Resolved server-side from the request IP via ipapi.co (free tier, no key
 *   needed for country/city). Falls back gracefully if the service is down
 *   or the IP is localhost.
 *
 * Device / OS / Browser:
 *   Parsed from the User-Agent header (no client-side JS required).
 *
 * Consent:
 *   The body carries `consentAnalytics` and `consentMarketing` booleans
 *   from the CookieConsentBanner. Page views are only stored when
 *   `consentAnalytics` is true — otherwise this endpoint returns 204
 *   without writing anything, so ad/tracking-blockers never see a write.
 *
 * Environment:
 *   No keys required. Uses the existing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.
 */

const { createClient } = require('@supabase/supabase-js');

// ─── UA parsing ────────────────────────────────────────────────────────

/**
 * Returns a rough device type from the User-Agent string.
 * Matches mobile and tablet before falling back to desktop.
 */
function parseDeviceType(ua) {
    if (!ua) return 'desktop';
    const tablet = /ipad|tablet|playbook|(android(?!.*mobile))/i;
    const mobile = /android|iphone|ipod|blackberry|opera mini|mobile/i;
    if (tablet.test(ua)) return 'tablet';
    if (mobile.test(ua)) return 'mobile';
    return 'desktop';
}

/**
 * Extracts the OS family from a User-Agent string.
 */
function parseOS(ua) {
    if (!ua) return 'Unknown';

    // iOS must come before Android because iPad UA also contains "Mac"
    if (/ipad/i.test(ua)) return 'iPadOS';
    if (/iphone/i.test(ua)) return 'iOS';
    if (/android/i.test(ua)) return 'Android';
    if (/macintosh|mac os x/i.test(ua)) return 'macOS';
    if (/windows/i.test(ua)) return 'Windows';
    if (/cros/i.test(ua)) return 'ChromeOS';
    if (/linux/i.test(ua)) return 'Linux';
    return 'Unknown';
}

/**
 * Extracts the browser family from a User-Agent string.
 */
function parseBrowser(ua) {
    if (!ua) return 'Unknown';

    // Edge / Opera / IE must come before Chrome / Safari checks
    if (/edg/i.test(ua)) return 'Edge';
    if (/opera|opr\//i.test(ua)) return 'Opera';
    if (/chrome|cri/i.test(ua)) return 'Chrome';
    if (/safari/i.test(ua)) return 'Safari';
    if (/firefox/i.test(ua)) return 'Firefox';
    if (/msie|trident/i.test(ua)) return 'Internet Explorer';
    return 'Unknown';
}

// ─── IP location (ipapi.co, free tier) ─────────────────────────────────

/**
 * Resolves country + city from an IP address using ipapi.co.
 * Returns { country, city, continent } or nulls on failure.
 * No API key required for country/city on the free tier.
 */
async function lookupLocation(ip) {
    // Skip private / loopback IPs
    if (!ip || ip === '::1' || ip === '127.0.0.1' ||
        ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
        return { country: null, city: null, continent: null };
    }

    try {
        const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
            signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) return { country: null, city: null, continent: null };
        const data = await res.json();

        // ipapi.co includes a "reason" field when rate-limited or blocked
        if (data.reason) {
            console.warn('[track-visit] ipapi.co rejected IP:', data.reason);
            return { country: null, city: null, continent: null };
        }

        return {
            country: data.country_name || null,
            city: data.city || null,
            continent: data.continent_code || null,
        };
    } catch (err) {
        // Non-fatal — visitor row just won't have location data
        console.warn('[track-visit] Location lookup failed:', err.message);
        return { country: null, city: null, continent: null };
    }
}

// ─── Hash IP for dedup (never store raw) ───────────────────────────────

const crypto = require('crypto');

function hashIp(ip) {
    if (!ip) return null;
    // Truncate to /24 for v4 (or /64 for v6) to reduce precision, per GDPR guidance
    const truncated = ip.includes(':')
        ? ip.split(':').slice(0, 4).join(':')    // rough v6 truncation
        : ip.split('.').slice(0, 3).join('.') + '.0';
    return crypto.createHash('sha256').update(truncated).digest('hex');
}

// ─── Handler ──────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const {
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
    } = process.env;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        console.error('[track-visit] Missing Supabase env vars');
        return res.status(500).json({ error: 'Server not configured' });
    }

    // ── Parse body (Vercel parses JSON for POST by default) ──
    const body = req.body || {};
    const {
        visitorId,
        pathname,
        referrer,
        utmSource,
        utmMedium,
        utmCampaign,
        consentAnalytics,
        consentMarketing,
    } = body;

    // If the visitor hasn't consented to analytics, do nothing.
    // This means no row is written — GDPR-compliant by design.
    if (!consentAnalytics) {
        return res.status(204).end();
    }

    if (!visitorId || !pathname) {
        return res.status(400).json({ error: 'visitorId and pathname are required' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── Determine real client IP ──
    // Vercel sets x-forwarded-for; fall back to the socket address.
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded
        ? forwarded.split(',').map((s) => s.trim())[0]
        : req.socket?.remoteAddress || '127.0.0.1';

    // ── Resolve location from IP ──
    const { country, city, continent } = await lookupLocation(ip);

    // ── Parse UA ──
    const ua = req.headers['user-agent'] || '';
    const deviceType = parseDeviceType(ua);
    const os = parseOS(ua);
    const browser = parseBrowser(ua);
    const ipHash = hashIp(ip);

    try {
        // ── Upsert the visitor row ──
        // If this visitor_id is new, insert a new row. If it exists,
        // update last_seen and increment total_page_views.
        const { data: existing, error: findErr } = await supabase
            .from('visitors')
            .select('id, total_page_views')
            .eq('visitor_id', visitorId)
            .maybeSingle();

        if (findErr && findErr.code !== 'PGRST116') {
            // PGRST116 = no rows found, which is fine for new visitors
            console.error('[track-visit] Error looking up visitor:', findErr);
        }

        if (existing) {
            // Update existing visitor
            const { error: updErr } = await supabase
                .from('visitors')
                .update({
                    last_seen: new Date().toISOString(),
                    total_page_views: (existing.total_page_views || 0) + 1,
                    user_agent: ua || undefined,
                    device_type: deviceType,
                    os,
                    browser,
                    country: country,
                    city: city,
                    continent: continent,
                    ip_hash: ipHash,
                })
                .eq('id', existing.id);

            if (updErr) {
                console.error('[track-visit] Update visitor error:', updErr);
            }
        } else {
            // Insert new visitor
            const { error: insErr } = await supabase
                .from('visitors')
                .insert({
                    visitor_id: visitorId,
                    user_agent: ua || null,
                    device_type: deviceType,
                    os,
                    browser,
                    country: country,
                    city: city,
                    continent: continent,
                    ip_hash: ipHash,
                    total_page_views: 1,
                    first_seen: new Date().toISOString(),
                    last_seen: new Date().toISOString(),
                });

            if (insErr) {
                console.error('[track-visit] Insert visitor error:', insErr);
            }
        }

        // ── Insert the page view row ──
        const { error: pvErr } = await supabase
            .from('page_views')
            .insert({
                visitor_id: visitorId,
                pathname,
                referrer: referrer || null,
                utm_source: utmSource || null,
                utm_medium: utmMedium || null,
                utm_campaign: utmCampaign || null,
                consent_analytics: true,
                consent_marketing: !!consentMarketing,
            });

        if (pvErr) {
            console.error('[track-visit] Insert page_view error:', pvErr);
        }

        // Don't leak timing info — just return 200
        res.status(200).json({ ok: true });
    } catch (err) {
        console.error('[track-visit] Handler error:', err);
        // Non-fatal: the page still loads fine without analytics
        res.status(200).json({ ok: true });
    }
};
