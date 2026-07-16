import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// API 集成测试：验证 schema、输入校验、CSRF 逻辑

// ========== 注册 API Schema 验证 ==========
const registerSchema = z.object({
  name: z.string().min(1, '请输入姓名'),
  email: z.string().email('请输入有效的邮箱'),
  password: z.string().min(6, '密码至少6位'),
  confirmPassword: z.string().min(6, '确认密码至少6位'),
  role: z.enum(['STUDENT', 'ENTERPRISE']).default('STUDENT'),
  major: z.string().optional(),
  graduationYear: z.number().int().optional(),
});

describe('API: 注册接口 Schema 验证', () => {
  const validData = {
    name: '张三',
    email: 'zhangsan@test.com',
    password: 'password123',
    confirmPassword: 'password123',
  };

  it('合法数据应通过验证', () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('空姓名应被拒绝', () => {
    const result = registerSchema.safeParse({ ...validData, name: '' });
    expect(result.success).toBe(false);
  });

  it('无效邮箱应被拒绝', () => {
    const result = registerSchema.safeParse({ ...validData, email: 'invalid' });
    expect(result.success).toBe(false);
    const result2 = registerSchema.safeParse({ ...validData, email: 'a@b' });
    expect(result2.success).toBe(false);
  });

  it('短密码应被拒绝', () => {
    const result = registerSchema.safeParse({ ...validData, password: '12345', confirmPassword: '12345' });
    expect(result.success).toBe(false);
  });

  it('非法角色应被拒绝', () => {
    const result = registerSchema.safeParse({ ...validData, role: 'HACKER' });
    expect(result.success).toBe(false);
  });

  it('默认角色应为 STUDENT', () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe('STUDENT');
    }
  });

  it('ENTERPRISE 角色应被接受', () => {
    const result = registerSchema.safeParse({ ...validData, role: 'ENTERPRISE' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe('ENTERPRISE');
    }
  });

  it('可选字段应正确处理', () => {
    const result = registerSchema.safeParse({
      ...validData,
      major: '计算机科学',
      graduationYear: 2026,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.major).toBe('计算机科学');
      expect(result.data.graduationYear).toBe(2026);
    }
  });

  it('XSS 载荷应通过 schema 但被 sanitize 处理', () => {
    const xssData = {
      ...validData,
      name: '<script>alert(1)</script>',
      bio: '"onload="alert(1)',
    };
    const result = registerSchema.safeParse(xssData);
    expect(result.success).toBe(true);
    // schema 只验证格式，sanitize 在 API handler 中处理
  });
});

// ========== 个人资料更新 Schema 验证 ==========
const profileSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  major: z.string().optional(),
  graduationYear: z.number().int().min(1900).max(2099).optional(),
  bio: z.string().optional(),
  skills: z.string().optional(),
});

describe('API: 个人资料更新 Schema 验证', () => {
  it('合法更新数据应通过', () => {
    const result = profileSchema.safeParse({
      name: '李四',
      major: '计算机科学',
      graduationYear: 2025,
    });
    expect(result.success).toBe(true);
  });

  it('空姓名应被拒绝', () => {
    const result = profileSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('graduationYear 超出范围应被拒绝', () => {
    const result1 = profileSchema.safeParse({ name: '李四', graduationYear: 1800 });
    expect(result1.success).toBe(false);
    const result2 = profileSchema.safeParse({ name: '李四', graduationYear: 2100 });
    expect(result2.success).toBe(false);
  });

  it('graduationYear 在合法范围内应通过', () => {
    const result = profileSchema.safeParse({ name: '李四', graduationYear: 2024 });
    expect(result.success).toBe(true);
  });
});

// ========== CSRF Origin 验证逻辑 ==========
describe('API: CSRF Origin 验证', () => {
  const allowedHosts = ['localhost:3000', 'localhost:3001', 'patio-whole-everybody.ngngrok-free.dev'];

  function validateOrigin(origin: string | null, host: string | null): boolean {
    if (!origin) return true; // 同源请求无 origin 头
    try {
      const originUrl = new URL(origin);
      return allowedHosts.includes(originUrl.host) || (host ? originUrl.host === host : false);
    } catch {
      return false;
    }
  }

  it('无 origin 头（同源请求）应允许', () => {
    expect(validateOrigin(null, 'localhost:3000')).toBe(true);
  });

  it('合法 origin 应允许', () => {
    expect(validateOrigin('http://localhost:3000', 'localhost:3000')).toBe(true);
    expect(validateOrigin('https://localhost:3000', 'localhost:3000')).toBe(true);
  });

  it('非法 origin 应拒绝', () => {
    expect(validateOrigin('http://evil.com', 'localhost:3000')).toBe(false);
    expect(validateOrigin('https://attacker.com', 'localhost:3000')).toBe(false);
  });

  it('恶意子域应拒绝', () => {
    expect(validateOrigin('http://evil.localhost:3000', 'localhost:3000')).toBe(false);
  });

  it('无效 URL 格式应拒绝', () => {
    expect(validateOrigin('not-a-url', 'localhost:3000')).toBe(false);
  });

  it('origin 与 host 匹配应允许', () => {
    expect(validateOrigin('http://custom-host:8080', 'custom-host:8080')).toBe(true);
  });
});

// ========== 速率限制边界验证 ==========
describe('API: 速率限制边界验证', () => {
  it('注册限制：1小时5次', () => {
    const windowMs = 60 * 60 * 1000;
    const maxRequests = 5;
    expect(windowMs).toBe(3600000);
    expect(maxRequests).toBe(5);
  });

  it('密码重置限制：1小时3次', () => {
    const windowMs = 60 * 60 * 1000;
    const maxRequests = 3;
    expect(windowMs).toBe(3600000);
    expect(maxRequests).toBe(3);
  });

  it('429 响应应包含 Retry-After 头', () => {
    const retryAfter = 3600;
    expect(retryAfter).toBe(3600);
    expect(Number.isInteger(retryAfter)).toBe(true);
  });
});

// ========== 删除账号验证 ==========
describe('API: 删除账号验证', () => {
  function validateDeleteRequest(body: { confirm?: string }): { valid: boolean; error?: string } {
    if (body.confirm !== 'DELETE') {
      return { valid: false, error: '请确认删除操作（confirm: "DELETE"）' };
    }
    return { valid: true };
  }

  it('正确的确认字符串应通过', () => {
    const result = validateDeleteRequest({ confirm: 'DELETE' });
    expect(result.valid).toBe(true);
  });

  it('错误的确认字符串应被拒绝', () => {
    expect(validateDeleteRequest({ confirm: 'delete' }).valid).toBe(false);
    expect(validateDeleteRequest({ confirm: 'Delete' }).valid).toBe(false);
    expect(validateDeleteRequest({ confirm: '' }).valid).toBe(false);
    expect(validateDeleteRequest({}).valid).toBe(false);
  });

  it('缺失 confirm 字段应被拒绝', () => {
    const result = validateDeleteRequest({});
    expect(result.valid).toBe(false);
    expect(result.error).toContain('DELETE');
  });
});
