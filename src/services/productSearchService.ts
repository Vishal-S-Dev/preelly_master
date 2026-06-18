import {
  MOTORS_ROOT_CATEGORY_ID,
} from '../constants/createPostConstants';
import { ProductApi } from '../data/api/ProductApi';
import { ProductDTO, ProductsResponseDTO } from '../data/dto/ProductDTO';
import { SearchListingItem } from '../types/search.types';
import {
  ProductSearchPage,
  ProductSearchQuery,
  SEARCH_PAGE_LIMIT,
  SearchSortOption,
} from '../types/searchFilter.types';

const mapProductDtoToListing = (dto: ProductDTO): SearchListingItem => {
  const id = dto._id ?? dto.id ?? '';
  const imagePath = dto.images?.[0] ?? '';
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
    imageUrl: imagePath ? ProductApi.withBase(imagePath) : '',
    hasVideo: Boolean(dto.video),
    isSaved: Boolean(dto.saved ?? dto.isSaved),
    isFeatured: dto.status === 'featured' || dto.status === 'promoted',
  };
};

const resolveCategoryId = (categoryId?: string): string | undefined => {
  if (!categoryId) {
    return undefined;
  }
  if (categoryId.length >= 20) {
    return categoryId;
  }
  if (categoryId === 'motors') {
    return MOTORS_ROOT_CATEGORY_ID;
  }
  return categoryId;
};

const buildQueryParams = (query: ProductSearchQuery): Record<string, string | number> => {
  const params: Record<string, string | number> = {
    page: query.page ?? 1,
    limit: query.limit ?? SEARCH_PAGE_LIMIT,
  };

  // Temporarily omit `search` from product API params — filter via category/subcategory instead.
  // if (query.keyword?.trim()) {
  //   params.search = query.keyword.trim();
  // }
  const categoryId = resolveCategoryId(query.categoryId);
  if (categoryId) {
    params.categoryId = categoryId;
  }
  if (query.city?.trim() && query.city !== 'All Cities') {
    params.location = query.city.trim();
  }
  if (typeof query.minPrice === 'number' && query.minPrice > 0) {
    params.minPrice = query.minPrice;
  }
  if (typeof query.maxPrice === 'number' && query.maxPrice > 0) {
    params.maxPrice = query.maxPrice;
  }
  /*if (query.subCategoryId) {
    params.subCategoryId = query.subCategoryId;
  }*/
  if (query.makeModelId) {
    params.makeModelId = query.makeModelId;
  }
  if (query.trimId) {
    params.trimId = query.trimId;
  }
  if (query.emirates?.length) {
    params.emirates = query.emirates.join(',');
  }
  if (query.yearFrom?.trim()) {
    params.yearFrom = query.yearFrom.trim();
  }
  if (query.yearTo?.trim()) {
    params.yearTo = query.yearTo.trim();
  }
  if (typeof query.minKilometers === 'number' && query.minKilometers > 0) {
    params.minKilometers = query.minKilometers;
  }
  if (query.dynamicFilters && Object.keys(query.dynamicFilters).length > 0) {
    params.filters = JSON.stringify(query.dynamicFilters);
  }
  if (query.sort) {
    params.sort = query.sort;
  }
  if (query.year?.trim()) {
    params.year = query.year.trim();
  }
  if (query.maxKilometers?.trim()) {
    params.maxKilometers = query.maxKilometers.trim();
  }

  return params;
};

const sortListings = (items: SearchListingItem[], sort?: SearchSortOption): SearchListingItem[] => {
  if (!sort || sort === 'newest') {
    return items;
  }
  const next = [...items];
  if (sort === 'price_asc') {
    return next.sort((a, b) => a.price - b.price);
  }
  if (sort === 'price_desc') {
    return next.sort((a, b) => b.price - a.price);
  }
  return next;
};

const mockSearchProducts = (query: ProductSearchQuery): ProductSearchPage => {
  const page = query.page ?? 1;
  const limit = query.limit ?? SEARCH_PAGE_LIMIT;
  const keyword = query.keyword?.toLowerCase() ?? '';

  const products: ProductDTO[] = Array.from({ length: limit }, (_, index) => {
    const seed = (page - 1) * limit + index + 1;
    const titleBase = keyword ? `${keyword} listing ${seed}` : `Premium listing ${seed}`;
    const isVideo = seed % 3 === 0;
    return {
      _id: `search_${seed}`,
      title: titleBase,
      price: 25000 + seed * 3500,
      currency: 'AED',
      video: isVideo
        ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
        : '',
      images: [`https://picsum.photos/seed/search-${seed}/720/960`],
      location: query.city && query.city !== 'All Cities' ? `${query.city}, UAE` : 'Dubai, UAE',
      saved: seed % 5 === 0,
      status: seed % 7 === 0 ? 'featured' : 'active',
      year: `${2018 + (seed % 7)}`,
    };
  });

  const items = sortListings(products.map(mapProductDtoToListing), query.sort);
  return {
    items,
    page,
    limit,
    total: 103,
    hasMore: page < 6,
  };
};

const mapResponse = (
  data: ProductsResponseDTO,
  query: ProductSearchQuery,
): ProductSearchPage => {
  const items = sortListings((data.products ?? []).map(mapProductDtoToListing), query.sort);
  return {
    items,
    page: data.page ?? query.page ?? 1,
    limit: data.limit ?? query.limit ?? SEARCH_PAGE_LIMIT,
    total: data.total ?? items.length,
    hasMore: Boolean(data.hasMore),
  };
};

export const productSearchService = {
  searchProducts: async (query: ProductSearchQuery): Promise<ProductSearchPage> => {
    try {
      const data = await ProductApi.searchProducts(buildQueryParams(query));
      return mapResponse(data, query);
    } catch {
      await new Promise<void>(resolve => setTimeout(resolve, 350));
      return mockSearchProducts(query);
    }
  },
};
