import { describe, expect, it, vi } from 'vitest';
import {
  McpStreamableHttpClient,
  type FetchLike,
} from '../src/adapters/mcp-client.js';
import { InMemoryToolCallLogger } from '../src/telemetry/tool-call-log.js';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('McpStreamableHttpClient', () => {
  it('initializes, sends a read-only tool call, and logs only metadata', async () => {
    const requests: Record<string, unknown>[] = [];
    const responses = [
      jsonResponse({ jsonrpc: '2.0', id: 1, result: { protocolVersion: '2025-06-18' } }),
      new Response('', { status: 202 }),
      jsonResponse({
        jsonrpc: '2.0',
        id: 2,
        result: { content: [{ type: 'text', text: '{"success":true}' }] },
      }),
    ];
    const fetchImpl: FetchLike = async (_input, init) => {
      requests.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      const response = responses.shift();
      if (!response) throw new Error('missing test response');
      return response;
    };
    const logger = new InMemoryToolCallLogger();
    const client = new McpStreamableHttpClient({
      endpoint: 'https://mcp.example.test',
      token: 'local-test-token',
      fetchImpl,
      logger,
      now: () => new Date('2026-10-19T11:00:00.000Z'),
    });

    const result = await client.callTool('query-meals', {
      storeCode: '1450398',
      orderType: 1,
      beType: 1,
    });

    expect(result).toEqual({ content: [{ type: 'text', text: '{"success":true}' }] });
    expect(requests.map((request) => request.method)).toEqual([
      'initialize',
      'notifications/initialized',
      'tools/call',
    ]);
    expect((requests[2]?.params as { name: string }).name).toBe('query-meals');
    expect(JSON.stringify(logger.getEntries())).not.toContain('local-test-token');
    expect(logger.getEntries()[0]).toMatchObject({
      toolName: 'query-meals',
      status: 'success',
      occurredAt: '2026-10-19T11:00:00.000Z',
    });
  });

  it('classifies forbidden responses without exposing response bodies', async () => {
    const fetchImpl: FetchLike = vi.fn(async () =>
      new Response('secret server body', { status: 403 }),
    );
    const logger = new InMemoryToolCallLogger();
    const client = new McpStreamableHttpClient({
      endpoint: 'https://mcp.example.test',
      token: 'local-test-token',
      fetchImpl,
      logger,
    });

    await expect(client.callTool('query-meals', {})).rejects.toMatchObject({
      kind: 'http-403-forbidden',
      status: 403,
    });
    expect(JSON.stringify(logger.getEntries())).not.toContain('secret server body');
  });
});
