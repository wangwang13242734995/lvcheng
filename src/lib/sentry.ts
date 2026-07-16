import * as Sentry from '@sentry/nextjs';

export function initSentry() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    debug: false,
    environment: process.env.NODE_ENV || 'development',
    beforeSend(event) {
      if (process.env.NODE_ENV === 'development') {
        return null;
      }
      return event;
    },
  });
}
