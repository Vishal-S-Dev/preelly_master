import { API_ENDPOINTS, PAGINATION } from '../../constants/appConstants';
import { ENV } from '../../constants/env';
import { ProductDTO, ProductsResponseDTO } from '../dto/ProductDTO';
import { httpClient } from './httpClient';

const PRODUCTS_BASE_URL = ENV.API_BASE_URL;

const withBase = (path: string): string =>
  path.startsWith('http')
    ? path
    : `${PRODUCTS_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

export interface ProductLikeResponseDTO {
  liked: boolean;
  likeCount: number;
}

export interface ProductSaveResponseDTO {
  saved: boolean;
}

const mockProducts = (page: number, limit: number): ProductsResponseDTO => {
  const start = (page - 1) * limit + 1;
  const products: ProductDTO[] = Array.from({ length: limit }, (_entry, index) => {
    const seed = start + index;
    const isVideo = seed % 2 === 0;
    return {
      _id: `mock_${seed}`,
      title: `Premium Car ${seed}`,
      description: `Well maintained, single owner, top condition model ${seed}.`,
      price: 95000 + seed * 100,
      currency: 'AED',
      video: isVideo
        ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
        : '',
      images: [
        `https://picsum.photos/seed/product-${seed}/1080/1920`,
        `https://picsum.photos/seed/product-alt-${seed}/1080/1920`,
      ],
      location: 'Dubai, UAE',
      likes: Array.from({ length: (seed % 300) + 40 }, (_likeEntry, i) => `like_${i}`),
      isSaved: false,
      createdAt: new Date().toISOString(),
      user: {
        name: `Seller ${seed % 11}`,
        avatar: `https://i.pravatar.cc/200?img=${(seed % 70) + 1}`,
      },
    };
  });

  return {
    products,
    page,
    limit,
    total: 200,
    hasMore: page < 8,
  };
};

export const ProductApi = {
  async getProductById(productId: string): Promise<ProductDTO> {
    try {
      const { data } = await httpClient.get<ProductDTO | { data: ProductDTO }>(
        `${API_ENDPOINTS.PRODUCTS}/${productId}`,
        { baseURL: PRODUCTS_BASE_URL },
      );
      return (data as { data?: ProductDTO })?.data ?? (data as ProductDTO);
    } catch {
      await new Promise(resolve => setTimeout(resolve, 320));
      const seed = productId.replace(/\W/g, '') || '1';
      return {
        _id: productId,
        title: 'Lexus ES-Series ES 350',
        description:
          'Lexus RC 300 Full Options 2021 Model with premium package, leather interior, navigation, and full dealer warranty.',
        price: 100000,
        currency: 'AED',
        images: [
          `https://picsum.photos/seed/${seed}-1/1080/720`,
          `https://picsum.photos/seed/${seed}-2/1080/720`,
          `https://picsum.photos/seed/${seed}-3/1080/720`,
        ],
        location: 'Mussafah, Abu Dhabi, UAE',
        createdAt: new Date().toISOString(),
        user: { name: 'Abrar Shaikh', avatar: 'https://i.pravatar.cc/200?img=52' },
      };
    }
  },

  async getProducts(
    page: number = PAGINATION.INITIAL_PAGE,
    limit: number = PAGINATION.LIMIT,
  ): Promise<ProductsResponseDTO> {
    try {
      const { data } = await httpClient.get<ProductsResponseDTO>(API_ENDPOINTS.PRODUCTS, {
        baseURL: PRODUCTS_BASE_URL,
        params: { page, limit },
      });
      return data;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 350));
      return mockProducts(page, limit);
    }
  },

  async searchProducts(
    params: Record<string, string | number>,
  ): Promise<ProductsResponseDTO> {
    const { data } = await httpClient.get<ProductsResponseDTO>(API_ENDPOINTS.PRODUCTS, {
      baseURL: PRODUCTS_BASE_URL,
      params,
    });
    return data;
  },
  async likeProduct(productId: string): Promise<ProductLikeResponseDTO> {
    const { data } = await httpClient.post<ProductLikeResponseDTO>(
      `${API_ENDPOINTS.PRODUCTS}/${productId}/like`,
      undefined,
      { baseURL: PRODUCTS_BASE_URL },
    );
    return data;
  },
  async saveProduct(productId: string): Promise<ProductSaveResponseDTO> {
    const { data } = await httpClient.post<ProductSaveResponseDTO>(
      `${API_ENDPOINTS.PRODUCTS}/${productId}/save`,
      undefined,
      { baseURL: PRODUCTS_BASE_URL },
    );
    return data;
  },

  async viewProduct(productId: string): Promise<void> {
    await httpClient.post(
      `${API_ENDPOINTS.PRODUCTS}/${productId}/view`,
      undefined,
      { baseURL: PRODUCTS_BASE_URL },
    );
  },

  async createProduct(formData: FormData): Promise<{ id?: string }> {
    const { data } = await httpClient.post<{ _id?: string; id?: string; data?: { _id?: string } }>(
      API_ENDPOINTS.PRODUCTS,
      formData,
      {
        baseURL: PRODUCTS_BASE_URL,
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      },
    );
    return { id: data?._id ?? data?.id ?? data?.data?._id };
  },

  async updateProduct(productId: string, formData: FormData): Promise<{ id?: string }> {
    const { data } = await httpClient.put<{ _id?: string; id?: string; data?: { _id?: string } }>(
      `${API_ENDPOINTS.PRODUCTS}/${productId}`,
      formData,
      {
        baseURL: PRODUCTS_BASE_URL,
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      },
    );
    return { id: data?._id ?? data?.id ?? data?.data?._id ?? productId };
  },

  withBase,
};
