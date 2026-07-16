'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { recordMetric, getRating } from '@/lib/web-vitals';
import { logger } from '@/lib/logger';

export default function WebVitalsMonitor() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const reportToApi = process.env.NEXT_PUBLIC_WEB_VITALS_REPORT === 'true';
  const sampleRate = parseFloat(process.env.NEXT_PUBLIC_WEB_VITALS_SAMPLE_RATE || '1');

  function shouldSample(): boolean {
    return Math.random() < sampleRate;
  }

  useReportWebVitals((metric) => {
    const rating = getRating(metric.name, metric.value);
    
    recordMetric({
      id: metric.id,
      name: metric.name,
      value: metric.value,
      label: metric.label as 'web-vital' | 'custom',
      rating,
      delta: metric.delta,
      navigationType: (metric as any).navigationType,
    });

    if (isDevelopment) {
      logger.debug(`[Web Vitals] ${metric.name}: ${metric.value}`, {
        rating,
        label: metric.label,
      });
    }

    if (reportToApi && shouldSample()) {
      try {
        const body = JSON.stringify({
          id: metric.id,
          name: metric.name,
          value: metric.value,
          rating,
          label: metric.label,
          delta: metric.delta,
          navigationType: (metric as any).navigationType,
          url: typeof window !== 'undefined' ? window.location.href : '',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          timestamp: new Date().toISOString(),
        });

        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          navigator.sendBeacon('/api/web-vitals', body);
        } else if (typeof fetch === 'function') {
          fetch('/api/web-vitals', {
            body,
            method: 'POST',
            keepalive: true,
            headers: { 'Content-Type': 'application/json' },
          }).catch(() => {});
        }
      } catch {
      }
    }
  });

  return null;
}
