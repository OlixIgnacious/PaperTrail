// PaperTrail Session-Scoped Cache & Async Task Scheduler (NFR-1 Zero Persistence, Efficiency)
// Provides LRU in-memory caching with TTL eviction, non-blocking async execution, and explicit memory cleanup.

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttlMs: number;
}

export class SessionLruCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxEntries: number;
  private defaultTtlMs: number;

  constructor(maxEntries = 50, defaultTtlMs = 15 * 60 * 1000) {
    this.maxEntries = maxEntries;
    this.defaultTtlMs = defaultTtlMs;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check TTL expiration
    if (Date.now() - entry.timestamp > entry.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    // Refresh position for LRU
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T, ttlMs = this.defaultTtlMs): void {
    // Evict oldest entry if capacity reached
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttlMs,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Explicit memory purge to prevent leaks and honor zero document persistence.
   */
  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Non-blocking task scheduler: Runs CPU-heavy or batch operations asynchronously
 * without freezing the UI thread, utilizing requestIdleCallback with setTimeout fallback.
 */
export function scheduleNonBlockingTask<T>(task: () => T | Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      }, { timeout: 2000 });
    } else {
      setTimeout(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      }, 0);
    }
  });
}
