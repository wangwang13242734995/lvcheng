import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();
const MAX_ENTRIES = 10000;

function cleanupExpired() {
  const now = Date.now();
  const keysToDelete: string[] = [];
  store.forEach((entry, key) => {
    if (entry.resetTime < now) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach((key) => store.delete(key));

  if (store.size > MAX_ENTRIES) {
    const entries = Array.from(store.entries());
    entries
      .sort((a, b) => a[1].resetTime - b[1].resetTime)
      .slice(0, store.size - MAX_ENTRIES)
      .forEach(([key]) => store.delete(key));
  }
}

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, maxRequests, message = '请求过于频繁，请稍后再试' } = options;

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function (req: NextRequest, ...args: any[]) {
      cleanupExpired();

      const ip = req.headers.get('x-forwarded-for') || 'unknown';
      const key = `${ip}:${propertyKey}`;
      const now = Date.now();

      let entry = store.get(key);

      if (!entry || entry.resetTime < now) {
        entry = { count: 0, resetTime: now + windowMs };
        store.set(key, entry);
      }

      entry.count++;

      if (entry.count > maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        return NextResponse.json(
          { error: message },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfter),
              'X-RateLimit-Limit': String(maxRequests),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(entry.resetTime),
            },
          }
        );
      }

      return originalMethod.apply(this, [req, ...args]);
    };

    return descriptor;
  };
}

export function checkRateLimit(
  req: NextRequest,
  identifier: string,
  options: RateLimitOptions
): { allowed: boolean; remaining: number; resetTime: number } {
  const { windowMs, maxRequests } = options;

  cleanupExpired();

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const key = `${ip}:${identifier}`;
  const now = Date.now();

  let entry = store.get(key);

  if (!entry || entry.resetTime < now) {
    entry = { count: 0, resetTime: now + windowMs };
    store.set(key, entry);
  }

  entry.count++;

  const allowed = entry.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - entry.count);

  return { allowed, remaining, resetTime: entry.resetTime };
}
