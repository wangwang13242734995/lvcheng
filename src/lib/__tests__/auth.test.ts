import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';

describe('Auth: bcrypt 密码哈希', () => {
  it('应生成有效的密码哈希', async () => {
    const password = 'testPassword123';
    const hash = await bcrypt.hash(password, 10);
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(0);
  });

  it('正确的密码应通过验证', async () => {
    const password = 'securePassword!@#';
    const hash = await bcrypt.hash(password, 10);
    const isValid = await bcrypt.compare(password, hash);
    expect(isValid).toBe(true);
  });

  it('错误的密码应验证失败', async () => {
    const password = 'correctPassword';
    const wrongPassword = 'wrongPassword';
    const hash = await bcrypt.hash(password, 10);
    const isValid = await bcrypt.compare(wrongPassword, hash);
    expect(isValid).toBe(false);
  });

  it('相同密码每次哈希应不同（加盐）', async () => {
    const password = 'samePassword';
    const hash1 = await bcrypt.hash(password, 10);
    const hash2 = await bcrypt.hash(password, 10);
    expect(hash1).not.toBe(hash2);
    const valid1 = await bcrypt.compare(password, hash1);
    const valid2 = await bcrypt.compare(password, hash2);
    expect(valid1).toBe(true);
    expect(valid2).toBe(true);
  });

  it('空密码不应崩溃', async () => {
    const hash = await bcrypt.hash('', 10);
    const isValid = await bcrypt.compare('', hash);
    expect(isValid).toBe(true);
  });

  it('特殊字符密码应正常处理', async () => {
    const password = 'p@ssw0rd!#$%^&*()_+{}[]|\\:;"<>,.?/';
    const hash = await bcrypt.hash(password, 10);
    const isValid = await bcrypt.compare(password, hash);
    expect(isValid).toBe(true);
  });
});

describe('Auth: 登录验证逻辑', () => {
  interface Credentials {
    email?: string;
    password?: string;
  }

  function validateCredentials(credentials: Credentials): string | null {
    if (!credentials?.email || !credentials?.password) {
      return '请输入邮箱和密码';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
      return '邮箱格式不正确';
    }
    if (credentials.password.length < 6) {
      return '密码至少6位';
    }
    return null;
  }

  it('空邮箱应返回错误', () => {
    expect(validateCredentials({ email: '', password: '123456' })).toBe('请输入邮箱和密码');
  });

  it('空密码应返回错误', () => {
    expect(validateCredentials({ email: 'test@example.com', password: '' })).toBe('请输入邮箱和密码');
  });

  it('都为空应返回错误', () => {
    expect(validateCredentials({})).toBe('请输入邮箱和密码');
  });

  it('邮箱格式不正确应返回错误', () => {
    expect(validateCredentials({ email: 'invalid', password: '123456' })).toBe('邮箱格式不正确');
    expect(validateCredentials({ email: 'test@', password: '123456' })).toBe('邮箱格式不正确');
    expect(validateCredentials({ email: '@example.com', password: '123456' })).toBe('邮箱格式不正确');
  });

  it('密码太短应返回错误', () => {
    expect(validateCredentials({ email: 'test@example.com', password: '12345' })).toBe('密码至少6位');
  });

  it('合法凭据应返回 null（无错误）', () => {
    expect(validateCredentials({ email: 'test@example.com', password: '123456' })).toBeNull();
    expect(validateCredentials({ email: 'user.name+tag@domain.co.uk', password: 'securePass123!' })).toBeNull();
  });
});

describe('Auth: 注册验证逻辑', () => {
  interface RegisterData {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }

  function validateRegistration(data: RegisterData): string | null {
    if (!data.name || data.name.trim().length === 0) return '请输入姓名';
    if (!data.email) return '请输入邮箱';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return '邮箱格式不正确';
    if (!data.password) return '请输入密码';
    if (data.password.length < 6) return '密码至少6位';
    if (data.password !== data.confirmPassword) return '两次密码不一致';
    return null;
  }

  it('空姓名应返回错误', () => {
    expect(validateRegistration({
      name: '',
      email: 'test@example.com',
      password: '123456',
      confirmPassword: '123456',
    })).toBe('请输入姓名');
  });

  it('两次密码不一致应返回错误', () => {
    expect(validateRegistration({
      name: '张三',
      email: 'test@example.com',
      password: '123456',
      confirmPassword: '654321',
    })).toBe('两次密码不一致');
  });

  it('合法注册数据应通过验证', () => {
    expect(validateRegistration({
      name: '张三',
      email: 'zhangsan@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    })).toBeNull();
  });
});
