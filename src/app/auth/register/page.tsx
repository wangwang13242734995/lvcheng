'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('两次密码不一致');
      return;
    }

    if (formData.password.length < 6) {
      setError('密码至少6位');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          role: 'STUDENT',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '注册失败');
        setLoading(false);
        return;
      }

      // 注册成功后自动登录并跳转到引导页
      const loginRes = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (loginRes?.ok) {
        router.push('/onboarding');
      } else {
        router.push('/auth/login?registered=true');
      }
    } catch {
      setError('网络错误，请稍后重试');
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center px-4 py-8 bg-gradient-to-br from-green-900 via-green-950 to-slate-900">
      {/* 装饰元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="w-96 h-96 bg-green-500/5 rounded-full -top-48 -right-48 absolute" />
        <div className="w-64 h-64 bg-orange-500/5 rounded-full -bottom-32 -left-32 absolute" />
      </div>

      <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-xl relative z-10">
        {/* 品牌标识 */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-green-900 to-green-950 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">履</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">加入履程</h1>
          <p className="text-slate-500 text-sm mt-1">30秒注册，立即生成你的能力名片</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm flex items-center gap-2">
            <span>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">姓名 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              placeholder="你的名字"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">邮箱 *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              placeholder="your@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">密码 *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              placeholder="至少6位密码"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">确认密码 *</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              placeholder="再输入一次密码"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-900 to-green-950 text-white py-2.5 rounded-xl hover:from-green-800 hover:to-green-900 disabled:opacity-50 transition font-medium shadow-sm"
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          已有账号？{' '}
          <Link href="/auth/login" className="text-orange-600 hover:underline font-medium">
            登录
          </Link>
        </p>
      </div>
    </div>
  );
}
