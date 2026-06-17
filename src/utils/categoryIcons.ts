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
