import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

function createMockRequest(ip: string = '127.0.0.1'): NextRequest {
  return {
    headers: new Headers({ 'x-forwarded-for': ip }),
  } as unknown as NextRequest;
}

describe('checkRateLimit', () => {
  beforeEach(() => {
    // 等待时间窗口重置
  });

  it('首次请求应被允许', () => {
    const req = createMockRequest('192.168.1.1');
    const result = checkRateLimit(req, 'test-first', {
      windowMs: 5000,
      maxRequests: 3,
    });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('未超过限制时应被允许', () => {
    const req = createMockRequest('192.168.1.2');
    const opts = { windowMs: 5000, maxRequests: 5 };

    checkRateLimit(req, 'test-within', opts);
    checkRateLimit(req, 'test-within', opts);
    const result = checkRateLimit(req, 'test-within', opts);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('超过限制时应被拒绝', () => {
    const req = createMockRequest('192.168.1.3');
    const opts = { windowMs: 5000, maxRequests: 2 };

    checkRateLimit(req, 'test-exceed', opts);
    checkRateLimit(req, 'test-exceed', opts);
    const result = checkRateLimit(req, 'test-exceed', opts);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('不同 IP 应有独立的限制计数', () => {
    const req1 = createMockRequest('10.0.0.1');
    const req2 = createMockRequest('10.0.0.2');
    const opts = { windowMs: 5000, maxRequests: 1 };

    const r1 = checkRateLimit(req1, 'test-ip', opts);
    const r2 = checkRateLimit(req2, 'test-ip', opts);

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
  });

  it('不同标识符应有独立的限制计数', () => {
    const req = createMockRequest('10.0.0.3');
    const opts = { windowMs: 5000, maxRequests: 1 };

    const r1 = checkRateLimit(req, 'endpoint-a', opts);
    const r2 = checkRateLimit(req, 'endpoint-b', opts);

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
  });

  it('剩余次数应正确递减', () => {
    const req = createMockRequest('10.0.0.4');
    const opts = { windowMs: 5000, maxRequests: 4 };

    expect(checkRateLimit(req, 'test-decrement', opts).remaining).toBe(3);
    expect(checkRateLimit(req, 'test-decrement', opts).remaining).toBe(2);
    expect(checkRateLimit(req, 'test-decrement', opts).remaining).toBe(1);
    expect(checkRateLimit(req, 'test-decrement', opts).remaining).toBe(0);
  });

  it('无 IP 头时不应崩溃', () => {
    const req = { headers: new Headers() } as unknown as NextRequest;
    const result = checkRateLimit(req, 'test-no-ip', {
      windowMs: 5000,
      maxRequests: 1,
    });
    expect(result.allowed).toBe(true);
  });
});
