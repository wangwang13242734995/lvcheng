'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      setError('请输入有效的11位手机号');
      return;
    }

    if (formData.password.length < 6) {
      setError('密码至少6位');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('两次密码不一致');
      return;
    }

    if (!formData.name.trim()) {
      setError('请输入昵称');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '注册失败');
        setLoading(false);
        return;
      }

      router.push('/auth/login?registered=1');
    } catch {
      setError('网络错误，请稍后重试');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center px-4 bg-gradient-to-br from-[#4A3728] via-[#2C1F14] to-slate-900">
      <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-[#4A3728] to-[#2C1F14] rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">履</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">注册账号</h1>
          <p className="text-slate-500 text-sm mt-1">3秒钟，开启你的能力证明之旅</p>
        </div>

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
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7A57] focus:border-transparent transition text-base"
              placeholder="11位手机号"
              maxLength={11}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">昵称</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7A57] focus:border-transparent transition text-base"
              placeholder="给自己起个名字"
              maxLength={20}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">设置密码</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7A57] focus:border-transparent transition text-base"
              placeholder="至少6位"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">确认密码</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7A57] focus:border-transparent transition text-base"
              placeholder="再输入一次"
              required
            />
          </div>
          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              required
              className="mt-0.5 rounded border-slate-300 text-[#4A3728] focus:ring-[#5D7A57]"
            />
            <span>
              我已阅读并同意
              <Link href="/terms" className="text-[#4A3728] hover:underline mx-0.5">服务条款</Link>
              和
              <Link href="/privacy" className="text-[#4A3728] hover:underline mx-0.5">隐私政策</Link>
            </span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#4A3728] to-[#2C1F14] text-white py-3 rounded-xl hover:from-[#6B4E3D] hover:to-[#4A3728] disabled:opacity-50 transition font-medium shadow-sm text-base"
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
