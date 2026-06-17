import { Product, ProductsPage } from '../../domain/models/Product';
import { ProductRepository } from '../../domain/repository/ProductRepository';
import { ProductApi } from '../api/ProductApi';
import { ProductDTO } from '../dto/ProductDTO';
import { mapProductDtoToProduct } from '../mappers/mapProductDtoToProduct';

const mapProduct = (item: ProductDTO): Product => mapProductDtoToProduct(item);

export class ProductRepositoryImpl implements ProductRepository {
  async getProducts(page: number, limit: number): Promise<ProductsPage> {
    const response = await ProductApi.getProducts(page, limit);
    return {
      page: response.page,
      limit: response.limit,
      total: response.total,
      hasMore: response.hasMore,
      products: response.products.map(mapProduct),
    };
  }

  async likeProduct(
    productId: string,
  ): Promise<{ liked: boolean; likeCount: number }> {
    return ProductApi.likeProduct(productId);
  }

  async saveProduct(productId: string): Promise<{ saved: boolean }> {
    return ProductApi.saveProduct(productId);
  }
}
