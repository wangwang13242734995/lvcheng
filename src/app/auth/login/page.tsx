'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center px-4 bg-gradient-to-br from-green-900 via-green-950 to-slate-900">
      {/* 装饰元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="w-96 h-96 bg-green-500/5 rounded-full -top-48 -left-48 absolute" />
        <div className="w-64 h-64 bg-orange-500/5 rounded-full -bottom-32 -right-32 absolute" />
      </div>

      <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-xl relative z-10">
        {/* 品牌标识 */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-green-900 to-green-950 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">履</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">欢迎回来</h1>
          <p className="text-slate-500 text-sm mt-1">登录履程，继续积累你的能力数据</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm flex items-center gap-2">
            <span>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              placeholder="your@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              placeholder="至少6位密码"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-900 to-green-950 text-white py-2.5 rounded-xl hover:from-green-800 hover:to-green-900 disabled:opacity-50 transition font-medium shadow-sm"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          <Link href="/auth/forgot-password" className="text-orange-600 hover:underline font-medium">
            忘记密码？
          </Link>
        </p>

        <p className="text-center text-sm text-slate-500 mt-4">
          还没有账号？{' '}
          <Link href="/auth/register" className="text-orange-600 hover:underline font-medium">
            注册
          </Link>
        </p>
      </div>
    </div>
  );
}
