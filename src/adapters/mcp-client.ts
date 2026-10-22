import {
  classifyError,
  NoopToolCallLogger,
  type ToolCallLogger,
} from '../telemetry/tool-call-log.js';

export interface FetchLike {
  (input: string | URL, init?: RequestInit): Promise<Response>;
}

export interface McpClientOptions {
  endpoint: string;
  token: string;
  fetchImpl?: FetchLike;
  logger?: ToolCallLogger;
  requestTimeoutMs?: number;
  protocolVersion?: string;
  now?: () => Date;
}

interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

interface JsonRpcResponse {
  result?: unknown;
  error?: JsonRpcError;
}

interface HttpRpcResponse {
  rpc: JsonRpcResponse | undefined;
  sessionId: string | undefined;
}

export class McpHttpError extends Error {
  readonly kind: string;
  readonly status: number | undefined;

  constructor(message: string, kind: string, status?: number) {
    super(message);
    this.name = 'McpHttpError';
    this.kind = kind;
    this.status = status;
  }
}

function classifyHttpStatus(status: number): string {
  if (status === 401) return 'http-401-unauthorized';
  if (status === 403) return 'http-403-forbidden';
  if (status === 429) return 'http-429-rate-limit';
  if (status >= 500) return 'http-5xx-server';
  return `http-${status}`;
}

function parseRpcResponse(body: string): JsonRpcResponse | undefined {
  const trimmed = body.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith('{')) {
    return JSON.parse(trimmed) as JsonRpcResponse;
  }

  const dataLines = trimmed
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.replace(/^data:\s*/, '').trim())
    .filter((line) => line && line !== '[DONE]');

  for (const line of dataLines) {
    try {
      return JSON.parse(line) as JsonRpcResponse;
    } catch {
      // Continue until an SSE data line contains a JSON-RPC envelope.
    }
  }

  throw new McpHttpError('MCP response was not valid JSON or SSE JSON', 'invalid-response');
}

export class McpStreamableHttpClient {
  private readonly endpoint: string;
  private readonly token: string;
  private readonly fetchImpl: FetchLike;
  private readonly logger: ToolCallLogger;
  private readonly requestTimeoutMs: number;
  private readonly protocolVersion: string;
  private readonly now: () => Date;
  private initialized = false;
  private sessionId: string | undefined;

  constructor(options: McpClientOptions) {
    if (!options.endpoint) throw new Error('MCP endpoint is required');
    if (!options.token) throw new Error('MCP token is required');

    this.endpoint = options.endpoint;
    this.token = options.token;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.logger = options.logger ?? new NoopToolCallLogger();
    this.requestTimeoutMs = options.requestTimeoutMs ?? 30_000;
    this.protocolVersion = options.protocolVersion ?? '2025-06-18';
    this.now = options.now ?? (() => new Date());
  }

  async callTool<T>(toolName: string, argumentsValue: Record<string, unknown>): Promise<T> {
    const startedAt = Date.now();
    try {
      await this.ensureInitialized();
      const response = await this.post({
        jsonrpc: '2.0',
        id: this.nextRequestId(),
        method: 'tools/call',
        params: { name: toolName, arguments: argumentsValue },
      });

      if (response.rpc?.error) {
        throw new McpHttpError(
          `MCP tool ${toolName} returned an error`,
          'mcp-jsonrpc-error',
        );
      }
      if (response.rpc?.result === undefined) {
        throw new McpHttpError(`MCP tool ${toolName} returned no result`, 'empty-result');
      }

      const durationMs = Date.now() - startedAt;
      this.logger.record({
        toolName,
        status: 'success',
        durationMs,
        occurredAt: this.now().toISOString(),
      });
      return response.rpc.result as T;
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      const errorType = error instanceof McpHttpError ? error.kind : classifyError(error);
      this.logger.record({
        toolName,
        status: 'error',
        durationMs,
        occurredAt: this.now().toISOString(),
        errorType,
      });
      throw error;
    }
  }

  private requestId = 0;

  private nextRequestId(): number {
    this.requestId += 1;
    return this.requestId;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    const response = await this.post({
      jsonrpc: '2.0',
      id: this.nextRequestId(),
      method: 'initialize',
      params: {
        protocolVersion: this.protocolVersion,
        capabilities: {},
        clientInfo: { name: 'my-mcmenu', version: '0.1.0' },
      },
    });

    if (response.rpc?.error) {
      throw new McpHttpError('MCP initialization failed', 'mcp-initialize-error');
    }

    await this.post({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    });
    this.initialized = true;
  }

  private async post(payload: Record<string, unknown>): Promise<HttpRpcResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);
    const headers: Record<string, string> = {
      Accept: 'application/json, text/event-stream',
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      'MCP-Protocol-Version': this.protocolVersion,
    };
    if (this.sessionId) headers['Mcp-Session-Id'] = this.sessionId;

    try {
      const response = await this.fetchImpl(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new McpHttpError(
          `MCP HTTP request failed with status ${response.status}`,
          classifyHttpStatus(response.status),
          response.status,
        );
      }

      const sessionId = response.headers.get('Mcp-Session-Id') ?? undefined;
      if (sessionId) this.sessionId = sessionId;
      const body = await response.text();
      return { rpc: parseRpcResponse(body), sessionId };
    } finally {
      clearTimeout(timeout);
    }
  }
}
