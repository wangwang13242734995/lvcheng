import { describe, it, expect, beforeEach } from 'vitest';
import { getRating, formatMetricValue, recordMetric, getMetrics, resetMetrics, type WebVitalsMetric } from '@/lib/web-vitals';

describe('web-vitals utilities', () => {
  beforeEach(() => {
    resetMetrics();
  });

  describe('getRating', () => {
    it('should return "good" for LCP <= 2500ms', () => {
      expect(getRating('LCP', 2000)).toBe('good');
      expect(getRating('LCP', 2500)).toBe('good');
    });

    it('should return "needs-improvement" for LCP between 2500ms and 4000ms', () => {
      expect(getRating('LCP', 3000)).toBe('needs-improvement');
    });

    it('should return "poor" for LCP > 4000ms', () => {
      expect(getRating('LCP', 5000)).toBe('poor');
    });

    it('should return "good" for CLS <= 0.1', () => {
      expect(getRating('CLS', 0.05)).toBe('good');
      expect(getRating('CLS', 0.1)).toBe('good');
    });

    it('should return "needs-improvement" for CLS between 0.1 and 0.25', () => {
      expect(getRating('CLS', 0.15)).toBe('needs-improvement');
    });

    it('should return "poor" for CLS > 0.25', () => {
      expect(getRating('CLS', 0.3)).toBe('poor');
    });

    it('should return "good" for FID <= 100ms', () => {
      expect(getRating('FID', 50)).toBe('good');
      expect(getRating('FID', 100)).toBe('good');
    });

    it('should return "needs-improvement" for unknown metrics', () => {
      expect(getRating('UNKNOWN', 1000)).toBe('needs-improvement');
    });

    it('should handle TTFB correctly', () => {
      expect(getRating('TTFB', 500)).toBe('good');
      expect(getRating('TTFB', 1200)).toBe('needs-improvement');
      expect(getRating('TTFB', 2000)).toBe('poor');
    });

    it('should handle FCP correctly', () => {
      expect(getRating('FCP', 1500)).toBe('good');
      expect(getRating('FCP', 2400)).toBe('needs-improvement');
      expect(getRating('FCP', 4000)).toBe('poor');
    });

    it('should handle INP correctly', () => {
      expect(getRating('INP', 150)).toBe('good');
      expect(getRating('INP', 300)).toBe('needs-improvement');
      expect(getRating('INP', 600)).toBe('poor');
    });
  });

  describe('formatMetricValue', () => {
    it('should format CLS with 3 decimal places', () => {
      expect(formatMetricValue('CLS', 0.123456)).toBe('0.123');
    });

    it('should format time-based metrics with ms suffix', () => {
      expect(formatMetricValue('LCP', 2500.123)).toBe('2500 ms');
      expect(formatMetricValue('FCP', 1800.5)).toBe('1801 ms');
      expect(formatMetricValue('FID', 50.9)).toBe('51 ms');
      expect(formatMetricValue('TTFB', 800)).toBe('800 ms');
      expect(formatMetricValue('INP', 200.4)).toBe('200 ms');
    });

    it('should return string value for unknown metrics', () => {
      expect(formatMetricValue('UNKNOWN', 123)).toBe('123');
    });
  });

  describe('metrics storage', () => {
    it('should record and retrieve metrics', () => {
      const metric: WebVitalsMetric = {
        id: 'test-1',
        name: 'LCP',
        value: 2500,
        label: 'web-vital',
        rating: 'good',
      };

      recordMetric(metric);
      const metrics = getMetrics();

      expect(metrics['LCP']).toEqual(metric);
    });

    it('should overwrite existing metric with same name', () => {
      const metric1: WebVitalsMetric = {
        id: 'test-1',
        name: 'LCP',
        value: 2000,
        label: 'web-vital',
      };
      const metric2: WebVitalsMetric = {
        id: 'test-2',
        name: 'LCP',
        value: 3000,
        label: 'web-vital',
      };

      recordMetric(metric1);
      recordMetric(metric2);
      const metrics = getMetrics();

      expect(metrics['LCP'].value).toBe(3000);
    });

    it('should reset all metrics', () => {
      const metric: WebVitalsMetric = {
        id: 'test-1',
        name: 'LCP',
        value: 2500,
        label: 'web-vital',
      };

      recordMetric(metric);
      resetMetrics();
      const metrics = getMetrics();

      expect(Object.keys(metrics)).toHaveLength(0);
    });

    it('should return a copy of metrics object', () => {
      const metric: WebVitalsMetric = {
        id: 'test-1',
        name: 'LCP',
        value: 2500,
        label: 'web-vital',
      };

      recordMetric(metric);
      const metrics = getMetrics();
      metrics['LCP'].value = 9999;

      const metricsAfter = getMetrics();
      expect(metricsAfter['LCP'].value).toBe(2500);
    });

    it('should store multiple different metrics', () => {
      recordMetric({ id: '1', name: 'LCP', value: 2500, label: 'web-vital' });
      recordMetric({ id: '2', name: 'FCP', value: 1800, label: 'web-vital' });
      recordMetric({ id: '3', name: 'CLS', value: 0.1, label: 'web-vital' });

      const metrics = getMetrics();
      expect(Object.keys(metrics)).toHaveLength(3);
      expect(metrics['LCP']).toBeDefined();
      expect(metrics['FCP']).toBeDefined();
      expect(metrics['CLS']).toBeDefined();
    });
  });
});
