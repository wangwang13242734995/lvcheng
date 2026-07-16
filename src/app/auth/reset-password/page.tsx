'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="min-h-[calc(100vh-60px)] flex items-center justify-center px-4 py-8 bg-gradient-to-br from-[#4A3728] via-[#2C1F14] to-slate-900">
        <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-xl">
          <div className="text-center">
            <p className="text-slate-500">链接无效或已过期</p>
            <Link href="/auth/forgot-password" className="inline-block mt-4 text-[#4A3728] hover:text-[#6B4E3D] font-medium">
              重新获取重置链接
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码至少6位');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
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
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center px-4 py-8 bg-gradient-to-br from-[#4A3728] via-[#2C1F14] to-slate-900">
      <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-[#4A3728] to-[#2C1F14] rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">履</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">重置密码</h1>
          <p className="text-slate-500 text-sm mt-1">设置新密码</p>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-[#EDF3EB] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-[#4A6B43] text-3xl">✓</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">密码重置成功</h2>
            <p className="text-slate-500 text-sm">现在可以用新密码登录了</p>
            <Link
              href="/auth/login"
              className="inline-block mt-6 text-[#4A3728] hover:text-[#6B4E3D] font-medium"
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
                <label className="block text-sm font-medium text-slate-700 mb-1.5">新密码 *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7A57] focus:border-transparent transition"
                  placeholder="至少6位密码"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">确认密码 *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7A57] focus:border-transparent transition"
                  placeholder="再输入一次密码"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#4A3728] to-[#2C1F14] text-white py-2.5 rounded-xl hover:from-[#6B4E3D] hover:to-[#4A3728] disabled:opacity-50 transition font-medium shadow-sm"
              >
                {loading ? '重置中...' : '重置密码'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              <Link href="/auth/login" className="text-orange-600 hover:underline font-medium">
                返回登录
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
