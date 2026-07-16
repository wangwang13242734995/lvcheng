import { describe, it, expect } from 'vitest';
import { sanitizeInput, sanitizeObject, isValidUrl, validateUrlOrNull } from '@/lib/sanitize';

describe('sanitizeInput', () => {
  it('应转义 HTML 特殊字符', () => {
    expect(sanitizeInput('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;&#x2F;script&gt;'
    );
  });

  it('应转义 & 符号', () => {
    expect(sanitizeInput('a & b')).toBe('a &amp; b');
  });

  it('应转义引号', () => {
    expect(sanitizeInput('"hello"')).toBe('&quot;hello&quot;');
    expect(sanitizeInput("it's")).toBe('it&#39;s');
  });

  it('应转义反引号和等号', () => {
    expect(sanitizeInput('`code`')).toBe('&#x60;code&#x60;');
    expect(sanitizeInput('a=b')).toBe('a&#x3D;b');
  });

  it('应转义斜杠', () => {
    expect(sanitizeInput('path/to')).toBe('path&#x2F;to');
  });

  it('普通文本应保持不变', () => {
    expect(sanitizeInput('普通文本 123')).toBe('普通文本 123');
  });

  it('空字符串应返回空字符串', () => {
    expect(sanitizeInput('')).toBe('');
  });

  it('应处理组合攻击载荷', () => {
    const payload = '<img src=x onerror="alert(1)">';
    const result = sanitizeInput(payload);
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).not.toContain('"');
  });

  it('应处理 SVG XSS 载荷', () => {
    const payload = '<svg/onload=alert(1)>';
    const result = sanitizeInput(payload);
    expect(result).not.toContain('<');
    expect(result).not.toContain('=');
  });
});

describe('sanitizeObject', () => {
  it('应转义对象中所有字符串值', () => {
    const input = { name: '<script>', age: 25, bio: '"test"' };
    const result = sanitizeObject(input);
    expect(result.name).toBe('&lt;script&gt;');
    expect(result.age).toBe(25);
    expect(result.bio).toBe('&quot;test&quot;');
  });

  it('不应修改非字符串值', () => {
    const input = { count: 42, active: true, data: null };
    const result = sanitizeObject(input);
    expect(result.count).toBe(42);
    expect(result.active).toBe(true);
    expect(result.data).toBe(null);
  });

  it('空对象应返回空对象', () => {
    const result = sanitizeObject({});
    expect(Object.keys(result)).toHaveLength(0);
  });
});

describe('isValidUrl', () => {
  it('应接受 http:// URL', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
  });

  it('应接受 https:// URL', () => {
    expect(isValidUrl('https://example.com/path?query=1')).toBe(true);
  });

  it('应拒绝 javascript: URL', () => {
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
  });

  it('应拒绝 data: URL', () => {
    expect(isValidUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('应拒绝无效的URL字符串', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
    expect(isValidUrl('')).toBe(false);
  });

  it('应拒绝 file: URL', () => {
    expect(isValidUrl('file:///etc/passwd')).toBe(false);
  });
});

describe('validateUrlOrNull', () => {
  it('有效的URL应返回原URL', () => {
    expect(validateUrlOrNull('https://example.com')).toBe('https://example.com');
  });

  it('无效的URL应返回null', () => {
    expect(validateUrlOrNull('javascript:alert(1)')).toBeNull();
  });

  it('undefined应返回null', () => {
    expect(validateUrlOrNull(undefined)).toBeNull();
  });

  it('null应返回null', () => {
    expect(validateUrlOrNull(null)).toBeNull();
  });

  it('空字符串应返回null', () => {
    expect(validateUrlOrNull('')).toBeNull();
  });
});
