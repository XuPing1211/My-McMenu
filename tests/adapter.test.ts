import { describe, expect, it } from 'vitest';
import { normalizeMealsResponse } from '../src/adapters/mcd-response.js';
import { MockProductAdapter } from '../src/adapters/mock-product-adapter.js';

const dineInContext = {
  storeCode: '1450398',
  orderType: 1 as const,
  beType: 1 as const,
};

describe('MockProductAdapter', () => {
  it('returns explicitly marked demo products and protects its internal array', async () => {
    const adapter = new MockProductAdapter();
    const first = await adapter.listProducts(dineInContext);
    first[0]!.tags.push('mutated-in-test');
    const second = await adapter.listProducts(dineInContext);

    expect(first.length).toBeGreaterThan(0);
    expect(first.every((product) => product.source === 'mock')).toBe(true);
    expect(first.every((product) => product.officialName.includes('非官方商品数据'))).toBe(true);
    expect(second[0]?.tags).not.toContain('mutated-in-test');
  });
});

describe('MCP response normalization', () => {
  it('maps category codes and detail facts into ProductRef values', () => {
    const payload = {
      success: true,
      data: {
        categories: [
          {
            name: '饮品',
            meals: [{ code: '6352', tags: ['冷饮'] }],
          },
        ],
        meals: {
          '6352': {
            name: '阳光橙麦炫酷',
            image: 'https://menu-img.mcd.cn/example.png',
            currentPrice: '13',
            originalPrice: '13',
            canWithOrder: false,
          },
        },
      },
    };

    const products = normalizeMealsResponse(payload, '2026-10-19T11:00:00.000Z');
    expect(products).toEqual([
      {
        source: 'mcd-mcp',
        productId: '6352',
        officialName: '阳光橙麦炫酷',
        imageUrl: 'https://menu-img.mcd.cn/example.png',
        available: true,
        price: {
          amount: 13,
          currency: 'CNY',
          checkedAt: '2026-10-19T11:00:00.000Z',
          sourceField: 'currentPrice',
        },
        category: '饮品',
        tags: ['冷饮'],
      },
    ]);
  });

  it('does not invent an official name when detail data is incomplete', () => {
    const products = normalizeMealsResponse(
      {
        data: {
          categories: [{ name: '未知', meals: [{ code: 'missing-detail' }] }],
          meals: {},
        },
      },
      '2026-10-19T11:00:00.000Z',
    );
    expect(products).toEqual([]);
  });
});
