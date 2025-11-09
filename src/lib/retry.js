export async function withRetry(fn, {
  retries = 3,
  baseDelayMs = 300,
  factor = 2,
  onRetry = () => {}
} = {}) {
  let attempt = 0;
  let lastError;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === retries) break;
      const delay = baseDelayMs * Math.pow(factor, attempt);
      try { await new Promise(r => setTimeout(r, delay)); } catch {}
      onRetry(err, attempt + 1, delay);
    }
    attempt += 1;
  }
  throw lastError;
}


