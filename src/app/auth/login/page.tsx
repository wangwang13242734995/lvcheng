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
      setSuccessMsg('注册成功，请登录');
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
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center px-4 bg-gradient-to-br from-[#4A3728] via-[#2C1F14] to-slate-900">
      <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-[#4A3728] to-[#2C1F14] rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">履</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">欢迎回来</h1>
          <p className="text-slate-500 text-sm mt-1">用手机号登录，继续积累你的能力</p>
        </div>

        {successMsg && (
          <div className="bg-[#F7FAF6] text-[#7A9A75] p-3 rounded-xl mb-4 text-sm flex items-center gap-2">
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">手机号</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7A57] focus:border-transparent transition text-base"
              placeholder="11位手机号"
              maxLength={11}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7A57] focus:border-transparent transition text-base"
              placeholder="至少6位"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#4A3728] to-[#2C1F14] text-white py-3 rounded-xl hover:from-[#6B4E3D] hover:to-[#4A3728] disabled:opacity-50 transition font-medium shadow-sm text-base"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          还没有账号？{' '}
          <Link href="/auth/register" className="text-orange-600 hover:underline font-medium">
            立即注册
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4A3728] via-[#2C1F14] to-slate-900">
        <div className="text-white">加载中...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
