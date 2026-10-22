import { menuBookSchema } from './schema.js';
import type { BookPage, CustomProduct, MenuBook } from './types.js';

export type MenuBookEdit =
  | { kind: 'book'; field: 'title' | 'description' | 'authorNickname' | 'themeId'; value: string }
  | { kind: 'page'; pageId: string; field: 'title'; value: string }
  | { kind: 'page'; pageId: string; field: 'content'; contentKey: string; value: string }
  | { kind: 'product'; productId: string; field: 'customName' | 'customDescription' | 'personalStory'; value: string }
  | { kind: 'product'; productId: string; field: 'tags'; value: string[] }
  | { kind: 'product'; productId: string; field: 'hidden'; value: boolean };

function cloneBook(book: MenuBook): MenuBook {
  return JSON.parse(JSON.stringify(book)) as MenuBook;
}

function touch(book: MenuBook, now: Date): MenuBook {
  book.revision += 1;
  book.updatedAt = now.toISOString();
  menuBookSchema.parse(book);
  return book;
}

function findPage(book: MenuBook, pageId: string): BookPage {
  const page = book.pages.find((candidate) => candidate.id === pageId);
  if (!page) throw new Error(`Unknown pageId: ${pageId}`);
  return page;
}

function findProduct(book: MenuBook, productId: string): CustomProduct {
  const product = book.products.find((candidate) => candidate.product.productId === productId);
  if (!product) throw new Error(`Unknown productId: ${productId}`);
  return product;
}

function assignOptionalString(product: CustomProduct, field: 'customDescription' | 'personalStory', value: string): void {
  const normalized = value.trim();
  if (normalized) product[field] = normalized;
  else delete product[field];
}

function applyEditToDraft(next: MenuBook, edit: MenuBookEdit): void {
  if (edit.kind === 'book') {
    next[edit.field] = edit.value.trim() || (edit.field === 'title' ? '我的麦门菜单册' : next[edit.field]);
    return;
  }

  if (edit.kind === 'page') {
    const page = findPage(next, edit.pageId);
    if (edit.field === 'title') {
      if (edit.value.trim()) page.title = edit.value.trim();
      else delete page.title;
    } else {
      const normalized = edit.value.trim();
      if (normalized) page.content[edit.contentKey] = normalized;
      else delete page.content[edit.contentKey];
    }
    return;
  }

  const product = findProduct(next, edit.productId);
  if (edit.field === 'customName') {
    product.customName = edit.value.trim() || product.product.officialName;
  } else if (edit.field === 'customDescription' || edit.field === 'personalStory') {
    assignOptionalString(product, edit.field, edit.value);
  } else if (edit.field === 'tags') {
    product.tags = [...new Set(edit.value.map((tag) => tag.trim()).filter(Boolean))];
  } else if (edit.field === 'hidden') {
    product.hidden = edit.value;
  }
}

export function applyMenuBookEdits(book: MenuBook, edits: MenuBookEdit[], now = new Date()): MenuBook {
  if (edits.length === 0) return book;
  const next = cloneBook(book);
  edits.forEach((edit) => applyEditToDraft(next, edit));
  return touch(next, now);
}

export function applyMenuBookEdit(book: MenuBook, edit: MenuBookEdit, now = new Date()): MenuBook {
  return applyMenuBookEdits(book, [edit], now);
}

export function toggleProductHidden(book: MenuBook, productId: string, now = new Date()): MenuBook {
  const product = findProduct(book, productId);
  return applyMenuBookEdit(book, {
    kind: 'product',
    productId,
    field: 'hidden',
    value: !product.hidden,
  }, now);
}
