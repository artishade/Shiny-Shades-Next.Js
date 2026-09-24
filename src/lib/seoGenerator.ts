/**
 * High-Converting SEO Meta & Tags Generator
 * Used by Admin AI Chat, Product Draft Card, Category Draft Card, and Product Form
 * to guarantee that every published product and category has rich SEO tags and meta titles.
 */

import { BRAND } from '@/config/brandingConfig';

export interface SeoGenerationInput {
  name: string;
  categoryName?: string;
  colors?: string[];
  price?: number | string;
  shortDescription?: string;
  description?: string;
}

export interface SeoGenerationOutput {
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  seoKeywords: string;
}

const GENERAL_FASHION_TAGS = [
  'women fashion bangladesh',
  'online shopping bd',
  'trending outfit',
  'premium quality dress',
  'eid collection',
  'party wear collection',
  'best price in bd',
  'authentic clothing',
];

export function generateProductSeo(input: SeoGenerationInput): SeoGenerationOutput {
  const name = (input.name || '').trim();
  const cat = (input.categoryName || '').trim();
  const colors = (input.colors || []).filter(Boolean);
  const brand = BRAND.fullName || 'Shiny Shades';

  // 1. Build SEO Title (within 60-70 chars ideally)
  let seoTitle = '';
  if (name) {
    if (cat && !name.toLowerCase().includes(cat.toLowerCase())) {
      seoTitle = `${name} - ${cat} | ${brand}`;
    } else {
      seoTitle = `${name} | Buy Online in Bangladesh - ${brand}`;
    }
    if (seoTitle.length > 70) {
      seoTitle = `${name} | ${brand}`;
    }
  }

  // 2. Build Rich Tags
  const tagSet = new Set<string>();

  // Add name variations
  if (name) {
    tagSet.add(name.toLowerCase());
    const words = name.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    if (words.length >= 2) {
      tagSet.add(`${words[0]} ${words[1]}`);
      if (words.length >= 3) {
        tagSet.add(`${words[1]} ${words[2]}`);
      }
    }
  }

  // Add category
  if (cat) {
    tagSet.add(cat.toLowerCase());
    tagSet.add(`${cat.toLowerCase()} collection`);
    tagSet.add(`${cat.toLowerCase()} bd`);
    tagSet.add(`buy ${cat.toLowerCase()} online`);
  }

  // Add colors
  colors.forEach((c) => {
    const col = c.toLowerCase();
    tagSet.add(`${col} dress`);
    if (name) tagSet.add(`${col} ${name.toLowerCase()}`);
    if (cat) tagSet.add(`${col} ${cat.toLowerCase()}`);
  });

  // Blend in high-ranking Bangladeshi fashion search terms
  GENERAL_FASHION_TAGS.forEach((tag) => tagSet.add(tag));

  const tags = Array.from(tagSet).slice(0, 14);
  const seoKeywords = tags.join(', ');

  // 3. Build SEO Meta Description
  const priceText = input.price ? ` at only ৳${input.price}` : '';
  const colorText = colors.length > 0 ? ` Available in ${colors.join(', ')}.` : '';
  const seoDescription = `Order ${name || 'stylish women fashion'}${priceText}${colorText}. Premium quality, trendy design & fast cash-on-delivery across Bangladesh from ${brand}.`.slice(0, 160);

  return {
    seoTitle,
    seoDescription,
    tags,
    seoKeywords,
  };
}

export function generateCategorySeo(categoryName: string, parentName?: string): {
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
} {
  const cat = (categoryName || '').trim();
  const brand = BRAND.fullName || 'Shiny Shades';

  const seoTitle = parentName
    ? `${cat} - ${parentName} Collection | Buy Online - ${brand}`
    : `${cat} Collection - Women's Fashion in Bangladesh | ${brand}`;

  const tags = [
    cat.toLowerCase(),
    `${cat.toLowerCase()} online bd`,
    `${cat.toLowerCase()} price in bangladesh`,
    `latest ${cat.toLowerCase()} designs`,
    'women fashion collection',
    'party wear bd',
    'eid collection 2026',
    'trendy dresses bd',
  ];

  const seoDescription = `Explore exclusive ${cat} collection at ${brand}. Discover stylish, comfortable, and top-tier women's attire with best prices and nationwide home delivery.`.slice(0, 160);

  return {
    seoTitle: seoTitle.slice(0, 70),
    seoDescription,
    seoKeywords: tags.join(', '),
  };
}
