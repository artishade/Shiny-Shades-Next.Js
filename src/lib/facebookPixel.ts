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

type PixelEventName =
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'Purchase'
  | 'Search';

/**
 * Ensure window.fbq stub exists so calls are queued and never dropped
 * even if the external fbevents.js has not finished downloading.
 * The real loader + fbq('init') lives in _app.tsx.
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
  id: String(item?.id ?? '').trim(),
  name: String(item?.name ?? '').trim(),
  price: Math.max(0, Number(item?.price) || 0),
  quantity: Math.max(1, Math.floor(Number(item?.quantity) || 1)),
});

type CleanItem = ReturnType<typeof sanitizeItem>;

const sanitizeItems = (items: PixelItem[] | undefined): CleanItem[] =>
  (items ?? []).map(sanitizeItem).filter((item) => Boolean(item.id));

/** `contents` objects need `id` + `quantity`; `item_price` is the documented extra. */
const toContents = (items: CleanItem[]) =>
  items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    item_price: item.price,
  }));

const itemsValue = (items: CleanItem[]) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

const numItems = (items: CleanItem[]) =>
  items.reduce((sum, item) => sum + item.quantity, 0);

/**
 * `Number(total) || itemsValue(items)` used to treat a legitimately free
 * (0.00) order as "no total" and report the item sum instead, inflating
 * reported revenue for fully discounted orders.
 */
const resolveValue = (total: number, items: CleanItem[]) => {
  const numeric = Number(total);
  return Number.isFinite(numeric) ? Math.max(0, numeric) : itemsValue(items);
};

/**
 * The fourth argument of `fbq('track')` is `eventID` — a string used to
 * deduplicate against a Conversions API event with the same ID.
 * `test_event_code` is a server-side (Conversions API) parameter and does
 * nothing when passed here, so it is not used.
 */
const send = (
  event: PixelEventName,
  params: Record<string, unknown>,
  eventId?: string,
) => {
  const fbq = getFbq();
  if (!fbq) return;

  if (eventId) {
    fbq('track', event, params, String(eventId));
  } else {
    fbq('track', event, params);
  }
};

export const initFacebookPixel = () => {
  getFbq();
};

export const trackPageView = (eventId?: string) => {
  send('PageView', {}, eventId);
};

export const trackViewContent = (item: PixelItem, eventId?: string) => {
  const clean = sanitizeItem(item);
  if (!clean.id) return;

  send(
    'ViewContent',
    {
      content_type: CONTENT_TYPE,
      content_ids: [clean.id],
      contents: toContents([clean]),
      content_name: clean.name,
      value: clean.price * clean.quantity,
      currency: CURRENCY,
    },
    eventId,
  );
};

export const trackAddToCart = (item: PixelItem, eventId?: string) => {
  const clean = sanitizeItem(item);
  if (!clean.id) return;

  send(
    'AddToCart',
    {
      content_type: CONTENT_TYPE,
      content_ids: [clean.id],
      contents: toContents([clean]),
      content_name: clean.name,
      value: clean.price * clean.quantity,
      currency: CURRENCY,
    },
    eventId,
  );
};

export const trackInitiateCheckout = (
  items: PixelItem[],
  total: number,
  eventId?: string,
) => {
  const cleanItems = sanitizeItems(items);
  if (cleanItems.length === 0) return;

  send(
    'InitiateCheckout',
    {
      content_type: CONTENT_TYPE,
      content_ids: cleanItems.map((item) => item.id),
      contents: toContents(cleanItems),
      num_items: numItems(cleanItems),
      value: resolveValue(total, cleanItems),
      currency: CURRENCY,
    },
    eventId,
  );
};

export const trackPurchase = (
  items: PixelItem[],
  total: number,
  orderId?: string,
  eventId?: string,
) => {
  const cleanItems = sanitizeItems(items);
  if (cleanItems.length === 0) return;

  const params: Record<string, unknown> = {
    content_type: CONTENT_TYPE,
    content_ids: cleanItems.map((item) => item.id),
    contents: toContents(cleanItems),
    num_items: numItems(cleanItems),
    value: resolveValue(total, cleanItems),
    currency: CURRENCY,
  };

  if (orderId) {
    params.order_id = String(orderId);
  }

  send('Purchase', params, eventId);
};

/**
 * `Search` carries `search_string`; `contents`/`content_ids` are only required
 * for Advantage+ catalog ads, so they are attached when the matched products
 * are already known.
 */
export const trackSearch = (
  searchString: string,
  items: PixelItem[] = [],
  eventId?: string,
) => {
  const query = String(searchString ?? '').trim();
  if (!query) return;

  const cleanItems = sanitizeItems(items);

  const params: Record<string, unknown> = {
    content_type: CONTENT_TYPE,
    search_string: query,
    currency: CURRENCY,
  };

  if (cleanItems.length > 0) {
    params.content_ids = cleanItems.map((item) => item.id);
    params.contents = toContents(cleanItems);
    params.value = itemsValue(cleanItems);
  }

  send('Search', params, eventId);
};
