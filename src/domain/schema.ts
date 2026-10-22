import { z } from 'zod';

const productSourceSchema = z.enum(['mcd-mcp', 'mock']);

const mbtiSchema = z.enum(['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP']);
const zodiacSchema = z.enum(['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座']);
const frequentSourceSchema = z.enum(['mcd-mcp-order-list', 'not-loaded', 'mock']);

export const bookProfileSchema = z.object({
  frequentProductIds: z.array(z.string()),
  frequentSource: frequentSourceSchema,
  comboProductIds: z.array(z.string()).optional(),
  dailyProductIds: z.array(z.string()).optional(),
  mbti: mbtiSchema.optional(),
  zodiac: zodiacSchema.optional(),
  horoscopeTitle: z.string().optional(),
  horoscopeText: z.string().optional(),
  comboTitle: z.string().optional(),
  comboDescription: z.string().optional(),
});

export const priceFactSchema = z.object({
  amount: z.number().finite().nonnegative(),
  currency: z.string().min(1),
  checkedAt: z.string().datetime(),
  sourceField: z.enum(['currentPrice', 'originalPrice']),
});

export const productRefSchema = z.object({
  source: productSourceSchema,
  productId: z.string().min(1),
  officialName: z.string().min(1),
  imageUrl: z.string().url().optional(),
  available: z.boolean().optional(),
  price: priceFactSchema.optional(),
  category: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)),
});

export const customProductSchema = z.object({
  product: productRefSchema,
  customName: z.string().min(1),
  customDescription: z.string().optional(),
  personalStory: z.string().optional(),
  tags: z.array(z.string().min(1)),
  hidden: z.boolean(),
});

export const bookPageSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    'cover',
    'contents',
    'product-story',
    'combo',
    'daily',
    'back-cover',
  ]),
  templateId: z.string().min(1),
  title: z.string().optional(),
  productIds: z.array(z.string()),
  content: z.record(z.string(), z.string()),
});

const fixedPageTypes = [
  'cover',
  'contents',
  'product-story',
  'combo',
  'daily',
  'back-cover',
] as const;

export const menuBookSchema = z
  .object({
    schemaVersion: z.literal(1),
    bookId: z.string().min(1),
    title: z.string().min(1),
    authorNickname: z.string().min(1),
    themeId: z.string().min(1),
    description: z.string(),
    products: z.array(customProductSchema),
    profile: bookProfileSchema.optional(),
    pages: z.array(bookPageSchema).length(6),
    revision: z.number().int().positive(),
    updatedAt: z.string().datetime(),
  })
  .superRefine((book, ctx) => {
    const productIds = book.products.map(({ product }) => product.productId);
    const uniqueProductIds = new Set(productIds);
    if (uniqueProductIds.size !== productIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['products'],
        message: 'products.productId must be unique',
      });
    }

    const pageIds = book.pages.map((page) => page.id);
    if (new Set(pageIds).size !== pageIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pages'],
        message: 'pages.id must be unique',
      });
    }

    book.pages.forEach((page, index) => {
      if (page.type !== fixedPageTypes[index]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['pages', index, 'type'],
          message: `page ${index + 1} must be ${fixedPageTypes[index]}`,
        });
      }

      page.productIds.forEach((productId) => {
        if (!uniqueProductIds.has(productId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['pages', index, 'productIds'],
            message: `unknown productId reference: ${productId}`,
          });
        }
      });
    });
  });

export type MenuBookInput = z.infer<typeof menuBookSchema>;
export type ProductRefInput = z.infer<typeof productRefSchema>;
