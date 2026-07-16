'use client';

import { useEffect, useState, useCallback } from 'react';
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

const rewardTypeLabels: Record<string, string> = {
  CERTIFICATE: '证书',
  CASH: '现金',
  PRIZE: '奖品',
  INTERNSHIP: '实习',
};

const sortLabels: Record<string, string> = {
  newest: '最新',
  reward_desc: '奖金最高',
  deadline_asc: '即将截止',
  applicants_desc: '最热门',
};

const abilityDimensions = [
  { key: 'craft', label: '专业' },
  { key: 'learn', label: '学习' },
  { key: 'drive', label: '自驱' },
  { key: 'team', label: '协作' },
  { key: 'grit', label: '抗压' },
  { key: 'express', label: '表达' },
];

const rewardRanges = [
  { value: '', label: '不限奖金' },
  { value: '0-1000', label: '¥0-1000' },
  { value: '1000-5000', label: '¥1000-5000' },
  { value: '5000-10000', label: '¥5000-10000' },
  { value: '10000+', label: '¥10000+' },
];

const statusLabels: Record<string, string> = {
  OPEN: '开放中',
  CLOSED: '已结束',
  ALL: '全部',
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
  isFavorited: boolean;
}

export default function ChallengesPage() {
  const { data: session } = useSession();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [rewardType, setRewardType] = useState('');
  const [sort, setSort] = useState('newest');
  const [q, setQ] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [rewardRange, setRewardRange] = useState('');
  const [abilityFilters, setAbilityFilters] = useState<Record<string, number>>({});

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'ALL') params.set('category', filter);
      if (rewardType) params.set('rewardType', rewardType);
      if (q) params.set('q', q);
      params.set('sort', sort);
      params.set('page', page.toString());
      params.set('pageSize', '20');
      params.set('status', statusFilter);

      if (rewardRange) {
        const [min, max] = rewardRange.split('-');
        if (min) params.set('minReward', min);
        if (max && !max.includes('+')) params.set('maxReward', max);
        if (max?.includes('+')) params.set('minReward', max.replace('+', ''));
      }

      Object.entries(abilityFilters).forEach(([key, value]) => {
        if (value > 0) params.set(`min${key.charAt(0).toUpperCase() + key.slice(1)}`, String(value));
      });

      const res = await fetch(`/api/challenges?${params}`);
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      setChallenges(data.challenges || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter, rewardType, sort, q, page, statusFilter, rewardRange, abilityFilters]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const toggleFavorite = async (challengeId: string, isFavorited: boolean) => {
    try {
      const method = isFavorited ? 'DELETE' : 'POST';
      const res = await fetch('/api/user/favorites', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId }),
      });
      if (res.ok) {
        setChallenges(prev => prev.map(c => 
          c.id === challengeId ? { ...c, isFavorited: !isFavorited } : c
        ));
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQ(searchInput);
  };

  const clearFilters = () => {
    setFilter('ALL');
    setRewardType('');
    setSearchInput('');
    setQ('');
    setSort('newest');
    setPage(1);
    setStatusFilter('OPEN');
    setRewardRange('');
    setAbilityFilters({});
  };

  const hasActiveFilters = filter !== 'ALL' || rewardType || q || statusFilter !== 'OPEN' || rewardRange || Object.values(abilityFilters).some(v => v > 0);

  const totalApplicants = challenges.reduce((sum, c) => sum + c.applicantCount, 0);
  const totalBonus = challenges.reduce((sum, c) => sum + c.rewardAmount, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-br from-[#4A3728] to-[#2C1F14] rounded-2xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-24 translate-x-24" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/10 rounded-full translate-y-16 -translate-x-16" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl">⚔️</span>
            <h1 className="text-3xl font-bold text-white">挑战广场</h1>
          </div>
          <p className="text-[#D6E4D2]/80 text-lg mb-6 max-w-2xl">
            企业发布真实问题，你用能力来解答。完成挑战，获得企业认证，让能力被看见。
          </p>
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-6">
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                <p className="text-2xl font-bold text-white">{total}</p>
                <p className="text-xs text-[#D6E4D2]/70">开放挑战</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                <p className="text-2xl font-bold text-orange-400">{totalApplicants}</p>
                <p className="text-xs text-[#D6E4D2]/70">已报名人数</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                <p className="text-2xl font-bold text-yellow-400">¥{totalBonus.toLocaleString()}</p>
                <p className="text-xs text-[#D6E4D2]/70">奖金池</p>
              </div>
            </div>

            {(session?.user as any)?.role === 'ENTERPRISE' && (
              <Link
                href="/challenges/new"
                className="inline-flex items-center gap-2 bg-white text-[#6B4E3D] px-5 py-2.5 rounded-xl font-semibold hover:bg-[#F7FAF6] transition shadow-lg"
              >
                + 发布挑战
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3 mb-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="搜索挑战标题或企业名称"
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#4A3728] text-white rounded-lg text-sm font-medium hover:bg-[#6B4E3D] transition"
            >
              搜索
            </button>
          </form>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">排序：</span>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
            >
              {Object.entries(sortLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-sm text-slate-500 mr-1">分类：</span>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setFilter(key); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                filter === key
                  ? 'bg-[#4A3728] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {key !== 'ALL' && <span className="mr-1">{categoryIcons[key]}</span>}
              {label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-slate-500">状态：</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
            >
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">奖金：</span>
            <select
              value={rewardRange}
              onChange={(e) => { setRewardRange(e.target.value); setPage(1); }}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
            >
              {rewardRanges.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">奖励：</span>
            <select
              value={rewardType}
              onChange={(e) => { setRewardType(e.target.value); setPage(1); }}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
            >
              <option value="">全部</option>
              {Object.entries(rewardTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-4 ml-auto">
            <span className="text-sm text-slate-500">能力要求：</span>
            {abilityDimensions.map((dim) => (
              <div key={dim.key} className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{dim.label}</span>
                <select
                  value={abilityFilters[dim.key] || 0}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setAbilityFilters(prev => ({
                      ...prev,
                      [dim.key]: value,
                    }));
                  }}
                  className="px-2 py-1 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-[#5D7A57] focus:border-transparent bg-white"
                >
                  <option value="0">不限</option>
                  <option value="50">50+</option>
                  <option value="70">70+</option>
                  <option value="85">85+</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
            {q && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F7FAF6] text-[#7A9A75] rounded-full text-xs font-medium">
                关键词: {q}
                <button onClick={() => { setSearchInput(''); setQ(''); }} className="hover:text-[#4A3728]">×</button>
              </span>
            )}
            {filter !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                分类: {categoryLabels[filter]}
                <button onClick={() => setFilter('ALL')} className="hover:text-blue-900">×</button>
              </span>
            )}
            {rewardType && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                奖励: {rewardTypeLabels[rewardType]}
                <button onClick={() => setRewardType('')} className="hover:text-amber-900">×</button>
              </span>
            )}
            {rewardRange && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium">
                奖金: {rewardRanges.find(r => r.value === rewardRange)?.label}
                <button onClick={() => setRewardRange('')} className="hover:text-yellow-900">×</button>
              </span>
            )}
            {statusFilter !== 'OPEN' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-xs font-medium">
                状态: {statusLabels[statusFilter]}
                <button onClick={() => setStatusFilter('OPEN')} className="hover:text-gray-900">×</button>
              </span>
            )}
            {Object.entries(abilityFilters).map(([key, value]) => {
              if (value <= 0) return null;
              const dim = abilityDimensions.find(d => d.key === key);
              return (
                <span key={key} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                  {dim?.label}≥{value}
                  <button onClick={() => setAbilityFilters(prev => ({ ...prev, [key]: 0 }))} className="hover:text-indigo-900">×</button>
                </span>
              );
            })}
            <button
              onClick={clearFilters}
              className="text-xs text-slate-400 hover:text-slate-600 ml-auto"
            >
              清除全部
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-3 border-slate-300 border-t-[#5D7A57] rounded-full animate-spin" />
          <p className="text-slate-400 mt-4 text-sm">加载挑战中...</p>
        </div>
      ) : challenges.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <span className="text-5xl mb-4 block">🔍</span>
          <p className="text-slate-600 mb-2">暂无匹配的挑战</p>
          <p className="text-sm text-slate-400 mb-6">试试调整筛选条件或搜索关键词</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-medium hover:bg-slate-200 transition"
            >
              清除筛选
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="text-sm text-slate-500 mb-4">共 {total} 个挑战</div>
          <div className="grid md:grid-cols-2 gap-6">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className="group bg-white rounded-2xl border border-slate-200 hover:border-[#D6E4D2] hover:shadow-md transition-all overflow-hidden"
            >
              <div className="h-1 bg-gradient-to-r from-[#5D7A57] to-orange-500" />
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-500">{challenge.company}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${categoryColors[challenge.category] || 'bg-slate-100 text-slate-600'}`}>
                    {categoryIcons[challenge.category]} {categoryLabels[challenge.category]}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#4A3728] transition-colors">
                    {challenge.title}
                  </h3>
                  {session && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(challenge.id, challenge.isFavorited);
                      }}
                      className={`p-1.5 rounded-lg transition ${
                        challenge.isFavorited
                          ? 'text-red-500 bg-red-50'
                          : 'text-slate-300 hover:text-red-500 hover:bg-red-50'
                      }`}
                    >
                      {challenge.isFavorited ? '❤️' : '🤍'}
                    </button>
                  )}
                </div>

                <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                  {challenge.description}
                </p>

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
                    <span className="text-xs bg-[#F7FAF6] text-[#7A9A75] px-2.5 py-1 rounded-full font-medium">
                      🎖️ 证书+面试
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>👥 {challenge.applicantCount}/{challenge.spots || '∞'} 人</span>
                    {challenge.deadline && (
                      <span>⏰ {new Date(challenge.deadline).toLocaleDateString('zh-CN')}</span>
                    )}
                  </div>
                  <Link
                    href={`/challenges/${challenge.id}`}
                    className="text-xs text-[#4A6B43] font-medium group-hover:translate-x-1 transition-transform"
                  >
                    {challenge.hasApplied ? '查看进度 →' : '查看详情 →'}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
            >
              上一页
            </button>
            <span className="text-sm text-slate-500">第 {page} / {totalPages} 页</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
            >
              下一页
            </button>
          </div>
        )}
        </>
      )}
    </div>
  );
}