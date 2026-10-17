/**
 * CookieConsentBanner — GDPR/privacy banner.
 *
 * Shows a toggle-based consent dialog for analytics and marketing cookies.
 * The banner reads/writes the `shiny_consent` cookie via visitorTracking.ts.
 * It does NOT block essential cookies (cart, auth, etc.).
 *
 * Placement: rendered in _app.tsx so it appears on every page (excluded
 * from admin routes, since admins don't need visitor analytics on their
 * own sessions — the banner is only shown on customer-facing pages).
 */

import React, { useState, useEffect } from 'react';
import { getConsent, saveConsent, type ConsentState, CONSENT_COOKIE } from '@/lib/visitorTracking';

export const CookieConsentBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    analytics: false,
    marketing: false,
    essential: true,
  });

  // Check if the banner was already dismissed
  useEffect(() => {
    const existing = getConsent();
    // If the cookie exists at all, the user has made a choice — don't show banner.
    const cookieMatch = document.cookie.match(
      new RegExp('(?:^|; )' + CONSENT_COOKIE + '=([^;]*)'),
    );

    if (!cookieMatch) {
      setVisible(true);
    } else {
      setConsent(existing);
      setVisible(false);
    }
  }, []);

  const handleToggle = (key: 'analytics' | 'marketing') => {
    setConsent((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAcceptAll = () => {
    const all = { analytics: true, marketing: true, essential: true };
    saveConsent(all);
    setConsent(all);
    setVisible(false);
  };

  const handleSave = () => {
    saveConsent(consent);
    setVisible(false);
  };

  const handleRejectAll = () => {
    const minimal = { analytics: false, marketing: false, essential: true };
    saveConsent(minimal);
    setConsent(minimal);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 pointer-events-none">
      <div className="max-w-4xl mx-auto glass-card rounded-2xl shadow-2xl pointer-events-auto border border-blush/20">
        <div className="p-5 md:p-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-10 h-10 rounded-xl bg-rose-gold/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.295 4.95a4 4 0 0 1 7.5 3.5A4 4 0 0 1 15 15H9a4 4 0 0 1 0-8 4 4 0 0 1 1.295-.05z" />
                  <path d="M15 15v5a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2v0" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-charcoal mb-1">We value your privacy</h3>
              <p className="text-sm text-[#6B5B55] leading-relaxed">
                We use cookies to understand how you interact with our site, to personalize content,
                and to enable features like wishlist and cart. Essential cookies are always active.
                Analytics cookies help us improve our store, and marketing cookies let us serve
                relevant ads.
              </p>
            </div>
          </div>

          {/* Consent toggles */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between p-3 bg-blush-light/30 rounded-xl">
              <div className="flex-1">
                <span className="text-sm font-medium text-charcoal">Essential Cookies</span>
                <p className="text-xs text-[#6B5B55] mt-0.5">
                  Required for cart, checkout, and account features.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Always On
              </span>
            </div>

            <div
              className="flex items-center justify-between p-3 bg-white/60 rounded-xl cursor-pointer transition-all duration-200"
              onClick={() => handleToggle('analytics')}
            >
              <div className="flex-1">
                <span className="text-sm font-medium text-charcoal">Analytics Cookies</span>
                <p className="text-xs text-[#6B5B55] mt-0.5">
                  Help us understand site usage and improve performance.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={consent.analytics}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-rose-gold/30 ${consent.analytics ? 'bg-rose-gold' : 'bg-gray-300'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle('analytics');
                }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${consent.analytics ? 'translate-x-4' : 'translate-x-0.5'}`}
                />
              </button>
            </div>

            <div
              className="flex items-center justify-between p-3 bg-white/60 rounded-xl cursor-pointer transition-all duration-200"
              onClick={() => handleToggle('marketing')}
            >
              <div className="flex-1">
                <span className="text-sm font-medium text-charcoal">Marketing Cookies</span>
                <p className="text-xs text-[#6B5B55] mt-0.5">
                  Used to deliver personalized ads from Meta and Google.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={consent.marketing}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-rose-gold/30 ${consent.marketing ? 'bg-rose-gold' : 'bg-gray-300'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle('marketing');
                }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${consent.marketing ? 'translate-x-4' : 'translate-x-0.5'}`}
                />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleAcceptAll}
              className="flex-1 px-4 py-2.5 bg-rose-gold text-white rounded-xl font-medium hover:bg-deep-rose transition-colors text-sm"
            >
              Accept All
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2.5 bg-blush text-charcoal rounded-xl font-medium hover:bg-blush-dark transition-colors text-sm"
            >
              Save Preferences
            </button>
            <button
              onClick={handleRejectAll}
              className="px-4 py-2.5 text-sm text-[#6B5B55] hover:text-charcoal transition-colors"
            >
              Reject Non-Essential
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
