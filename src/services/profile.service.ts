import { ENV } from '../constants/env';
import { mapProductDtoToProduct } from '../data/mappers/mapProductDtoToProduct';
import { ProductApi } from '../data/api/ProductApi';
import { ProductDTO } from '../data/dto/ProductDTO';
import { Product } from '../domain/models/Product';
import { UserApi } from '../data/api/UserApi';
import { httpClient } from '../data/api/httpClient';
import { getDisplayAvatarUri } from '../utils/mediaUrl';
import type { ProfileProductGridItem, UserConnectionListing } from '../types/profile.types';
import type {
  UserConnectionDTO,
  UserFollowStatusResponseDTO,
  UserFollowToggleResponseDTO,
  UserProfileDTO,
} from '../types/userProfile.types';

const PROFILE_BASE = ENV.API_BASE_URL;

export type ProfileApiUserDTO = UserProfileDTO;

export interface ProfileListingsResult {
  items: ProfileProductGridItem[];
  products: Product[];
  hasMore: boolean;
}

const resolveListingImage = (dto: ProductDTO, seed: number): string => {
  const screenshot = dto.videoScreenshots?.[0]?.image;
  const raw = dto.images?.[0] ?? screenshot ?? dto.video;
  if (typeof raw === 'string' && raw.trim()) {
    return ProductApi.withBase(raw);
  }
  return `https://picsum.photos/seed/profile-${seed}/400/560`;
};

const mapUserConnection = (dto: UserConnectionDTO): UserConnectionListing => ({
  id: dto._id ?? dto.id ?? '',
  name: dto.name?.trim() || 'User',
  avatarUri: getDisplayAvatarUri(dto.avatar, dto.name),
  email: dto.email,
  rating: dto.rating ?? 0,
  isVerified: Boolean(dto.isVerified),
  isFollowing: dto.isFollowing,
});

const mapProductToGrid = (dto: ProductDTO, seed: number): ProfileProductGridItem => {
  const id = dto._id ?? dto.id ?? `product_${seed}`;
  return {
    id,
    title: dto.title ?? dto.name ?? 'Listing',
    price: dto.price ?? 0,
    currency: dto.currency ?? 'AED',
    imageUrl: resolveListingImage(dto, seed),
  };
};

const mockProductDtos = (count: number, tab: string, page: number): ProductDTO[] =>
  Array.from({ length: count }, (_, index) => {
    const seed = (page - 1) * count + index + 1 + tab.length;
    const isVideo = seed % 2 === 0;
    return {
      _id: `mock_${tab}_${seed}`,
      title: 'Best Deal Alert – Well Maintained Car at Great Price',
      price: 75000 + seed * 500,
      currency: 'AED',
      video: isVideo
        ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
        : '',
      images: [`https://picsum.photos/seed/profile-grid-${tab}-${seed}/400/560`],
      location: 'Dubai, UAE',
      likes: Array.from({ length: (seed % 50) + 10 }, (_entry, i) => `like_${i}`),
      liked: false,
      saved: false,
    };
  });

const mapListingsResult = (
  products: ProductDTO[],
  page: number,
  limit: number,
): ProfileListingsResult => ({
  items: products.map((item, index) => mapProductToGrid(item, page * 100 + index)),
  products: products.map(mapProductDtoToProduct),
  hasMore: products.length >= limit,
});

const fetchUserListingDtos = async (
  userId: string,
  page: number,
  limit: number,
): Promise<ProductDTO[]> => {
  try {
    const { data } = await httpClient.get<unknown>('/api/products', {
      baseURL: PROFILE_BASE,
      params: { userId, page, limit },
    });
    return extractProducts(data);
  } catch {
    return [];
  }
};

const fetchSavedListingDtos = async (page: number, limit: number): Promise<ProductDTO[]> => {
  try {
    const { data } = await httpClient.get<unknown>('/api/user/saved', {
      baseURL: PROFILE_BASE,
      params: { page, limit },
    });
    return extractProducts(data);
  } catch {
    return [];
  }
};

