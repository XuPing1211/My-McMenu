import { parseStoreContext, toQueryMealsArguments } from '../domain/store-context.js';
import type { ProductRef, StoreContext } from '../domain/types.js';
import type { ToolCallLogger } from '../telemetry/tool-call-log.js';
import { McpStreamableHttpClient, type McpClientOptions } from './mcp-client.js';
import {
  normalizeMealsResponse,
  normalizeProductDetailResponse,
} from './mcd-response.js';
import type { ProductAdapter } from './types.js';

export interface RealMcpAdapterOptions extends McpClientOptions {
  logger?: ToolCallLogger;
}

export class RealMcpAdapter implements ProductAdapter {
  private readonly client: McpStreamableHttpClient;
  private readonly now: () => Date;

  constructor(client: McpStreamableHttpClient, now: () => Date = () => new Date()) {
    this.client = client;
    this.now = now;
  }

  async listProducts(context: StoreContext): Promise<ProductRef[]> {
    const parsedContext = parseStoreContext(context);
    const result = await this.client.callTool<unknown>(
      'query-meals',
      toQueryMealsArguments(parsedContext),
    );
    return normalizeMealsResponse(result, this.now().toISOString());
  }

  async getProduct(productId: string, context: StoreContext): Promise<ProductRef | null> {
    if (!productId) throw new Error('productId is required');
    const parsedContext = parseStoreContext(context);
    const result = await this.client.callTool<unknown>('query-meal-detail', {
      ...toQueryMealsArguments(parsedContext),
      code: productId,
    });
    return normalizeProductDetailResponse(productId, result, this.now().toISOString());
  }
}

export function createRealMcpAdapter(options: RealMcpAdapterOptions): RealMcpAdapter {
  const client = new McpStreamableHttpClient(options);
  return new RealMcpAdapter(client, options.now ?? (() => new Date()));
}
