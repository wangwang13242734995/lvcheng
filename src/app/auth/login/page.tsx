'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
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

    const result = await signIn('credentials', {
      phone,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
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
            <span className="text-[var(--text-muted)] text-xs">首次使用将自动创建账号</span>
          </p>
        </div>

        {successMsg && (
          <div className="bg-[var(--bg-warm)] text-[var(--accent)] p-3 rounded-xl mb-4 text-sm flex items-center gap-2 border border-[var(--border)]">
            <span>✓</span>
            {successMsg}
          </div>
        )}

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
