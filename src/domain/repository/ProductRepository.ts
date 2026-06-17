import { ProductsPage } from '../models/Product';

export interface ProductRepository {
  getProducts(page: number, limit: number): Promise<ProductsPage>;
  likeProduct(productId: string): Promise<{ liked: boolean; likeCount: number }>;
  saveProduct(productId: string): Promise<{ saved: boolean }>;
}
