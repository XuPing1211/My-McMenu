import { getDefaultMockProducts } from '../adapters/mock-product-adapter.js';
import type { ProductRef } from '../domain/types.js';

const snapshotCheckedAt = '2026-10-19T11:00:00.000Z';

export const mcpSnapshotProducts: ProductRef[] = [
  {
    source: 'mcd-mcp',
    productId: '9900016076',
    officialName: '“我就喜欢”鸡薯双全盒',
    category: '人气热卖',
    tags: ['心形薯饼同款比心'],
    available: true,
    price: { amount: 15.9, currency: 'CNY', checkedAt: snapshotCheckedAt, sourceField: 'currentPrice' },
  },
  {
    source: 'mcd-mcp',
    productId: '9900016075',
    officialName: '龙焰芝士棒鸡腿堡三件套',
    category: '鸡肉汉堡 / 卷',
    tags: ['上新', '浓郁奶香拉丝芝士'],
    available: true,
    price: { amount: 29.9, currency: 'CNY', checkedAt: snapshotCheckedAt, sourceField: 'currentPrice' },
  },
  {
    source: 'mcd-mcp',
    productId: '9900016073',
    officialName: '龙焰鸡腿堡三件套',
    category: '鸡肉汉堡 / 卷',
    tags: ['上新', '韩式辣椒黄油风味'],
    available: true,
    price: { amount: 26.9, currency: 'CNY', checkedAt: snapshotCheckedAt, sourceField: 'currentPrice' },
  },
  {
    source: 'mcd-mcp',
    productId: '9900005456',
    officialName: '麦辣鸡腿汉堡三件套',
    category: '鸡肉汉堡 / 卷',
    tags: ['套餐', '立省10.5元起'],
    available: true,
    price: { amount: 33.5, currency: 'CNY', checkedAt: snapshotCheckedAt, sourceField: 'currentPrice' },
  },
  {
    source: 'mcd-mcp',
    productId: '511781',
    officialName: '培根安格斯厚牛堡',
    category: '安格斯 MAX 厚牛堡',
    tags: ['单品', '100%安格斯牛肉'],
    available: true,
    price: { amount: 34.5, currency: 'CNY', checkedAt: snapshotCheckedAt, sourceField: 'currentPrice' },
  },
  {
    source: 'mcd-mcp',
    productId: '6352',
    officialName: '阳光橙麦炫酷',
    category: '饮品',
    tags: ['冷饮'],
    available: true,
    price: { amount: 13, currency: 'CNY', checkedAt: snapshotCheckedAt, sourceField: 'currentPrice' },
  },
];

export function getCatalog(source: 'mcp-snapshot' | 'mock'): ProductRef[] {
  return source === 'mcp-snapshot'
    ? mcpSnapshotProducts.map((product) => ({ ...product, tags: [...product.tags] }))
    : getDefaultMockProducts();
}
