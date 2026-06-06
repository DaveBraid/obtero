const RATE_LIMIT_STATUS_RE = /status\s+429|429/i;

export class SearchRateLimitError extends Error {
  constructor(source: string) {
    super(`${source} 请求过于频繁，请稍等后再试`);
    this.name = 'SearchRateLimitError';
  }
}

export function isRateLimitError(error: unknown): boolean {
  if (error instanceof SearchRateLimitError) return true;
  if (error instanceof Error) return RATE_LIMIT_STATUS_RE.test(error.message);
  return RATE_LIMIT_STATUS_RE.test(String(error));
}

export async function wait(ms: number): Promise<void> {
  await new Promise(resolve => window.setTimeout(resolve, ms));
}

export async function runWithMinimumInterval<T>(
  task: () => Promise<T>,
  getLastRunAt: () => number,
  setLastRunAt: (value: number) => void,
  minimumIntervalMs: number
): Promise<T> {
  const elapsed = Date.now() - getLastRunAt();
  if (elapsed < minimumIntervalMs) {
    await wait(minimumIntervalMs - elapsed);
  }

  try {
    return await task();
  } finally {
    setLastRunAt(Date.now());
  }
}
