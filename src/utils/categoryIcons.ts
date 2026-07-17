import { resolveMediaUrl } from './mediaUrl';
import { Category } from '../types/category.types';

const SLUG_ICON_MAP: Record<string, string> = {
  motors: 'car-sports',
  property: 'home-city-outline',
  fashion: 'tshirt-crew-outline',
  furniture: 'sofa-outline',
  classifieds: 'newspaper-variant-outline',
  electronics: 'cellphone',
};

const CARD_COLORS = ['#FEF3C7', '#DBEAFE', '#FCE7F3', '#DCFCE7', '#FFEDD5', '#E0E7FF'];

export const getCategoryIcon = (slug?: string, name?: string): string => {
  const key = (slug ?? name ?? '').toLowerCase();
  return SLUG_ICON_MAP[key] ?? 'shape-outline';
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
