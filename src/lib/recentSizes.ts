/**
 * Dynamic Recently-Used Sizes Manager
 * Replaces hardcoded size presets with live, merchant-tailored suggestions.
 * Keeps track of recently added individual sizes and combined size groups (e.g. M, L, XL, XXL).
 */

const STORAGE_KEY_SIZES = 'shiny_admin_recent_sizes';
const STORAGE_KEY_GROUPS = 'shiny_admin_recent_size_groups';

export interface SizeGroup {
  id: string;
  label: string;
  sizes: string[];
}

const DEFAULT_INDIVIDUAL_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
const DEFAULT_SIZE_GROUPS: SizeGroup[] = [
  { id: 'm-xl', label: 'M, L, XL', sizes: ['M', 'L', 'XL'] },
  { id: 's-xxl', label: 'S, M, L, XL, XXL', sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
  { id: 'free-size', label: 'Free Size', sizes: ['Free Size'] },
];

export function getRecentIndividualSizes(): string[] {
  if (typeof window === 'undefined') return DEFAULT_INDIVIDUAL_SIZES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SIZES);
    if (!raw) return DEFAULT_INDIVIDUAL_SIZES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.filter((s) => typeof s === 'string' && s.trim().length > 0);
    }
  } catch (err) {
    console.warn('[recentSizes] failed to parse stored sizes:', err);
  }
  return DEFAULT_INDIVIDUAL_SIZES;
}

export function getRecentSizeGroups(): SizeGroup[] {
  if (typeof window === 'undefined') return DEFAULT_SIZE_GROUPS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GROUPS);
    if (!raw) return DEFAULT_SIZE_GROUPS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('[recentSizes] failed to parse stored size groups:', err);
  }
  return DEFAULT_SIZE_GROUPS;
}

export function formatSizeGroupLabel(sizes: string[]): string {
  if (!sizes || !sizes.length) return '';
  if (sizes.length === 1) return sizes[0];
  // Check consecutive standard sizes
  const std = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
  const indices = sizes.map((s) => std.indexOf(s.toUpperCase()));
  const isConsecutive = indices.every((idx, i) => i === 0 || (idx !== -1 && idx === indices[i - 1] + 1));
  if (isConsecutive && indices[0] !== -1 && sizes.length > 2) {
    return `${sizes[0]}–${sizes[sizes.length - 1]}`;
  }
  return sizes.join(', ');
}

export function recordUsedSizes(newSizes: string[]): void {
  if (typeof window === 'undefined' || !newSizes || !newSizes.length) return;

  const cleaned = Array.from(
    new Set(
      newSizes
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.length <= 20)
    )
  );

  if (!cleaned.length) return;

  try {
    // 1. Update individual sizes list (most recent first)
    const existingSizes = getRecentIndividualSizes();
    const updatedSizes = Array.from(new Set([...cleaned, ...existingSizes])).slice(0, 24);
    localStorage.setItem(STORAGE_KEY_SIZES, JSON.stringify(updatedSizes));

    // 2. Update size groups if more than 1 size or distinct
    const existingGroups = getRecentSizeGroups();
    const groupKey = cleaned.map((s) => s.toUpperCase()).sort().join('|');

    // Filter out group with exact same sizes
    const filteredGroups = existingGroups.filter(
      (g) => g.sizes.map((s) => s.toUpperCase()).sort().join('|') !== groupKey
    );

    const newGroup: SizeGroup = {
      id: `grp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: formatSizeGroupLabel(cleaned),
      sizes: cleaned,
    };

    const updatedGroups = [newGroup, ...filteredGroups].slice(0, 10);
    localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(updatedGroups));

    // Notify listeners
    window.dispatchEvent(new CustomEvent('shiny_recent_sizes_changed'));
  } catch (err) {
    console.warn('[recentSizes] failed to record used sizes:', err);
  }
}

export function removeRecentSize(sizeToRemove: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existingSizes = getRecentIndividualSizes().filter((s) => s !== sizeToRemove);
    localStorage.setItem(STORAGE_KEY_SIZES, JSON.stringify(existingSizes));
    window.dispatchEvent(new CustomEvent('shiny_recent_sizes_changed'));
  } catch (err) {
    console.warn('[recentSizes] failed to remove size:', err);
  }
}

export function removeRecentGroup(groupId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existingGroups = getRecentSizeGroups().filter((g) => g.id !== groupId);
    localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(existingGroups));
    window.dispatchEvent(new CustomEvent('shiny_recent_sizes_changed'));
  } catch (err) {
    console.warn('[recentSizes] failed to remove group:', err);
  }
}

/**
 * Harvests sizes from existing store products to seed dynamic suggestions
 */
export function seedSizesFromProducts(products: Array<{ sizes?: string[] }>): void {
  if (typeof window === 'undefined' || !products || !products.length) return;
  const groupsFound: Array<string[]> = [];
  const individualFound = new Set<string>();

  for (const p of products) {
    if (Array.isArray(p.sizes) && p.sizes.length > 0) {
      const valid = p.sizes.map((s) => String(s).trim()).filter(Boolean);
      if (valid.length > 0) {
        groupsFound.push(valid);
        valid.forEach((s) => individualFound.add(s));
      }
    }
  }

  if (groupsFound.length > 0) {
    try {
      const currentSizes = getRecentIndividualSizes();
      const mergedSizes = Array.from(new Set([...currentSizes, ...Array.from(individualFound)])).slice(0, 24);
      localStorage.setItem(STORAGE_KEY_SIZES, JSON.stringify(mergedSizes));

      const currentGroups = getRecentSizeGroups();
      const existingKeys = new Set(
        currentGroups.map((g) => g.sizes.map((s) => s.toUpperCase()).sort().join('|'))
      );

      const addedGroups: SizeGroup[] = [];
      for (const grp of groupsFound) {
        const key = grp.map((s) => s.toUpperCase()).sort().join('|');
        if (!existingKeys.has(key)) {
          existingKeys.add(key);
          addedGroups.push({
            id: `seed-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            label: formatSizeGroupLabel(grp),
            sizes: grp,
          });
        }
      }

      if (addedGroups.length > 0) {
        const mergedGroups = [...currentGroups, ...addedGroups].slice(0, 12);
        localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(mergedGroups));
      }
      window.dispatchEvent(new CustomEvent('shiny_recent_sizes_changed'));
    } catch {
      // Ignored
    }
  }
}
