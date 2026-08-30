'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入有效的11位手机号');
      return;
    }

    if (newPassword.length < 6) {
      setError('密码至少6位');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '操作失败');
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError('网络错误，请稍后重试');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center px-4 py-8 bg-gradient-to-br from-[var(--primary)] via-[var(--primary-light)] to-[var(--text-primary)]">
      <div className="bg-[var(--card)] p-8 rounded-2xl w-full max-w-md shadow-xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-[var(--primary)] to-[var(--text-primary)] rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold font-serif">履</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] font-serif">重置密码</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-2">
            输入手机号和新密码，立即重置
          </p>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-[var(--bg-warm)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--border)]">
              <span className="text-[var(--accent)] text-3xl">✓</span>
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">密码重置成功</h2>
            <p className="text-[var(--text-secondary)] text-sm">现在可以用新密码登录了</p>
            <Link
              href="/auth/login?reset=1"
              className="inline-block mt-6 text-[var(--gold)] hover:text-[var(--gold-light)] font-medium"
            >
              去登录
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm flex items-center gap-2">
                <span>⚠️</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">手机号</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition text-base bg-[var(--bg)] text-[var(--text-primary)]"
                  placeholder="11位手机号"
                  maxLength={11}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">新密码</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition text-base bg-[var(--bg)] text-[var(--text-primary)]"
                  placeholder="至少6位"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--text-primary)] text-white py-3 rounded-xl hover:from-[var(--primary-light)] hover:to-[var(--primary)] disabled:opacity-50 transition font-medium shadow-sm text-base"
              >
                {loading ? '重置中...' : '重置密码'}
              </button>
            </form>

            <p className="text-center text-sm text-[var(--text-muted)] mt-6">
              记得密码了？{' '}
              <Link href="/auth/login" className="text-[var(--gold)] hover:underline font-medium">
                返回登录
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
