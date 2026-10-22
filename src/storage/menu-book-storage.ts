import { menuBookSchema } from '../domain/schema.js';
import type { MenuBook } from '../domain/types.js';

export const MENU_BOOK_STORAGE_KEY = 'my-mcmenu:menu-book:v1';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getBrowserStorage(): StorageLike | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage;
}

export function saveMenuBook(book: MenuBook, storage: StorageLike | null = getBrowserStorage()): boolean {
  if (!storage) return false;
  menuBookSchema.parse(book);
  storage.setItem(MENU_BOOK_STORAGE_KEY, JSON.stringify(book));
  return true;
}

export function loadMenuBook(storage: StorageLike | null = getBrowserStorage()): MenuBook | null {
  if (!storage) return null;
  const raw = storage.getItem(MENU_BOOK_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    const result = menuBookSchema.safeParse(parsed);
    return result.success ? (result.data as MenuBook) : null;
  } catch {
    return null;
  }
}

export function clearMenuBook(storage: StorageLike | null = getBrowserStorage()): void {
  storage?.removeItem(MENU_BOOK_STORAGE_KEY);
}