const fetchLikedListingDtos = async (page: number, limit: number): Promise<ProductDTO[]> => {
  try {
    const { data } = await httpClient.get<unknown>('/api/user/liked', {
      baseURL: PROFILE_BASE,
      params: { page, limit },
    });
    return extractProducts(data);
  } catch {
    return [];
  }
};

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

export const profileService = {
  async getCurrentUserProfile(): Promise<ProfileApiUserDTO> {
    try {
      const { data } = await httpClient.get<ProfileApiUserDTO | { data: ProfileApiUserDTO }>(
        '/api/user/profile',
        { baseURL: PROFILE_BASE },
      );
      return (data as { data?: ProfileApiUserDTO })?.data ?? (data as ProfileApiUserDTO);
    } catch {
      await new Promise(r => setTimeout(r, 300));
      /*return {
        name: 'Apsar Shaikh',
        bio: 'Your Dream Car Starts Here 🚗\nBest Deals | Verified Cars ✓',
        rating: 4.5,
        ratingsCount: 7,
        isVerified: true,
        avatar: 'https://i.pravatar.cc/300?img=68',
      };*/
    }
  },

  async getUserProfile(userId: string): Promise<ProfileApiUserDTO> {
    const { data } = await httpClient.get<ProfileApiUserDTO | { data: ProfileApiUserDTO }>(
      `/api/user/${userId}/profile`,
      { baseURL: PROFILE_BASE },
    );
    return (data as { data?: ProfileApiUserDTO })?.data ?? (data as ProfileApiUserDTO);
  },

  async toggleFollow(userId: string): Promise<UserFollowToggleResponseDTO> {
    return UserApi.toggleFollow(userId);
  },

  async getFollowStatus(userId: string): Promise<UserFollowStatusResponseDTO> {
    return UserApi.getFollowStatus(userId);
  },

  // Reuse the exact same call the Followers/Following list screens make (UserApi.getFollowersList
  // /getFollowingList) rather than a second, separately-implemented request to the same endpoint —
  // matching how the web app does it (one call to GET /api/user/:id/followers, trust `.count`),
  // and guaranteeing the count can never drift from what the list itself shows.
  // Deliberately does NOT catch/degrade to 0 here — a transient network failure must look like a
  // failure to the caller, not like "this user genuinely has 0 followers". Callers refetch this
  // periodically (e.g. on screen focus), so swallowing errors into a fake 0 would visibly regress
  // an already-correct count back to zero on nothing more than one flaky request.
  async getFollowersCount(userId: string): Promise<number> {
    const { count, followers } = await UserApi.getFollowersList(userId);
    return typeof count === 'number' ? count : followers?.length ?? 0;
  },

  async getFollowingCount(userId: string): Promise<number> {
    const { count, following } = await UserApi.getFollowingList(userId);
    return typeof count === 'number' ? count : following?.length ?? 0;
  },

  async getFollowers(userId: string): Promise<UserConnectionListing[]> {
    const { followers } = await UserApi.getFollowersList(userId);
    return (followers ?? []).map(mapUserConnection);
  },

  async getFollowing(userId: string): Promise<UserConnectionListing[]> {
    const { following } = await UserApi.getFollowingList(userId);
    return (following ?? []).map(mapUserConnection);
  },

  async getUserListings(
    userId: string,
    page = 1,
    limit = 18,
  ): Promise<ProfileListingsResult> {
    await new Promise(r => setTimeout(r, page === 1 ? 0 : 280));
    const products = await fetchUserListingDtos(userId, page, limit);
    return mapListingsResult(products, page, limit);
  },

  async getSavedProducts(page = 1, limit = 18): Promise<ProfileListingsResult> {
    await new Promise(r => setTimeout(r, 280));
    const products = await fetchSavedListingDtos(page, limit);
    return mapListingsResult(products, page, limit);
  },

  async getLikedProducts(page = 1, limit = 18): Promise<ProfileListingsResult> {
    await new Promise(r => setTimeout(r, 280));
    const products = await fetchLikedListingDtos(page, limit);
    return mapListingsResult(products, page, limit);
  },
};
