import { FeedApi } from '../data/api/feedApi';
import { ProductApi } from '../data/api/ProductApi';
import { SearchApi } from '../data/api/searchApi';
import { ProductDTO } from '../data/dto/ProductDTO';
import { FeedReelDto } from '../data/dto/FeedDTO';
import { PopularSearchesData, SearchListingItem } from '../types/search.types';

const mapProductDtoToListing = (dto: ProductDTO): SearchListingItem => {
  const id = dto._id ?? dto.id ?? '';
  const imagePath = dto.images?.[0] ?? '';
  return {
    id,
    title: dto.title ?? dto.name ?? 'Listing',
    price: typeof dto.productPriceValue === 'number' ? dto.productPriceValue : (dto.price ?? 0),
    currency: dto.currency ?? 'AED',
    location: dto.location ?? dto.city ?? 'UAE',
    imageUrl: imagePath ? ProductApi.withBase(imagePath) : '',
    hasVideo: Boolean(dto.video),
    isSaved: Boolean(dto.saved ?? dto.isSaved),
  };
};

const mapFeedReelToListing = (item: FeedReelDto): SearchListingItem => {
  const id = item._id ?? item.id ?? '';
  const imagePath = item.images?.[0] ?? '';
  return {
    id,
    title: item.title ?? 'Listing',
    price: item.price ?? 0,
    currency: item.currency ?? 'AED',
    location: item.location ?? 'UAE',
    imageUrl: imagePath ? ProductApi.withBase(imagePath) : '',
    hasVideo: Boolean(item.video),
    isSaved: Boolean(item.saved),
  };
};

export const searchService = {
  getPopularSearches: (limit = 10): Promise<PopularSearchesData> =>
    SearchApi.getPopularSearches(limit),

  getSuggestions: (keyword: string, limit = 10): Promise<string[]> =>
    SearchApi.getSuggestions(keyword, limit),

  getPopularListings: async (limit = 8): Promise<SearchListingItem[]> => {
    try {
      const feed = await FeedApi.getFeed(1, limit, 'trending');
      const fromFeed = (feed?.reels ?? []).map(mapFeedReelToListing).filter(item => item.imageUrl);
      if (fromFeed.length > 0) {
        return fromFeed;
      }
    } catch {
      // fall through to products API
    }

    const response = await ProductApi.getProducts(1, limit);
    return (response.products ?? []).map(mapProductDtoToListing).filter(item => item.imageUrl);
  },
};
