import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guards';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const webVitalsSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number(),
  rating: z.enum(['good', 'needs-improvement', 'poor']).optional(),
  label: z.enum(['web-vital', 'custom']).optional(),
  delta: z.number().optional(),
  navigationType: z.string().optional(),
  url: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.string().optional(),
});

const metricsBuffer: Array<{
  metric: z.infer<typeof webVitalsSchema>;
  receivedAt: string;
}> = [];

const MAX_BUFFER_SIZE = 1000;

function addMetric(metric: z.infer<typeof webVitalsSchema>) {
  metricsBuffer.push({
    metric,
    receivedAt: new Date().toISOString(),
  });
  
  if (metricsBuffer.length > MAX_BUFFER_SIZE) {
    metricsBuffer.shift();
  }
}

function getPoorMetricsCount() {
  return metricsBuffer.filter((m) => m.metric.rating === 'poor').length;
}

function getMetricsSummary() {
  const summary: Record<string, {
    count: number;
    poor: number;
    needsImprovement: number;
    good: number;
    avgValue: number;
  }> = {};

  for (const item of metricsBuffer) {
    const name = item.metric.name;
    if (!summary[name]) {
      summary[name] = { count: 0, poor: 0, needsImprovement: 0, good: 0, avgValue: 0 };
    }
    summary[name].count++;
    summary[name].avgValue += item.metric.value;
    
    if (item.metric.rating === 'poor') summary[name].poor++;
    else if (item.metric.rating === 'needs-improvement') summary[name].needsImprovement++;
    else if (item.metric.rating === 'good') summary[name].good++;
  }

  for (const name in summary) {
    summary[name].avgValue = summary[name].avgValue / summary[name].count;
  }

  return summary;
}

export async function POST(request: NextRequest) {
  const { allowed, remaining, resetTime } = checkRateLimit(
    request,
    'web-vitals',
    { windowMs: 60 * 1000, maxRequests: 60 }
  );

  if (!allowed) {
    return NextResponse.json(
      { error: '请求过于频繁' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000)),
          'X-RateLimit-Limit': '60',
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(resetTime),
        },
      }
    );
  }

  try {
    const body = await request.json();
    const validated = webVitalsSchema.parse(body);
    
    addMetric(validated);

    if (validated.rating === 'poor') {
      logger.warn(`[Web Vitals] Poor performance detected: ${validated.name}`, {
        value: validated.value,
        url: validated.url,
        rating: validated.rating,
      });
    }

    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': '60',
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(resetTime),
        },
      }
    );
  } catch (error) {
    logger.warn('[Web Vitals] Failed to process metric', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const { isAdmin, response } = await requireAdmin(request);
  if (!isAdmin && response) return response;

  return NextResponse.json({
    totalMetrics: metricsBuffer.length,
    poorMetrics: getPoorMetricsCount(),
    summary: getMetricsSummary(),
    recentMetrics: metricsBuffer.slice(-20),
  });
}
