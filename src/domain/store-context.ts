import { z } from 'zod';
import type { BeType, OrderType, StoreContext } from './types.js';

const reservationDatePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

export const storeContextSchema = z
  .object({
    storeCode: z.string().regex(/^\d+$/, 'storeCode must contain digits only'),
    orderType: z.union([z.literal(1), z.literal(2)]),
    beType: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(5),
      z.literal(6),
    ]),
    beCode: z.string().min(1).optional(),
    reservationDate: z
      .string()
      .regex(reservationDatePattern, 'reservationDate must use yyyy-MM-dd HH:mm')
      .optional(),
  })
  .superRefine((context, ctx) => {
    const expectedOrderType: OrderType = context.beType === 1 || context.beType === 5 ? 1 : 2;
    if (context.orderType !== expectedOrderType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['orderType'],
        message: `beType ${context.beType} requires orderType ${expectedOrderType}`,
      });
    }

    const requiresBeCode = context.beType !== 1;
    if (requiresBeCode && !context.beCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['beCode'],
        message: `beType ${context.beType} requires beCode from an upstream store query`,
      });
    }

    if (context.beType === 1 && context.beCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['beCode'],
        message: 'beType 1 must not send beCode',
      });
    }
  });

export function parseStoreContext(input: unknown): StoreContext {
  return storeContextSchema.parse(input) as StoreContext;
}

export function toQueryMealsArguments(context: StoreContext): {
  storeCode: string;
  orderType: OrderType;
  beType: BeType;
  beCode?: string;
  reservationDate?: string;
} {
  const parsed = parseStoreContext(context);
  const args: {
    storeCode: string;
    orderType: OrderType;
    beType: BeType;
    beCode?: string;
    reservationDate?: string;
  } = {
    storeCode: parsed.storeCode,
    orderType: parsed.orderType,
    beType: parsed.beType,
  };

  if (parsed.beCode) {
    args.beCode = parsed.beCode;
  }
  if (parsed.reservationDate) {
    args.reservationDate = parsed.reservationDate;
  }
  return args;
}
