import { parseStoreContext } from '../domain/store-context.js';
import type { ProductRef, StoreContext } from '../domain/types.js';
import type { ProductAdapter } from './types.js';

const demoProducts: ProductRef[] = [
  {
    source: 'mock',
    productId: 'mock-burger-001',
    officialName: '演示汉堡（非官方商品数据）',
    category: '演示菜单',
    tags: ['演示数据'],
    available: true,
  },
  {
    source: 'mock',
    productId: 'mock-fries-001',
    officialName: '演示薯条（非官方商品数据）',
    category: '演示菜单',
    tags: ['演示数据'],
    available: true,
  },
  {
    source: 'mock',
    productId: 'mock-drink-001',
    officialName: '演示饮品（非官方商品数据）',
    category: '演示菜单',
    tags: ['演示数据'],
    available: true,
  },
];

function cloneProduct(product: ProductRef): ProductRef {
  return {
    ...product,
    tags: [...product.tags],
    ...(product.price ? { price: { ...product.price } } : {}),
  };
}

export interface MockProductAdapterOptions {
  products?: ProductRef[];
}

export class MockProductAdapter implements ProductAdapter {
  private readonly products: ProductRef[];

  constructor(options: MockProductAdapterOptions = {}) {
    this.products = (options.products ?? demoProducts).map(cloneProduct);
  }

  async listProducts(context: StoreContext): Promise<ProductRef[]> {
    parseStoreContext(context);
    return this.products.map(cloneProduct);
  }

  async getProduct(productId: string, context: StoreContext): Promise<ProductRef | null> {
    parseStoreContext(context);
    const product = this.products.find((item) => item.productId === productId);
    return product ? cloneProduct(product) : null;
  }
}

export function getDefaultMockProducts(): ProductRef[] {
  return demoProducts.map(cloneProduct);
}
