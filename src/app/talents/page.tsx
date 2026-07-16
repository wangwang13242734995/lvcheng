'use client';

import { useEffect, useState, useCallback, useDeferredValue } from 'react';
import Link from 'next/link';
import TalentCard from '@/components/TalentCard';
import { CardSkeleton } from '@/components/Skeleton';

interface Scores {
  craft: number;
  learn: number;
  drive: number;
  team: number;
  grit: number;
  express: number;
  totalScore: number;
}

interface Talent {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  major: string | null;
  skills: string[];
  projectCount: number;
  scores: Scores;
  createdAt: string;
}

interface TalentListResponse {
  users: Talent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const sortOptions = [
  { value: 'score_desc', label: '综合得分 ↓' },
  { value: 'projects_desc', label: '项目数 ↓' },
  { value: 'newest', label: '最新加入' },
];

const abilityDimensions = [
  { key: 'craft', label: '专业力', color: 'bg-blue-500' },
  { key: 'learn', label: '学习力', color: 'bg-[#5D7A57]' },
  { key: 'drive', label: '自驱力', color: 'bg-orange-500' },
  { key: 'team', label: '协作力', color: 'bg-purple-500' },
  { key: 'grit', label: '抗压性', color: 'bg-red-500' },
  { key: 'express', label: '表达力', color: 'bg-cyan-500' },
];

export default function TalentsPage() {
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [majorFilter, setMajorFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState('score_desc');
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [abilityFilters, setAbilityFilters] = useState<Record<string, number>>({});

  const deferredSearch = useDeferredValue(searchInput);

  const fetchTalents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        sort: sortBy,
      });
      if (deferredSearch) params.set('q', deferredSearch);
      if (majorFilter) params.set('major', majorFilter);
      if (skillFilter) params.set('skill', skillFilter);
      if (minScore > 0) params.set('minScore', String(minScore));

      Object.entries(abilityFilters).forEach(([key, value]) => {
        if (value > 0) params.set(`min${key.charAt(0).toUpperCase() + key.slice(1)}`, String(value));
      });

      const res = await fetch(`/api/talents?${params.toString()}`);
      if (!res.ok) throw new Error('加载失败');
      const data: TalentListResponse = await res.json();
      setTalents(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to load talents:', err);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, deferredSearch, majorFilter, skillFilter, minScore, abilityFilters]);

  useEffect(() => {
    fetchTalents();
  }, [fetchTalents]);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, majorFilter, skillFilter, minScore, sortBy, abilityFilters]);

  useEffect(() => {
    const skillSet = new Set<string>();
    talents.forEach((t) => {
      t.skills.forEach((skill) => skillSet.add(skill));
    });
    setAllSkills(Array.from(skillSet).sort());
  }, [talents]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    setMajorFilter('');
    setSkillFilter('');
    setMinScore(0);
    setSortBy('score_desc');
    setSelectedSkill('');
    setAbilityFilters({});
  };

  const hasActiveFilters = deferredSearch || majorFilter || skillFilter || minScore > 0 || Object.values(abilityFilters).some(v => v > 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-[#4A3728] via-[#6B4E3D] to-[#2C1F14] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-12">
          <div className="text-center">
            <p className="text-sm font-medium tracking-widest text-orange-400/80 uppercase mb-3">
              人才广场
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              发现真正有能力的人
            </h1>
            <p className="text-[#D6E4D2]/70 max-w-xl mx-auto mb-8">
              不看标签，看作品。这些人用真实项目证明了自己的能力
            </p>

            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索姓名、学校、技能、专业..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full px-5 py-4 pl-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 transition"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">🔍</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-500">专业</label>
              <input
                type="text"
                placeholder="输入专业"
                value={majorFilter}
                onChange={(e) => setMajorFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm w-40 focus:ring-2 focus:ring-[#5D7A57] focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-500">技能</label>
              <select
                value={selectedSkill}
                onChange={(e) => {
                  setSelectedSkill(e.target.value);
                  setSkillFilter(e.target.value);
                }}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm w-40 focus:ring-2 focus:ring-[#5D7A57] focus:border-transparent bg-white"
              >
                <option value="">全部技能</option>
                {allSkills.map((skill) => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-500">最低分</label>
              <select
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-[#5D7A57] focus:border-transparent bg-white"
              >
                <option value="0">不限</option>
                <option value="50">50+</option>
                <option value="70">70+</option>
                <option value="85">85+</option>
              </select>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm text-slate-500">排序</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-[#5D7A57] focus:border-transparent bg-white"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-100">
            <span className="text-sm text-slate-500">能力维度：</span>
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
                  <option value="60">60+</option>
                  <option value="75">75+</option>
                  <option value="90">90+</option>
                </select>
              </div>
            ))}
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
              {deferredSearch && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F7FAF6] text-[#7A9A75] rounded-full text-xs font-medium">
                  关键词: {deferredSearch}
                  <button onClick={() => setSearchInput('')} className="hover:text-[#4A3728]">×</button>
                </span>
              )}
              {majorFilter && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-medium">
                  专业: {majorFilter}
                  <button onClick={() => setMajorFilter('')} className="hover:text-teal-900">×</button>
                </span>
              )}
              {skillFilter && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-medium">
                  技能: {skillFilter}
                  <button onClick={() => { setSkillFilter(''); setSelectedSkill(''); }} className="hover:text-violet-900">×</button>
                </span>
              )}
              {minScore > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium">
                  最低分: {minScore}+
                  <button onClick={() => setMinScore(0)} className="hover:text-orange-900">×</button>
                </span>
              )}
              {Object.entries(abilityFilters).map(([key, value]) => {
                if (value <= 0) return null;
                const dim = abilityDimensions.find(d => d.key === key);
                return (
                  <span key={key} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                    {dim?.label}: {value}+
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

        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-500">
            共找到 <span className="font-semibold text-slate-700">{total}</span> 位人才
          </p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} width="w-full" height="h-72" />
            ))}
          </div>
        ) : talents.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <span className="text-5xl mb-4 block">🔍</span>
            <p className="text-slate-600 mb-2 font-medium">未找到匹配的人才</p>
            <p className="text-slate-400 text-sm mb-6">试试调整筛选条件或搜索关键词</p>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {talents.map((talent) => (
              <TalentCard
                key={talent.id}
                id={talent.id}
                name={talent.name}
                projectCount={talent.projectCount}
                scores={talent.scores}
              />
            ))}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="w-10 h-10 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              ←
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-10 h-10 rounded-lg font-medium transition ${
                    page === pageNum
                      ? 'bg-gradient-to-r from-[#6B4E3D] to-[#4A3728] text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="w-10 h-10 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              →
            </button>
          </div>
        )}
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-20 pt-10">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 md:p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              你也想被看见？
            </h2>
            <p className="text-orange-100 mb-6 max-w-lg mx-auto">
              记录你的项目，展示你的能力，让企业主动找到你
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-white text-orange-600 px-8 py-3.5 rounded-xl font-semibold hover:bg-orange-50 transition shadow-lg"
            >
              用作品证明自己
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}