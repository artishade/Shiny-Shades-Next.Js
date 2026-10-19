import { trackingConfig } from '@/config/trackingConfig';

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

const CURRENCY = trackingConfig.currency || 'BDT';

/** Matches the product-level IDs in the Meta catalog, not size/colour variants. */
const CONTENT_TYPE = 'product';

export type PixelItem = {
  id: string;
  name: string;
  /** Unit price — value is derived as price * quantity. */
  price: number;
  quantity?: number;
};

/**
 * Returns Meta test_event_code if present in URL query params or sessionStorage.
 * In Meta Events Manager -> Test Events, Meta provides a code like "TEST12345".
 * Adding `?test_event_code=TEST12345` to the site URL routes all live events to the Test tab.
 */
export const getTestEventCode = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('test_event_code');
    if (code) {
      sessionStorage.setItem('meta_test_event_code', code);
      return code;
    }
    return sessionStorage.getItem('meta_test_event_code') || null;
  } catch {
    return null;
  }
};

/**
 * Ensure window.fbq stub exists so calls are queued and never dropped
 * even if the external fbevents.js has not finished downloading.
 */
const getFbq = (): ((...args: any[]) => void) | null => {
  if (typeof window === 'undefined') return null;

  if (typeof window.fbq === 'function') {
    return window.fbq;
  }

  // Create queue stub if not present
  if (!window.fbq) {
    const n: any = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!window._fbq) window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    window.fbq = n;
  }

  return window.fbq;
};

const sanitizeItem = (item: PixelItem) => ({
  id: String(item.id || '').trim(),
  name: String(item.name || '').trim(),
  price: Math.max(0, Number(item.price) || 0),
  quantity: Math.max(1, Number(item.quantity) || 1),
});

export const initFacebookPixel = () => {
  // Safe invocation — ensures queue is ready
  getFbq();
};

export const trackPageView = () => {
  const fbq = getFbq();
  if (!fbq) return;

  const testCode = getTestEventCode();
  if (testCode) {
    fbq('track', 'PageView', {}, { test_event_code: testCode });
  } else {
    fbq('track', 'PageView');
  }
};

export const trackViewContent = (item: PixelItem) => {
  const fbq = getFbq();
  if (!fbq || !item?.id) return;

  const clean = sanitizeItem(item);
  const totalVal = clean.price * clean.quantity;

  const payload = {
    content_type: CONTENT_TYPE,
    content_ids: [clean.id],
    contents: [
      {
        id: clean.id,
        quantity: clean.quantity,
        item_price: clean.price,
      },
    ],
    content_name: clean.name,
    value: totalVal,
    currency: CURRENCY,
  };

  const testCode = getTestEventCode();
  if (testCode) {
    fbq('track', 'ViewContent', payload, { test_event_code: testCode });
  } else {
    fbq('track', 'ViewContent', payload);
  }
};

export const trackAddToCart = (item: PixelItem) => {
  const fbq = getFbq();
  if (!fbq || !item?.id) return;

  const clean = sanitizeItem(item);
  const totalVal = clean.price * clean.quantity;

  const payload = {
    content_type: CONTENT_TYPE,
    content_ids: [clean.id],
    contents: [
      {
        id: clean.id,
        quantity: clean.quantity,
        item_price: clean.price,
      },
    ],
    content_name: clean.name,
    value: totalVal,
    currency: CURRENCY,
  };

  const testCode = getTestEventCode();
  if (testCode) {
    fbq('track', 'AddToCart', payload, { test_event_code: testCode });
  } else {
    fbq('track', 'AddToCart', payload);
  }
};

export const trackInitiateCheckout = (items: PixelItem[], total: number) => {
  const fbq = getFbq();
  if (!fbq || !items || items.length === 0) return;

  const cleanItems = items.map(sanitizeItem).filter((i) => Boolean(i.id));
  if (cleanItems.length === 0) return;

  const safeTotal = Math.max(0, Number(total) || cleanItems.reduce((acc, i) => acc + i.price * i.quantity, 0));

  const payload = {
    content_type: CONTENT_TYPE,
    content_ids: cleanItems.map((i) => i.id),
    contents: cleanItems.map((i) => ({
      id: i.id,
      quantity: i.quantity,
      item_price: i.price,
    })),
    num_items: cleanItems.reduce((acc, i) => acc + i.quantity, 0),
    value: safeTotal,
    currency: CURRENCY,
  };

  const testCode = getTestEventCode();
  if (testCode) {
    fbq('track', 'InitiateCheckout', payload, { test_event_code: testCode });
  } else {
    fbq('track', 'InitiateCheckout', payload);
  }
};

export const trackPurchase = (items: PixelItem[], total: number, orderId?: string) => {
  const fbq = getFbq();
  if (!fbq || !items || items.length === 0) return;

  const cleanItems = items.map(sanitizeItem).filter((i) => Boolean(i.id));
  if (cleanItems.length === 0) return;

  const safeTotal = Math.max(0, Number(total) || cleanItems.reduce((acc, i) => acc + i.price * i.quantity, 0));

  const payload: Record<string, any> = {
    content_type: CONTENT_TYPE,
    content_ids: cleanItems.map((i) => i.id),
    contents: cleanItems.map((i) => ({
      id: i.id,
      quantity: i.quantity,
      item_price: i.price,
    })),
    num_items: cleanItems.reduce((acc, i) => acc + i.quantity, 0),
    value: safeTotal,
    currency: CURRENCY,
  };

  if (orderId) {
    payload.order_id = String(orderId);
  }

  const testCode = getTestEventCode();
  if (testCode) {
    fbq('track', 'Purchase', payload, { test_event_code: testCode });
  } else {
    fbq('track', 'Purchase', payload);
  }
};
