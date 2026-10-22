export type ProductSource = 'mcd-mcp' | 'mock';

export type OrderType = 1 | 2;
export type BeType = 1 | 2 | 5 | 6;
export type MbtiType = 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP' | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP' | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ' | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP';
export type ZodiacSign = '白羊座' | '金牛座' | '双子座' | '巨蟹座' | '狮子座' | '处女座' | '天秤座' | '天蝎座' | '射手座' | '摩羯座' | '水瓶座' | '双鱼座';
export type FrequentProductSource = 'mcd-mcp-order-list' | 'not-loaded' | 'mock';

export type BookPageType =
  | 'cover'
  | 'contents'
  | 'product-story'
  | 'combo'
  | 'daily'
  | 'back-cover';

export interface StoreContext {
  storeCode: string;
  orderType: OrderType;
  beType: BeType;
  beCode?: string;
  reservationDate?: string;
}

export interface PriceFact {
  amount: number;
  currency: string;
  checkedAt: string;
  sourceField: 'currentPrice' | 'originalPrice';
}

export interface ProductRef {
  source: ProductSource;
  productId: string;
  officialName: string;
  imageUrl?: string;
  available?: boolean;
  price?: PriceFact;
  category?: string;
  tags: string[];
}

export interface CustomProduct {
  product: ProductRef;
  customName: string;
  customDescription?: string;
  personalStory?: string;
  tags: string[];
  hidden: boolean;
}

export interface BookPage {
  id: string;
  type: BookPageType;
  templateId: string;
  title?: string;
  productIds: string[];
  content: Record<string, string>;
}

export interface BookProfile {
  frequentProductIds: string[];
  frequentSource: FrequentProductSource;
  comboProductIds?: string[];
  dailyProductIds?: string[];
  mbti?: MbtiType;
  zodiac?: ZodiacSign;
  horoscopeTitle?: string;
  horoscopeText?: string;
  comboTitle?: string;
  comboDescription?: string;
}

export interface MenuBook {
  schemaVersion: 1;
  bookId: string;
  title: string;
  authorNickname: string;
  themeId: string;
  description: string;
  products: CustomProduct[];
  profile?: BookProfile;
  pages: BookPage[];
  revision: number;
  updatedAt: string;
}
