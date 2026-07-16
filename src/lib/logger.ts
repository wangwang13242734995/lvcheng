type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

class Logger {
  private isProduction: boolean;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (!this.isProduction || level === 'error' || level === 'warn') {
      const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;
      const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
      const output = `${prefix} ${message}${metaStr}`;

      switch (level) {
        case 'error':
          console.error(output);
          break;
        case 'warn':
          console.warn(output);
          break;
        case 'info':
          console.info(output);
          break;
        case 'debug':
          if (!this.isProduction) console.debug(output);
          break;
      }
    }
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>) {
    this.log('error', message, meta);
    this.reportToSentry(message, meta).catch(() => {});
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.log('debug', message, meta);
  }

  getRecentLogs(count = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  getErrorLogs(count = 50): LogEntry[] {
    return this.logs.filter((l) => l.level === 'error').slice(-count);
  }

  private async reportToSentry(message: string, meta?: Record<string, unknown>) {
    try {
      if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
      const { default: Sentry } = await import('@sentry/nextjs');
      if (Sentry.captureException) {
        const error = new Error(message);
        if (meta) {
          Sentry.captureException(error, { extra: meta });
        } else {
          Sentry.captureException(error);
        }
      }
    } catch {
      // Sentry not available, ignore
    }
  }
}

export const logger = new Logger();

export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  context?: string
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      logger.error(`${context || 'Unhandled'}: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }) as T;
}
