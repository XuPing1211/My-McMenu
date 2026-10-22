export interface FrequentHistoryResult {
  source: 'mcd-mcp-order-list';
  productIds: string[];
  count: number;
}

export async function fetchFrequentProductIds(): Promise<FrequentHistoryResult> {
  const response = await fetch('/api/mcd/history', { headers: { Accept: 'application/json' } });
  const payload = await response.json() as { message?: string; error?: string } & Partial<FrequentHistoryResult>;
  if (!response.ok || payload.error || !Array.isArray(payload.productIds)) {
    throw new Error(payload.message ?? '历史订单读取失败，请稍后重试。');
  }
  return payload as FrequentHistoryResult;
}
