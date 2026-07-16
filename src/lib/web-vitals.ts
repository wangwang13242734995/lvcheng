export interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
  label: 'web-vital' | 'custom';
  rating?: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  entries?: any[];
  navigationType?: string;
}

const THRESHOLDS: Record<string, { good: number; poor: number }> = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  FID: { good: 100, poor: 300 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

export function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name];
  if (!threshold) return 'needs-improvement';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

export function formatMetricValue(name: string, value: number): string {
  switch (name) {
    case 'CLS':
      return value.toFixed(3);
    case 'FCP':
    case 'FID':
    case 'LCP':
    case 'TTFB':
    case 'INP':
      return `${Math.round(value)} ms`;
    default:
      return String(value);
  }
}

const metrics: Record<string, WebVitalsMetric> = {};

export function recordMetric(metric: WebVitalsMetric) {
  metrics[metric.name] = metric;
}

export function getMetrics(): Record<string, WebVitalsMetric> {
  const result: Record<string, WebVitalsMetric> = {};
  for (const key in metrics) {
    result[key] = { ...metrics[key] };
  }
  return result;
}

export function resetMetrics() {
  Object.keys(metrics).forEach((key) => delete metrics[key]);
}
