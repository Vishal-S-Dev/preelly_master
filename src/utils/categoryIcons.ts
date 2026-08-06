import { resolveMediaUrl } from './mediaUrl';
import { Category } from '../types/category.types';

/** Lowercases and strips non-alphanumerics so "Fashion & Accessories" / "fashion-accessories" match one key. */
export const normalizeCategoryKey = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const SLUG_ICON_MAP: Record<string, string> = {
  motors: 'car-sports',
  automotive: 'car-sports',
  property: 'home-city-outline',
  fashion: 'tshirt-crew-outline',
  fashionaccessories: 'tshirt-crew-outline',
  // API label has been observed with this misspelling — kept as an alias, not a canonical spelling.
  fashionaccesseries: 'tshirt-crew-outline',
  furniture: 'sofa-outline',
  furniturefixtures: 'sofa-outline',
  classifieds: 'newspaper-variant-outline',
  electronics: 'cellphone',
  applianceselectronics: 'fridge-outline',
  giveaways: 'gift-outline',
  sportsoutdoors: 'basketball',
  beautyhealth: 'spa-outline',
  anythingeverything: 'shape-outline',
  gadgets: 'chip',
  kidsstuff: 'toy-brick-outline',
};

const CARD_COLORS = ['#FEF3C7', '#DBEAFE', '#FCE7F3', '#DCFCE7', '#FFEDD5', '#E0E7FF'];

export const getCategoryIcon = (slug?: string, name?: string): string => {
  const bySlug = slug ? SLUG_ICON_MAP[normalizeCategoryKey(slug)] : undefined;
  if (bySlug) {
    return bySlug;
  }
  const byName = name ? SLUG_ICON_MAP[normalizeCategoryKey(name)] : undefined;
  return byName ?? 'shape-outline';
};

export const getCategoryCardColor = (index: number): string =>
  CARD_COLORS[index % CARD_COLORS.length];

const isHexColor = (value: string): boolean => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value);

const isMediaPath = (value: string): boolean =>
  value.startsWith('/') ||
  value.startsWith('http://') ||
  value.startsWith('https://') ||
  value.includes('/uploads/');

export const resolveCategoryImageUrl = (
  category: Pick<Category, 'categoryImage' | 'image' | 'icon'>,
): string | undefined => {
  const candidates = [category.categoryImage, category.image, category.icon];
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (!trimmed || !isMediaPath(trimmed)) {
      continue;
    }
    const resolved = resolveMediaUrl(trimmed);
    if (resolved) {
      return resolved;
    }
  }
  return undefined;
};

export const resolveCategoryBackgroundColor = (
  category: Pick<Category, 'colorCode'>,
  index: number,
): string => {
  const color = category.colorCode?.trim();
  if (color && isHexColor(color)) {
    return color;
  }
  return getCategoryCardColor(index);
};
