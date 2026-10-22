import { describe, expect, it } from 'vitest';
import { createMenuBook } from '../src/domain/menu-book.js';
import { menuBookSchema, productRefSchema } from '../src/domain/schema.js';
import { parseStoreContext, toQueryMealsArguments } from '../src/domain/store-context.js';
import type { ProductRef } from '../src/domain/types.js';

const products: ProductRef[] = [
  {
    source: 'mcd-mcp',
    productId: '9900016076',
    officialName: '“我就喜欢”鸡薯双全盒',
    tags: ['心形薯饼同款比心'],
    available: true,
  },
  {
    source: 'mcd-mcp',
    productId: '6352',
    officialName: '阳光橙麦炫酷',
    tags: ['冷饮'],
    available: true,
  },
];

describe('domain schema and menu book', () => {
  it('creates a validated six-page menu book without changing official product facts', () => {
    const book = createMenuBook({
      products,
      bookId: 'book-test-001',
      now: new Date('2026-10-19T11:00:00.000Z'),
    });

    expect(book.pages).toHaveLength(6);
    expect(book.pages.map((page) => page.type)).toEqual([
      'cover',
      'contents',
      'product-story',
      'combo',
      'daily',
      'back-cover',
    ]);
    expect(book.products[0]?.product.officialName).toBe('“我就喜欢”鸡薯双全盒');
    expect(book.products[0]?.customName).toBe('“我就喜欢”鸡薯双全盒');
    expect(menuBookSchema.safeParse(book).success).toBe(true);
  });

  it('rejects a page that references a product outside the book', () => {
    const book = createMenuBook({ products, bookId: 'book-test-002' });
    const invalid = {
      ...book,
      pages: book.pages.map((page, index) =>
        index === 2 ? { ...page, productIds: ['missing-product'] } : page,
      ),
    };

    expect(menuBookSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects duplicate official product ids', () => {
    expect(
      productRefSchema.array().parse([
        products[0],
        { ...products[0], officialName: '另一个创作名称' },
      ]),
    ).toHaveLength(2);

    const book = createMenuBook({ products, bookId: 'book-test-003' });
    const firstProduct = book.products[0];
    if (!firstProduct) throw new Error('expected a generated product');
    const invalid = {
      ...book,
      products: [firstProduct, { ...firstProduct }],
    };
    expect(menuBookSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('store context', () => {
  it('maps dine-in pickup to the official read-only query arguments', () => {
    const context = parseStoreContext({
      storeCode: '1450398',
      orderType: 1,
      beType: 1,
    });

    expect(toQueryMealsArguments(context)).toEqual({
      storeCode: '1450398',
      orderType: 1,
      beType: 1,
    });
  });

  it('requires beCode for delivery and drive-through contexts', () => {
    expect(() =>
      parseStoreContext({ storeCode: '1450398', orderType: 2, beType: 2 }),
    ).toThrow(/beCode/);
    expect(() =>
      parseStoreContext({
        storeCode: '1450398',
        orderType: 1,
        beType: 5,
        beCode: 'dt-business-code',
      }),
    ).not.toThrow();
  });
});
