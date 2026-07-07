'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

const categoryLabels: Record<string, string> = {
  ALL: '全部',
  TECH: '技术',
  PRODUCT: '产品',
  GROWTH: '增长',
  MARKETING: '营销',
};

const categoryIcons: Record<string, string> = {
  TECH: '💻',
  PRODUCT: '🎨',
  GROWTH: '📈',
  MARKETING: '📣',
};

const categoryColors: Record<string, string> = {
  TECH: 'bg-blue-100 text-blue-700',
  PRODUCT: 'bg-violet-100 text-violet-700',
  GROWTH: 'bg-emerald-100 text-emerald-700',
  MARKETING: 'bg-amber-100 text-amber-700',
};

interface Challenge {
  id: string;
  company: string;
  title: string;
  description: string;
  category: string;
  requiredCraft: number;
  requiredLearn: number;
  requiredDrive: number;
  requiredTeam: number;
  requiredGrit: number;
  requiredExpress: number;
  reward: string | null;
  rewardAmount: number;
  rewardType: string;
  deadline: string | null;
  spots: number | null;
  applicantCount: number;
  hasApplied: boolean;
}

export default function ChallengesPage() {
  const { data: session } = useSession();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const params = filter !== 'ALL' ? `?category=${filter}` : '';
    fetch(`/api/challenges${params}`)
      .then((res) => res.json())
      .then(setChallenges)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  const totalApplicants = challenges.reduce((sum, c) => sum + c.applicantCount, 0);
  const totalBonus = challenges.reduce((sum, c) => sum + c.rewardAmount, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-green-900 to-green-950 rounded-2xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-24 translate-x-24" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/10 rounded-full translate-y-16 -translate-x-16" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl">⚔️</span>
            <h1 className="text-3xl font-bold text-white">挑战广场</h1>
          </div>
          <p className="text-green-200/80 text-lg mb-6 max-w-2xl">
            企业发布真实问题，你用能力来解答。完成挑战，获得企业认证，让能力被看见。
          </p>
          
          {/* 统计 */}
          <div className="flex gap-6">
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
              <p className="text-2xl font-bold text-white">{challenges.length}</p>
              <p className="text-xs text-green-200/70">开放挑战</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
              <p className="text-2xl font-bold text-orange-400">{totalApplicants}</p>
              <p className="text-xs text-green-200/70">已报名人数</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
              <p className="text-2xl font-bold text-yellow-400">¥{totalBonus.toLocaleString()}</p>
              <p className="text-xs text-green-200/70">奖金池</p>
            </div>
          </div>
        </div>
      </div>

      {/* 分类筛选 */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-slate-500 mr-2">筛选：</span>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setFilter(key); setLoading(true); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              filter === key
                ? 'bg-green-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {key !== 'ALL' && <span className="mr-1">{categoryIcons[key]}</span>}
            {label}
          </button>
        ))}
      </div>

      {/* 挑战列表 */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-3 border-slate-300 border-t-green-500 rounded-full animate-spin" />
          <p className="text-slate-400 mt-4 text-sm">加载挑战中...</p>
        </div>
      ) : challenges.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-400 mb-2">暂无开放挑战</p>
          <p className="text-sm text-slate-400">新挑战即将发布，敬请期待</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {challenges.map((challenge) => (
            <Link
              key={challenge.id}
              href={`/challenges/${challenge.id}`}
              className="group bg-white rounded-2xl border border-slate-200 hover:border-green-200 hover:shadow-md transition-all overflow-hidden"
            >
              {/* 顶部色条 */}
              <div className="h-1 bg-gradient-to-r from-green-500 to-orange-500" />
              
              <div className="p-6">
                {/* 企业 + 分类 */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-500">{challenge.company}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${categoryColors[challenge.category] || 'bg-slate-100 text-slate-600'}`}>
                    {categoryIcons[challenge.category]} {categoryLabels[challenge.category]}
                  </span>
                </div>

                {/* 标题 */}
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-green-900 transition-colors">
                  {challenge.title}
                </h3>

                {/* 描述 */}
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                  {challenge.description}
                </p>

                {/* 能力要求预览 */}
                <div className="flex gap-2 mb-4">
                  {[
                    { label: '专业', value: challenge.requiredCraft },
                    { label: '学习', value: challenge.requiredLearn },
                    { label: '自驱', value: challenge.requiredDrive },
                    { label: '协作', value: challenge.requiredTeam },
                    { label: '抗压', value: challenge.requiredGrit },
                    { label: '表达', value: challenge.requiredExpress },
                  ].filter(item => item.value > 0).map((item) => (
                    <span key={item.label} className="text-xs bg-slate-50 text-slate-600 px-2 py-1 rounded border border-slate-100">
                      {item.label}≥{item.value}
                    </span>
                  ))}
                </div>

                {/* 奖励信息 */}
                <div className="flex items-center gap-3 mb-4">
                  {challenge.rewardAmount > 0 && (
                    <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                      <span>💰</span> ¥{challenge.rewardAmount.toLocaleString()}
                    </span>
                  )}
                  {challenge.reward && (
                    <span className="text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                      <span>🏆</span> {challenge.reward.length > 10 ? challenge.reward.substring(0, 10) + '...' : challenge.reward}
                    </span>
                  )}
                  {challenge.rewardType === 'ALL' && (
                    <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">
                      🎖️ 证书+面试
                    </span>
                  )}
                </div>

                {/* 底部信息 */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>👥 {challenge.applicantCount}/{challenge.spots || '∞'} 人</span>
                    {challenge.deadline && (
                      <span>⏰ {new Date(challenge.deadline).toLocaleDateString('zh-CN')}</span>
                    )}
                  </div>
                  {challenge.hasApplied ? (
                    <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                      ✓ 已报名
                    </span>
                  ) : (
                    <span className="text-xs text-green-600 font-medium group-hover:translate-x-1 transition-transform">
                      查看详情 →
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}