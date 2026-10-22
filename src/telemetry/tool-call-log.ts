export type ToolCallStatus = 'success' | 'error';

export interface ToolCallLog {
  toolName: string;
  status: ToolCallStatus;
  durationMs: number;
  occurredAt: string;
  errorType?: string;
}

export interface ToolCallLogger {
  record(entry: ToolCallLog): void;
}

export class InMemoryToolCallLogger implements ToolCallLogger {
  private readonly entries: ToolCallLog[] = [];

  record(entry: ToolCallLog): void {
    this.entries.push({ ...entry });
  }

  getEntries(): ToolCallLog[] {
    return this.entries.map((entry) => ({ ...entry }));
  }
}

export class NoopToolCallLogger implements ToolCallLogger {
  record(_entry: ToolCallLog): void {
    // Intentionally empty: production callers may inject a redacted sink.
  }
}

export function classifyError(error: unknown): string {
  if (error instanceof Error && error.name === 'AbortError') {
    return 'timeout';
  }
  if (error instanceof Error && error.name) {
    return error.name;
  }
  return 'unknown-error';
}
