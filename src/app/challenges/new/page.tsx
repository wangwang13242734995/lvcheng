'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const categoryOptions = [
  { value: 'TECH', label: '技术' },
  { value: 'PRODUCT', label: '产品' },
  { value: 'GROWTH', label: '增长' },
  { value: 'MARKETING', label: '营销' },
];

const rewardTypeOptions = [
  { value: 'CERTIFICATE', label: '认证证书' },
  { value: 'CASH', label: '现金奖励' },
  { value: 'PRIZE', label: '实物奖品' },
  { value: 'INTERNSHIP', label: '实习机会' },
];

const abilityDimensions = [
  { key: 'craft', label: '专业力', icon: '🛠' },
  { key: 'learn', label: '学习力', icon: '📚' },
  { key: 'drive', label: '自驱力', icon: '⚡' },
  { key: 'team', label: '协作力', icon: '🤝' },
  { key: 'grit', label: '抗压力', icon: '🏔' },
  { key: 'express', label: '表达力', icon: '🎯' },
];

export default function NewChallengePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'TECH',
    company: (session?.user as any)?.name || '',
    requiredCraft: 30,
    requiredLearn: 30,
    requiredDrive: 30,
    requiredTeam: 30,
    requiredGrit: 30,
    requiredExpress: 30,
    reward: '',
    rewardAmount: 0,
    rewardType: 'CERTIFICATE',
    deadline: '',
    spots: '',
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (session && (session.user as any)?.role !== 'ENTERPRISE' && (session.user as any)?.role !== 'ADMIN') {
      router.push('/challenges');
    }
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload: any = {
        ...formData,
        spots: formData.spots ? parseInt(formData.spots) : undefined,
      };

      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '发布失败');
      }

      const data = await res.json();
      router.push(`/challenges/${data.challenge.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发布失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">发布挑战</h1>
          <p className="text-slate-500">发布一个挑战，找到真正有能力的人才</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">基本信息</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  企业名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => updateField('company', e.target.value)}
                  placeholder="请输入企业名称"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7A57] focus:border-transparent"
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  挑战标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="用一句话描述这个挑战"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7A57] focus:border-transparent"
                  maxLength={200}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  挑战分类
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7A57] focus:border-transparent bg-white"
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  挑战描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="详细描述挑战内容、要求、提交方式等"
                  rows={8}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7A57] focus:border-transparent resize-none"
                  maxLength={10000}
                  required
                />
                <p className="text-xs text-slate-400 mt-1">{formData.description.length}/10000</p>
              </div>
            </div>
          </div>

          {/* 能力要求 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">能力要求</h2>
            <p className="text-sm text-slate-500 mb-6">设置你期望候选人达到的能力水平（0-100）</p>

            <div className="grid grid-cols-2 gap-4">
              {abilityDimensions.map((dim) => {
                const key = `required${dim.key.charAt(0).toUpperCase() + dim.key.slice(1)}`;
                const value = (formData as any)[key];
                return (
                  <div key={dim.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-medium text-slate-700">
                        {dim.icon} {dim.label}
                      </label>
                      <span className="text-sm font-semibold text-[#4A6B43]">{value}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={value}
                      onChange={(e) => updateField(key, parseInt(e.target.value))}
                      className="w-full accent-[#4A6B43]"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* 奖励设置 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">奖励设置</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  奖励类型
                </label>
                <select
                  value={formData.rewardType}
                  onChange={(e) => updateField('rewardType', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7A57] focus:border-transparent bg-white"
                >
                  {rewardTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  奖励描述
                </label>
                <input
                  type="text"
                  value={formData.reward}
                  onChange={(e) => updateField('reward', e.target.value)}
                  placeholder="例如：一等奖5000元，二等奖2000元"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7A57] focus:border-transparent"
                  maxLength={500}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  奖励金额（分）
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.rewardAmount}
                  onChange={(e) => updateField('rewardAmount', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7A57] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 其他设置 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">其他设置</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  截止日期
                </label>
                <input
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => updateField('deadline', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7A57] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  招募人数
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.spots}
                  onChange={(e) => updateField('spots', e.target.value)}
                  placeholder="不限"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7A57] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 border border-slate-200 text-slate-700 py-3 rounded-xl hover:bg-slate-50 transition font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-[#6B4E3D] to-[#4A3728] text-white py-3 rounded-xl hover:from-[#7A9A75] hover:to-[#6B4E3D] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '发布中...' : '发布挑战'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
