'use client';

import { useEffect, useState, useCallback, useDeferredValue } from 'react';
import Link from 'next/link';
import ProjectCard from '@/components/ProjectCard';
import { ProjectCardSkeleton } from '@/components/Skeleton';

interface ProjectUser {
  id: string;
  name: string;
  avatar: string | null;
}

interface Project {
  id: string;
  title: string;
  type: string;
  description: string | null;
  outcome: string | null;
  outcomeType: string | null;
  techStack: string[];
  difficulty: string | null;
  videoUrl: string | null;
  createdAt: string;
  user: ProjectUser;
}

interface ExploreResponse {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const sortOptions = [
  { value: 'newest', label: '最新发布' },
  { value: 'oldest', label: '最早发布' },
  { value: 'title_asc', label: '标题排序' },
];

const typeOptions = [
  { value: '', label: '全部类型' },
  { value: 'COURSE', label: '课程作业' },
  { value: 'COMPETITION', label: '比赛' },
  { value: 'INTERNSHIP', label: '实习' },
  { value: 'PERSONAL', label: '个人项目' },
  { value: 'CHALLENGE', label: '挑战赛' },
];

const difficultyOptions = [
  { value: '', label: '全部难度' },
  { value: 'EASY', label: '简单' },
  { value: 'MEDIUM', label: '中等' },
  { value: 'HARD', label: '困难' },
];

const typeLabels: Record<string, string> = {
  COURSE: '课程作业',
  COMPETITION: '比赛',
  INTERNSHIP: '实习',
  PERSONAL: '个人项目',
  CHALLENGE: '挑战赛',
};

const difficultyLabels: Record<string, string> = {
  EASY: '简单',
  MEDIUM: '中等',
  HARD: '困难',
};

export default function ExplorePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [techFilter, setTechFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [allTechs, setAllTechs] = useState<string[]>([]);
  const [selectedTech, setSelectedTech] = useState('');

  const deferredSearch = useDeferredValue(searchInput);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        sort: sortBy,
      });
      if (deferredSearch) params.set('q', deferredSearch);
      if (typeFilter) params.set('type', typeFilter);
      if (techFilter) params.set('tech', techFilter);
      if (difficultyFilter) params.set('difficulty', difficultyFilter);

      const res = await fetch(`/api/projects-explore?${params.toString()}`);
      if (!res.ok) throw new Error('加载失败');
      const data: ExploreResponse = await res.json();
      setProjects(data.projects);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, deferredSearch, typeFilter, techFilter, difficultyFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, typeFilter, techFilter, difficultyFilter, sortBy]);

  useEffect(() => {
    const techSet = new Set<string>();
    projects.forEach((p) => {
      p.techStack.forEach((tech) => techSet.add(tech));
    });
    setAllTechs(Array.from(techSet).sort());
  }, [projects]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    setTypeFilter('');
    setTechFilter('');
    setSelectedTech('');
    setDifficultyFilter('');
    setSortBy('newest');
  };

  const hasActiveFilters = deferredSearch || typeFilter || techFilter || difficultyFilter;

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-12">
          <div className="text-center">
            <p className="text-sm font-medium tracking-widest text-cyan-400/80 uppercase mb-3">
              作品探索
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              发现优秀的项目作品
            </h1>
            <p className="text-blue-200/70 max-w-xl mx-auto mb-8">
              看看其他人都做了什么，从真实作品中学习和寻找灵感
            </p>

            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索项目标题、描述、技术栈..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full px-5 py-4 pl-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition"
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
              <label className="text-sm text-slate-500">类型</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-500">技术</label>
              <select
                value={selectedTech}
                onChange={(e) => {
                  setSelectedTech(e.target.value);
                  setTechFilter(e.target.value);
                }}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm w-40 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">全部技术</option>
                {allTechs.map((tech) => (
                  <option key={tech} value={tech}>{tech}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-500">难度</label>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {difficultyOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm text-slate-500">排序</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
              {deferredSearch && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                  关键词: {deferredSearch}
                  <button onClick={() => setSearchInput('')} className="hover:text-blue-900">×</button>
                </span>
              )}
              {typeFilter && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F7FAF6] text-[#7A9A75] rounded-full text-xs font-medium">
                  类型: {typeLabels[typeFilter] || typeFilter}
                  <button onClick={() => setTypeFilter('')} className="hover:text-[#4A3728]">×</button>
                </span>
              )}
              {techFilter && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-medium">
                  技术: {techFilter}
                  <button onClick={() => { setTechFilter(''); setSelectedTech(''); }} className="hover:text-violet-900">×</button>
                </span>
              )}
              {difficultyFilter && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium">
                  难度: {difficultyLabels[difficultyFilter] || difficultyFilter}
                  <button onClick={() => setDifficultyFilter('')} className="hover:text-orange-900">×</button>
                </span>
              )}
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
            共找到 <span className="font-semibold text-slate-700">{total}</span> 个项目
          </p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <span className="text-5xl mb-4 block">🔍</span>
            <p className="text-slate-600 mb-2 font-medium">未找到匹配的项目</p>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                title={project.title}
                type={project.type}
                description={project.description}
                outcome={project.outcome}
                techStack={project.techStack}
                createdAt={project.createdAt}
                user={project.user}
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
                      ? 'bg-gradient-to-r from-blue-800 to-indigo-900 text-white'
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
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              也想展示你的作品？
            </h2>
            <p className="text-blue-100 mb-6 max-w-lg mx-auto">
              记录你的项目，让更多人看到你的能力和成长
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-3.5 rounded-xl font-semibold hover:bg-blue-50 transition shadow-lg"
            >
              开始记录项目
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}