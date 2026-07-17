import { Product } from '../../domain/models/Product';
import { ProductApi } from '../api/ProductApi';
import { ProductDTO } from '../dto/ProductDTO';

export const mapProductDtoToProduct = (item: ProductDTO): Product => {
  const id = item._id ?? item.id ?? `product_${Date.now()}`;
  const imagePaths = item.images ?? [];
  const images = imagePaths.map(path => ProductApi.withBase(path));
  const imageUrl = images[0] ?? '';
  const videoUrl = item.video ? ProductApi.withBase(item.video) : '';

  return {
    id,
    title: item.title ?? item.name ?? 'Untitled Product',
    description: item.description ?? '',
    price: typeof item.price === 'number' ? item.price : 0,
    currency: item.currency ?? 'AED',
    videoUrl,
    imageUrl,
    images: images.length > 0 ? images : undefined,
    location: item.location ?? 'Unknown',
    likesCount: item.likes?.length ?? 0,
    views: item.views ?? 0,
    isSaved: Boolean(item.saved),
    isViewed: Boolean(item.isViewed ?? item.viewed),
    isSold: Boolean(item.isSold),
    createdAt: item.createdAt ?? new Date().toISOString(),
    user: item.user?.name
      ? {
          name: item.user.name,
          avatar: item.user.avatar ?? undefined,
        }
      : undefined,
    liked: Boolean(item.liked),
    saved: Boolean(item.saved),
    isPaused: false,
  };
};
