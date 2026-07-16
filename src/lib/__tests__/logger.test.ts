import { describe, it, expect, beforeEach } from 'vitest';
import { logger, withErrorHandler } from '@/lib/logger';

describe('Logger', () => {
  beforeEach(() => {
    // 日志器在测试间保持状态，通过获取日志验证
  });

  it('应记录 info 级别日志', () => {
    logger.info('测试信息', { key: 'value' });
    const logs = logger.getRecentLogs(1);
    expect(logs).toHaveLength(1);
    expect(logs[0].level).toBe('info');
    expect(logs[0].message).toBe('测试信息');
    expect(logs[0].key).toBe('value');
  });

  it('应记录 error 级别日志', () => {
    logger.error('测试错误', { code: 500 });
    const errorLogs = logger.getErrorLogs(1);
    expect(errorLogs).toHaveLength(1);
    expect(errorLogs[0].level).toBe('error');
    expect(errorLogs[0].message).toBe('测试错误');
    expect(errorLogs[0].code).toBe(500);
  });

  it('应记录 warn 级别日志', () => {
    logger.warn('警告信息');
    const logs = logger.getRecentLogs(1);
    expect(logs[0].level).toBe('warn');
  });

  it('日志应包含 ISO 时间戳', () => {
    logger.info('时间测试');
    const logs = logger.getRecentLogs(1);
    expect(logs[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

describe('withErrorHandler', () => {
  it('正常执行时应返回结果', async () => {
    const handler = async (x: number) => x * 2;
    const wrapped = withErrorHandler(handler, 'test');
    const result = await wrapped(5);
    expect(result).toBe(10);
  });

  it('抛出错误时应记录日志并重新抛出', async () => {
    const handler = async () => {
      throw new Error('测试异常');
    };
    const wrapped = withErrorHandler(handler, 'test-context');

    await expect(wrapped()).rejects.toThrow('测试异常');

    const errorLogs = logger.getErrorLogs(1);
    expect(errorLogs[0].message).toContain('test-context');
    expect(errorLogs[0].message).toContain('测试异常');
  });

  it('非 Error 对象也应被捕获', async () => {
    const handler = async () => {
      throw '字符串错误';
    };
    const wrapped = withErrorHandler(handler, 'string-error');

    await expect(wrapped()).rejects.toBe('字符串错误');
  });
});
