import type { ProductRef } from '../domain/types.js';

export interface LiveCatalogResult {
  source: 'mcd-mcp';
  checkedAt: string;
  context: {
    storeCode: string;
    orderType: number;
    beType: number;
  };
  products: ProductRef[];
}

export async function fetchLiveCatalog(signal?: AbortSignal): Promise<LiveCatalogResult> {
  const request: RequestInit = { headers: { Accept: 'application/json' } };
  if (signal) request.signal = signal;
  const response = await fetch('/api/mcd/menu?storeCode=1450398&orderType=1&beType=1', request);
  const payload = await response.json() as { error?: string; message?: string } & Partial<LiveCatalogResult>;
  if (!response.ok || payload.error || !Array.isArray(payload.products)) {
    throw new Error(payload.message ?? '官方 MCP 商品查询失败，请稍后重试。');
  }
  return payload as LiveCatalogResult;
}
