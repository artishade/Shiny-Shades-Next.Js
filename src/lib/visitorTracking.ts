/**
 * Visitor tracking client hook.
 *
 * Responsibilities:
 *   1. Read/write a `visitor_id` UUID cookie (persists across sessions).
 *   2. Read consent flags from cookies (set by CookieConsentBanner).
 *   3. On each page navigation, send the current pathname + UTM params to
 *      /api/track-visit — but ONLY if analytics consent is granted.
 *
 * Privacy:
 *   • No raw IP is sent from the client (resolved server-side from the
 *     request headers).
 *   • Only fires after the visitor has clicked "Accept" on the consent banner.
 *   • The banner stores consent in a cookie named `shiny_consent`.
 */

export const VISITOR_COOKIE = 'shiny_visitor_id';
export const CONSENT_COOKIE = 'shiny_consent';
export const CONSENT_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

export interface ConsentState {
  analytics: boolean;
  marketing: boolean;
  essential: boolean; // always true — required for cart, auth, etc.
}

/**
 * Reads the visitor_id UUID from the cookie. If absent, generates a new
 * UUID v4 and writes it (HttpOnly can't be set from JS, so we use a
 * plain cookie — this is a site identifier, not a session token, so the
 * risk is minimal; it cannot be used for auth).
 */
export function getVisitorId(): string {
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + VISITOR_COOKIE + '=([^;]*)'),
  );
  let id = match ? decodeURIComponent(match[1]) : '';

  if (!id) {
    // Generate a UUID v4
    id = crypto.randomUUID();
    document.cookie = `${VISITOR_COOKIE}=${encodeURIComponent(id)}; max-age=${CONSENT_MAX_AGE}; path=/; SameSite=Lax`;
  }

  return id;
}

/**
 * Reads the consent state from the cookie banner cookie.
 * Returns defaults (all false) if the banner was never accepted.
 */
export function getConsent(): ConsentState {
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + CONSENT_COOKIE + '=([^;]*)'),
  );
  const raw = match ? decodeURIComponent(match[1]) : '';

  if (!raw) {
    return { analytics: false, marketing: false, essential: true };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
      essential: true, // always true — cart/auth need this
    };
  } catch {
    return { analytics: false, marketing: false, essential: true };
  }
}

/**
 * Persists consent choices to the cookie so /api/track-visit can check.
 */
export function saveConsent(consent: ConsentState): void {
  const value = JSON.stringify({
    analytics: consent.analytics,
    marketing: consent.marketing,
  });
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(value)}; max-age=${CONSENT_MAX_AGE}; path=/; SameSite=Lax`;
}

/**
 * Extracts UTM parameters from the current URL's query string.
 */
function getUtmParams(): {
  source: string | null;
  medium: string | null;
  campaign: string | null;
} {
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get('utm_source'),
    medium: params.get('utm_medium'),
    campaign: params.get('utm_campaign'),
  };
}

/**
 * Sends a page-view event to /api/track-visit.
 * Only called when analytics consent is present — the API double-checks,
 * but we avoid the fetch entirely client-side for performance.
 */
export async function trackVisit(): Promise<void> {
  const consent = getConsent();
  if (!consent.analytics) return;

  const visitorId = getVisitorId();
  const utm = getUtmParams();

  try {
    await fetch('/api/track-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // keepalive: true ensures the beacon fires even if the page is
      // being unloaded (user navigating away)
      keepalive: true,
      body: JSON.stringify({
        visitorId,
        pathname: window.location.pathname,
        referrer: document.referrer || null,
        utmSource: utm.source,
        utmMedium: utm.medium,
        utmCampaign: utm.campaign,
        consentAnalytics: consent.analytics,
        consentMarketing: consent.marketing,
      }),
    });
  } catch (err) {
    // Non-fatal — analytics is best-effort
    console.debug('[visitorTracking] trackVisit failed:', err);
  }
}

/**
 * Call this on every route change (via Next.js router events or manually).
 * In _app.tsx, hook into router.events onRouteChangeComplete.
 */
export function initVisitorTracking(): void {
  trackVisit().catch(() => {});
}
