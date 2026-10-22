import { describe, expect, it } from 'vitest';
import { createCopyCandidates } from '../src/domain/creative-copy.js';
import { applyMenuBookEdits, toggleProductHidden } from '../src/domain/menu-book-editor.js';
import { buildBookHtml, toExportBook } from '../src/export/book-export.js';
import { createMenuBook } from '../src/domain/menu-book.js';
import { loadMenuBook, saveMenuBook, type StorageLike } from '../src/storage/menu-book-storage.js';
import type { ProductRef } from '../src/domain/types.js';

const product: ProductRef = {
  source: 'mcd-mcp',
  productId: '9900016076',
  officialName: '“我就喜欢”鸡薯双全盒',
  imageUrl: 'https://private.example.invalid/not-exported.png',
  tags: ['心形薯饼同款比心'],
  available: true,
};

function createBook() {
  return createMenuBook({ products: [product], bookId: 'phase3-book', now: new Date('2026-10-20T00:00:00.000Z') });
}

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}

describe('Phase 3 menu book editing', () => {
  it('changes only user-owned fields and leaves official facts untouched', () => {
    const book = createBook();
    const edited = applyMenuBookEdits(book, [
      { kind: 'product', productId: product.productId, field: 'customName', value: '烦恼退散小金条' },
      { kind: 'product', productId: product.productId, field: 'personalStory', value: '我的快乐开关。' },
      { kind: 'page', pageId: 'product-story', field: 'content', contentKey: 'note', value: '只属于我的一页。' },
    ], new Date('2026-10-20T01:00:00.000Z'));

    expect(edited.revision).toBe(2);
    expect(edited.products[0]?.customName).toBe('烦恼退散小金条');
    expect(edited.products[0]?.personalStory).toBe('我的快乐开关。');
    expect(edited.products[0]?.product.officialName).toBe(product.officialName);
    expect(edited.products[0]?.product.productId).toBe(product.productId);
    expect(edited.pages[2]?.content.note).toBe('只属于我的一页。');
    expect(book.products[0]?.customName).toBe(product.officialName);
    expect(book.pages[2]?.content.note).toBe('这里优先展示你常点的餐品；历史订单未授权时会明确标注来源状态。');
  });

  it('hides and restores a product without deleting it', () => {
    const book = createBook();
    const hidden = toggleProductHidden(book, product.productId, new Date('2026-10-20T02:00:00.000Z'));
    const restored = toggleProductHidden(hidden, product.productId, new Date('2026-10-20T03:00:00.000Z'));
    expect(hidden.products[0]?.hidden).toBe(true);
    expect(restored.products[0]?.hidden).toBe(false);
    expect(restored.products[0]?.product.productId).toBe(product.productId);
  });

  it('round trips through schema-validated local storage', () => {
    const storage = new MemoryStorage();
    const book = createBook();
    expect(saveMenuBook(book, storage)).toBe(true);
    expect(loadMenuBook(storage)).toEqual(book);
  });
});

describe('Phase 3 copy candidates and exports', () => {
  it('returns three local rewrite candidates', () => {
    const candidates = createCopyCandidates({
      kind: 'story',
      current: '',
      product,
    });
    expect(candidates).toHaveLength(3);
    expect(new Set(candidates).size).toBe(3);
  });

  it('exports only safe book fields and omits image URLs', () => {
    const book = createBook();
    const exported = toExportBook(book);
    const html = buildBookHtml(book);
    expect(exported.products[0]).not.toHaveProperty('imageUrl');
    expect(html).toContain('FAN-MADE / NOT OFFICIAL');
    expect(html).toContain(product.officialName);
    expect(html).not.toContain('private.example.invalid');
    expect(html).not.toContain('MCD_MCP_TOKEN');
  });
});
