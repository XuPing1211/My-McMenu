import { createRealMcpAdapter } from '../adapters/real-mcp-adapter.js';
import { parseStoreContext } from '../domain/store-context.js';
import { InMemoryToolCallLogger } from '../telemetry/tool-call-log.js';

const token = process.env.MCD_MCP_TOKEN;
if (!token) {
  throw new Error('MCD_MCP_TOKEN is required for the real MCP smoke test');
}

const storeCode = process.env.MCD_MCP_STORE_CODE ?? '1450398';
const beType = Number(process.env.MCD_MCP_BE_TYPE ?? '1') as 1 | 2 | 5 | 6;
const orderType = Number(process.env.MCD_MCP_ORDER_TYPE ?? (beType === 1 || beType === 5 ? '1' : '2')) as 1 | 2;
const rawContext: Record<string, unknown> = { storeCode, orderType, beType };
if (process.env.MCD_MCP_BE_CODE) rawContext.beCode = process.env.MCD_MCP_BE_CODE;
if (process.env.MCD_MCP_RESERVATION_DATE) rawContext.reservationDate = process.env.MCD_MCP_RESERVATION_DATE;

const context = parseStoreContext(rawContext);
const logger = new InMemoryToolCallLogger();
const adapter = createRealMcpAdapter({
  endpoint: process.env.MCD_MCP_URL ?? 'https://mcp.mcd.cn',
  token,
  logger,
});

const products = await adapter.listProducts(context);
console.log(JSON.stringify({
  source: 'mcd-mcp',
  count: products.length,
  sample: products.slice(0, 5).map((product) => ({
    productId: product.productId,
    officialName: product.officialName,
    category: product.category,
  })),
  toolCalls: logger.getEntries(),
}, null, 2));
