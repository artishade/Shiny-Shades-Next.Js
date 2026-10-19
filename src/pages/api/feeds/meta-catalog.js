/**
 * GET /api/feeds/meta-catalog
 *
 * Official product feed endpoint for Meta (Facebook & Instagram) Catalog.
 * Can be plugged directly into Meta Commerce Manager -> Catalog -> Data Sources -> Data Feeds
 * using "Scheduled Feed" (fetches daily or hourly automatically).
 *
 * Supports:
 *   ?format=xml (default) -> RSS 2.0 / Google Merchant XML format
 *   ?format=csv           -> Meta Commerce CSV format
 */

import { createClient } from '@supabase/supabase-js';

const SITE_DOMAIN = process.env.PUBLIC_SITE_URL
  ? process.env.PUBLIC_SITE_URL.replace(/\/$/, '')
  : 'https://www.shinyshades.store';

const BRAND_NAME = 'Shiny Shades';
const CURRENCY = 'BDT';

function stripHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function xmlEscape(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function csvEscape(val) {
  if (val == null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function mapCategories(cat) {
  const lower = (cat || '').toLowerCase();
  if (lower.includes('jewel') || lower.includes('accessor')) {
    return {
      google: 'Apparel & Accessories > Jewelry',
      fb: 'Clothing & Accessories > Jewelry',
    };
  }
  if (lower.includes('cosmetic') || lower.includes('beauty') || lower.includes('makeup')) {
    return {
      google: 'Health & Beauty > Beauty > Cosmetics',
      fb: 'Health & Beauty',
    };
  }
  return {
    google: 'Apparel & Accessories > Clothing',
    fb: 'Clothing & Accessories > Clothing',
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end('Method not allowed');
  }

  const { format = 'xml' } = req.query;
  const isCsv = String(format).toLowerCase() === 'csv';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase configuration missing' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .gt('price', 0)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products for Meta feed:', error);
    return res.status(500).json({ error: error.message });
  }

  const items = (products || []).filter((p) => p.name && p.price > 0);

  // Set cache headers: 1 hour browser/CDN cache, stale-while-revalidate 24 hours
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400');

  if (isCsv) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="meta-catalog.csv"');

    const headers = [
      'id',
      'title',
      'description',
      'availability',
      'condition',
      'link',
      'image_link',
      'additional_image_link',
      'brand',
      'price',
      'sale_price',
      'google_product_category',
      'fb_product_category',
      'quantity_to_sell_on_facebook',
      'item_group_id',
      'gender',
      'age_group',
      'color',
      'size',
    ];

    const rows = items.map((p) => {
      const link = `${SITE_DOMAIN}/product/${p.slug}`;
      const images = Array.isArray(p.images) ? p.images : [];
      const imageLink = images[0] || '';
      const additionalImageLink = images.slice(1, 11).join(',');
      const desc = stripHtml(p.description || p.short_description || p.name);
      const inStock = (p.stock ?? 0) > 0;
      const cats = mapCategories(p.category_name);

      const isOnSale = Boolean(p.is_on_sale && p.compare_price && p.compare_price > p.price);
      const regularPrice = isOnSale ? `${p.compare_price} ${CURRENCY}` : `${p.price} ${CURRENCY}`;
      const salePrice = isOnSale ? `${p.price} ${CURRENCY}` : '';

      const colors = Array.isArray(p.colors)
        ? p.colors.map((c) => (typeof c === 'string' ? c : c?.label || c?.name || '')).filter(Boolean).join(', ')
        : '';
      const sizes = Array.isArray(p.sizes) ? p.sizes.join(', ') : '';

      return [
        p.id,
        p.name,
        desc,
        inStock ? 'in stock' : 'out of stock',
        'new',
        link,
        imageLink,
        additionalImageLink,
        BRAND_NAME,
        regularPrice,
        salePrice,
        cats.google,
        cats.fb,
        p.stock ?? 0,
        '',
        'female',
        'adult',
        colors,
        sizes,
      ].map(csvEscape).join(',');
    });

    const csvContent = '\uFEFF' + [headers.map(csvEscape).join(','), ...rows].join('\r\n');
    return res.status(200).send(csvContent);
  }

  // XML Format (RSS 2.0 with Google Merchant / Meta extensions)
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n';
  xml += '  <channel>\n';
  xml += `    <title>${xmlEscape(BRAND_NAME)} Products</title>\n`;
  xml += `    <link>${xmlEscape(SITE_DOMAIN)}</link>\n`;
  xml += `    <description>Product feed for Meta Commerce Catalog</description>\n`;

  for (const p of items) {
    const link = `${SITE_DOMAIN}/product/${p.slug}`;
    const images = Array.isArray(p.images) ? p.images : [];
    const imageLink = images[0] || '';
    const desc = stripHtml(p.description || p.short_description || p.name);
    const inStock = (p.stock ?? 0) > 0;
    const cats = mapCategories(p.category_name);

    const isOnSale = Boolean(p.is_on_sale && p.compare_price && p.compare_price > p.price);
    const regularPrice = isOnSale ? `${p.compare_price} ${CURRENCY}` : `${p.price} ${CURRENCY}`;
    const salePrice = isOnSale ? `${p.price} ${CURRENCY}` : '';

    const colors = Array.isArray(p.colors)
      ? p.colors.map((c) => (typeof c === 'string' ? c : c?.label || c?.name || '')).filter(Boolean).join(', ')
      : '';
    const sizes = Array.isArray(p.sizes) ? p.sizes.join(', ') : '';

    xml += '    <item>\n';
    xml += `      <g:id>${xmlEscape(p.id)}</g:id>\n`;
    xml += `      <g:title>${xmlEscape(p.name)}</g:title>\n`;
    xml += `      <g:description>${xmlEscape(desc)}</g:description>\n`;
    xml += `      <g:link>${xmlEscape(link)}</g:link>\n`;
    if (imageLink) {
      xml += `      <g:image_link>${xmlEscape(imageLink)}</g:image_link>\n`;
    }
    for (const addImg of images.slice(1, 10)) {
      if (addImg) {
        xml += `      <g:additional_image_link>${xmlEscape(addImg)}</g:additional_image_link>\n`;
      }
    }
    xml += `      <g:brand>${xmlEscape(BRAND_NAME)}</g:brand>\n`;
    xml += `      <g:condition>new</g:condition>\n`;
    xml += `      <g:availability>${inStock ? 'in stock' : 'out of stock'}</g:availability>\n`;
    xml += `      <g:price>${xmlEscape(regularPrice)}</g:price>\n`;
    if (salePrice) {
      xml += `      <g:sale_price>${xmlEscape(salePrice)}</g:sale_price>\n`;
    }
    xml += `      <g:google_product_category>${xmlEscape(cats.google)}</g:google_product_category>\n`;
    xml += `      <g:fb_product_category>${xmlEscape(cats.fb)}</g:fb_product_category>\n`;
    xml += `      <g:gender>female</g:gender>\n`;
    xml += `      <g:age_group>adult</g:age_group>\n`;
    if (colors) {
      xml += `      <g:color>${xmlEscape(colors)}</g:color>\n`;
    }
    if (sizes) {
      xml += `      <g:size>${xmlEscape(sizes)}</g:size>\n`;
    }
    xml += '    </item>\n';
  }

  xml += '  </channel>\n';
  xml += '</rss>';

  return res.status(200).send(xml);
}
