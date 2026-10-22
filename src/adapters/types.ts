import type { ProductRef, StoreContext } from '../domain/types.js';

export interface ProductAdapter {
  listProducts(context: StoreContext): Promise<ProductRef[]>;
  getProduct(productId: string, context: StoreContext): Promise<ProductRef | null>;
}
