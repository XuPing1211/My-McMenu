import { menuBookSchema } from './schema.js';
import type { BookProfile, CustomProduct, MenuBook, ProductRef } from './types.js';

export interface CreateMenuBookOptions {
  products: ProductRef[];
  title?: string;
  authorNickname?: string;
  themeId?: string;
  description?: string;
  bookId?: string;
  profile?: BookProfile;
  now?: Date;
}

const defaultPageContent = {
  cover: {
    eyebrow: '粉丝创作 / 非官方商品命名',
    declaration: '把喜欢的麦门时刻，编成一本只属于我的菜单册。',
  },
  contents: {
    chapterLabel: '目录',
    note: '真实商品信息来自麦当劳 MCP；个性化文字由创作者编辑。',
  },
  productStory: {
    chapterLabel: '本命餐品',
    note: '这里优先展示你常点的餐品；历史订单未授权时会明确标注来源状态。',
  },
  combo: {
    chapterLabel: '快乐搭配',
    note: '根据你的 MBTI 性格偏好生成创作搭配，不是医学或营养建议。',
  },
  daily: {
    chapterLabel: '今日特刊',
    source: '娱乐性星座运势创作；餐品仍来自真实 MCP 商品列表。',
  },
  backCover: {
    note: '感谢每一个认真吃饭、认真表达的麦门时刻。',
  },
} as const;

function createBookId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  return `book-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toCustomProducts(products: ProductRef[]): CustomProduct[] {
  return products.map((product) => ({
    product,
    customName: product.officialName,
    tags: [],
    hidden: false,
  }));
}

function validProductIds(ids: string[] | undefined, productIds: string[], fallback: string[]): string[] {
  const allowed = new Set(productIds);
  const selected = (ids ?? []).filter((id) => allowed.has(id));
  return [...new Set(selected.length > 0 ? selected : fallback)];
}

function cloneProfile(profile: BookProfile | undefined, productIds: string[], fallbackIds: string[]): BookProfile | undefined {
  if (!profile) return undefined;
  const frequentProductIds = validProductIds(profile.frequentProductIds, productIds, []);
  const comboProductIds = validProductIds(profile.comboProductIds, productIds, fallbackIds);
  const dailyProductIds = validProductIds(profile.dailyProductIds, productIds, fallbackIds);
  return {
    ...profile,
    frequentProductIds,
    comboProductIds,
    dailyProductIds,
  };
}

export function createMenuBook(options: CreateMenuBookOptions): MenuBook {
  const now = options.now ?? new Date();
  const products = toCustomProducts(options.products);
  const productIds = products.map(({ product }) => product.productId);
  const fallbackIds = productIds.slice(0, 3);
  const profile = cloneProfile(options.profile, productIds, fallbackIds);
  const favoriteProductIds = profile?.frequentProductIds.length ? profile.frequentProductIds : fallbackIds;
  const comboProductIds = profile?.comboProductIds?.length ? profile.comboProductIds : fallbackIds;
  const dailyProductIds = profile?.dailyProductIds?.length ? profile.dailyProductIds : comboProductIds;

  const book: MenuBook = {
    schemaVersion: 1,
    bookId: options.bookId ?? createBookId(),
    title: options.title ?? '我的麦门菜单册',
    authorNickname: options.authorNickname ?? '麦门创作者',
    themeId: options.themeId ?? 'joyful',
    description: options.description ?? '一本由真实餐品和个人故事共同完成的菜单册。',
    products,
    ...(profile ? { profile } : {}),
    pages: [
      {
        id: 'cover',
        type: 'cover',
        templateId: `cover-hero-${options.themeId ?? 'joyful'}`,
        productIds: [],
        content: { ...defaultPageContent.cover },
      },
      {
        id: 'contents',
        type: 'contents',
        templateId: `contents-editorial-${options.themeId ?? 'joyful'}`,
        title: '目录',
        productIds,
        content: { ...defaultPageContent.contents },
      },
      {
        id: 'product-story',
        type: 'product-story',
        templateId: `product-story-${options.themeId ?? 'joyful'}`,
        title: '本命餐品',
        productIds: favoriteProductIds,
        content: {
          ...defaultPageContent.productStory,
          ...(profile?.frequentSource === 'mcd-mcp-order-list'
            ? { source: '来自你的麦当劳历史订单' }
            : { source: '常点记录未授权，当前使用候选餐品' }),
        },
      },
      {
        id: 'combo',
        type: 'combo',
        templateId: `combo-spread-${options.themeId ?? 'joyful'}`,
        title: profile?.comboTitle ?? '快乐搭配',
        productIds: comboProductIds,
        content: {
          ...defaultPageContent.combo,
          ...(profile?.mbti ? { mbti: `MBTI：${profile.mbti}` } : { mbti: 'MBTI：尚未选择' }),
          ...(profile?.comboDescription ? { reason: profile.comboDescription } : {}),
        },
      },
      {
        id: 'daily',
        type: 'daily',
        templateId: `daily-special-${options.themeId ?? 'joyful'}`,
        title: '今日特刊',
        productIds: dailyProductIds,
        content: {
          ...defaultPageContent.daily,
          ...(profile?.zodiac ? { zodiac: `星座：${profile.zodiac}` } : { zodiac: '星座：尚未选择' }),
          ...(profile?.horoscopeTitle ? { horoscopeTitle: profile.horoscopeTitle } : {}),
          ...(profile?.horoscopeText ? { horoscopeText: profile.horoscopeText } : {}),
        },
      },
      {
        id: 'back-cover',
        type: 'back-cover',
        templateId: `back-cover-editorial-${options.themeId ?? 'joyful'}`,
        productIds: [],
        content: { ...defaultPageContent.backCover },
      },
    ],
    revision: 1,
    updatedAt: now.toISOString(),
  };

  menuBookSchema.parse(book);
  return book;
}
