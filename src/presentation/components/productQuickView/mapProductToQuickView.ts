import { Product } from '../../../domain/models/Product';
import { ProductApi } from '../../../data/api/ProductApi';
import { ProductQuickViewData } from './productQuickViewTypes';

const formatPostedDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatMileage = (mileage?: number): string => {
  if (mileage === undefined || mileage === null) {
    return '—';
  }
  return `${mileage.toLocaleString()} km`;
};

const resolveImageUrl = (uri: string): string =>
  uri.startsWith('http') ? uri : ProductApi.withBase(uri);

const buildImageGallery = (product: Product): string[] => {
  const fromDto = product.images?.map(resolveImageUrl).filter(Boolean) ?? [];
  if (fromDto.length > 0) {
    return fromDto;
  }
  if (product.imageUrl) {
    return [resolveImageUrl(product.imageUrl)];
  }
  return [];
};

export const mapProductToQuickView = (product: Product): ProductQuickViewData => {
  const seedNum = product.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  return {
    product,
    images: buildImageGallery(product),
    viewsCount: product.views ?? 0,
    sharesCount: 40 + (seedNum % 80),
    commentsCount: product.commentCount ?? 0,
    year: product.year ?? '—',
    mileage: formatMileage(product.mileage),
    specsLabel: product.regionalSpecs ?? '—',
    availability: 'Available',
    seenByName: product.user?.name?.split(' ')[0] ?? '—',
    seenByOthers: 400 + (seedNum % 500),
    postedOnLabel: formatPostedDate(product.createdAt),
    locationTitle: product.location,
    locationAddress: product.location,
    quickViewData: product.quickViewData ?? [],
  };
};
