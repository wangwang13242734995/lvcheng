'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('registered') === '1') {
      setSuccessMsg('账号已创建，请登录');
    }
    if (searchParams.get('reset') === '1') {
      setSuccessMsg('密码已重置，请用新密码登录');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入有效的11位手机号');
      return;
    }

    if (password.length < 6) {
      setError('密码至少6位');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 使用 NextAuth 的 signIn，redirect:false 让我们手动处理结果
      // 这样 session 状态会自动更新，避免 dashboard 判定未登录又跳回登录页
      const result = await signIn('credentials', {
        phone,
        password,
        redirect: false,
        callbackUrl: '/dashboard',
      });

      if (result?.error) {
        // NextAuth 把错误放在 error 字段里
        if (result.error.includes('密码错误') || result.error.includes('Credentials')) {
          setError('密码错误，该手机号已注册。请重试或点击下方「重置密码」');
        } else {
          setError('手机号或密码错误，请重试');
        }
        setLoading(false);
        return;
      }

      // 成功 - 用 window.location 强制跳转，确保 session cookie 生效
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || '登录失败，请重试');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center px-4 bg-gradient-to-br from-[var(--primary)] via-[var(--primary-light)] to-[var(--text-primary)]">
      <div className="bg-[var(--card)] p-8 rounded-2xl w-full max-w-md shadow-xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-[var(--primary)] to-[var(--text-primary)] rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold font-serif">履</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] font-serif">进入履程</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-2 leading-relaxed">
            输入手机号和密码即可
            <br />
            <span className="text-[var(--accent)] text-xs font-medium">✨ 新手机号将自动创建账号，无需单独注册</span>
          </p>
        </div>

        {successMsg && (
          <div className="bg-[var(--bg-warm)] text-[var(--accent)] p-3 rounded-xl mb-4 text-sm flex items-center gap-2 border border-[var(--border)]">
            <span>✓</span>
            {successMsg}
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm flex items-start gap-2">
            <span>⚠️</span>
            <div>
              {error}
              {error.includes('密码错误') && (
                <Link href="/auth/forgot-password" className="underline ml-1 font-medium hover:text-red-700">
                  去重置 →
                </Link>
              )}
            </div>
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
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition text-base bg-[var(--bg)] text-[var(--text-primary)]"
              placeholder="至少6位"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--text-primary)] text-white py-3 rounded-xl hover:from-[var(--primary-light)] hover:to-[var(--primary)] disabled:opacity-50 transition font-medium shadow-sm text-base"
          >
            {loading ? '正在进入...' : '进入'}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
          忘记密码？{' '}
          <Link href="/auth/forgot-password" className="text-[var(--gold)] hover:underline font-medium">
            重置密码
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--primary)] via-[var(--primary-light)] to-[var(--text-primary)]">
        <div className="text-white">加载中...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
