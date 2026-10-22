import type { PriceFact, ProductRef } from '../domain/types.js';

interface TextContent {
  type?: unknown;
  text?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function parsePrice(
  value: unknown,
  checkedAt: string,
): PriceFact | undefined {
  const amount = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(amount) || amount < 0) return undefined;
  return {
    amount,
    currency: 'CNY',
    checkedAt,
    sourceField: 'currentPrice',
  };
}

function extractOriginalResponse(text: string): unknown {
  const marker = '## Original Response';
  const markerIndex = text.indexOf(marker);
  const candidate = markerIndex >= 0 ? text.slice(markerIndex + marker.length) : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) return undefined;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as unknown;
  } catch {
    return undefined;
  }
}

export function extractMcdPayload(value: unknown): unknown {
  const record = asRecord(value);
  if (!record) return value;

  if ('data' in record) return record;

  const structuredContent = record.structuredContent;
  if (structuredContent !== undefined) return extractMcdPayload(structuredContent);

  const content = asArray(record.content) as TextContent[];
  for (const item of content) {
    if (item.type !== 'text' || typeof item.text !== 'string') continue;
    try {
      return JSON.parse(item.text) as unknown;
    } catch {
      const originalResponse = extractOriginalResponse(item.text);
      if (originalResponse !== undefined) return originalResponse;
    }
  }

  return value;
}

function createProductRef(
  productId: string,
  details: Record<string, unknown>,
  category: string | undefined,
  tags: string[],
  checkedAt: string,
): ProductRef | undefined {
  const officialName = asString(details.name);
  if (!officialName) return undefined;

  const image = asString(details.image);
  const price = parsePrice(details.currentPrice, checkedAt);
  const product: ProductRef = {
    source: 'mcd-mcp',
    productId,
    officialName,
    tags: [...new Set(tags)],
    available: true,
  };
  if (image?.startsWith('http')) product.imageUrl = image;
  if (category) product.category = category;
  if (price) product.price = price;
  return product;
}

export function normalizeMealsResponse(value: unknown, checkedAt: string): ProductRef[] {
  const payload = asRecord(extractMcdPayload(value));
  const data = asRecord(payload?.data);
  if (!data) return [];

  const detailsMap = asRecord(data.meals) ?? {};
  const byId = new Map<string, ProductRef>();
  const categories = asArray(data.categories);

  for (const categoryValue of categories) {
    const category = asRecord(categoryValue);
    const categoryName = asString(category?.name);
    for (const mealValue of asArray(category?.meals)) {
      const meal = asRecord(mealValue);
      const code = asString(meal?.code);
      if (!code) continue;
      const details = asRecord(detailsMap[code]);
      if (!details) continue;
      const tags = asArray(meal?.tags).filter((tag): tag is string => typeof tag === 'string');
      const product = createProductRef(code, details, categoryName, tags, checkedAt);
      if (product) byId.set(code, product);
    }
  }

  for (const [productId, detailValue] of Object.entries(detailsMap)) {
    if (byId.has(productId)) continue;
    const details = asRecord(detailValue);
    if (!details) continue;
    const product = createProductRef(productId, details, undefined, [], checkedAt);
    if (product) byId.set(productId, product);
  }

  return [...byId.values()];
}

export function normalizeProductDetailResponse(
  productId: string,
  value: unknown,
  checkedAt: string,
): ProductRef | null {
  const payload = asRecord(extractMcdPayload(value));
  const data = asRecord(payload?.data);
  const candidates = [
    asRecord(data?.meal),
    asRecord(data?.product),
    asRecord(data),
  ].filter((candidate): candidate is Record<string, unknown> => candidate !== undefined);

  const details = candidates.find((candidate) => asString(candidate.name));
  if (!details) return null;
  return createProductRef(productId, details, undefined, [], checkedAt) ?? null;
}
