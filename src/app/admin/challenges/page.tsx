'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AdminChallenge {
  id: string;
  title: string;
  company: string;
  category: string;
  status: string;
  rewardAmount: number;
  rewardType: string;
  deadline: string | null;
  createdAt: string;
  applicantCount: number;
  submissionCount: number;
}

interface ChallengeListResponse {
  challenges: AdminChallenge[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const statusLabels: Record<string, string> = {
  OPEN: '进行中',
  CLOSED: '已关闭',
  COMPLETED: '已完成',
};

const statusColors: Record<string, string> = {
  OPEN: 'bg-[#EDF3EB] text-[#7A9A75]',
  CLOSED: 'bg-slate-100 text-slate-600',
  COMPLETED: 'bg-blue-100 text-blue-700',
};

const categoryLabels: Record<string, string> = {
  TECH: '技术',
  PRODUCT: '产品',
  GROWTH: '增长',
  MARKETING: '营销',
};

export default function AdminChallengesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [challenges, setChallenges] = useState<AdminChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (categoryFilter) params.set('category', categoryFilter);

      const res = await fetch(`/api/admin/challenges?${params}`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push('/');
          return;
        }
        throw new Error('获取挑战列表失败');
      }
      const data: ChallengeListResponse = await res.json();
      setChallenges(data.challenges);
      setTotal(data.total);
    } catch {
      setError('获取挑战列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter, categoryFilter, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role !== 'ADMIN') {
        router.push('/');
        return;
      }
      fetchChallenges();
    }
  }, [status, session, fetchChallenges, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchChallenges();
  };

  const handleStatusChange = async (challengeId: string, newStatus: string) => {
    const actionText = newStatus === 'CLOSED' ? '关闭' : '重新开启';
    if (!confirm(`确定要${actionText}这个挑战吗？`)) return;

    setProcessingId(challengeId);
    try {
      const res = await fetch(`/api/admin/challenges?id=${challengeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '操作失败');
      }

      setMessage(`挑战已${actionText}`);
      fetchChallenges();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setProcessingId(null);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }

  if ((session?.user as any)?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
            <h1 className="text-2xl font-bold text-slate-900">挑战管理</h1>
            <p className="text-slate-500 text-sm mt-1">共 {total} 个挑战</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.open('/api/admin/export/challenges', '_blank')}
              className="px-4 py-2 text-sm font-medium bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition"
            >
              导出 CSV
            </button>
            <Link
              href="/admin"
              className="text-sm text-slate-600 hover:text-slate-900 transition"
            >
              ← 返回后台
            </Link>
          </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-[#F7FAF6] border border-[#D6E4D2] text-[#4A6B43] p-4 rounded-xl mb-4 text-sm">
            {message}
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索挑战标题或企业"
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
              <span className="text-sm text-slate-500">状态：</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
              >
                <option value="">全部</option>
                <option value="OPEN">进行中</option>
                <option value="CLOSED">已关闭</option>
                <option value="COMPLETED">已完成</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">分类：</span>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
              >
                <option value="">全部</option>
                <option value="TECH">技术</option>
                <option value="PRODUCT">产品</option>
                <option value="GROWTH">增长</option>
                <option value="MARKETING">营销</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
                <div className="h-6 bg-slate-100 rounded w-1/3 mb-3" />
                <div className="h-4 bg-slate-100 rounded w-1/2 mb-2" />
                <div className="h-4 bg-slate-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : challenges.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 text-center py-16">
            <span className="text-5xl mb-4 block">🎯</span>
            <p className="text-slate-500">暂无挑战</p>
          </div>
        ) : (
          <div className="space-y-4">
            {challenges.map((challenge) => (
              <div
                key={challenge.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-[#D6E4D2] transition overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusColors[challenge.status] || 'bg-slate-100 text-slate-600'}`}>
                          {statusLabels[challenge.status] || challenge.status}
                        </span>
                        <span className="text-xs text-slate-400">
                          {categoryLabels[challenge.category] || challenge.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">
                        {challenge.title}
                      </h3>
                      <p className="text-sm text-slate-500">{challenge.company}</p>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-xl font-bold text-blue-600">{challenge.applicantCount}</p>
                        <p className="text-xs text-slate-400">报名</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-violet-600">{challenge.submissionCount}</p>
                        <p className="text-xs text-slate-400">提交</p>
                      </div>
                      <div className="text-center">
                        {challenge.rewardAmount > 0 ? (
                          <>
                            <p className="text-xl font-bold text-amber-600">
                              ¥{(challenge.rewardAmount / 100).toFixed(0)}
                            </p>
                            <p className="text-xs text-slate-400">奖金</p>
                          </>
                        ) : (
                          <>
                            <p className="text-xl font-bold text-slate-400">—</p>
                            <p className="text-xs text-slate-400">奖金</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>发布于 {new Date(challenge.createdAt).toLocaleDateString('zh-CN')}</span>
                      {challenge.deadline && (
                        <span>截止 {new Date(challenge.deadline).toLocaleDateString('zh-CN')}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/challenges/${challenge.id}`}
                        className="text-sm text-slate-600 hover:text-slate-900 transition"
                      >
                        查看详情
                      </Link>
                      {challenge.status === 'OPEN' && (
                        <button
                          onClick={() => handleStatusChange(challenge.id, 'CLOSED')}
                          disabled={processingId === challenge.id}
                          className="text-sm text-red-600 hover:text-red-700 transition disabled:opacity-50"
                        >
                          关闭
                        </button>
                      )}
                      {challenge.status === 'CLOSED' && (
                        <button
                          onClick={() => handleStatusChange(challenge.id, 'OPEN')}
                          disabled={processingId === challenge.id}
                          className="text-sm text-[#7A9A75] hover:text-[#6B4E3D] transition disabled:opacity-50"
                        >
                          重新开启
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 rounded-lg font-medium transition ${
                    page === pageNum
                      ? 'bg-[#4A3728] text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-10 h-10 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
