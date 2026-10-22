import { extractMcdPayload } from './mcd-response.js';

const productKeyPattern = /^(product(code|id)?|meal(code|id)?|item(code|id)?|food(code|id)?)$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function collectProductIds(value: unknown, output: Set<string>): void {
  if (Array.isArray(value)) {
    value.forEach((item) => collectProductIds(item, output));
    return;
  }
  if (!isRecord(value)) return;

  Object.entries(value).forEach(([key, child]) => {
    if (productKeyPattern.test(key) && typeof child === 'string' && /^\d{3,12}$/.test(child)) {
      output.add(child);
    }
    if (key.toLowerCase().includes('order') || key.toLowerCase().includes('item') || key.toLowerCase().includes('product') || key.toLowerCase().includes('meal')) {
      collectProductIds(child, output);
    }
  });
}

export function extractOrderProductIds(value: unknown): string[] {
  const ids = new Set<string>();
  collectProductIds(extractMcdPayload(value), ids);
  return [...ids];
}
