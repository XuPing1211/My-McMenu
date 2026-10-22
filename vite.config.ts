import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { createRealMcpAdapter } from './src/adapters/real-mcp-adapter.js';
import { McpStreamableHttpClient } from './src/adapters/mcp-client.js';
import { extractOrderProductIds } from './src/adapters/mcd-order-response.js';
import { parseStoreContext } from './src/domain/store-context.js';

function json(res: { statusCode: number; setHeader(name: string, value: string): void; end(body: string): void }, statusCode: number, payload: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function realMcpHistoryProxy(): Plugin {
  return {
    name: 'my-mcmenu-real-mcp-history-proxy',
    configureServer(server) {
      server.middlewares.use('/api/mcd/history', async (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.setHeader('Allow', 'GET');
          res.end('Method Not Allowed');
          return;
        }
        const token = process.env.MCD_MCP_TOKEN;
        if (!token) {
          json(res, 503, { error: 'MCP_TOKEN_MISSING', message: '本地 MCP Token 未注入。' });
          return;
        }
        try {
          const client = new McpStreamableHttpClient({
            endpoint: process.env.MCD_MCP_URL ?? 'https://mcp.mcd.cn',
            token,
          });
          const result = await client.callTool<unknown>('order-list', {});
          const productIds = extractOrderProductIds(result);
          json(res, 200, { source: 'mcd-mcp-order-list', productIds, count: productIds.length });
        } catch {
          json(res, 502, { error: 'MCP_HISTORY_FAILED', message: '历史订单读取失败，请检查授权或稍后重试。' });
        }
      });
    },
  };
}

function realMcpMenuProxy(): Plugin {
  return {
    name: 'my-mcmenu-real-mcp-proxy',
    configureServer(server) {
      server.middlewares.use('/api/mcd/menu', async (req, res, next) => {
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.setHeader('Allow', 'GET');
          res.end('Method Not Allowed');
          return;
        }

        const requestUrl = new URL(req.url ?? '/', 'http://127.0.0.1');
        const token = process.env.MCD_MCP_TOKEN;
        if (!token) {
          json(res, 503, {
            error: 'MCP_TOKEN_MISSING',
            message: '本地 MCP Token 未注入。请通过 OPEN_DEMO.bat 启动，或配置 MCD_MCP_TOKEN。',
          });
          return;
        }

        try {
          const rawContext: Record<string, unknown> = {
            storeCode: requestUrl.searchParams.get('storeCode') ?? '1450398',
            orderType: Number(requestUrl.searchParams.get('orderType') ?? '1'),
            beType: Number(requestUrl.searchParams.get('beType') ?? '1'),
          };
          const beCode = requestUrl.searchParams.get('beCode');
          const reservationDate = requestUrl.searchParams.get('reservationDate');
          if (beCode) rawContext.beCode = beCode;
          if (reservationDate) rawContext.reservationDate = reservationDate;

          const context = parseStoreContext(rawContext);
          const adapter = createRealMcpAdapter({
            endpoint: process.env.MCD_MCP_URL ?? 'https://mcp.mcd.cn',
            token,
          });
          const products = await adapter.listProducts(context);
          json(res, 200, {
            source: 'mcd-mcp',
            checkedAt: new Date().toISOString(),
            context: {
              storeCode: context.storeCode,
              orderType: context.orderType,
              beType: context.beType,
            },
            products,
          });
          return;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'MCP 商品查询失败';
          json(res, 502, {
            error: 'MCP_QUERY_FAILED',
            message: '官方 MCP 商品查询失败，请检查本地授权或稍后重试。',
            detail: process.env.NODE_ENV === 'development' ? message : undefined,
          });
          return;
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), realMcpMenuProxy(), realMcpHistoryProxy()],
  server: {
    host: '127.0.0.1',
    port: 4173,
  },
  build: {
    target: 'es2022',
  },
});
