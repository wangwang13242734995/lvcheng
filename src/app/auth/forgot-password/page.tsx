'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('请输入邮箱');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
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
          <h1 className="text-2xl font-bold text-slate-900">找回密码</h1>
          <p className="text-slate-500 text-sm mt-1">输入邮箱，我们会发送重置链接</p>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-[#EDF3EB] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-[#4A6B43] text-3xl">✓</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">重置链接已发送</h2>
            <p className="text-slate-500 text-sm">请检查你的邮箱，点击链接重置密码</p>
            <Link
              href="/auth/login"
              className="inline-block mt-6 text-[#4A3728] hover:text-[#6B4E3D] font-medium"
            >
              返回登录
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
                <label className="block text-sm font-medium text-slate-700 mb-1.5">邮箱 *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7A57] focus:border-transparent transition"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#4A3728] to-[#2C1F14] text-white py-2.5 rounded-xl hover:from-[#6B4E3D] hover:to-[#4A3728] disabled:opacity-50 transition font-medium shadow-sm"
              >
                {loading ? '发送中...' : '发送重置链接'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              记得密码了？{' '}
              <Link href="/auth/login" className="text-orange-600 hover:underline font-medium">
                登录
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
