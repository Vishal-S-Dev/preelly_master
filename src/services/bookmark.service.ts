import { ENV } from '../constants/env';
import { httpClient } from '../data/api/httpClient';
import { ProductApi } from '../data/api/ProductApi';
import { ProductDTO } from '../data/dto/ProductDTO';
import { BookmarkListingItem } from '../types/bookmark.types';

const PROFILE_BASE = ENV.API_BASE_URL;

// Same endpoint ProfileScreen's "Saved" tab already calls (see profile.service.ts) — reused as-is
// rather than the `/api/user/wishlist` endpoint, since it returns the identical DTO shape and is
// already wired end to end. Boards/groups have no backend representation, so this fetch pages
// through the *entire* saved set (bounded by MAX_PAGES as a safety cap) and the grouping is
// computed client-side in `useBookmarkSavedData`.
const SAVED_ENDPOINT = '/api/user/saved';
const PAGE_LIMIT = 50;
const MAX_PAGES = 20;

const extractProducts = (payload: unknown): ProductDTO[] => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === 'object') {
    const data = payload as {
      products?: ProductDTO[];
      items?: ProductDTO[];
      data?: ProductDTO[] | { products?: ProductDTO[]; items?: ProductDTO[] };
    };
    if (Array.isArray(data.items)) {
      return data.items;
    }
    if (Array.isArray(data.products)) {
      return data.products;
    }
    if (Array.isArray(data.data)) {
      return data.data;
    }
    if (data.data && typeof data.data === 'object') {
      if (Array.isArray(data.data.items)) {
        return data.data.items;
      }
      if (Array.isArray(data.data.products)) {
        return data.data.products;
      }
    }
  }
  return [];
};

const resolvePreviewImage = (dto: ProductDTO): string => {
  const raw = dto.images?.[0] ?? dto.videoScreenshots?.[0]?.image ?? '';
  return raw ? ProductApi.withBase(raw) : '';
};

const mapDtoToBookmarkItem = (dto: ProductDTO): BookmarkListingItem => {
  const id = dto._id ?? dto.id ?? '';
  const price =
    typeof dto.productPriceValue === 'number'
      ? dto.productPriceValue
      : typeof dto.price === 'number'
        ? dto.price
        : 0;

  return {
    id,
    title: dto.title ?? dto.name ?? 'Listing',
    price,
    currency: dto.currency ?? 'AED',
    location: dto.location ?? dto.city ?? 'UAE',
    imageUrl: resolvePreviewImage(dto),
    hasVideo: Boolean(dto.video),
    videoUrl: dto.video ? ProductApi.withBase(dto.video) : undefined,
    isSaved: true,
    isFeatured: dto.status === 'featured' || dto.status === 'promoted',
    isSold: dto.isSold,
    status: dto.status,
    createdAt: dto.createdAt ?? new Date().toISOString(),
    updatedAt: dto.updatedAt ?? dto.createdAt ?? new Date().toISOString(),
    categoryId: dto.category?._id,
    categoryName: dto.category?.name,
    categoryIcon: dto.category?.emoji,
  };
};

export const getBookmarkErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string }; status?: number } })
      .response;
    if (response?.status === 401 || response?.status === 403) {
      return 'Your session has expired. Please sign in again.';
    }
    if (typeof response?.data?.message === 'string' && response.data.message.trim()) {
      return response.data.message.trim();
    }
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: string }).message;
    if (message === 'Network Error') {
      return 'You’re offline. Check your connection and try again.';
    }
  }
  return 'Something went wrong while loading your saved items.';
};

export const bookmarkService = {
  /** Pages through the full saved list — required because grouping/filters/search here are all
   * client-side (no backend board support to filter by), so a complete, current snapshot is the
   * only way to compute accurate per-board counts and previews. */
  async fetchAllSavedListings(): Promise<BookmarkListingItem[]> {
    const results: BookmarkListingItem[] = [];
    let page = 1;

    while (page <= MAX_PAGES) {
      const { data } = await httpClient.get<unknown>(SAVED_ENDPOINT, {
        baseURL: PROFILE_BASE,
        params: { page, limit: PAGE_LIMIT },
      });
      const dtos = extractProducts(data);
      results.push(...dtos.map(mapDtoToBookmarkItem).filter(item => item.id));
      if (dtos.length < PAGE_LIMIT) {
        break;
      }
      page += 1;
    }

    return results;
  },
};
