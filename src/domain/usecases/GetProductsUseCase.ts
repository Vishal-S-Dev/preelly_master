import { ProductRepository } from '../repository/ProductRepository';

export class GetProductsUseCase {
  constructor(private readonly repository: ProductRepository) {}

  execute(page: number, limit: number) {
    return this.repository.getProducts(page, limit);
  }
}
