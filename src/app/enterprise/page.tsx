'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';

interface Challenge {
  id: string;
  title: string;
  company: string;
  category: string;
  status: string;
  rewardAmount: number;
  rewardType: string;
  deadline: string | null;
  spots: number | null;
  createdAt: string;
  applicantCount: number;
  submissionCount: number;
}

interface Stats {
  totalChallenges: number;
  openCount: number;
  totalApplicants: number;
  totalSubmissions: number;
}

interface ChallengeListResponse {
  challenges: Challenge[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: Stats;
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

export default function EnterpriseDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({
    totalChallenges: 0,
    openCount: 0,
    totalApplicants: 0,
    totalSubmissions: 0,
  });
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: 'TECH',
    requiredCraft: 0,
    requiredLearn: 0,
    requiredDrive: 0,
    requiredTeam: 0,
    requiredGrit: 0,
    requiredExpress: 0,
    reward: '',
    rewardAmount: 0,
    rewardType: 'CERTIFICATE',
    deadline: '',
    spots: undefined as number | undefined,
  });
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { unreadCount } = useNotifications();

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: String(page),
      });
      if (searchQuery) params.set('q', searchQuery);
      const res = await fetch(`/api/enterprise/challenges?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push('/challenges');
          return;
        }
        throw new Error('加载失败');
      }
      const data: ChallengeListResponse = await res.json();
      setChallenges(data.challenges);
      setTotalPages(data.totalPages);
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to load challenges:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, router, searchQuery]);

  useEffect(() => {
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role !== 'ENTERPRISE' && role !== 'ADMIN') {
        router.push('/challenges');
        return;
      }
      fetchChallenges();
    }
  }, [status, session, statusFilter, page, router, fetchChallenges, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage(1);
  };

  const isEnterprise = (session?.user as any)?.role === 'ENTERPRISE' || (session?.user as any)?.role === 'ADMIN';

  const openEditModal = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setEditError(null);
    // 需要先获取完整详情
    fetch(`/api/challenges/${challenge.id}`)
      .then((res) => res.json())
      .then((data) => {
        setEditForm({
          title: data.title || '',
          description: data.description || '',
          category: data.category || 'TECH',
          requiredCraft: data.requiredCraft || 0,
          requiredLearn: data.requiredLearn || 0,
          requiredDrive: data.requiredDrive || 0,
          requiredTeam: data.requiredTeam || 0,
          requiredGrit: data.requiredGrit || 0,
          requiredExpress: data.requiredExpress || 0,
          reward: data.reward || '',
          rewardAmount: data.rewardAmount || 0,
          rewardType: data.rewardType || 'CERTIFICATE',
          deadline: data.deadline ? new Date(data.deadline).toISOString().split('T')[0] : '',
          spots: data.spots || undefined,
        });
      })
      .catch(() => setEditError('加载详情失败'));
  };

  const closeEditModal = () => {
    setEditingChallenge(null);
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChallenge) return;
    setProcessingId(editingChallenge.id);
    setEditError(null);

    try {
      const res = await fetch(`/api/enterprise/challenges/${editingChallenge.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          spots: editForm.spots ? Number(editForm.spots) : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '保存失败');
      }

      closeEditModal();
      await fetchChallenges();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCloseChallenge = async (challengeId: string) => {
    if (!confirm('确定要关闭这个挑战吗？关闭后不再接受新的报名。')) return;
    setProcessingId(challengeId);
    try {
      const res = await fetch(`/api/enterprise/challenges/${challengeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CLOSED' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '关闭失败');
      }

      await fetchChallenges();
    } catch (err) {
      alert(err instanceof Error ? err.message : '关闭失败');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReopenChallenge = async (challengeId: string) => {
    if (!confirm('确定要重新开放这个挑战吗？将重新接受报名。')) return;
    setProcessingId(challengeId);
    try {
      const res = await fetch(`/api/enterprise/challenges/${challengeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'OPEN' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '重新开放失败');
      }

      await fetchChallenges();
    } catch (err) {
      alert(err instanceof Error ? err.message : '重新开放失败');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCompleteChallenge = async (challengeId: string) => {
    if (!confirm('确定要标记这个挑战为已完成吗？')) return;
    setProcessingId(challengeId);
    try {
      const res = await fetch(`/api/enterprise/challenges/${challengeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '标记完成失败');
      }

      await fetchChallenges();
    } catch (err) {
      alert(err instanceof Error ? err.message : '标记完成失败');
    } finally {
      setProcessingId(null);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }

  if (!isEnterprise) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">企业管理后台</h1>
              <p className="text-slate-500 text-sm mt-1">管理你发布的挑战和报名者</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/enterprise/analytics"
                className="text-sm text-slate-600 hover:text-slate-900 transition"
              >
                数据看板
              </Link>
              <Link
                href="/enterprise/notifications"
                className="relative text-sm text-slate-600 hover:text-slate-900 transition"
              >
                通知
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                href="/enterprise/profile"
                className="text-sm text-slate-600 hover:text-slate-900 transition"
              >
                企业资料
              </Link>
              <Link
                href="/challenges/new"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#6B4E3D] to-[#4A3728] text-white px-5 py-2.5 rounded-xl font-medium hover:from-[#7A9A75] hover:to-[#6B4E3D] transition"
              >
                + 发布新挑战
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-3xl font-bold text-slate-900">{stats.totalChallenges}</p>
            <p className="text-sm text-slate-500 mt-1">总挑战数</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-3xl font-bold text-[#4A6B43]">{stats.openCount}</p>
            <p className="text-sm text-slate-500 mt-1">进行中</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-3xl font-bold text-blue-600">{stats.totalApplicants}</p>
            <p className="text-sm text-slate-500 mt-1">总报名数</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-3xl font-bold text-violet-600">{stats.totalSubmissions}</p>
            <p className="text-sm text-slate-500 mt-1">总提交数</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="搜索挑战标题或描述..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#4A3728] text-white rounded-lg text-sm font-medium hover:bg-[#6B4E3D] transition"
              >
                搜索
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchInput(''); setSearchQuery(''); setPage(1); }}
                  className="px-4 py-2 text-slate-500 hover:text-slate-700 transition"
                >
                  清除
                </button>
              )}
            </form>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 mr-2">状态：</span>
              {[
                { value: 'ALL', label: '全部' },
                { value: 'OPEN', label: '进行中' },
                { value: 'CLOSED', label: '已关闭' },
                { value: 'COMPLETED', label: '已完成' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setStatusFilter(opt.value); setPage(1); }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                    statusFilter === opt.value
                      ? 'bg-[#4A3728] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Challenge List */}
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
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <span className="text-5xl mb-4 block">📋</span>
            {searchQuery ? (
              <>
                <p className="text-slate-600 mb-2 font-medium">未找到匹配的挑战</p>
                <p className="text-slate-400 text-sm mb-6">试试调整搜索关键词</p>
                <button
                  onClick={() => { setSearchInput(''); setSearchQuery(''); setPage(1); }}
                  className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl font-medium hover:bg-slate-200 transition"
                >
                  清除搜索
                </button>
              </>
            ) : (
              <>
                <p className="text-slate-600 mb-2 font-medium">暂无挑战</p>
                <p className="text-slate-400 text-sm mb-6">发布你的第一个挑战吧</p>
                <Link
                  href="/challenges/new"
                  className="inline-flex items-center gap-2 bg-[#4A3728] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#6B4E3D] transition"
                >
                  + 发布挑战
                </Link>
              </>
            )}
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
                      <div className="flex items-center gap-2 mb-2">
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
                      {challenge.spots && (
                        <span>招募 {challenge.spots} 人</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/challenges/${challenge.id}`}
                        className="text-sm text-slate-600 hover:text-slate-900 transition"
                      >
                        查看详情
                      </Link>
                      <Link
                        href={`/enterprise/challenges/${challenge.id}`}
                        className="text-sm text-[#7A9A75] hover:text-[#6B4E3D] font-medium transition"
                      >
                        管理报名
                      </Link>
                      <button
                        onClick={() => openEditModal(challenge)}
                        disabled={processingId === challenge.id}
                        className="text-sm text-slate-600 hover:text-slate-900 transition disabled:opacity-50"
                      >
                        编辑
                      </button>
                      {challenge.status === 'OPEN' && (
                        <>
                          <button
                            onClick={() => handleCloseChallenge(challenge.id)}
                            disabled={processingId === challenge.id}
                            className="text-sm text-orange-600 hover:text-orange-700 transition disabled:opacity-50"
                          >
                            关闭
                          </button>
                          <button
                            onClick={() => handleCompleteChallenge(challenge.id)}
                            disabled={processingId === challenge.id}
                            className="text-sm text-blue-600 hover:text-blue-700 transition disabled:opacity-50"
                          >
                            完成
                          </button>
                        </>
                      )}
                      {challenge.status === 'CLOSED' && (
                        <>
                          <button
                            onClick={() => handleReopenChallenge(challenge.id)}
                            disabled={processingId === challenge.id}
                            className="text-sm text-[#4A6B43] hover:text-[#7A9A75] transition disabled:opacity-50"
                          >
                            重新开放
                          </button>
                          <button
                            onClick={() => handleCompleteChallenge(challenge.id)}
                            disabled={processingId === challenge.id}
                            className="text-sm text-blue-600 hover:text-blue-700 transition disabled:opacity-50"
                          >
                            完成
                          </button>
                        </>
                      )}
                      {challenge.status === 'COMPLETED' && (
                        <button
                          onClick={() => handleReopenChallenge(challenge.id)}
                          disabled={processingId === challenge.id}
                          className="text-sm text-[#4A6B43] hover:text-[#7A9A75] transition disabled:opacity-50"
                        >
                          重新开放
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
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

      {/* Edit Modal */}
      {editingChallenge && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">编辑挑战</h3>
              <button
                onClick={closeEditModal}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                  {editError}
                </div>
              )}
              <div>
                <label className="block text-sm text-slate-500 mb-1">标题 *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
                  required
                  maxLength={200}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-500 mb-1">描述 *</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
                  required
                  minLength={10}
                  maxLength={10000}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-500 mb-1">分类</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
                  >
                    <option value="TECH">技术</option>
                    <option value="PRODUCT">产品</option>
                    <option value="GROWTH">增长</option>
                    <option value="MARKETING">营销</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">截止日期</label>
                  <input
                    type="date"
                    value={editForm.deadline}
                    onChange={(e) => setEditForm((f) => ({ ...f, deadline: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-500 mb-1">招募人数</label>
                  <input
                    type="number"
                    min={1}
                    value={editForm.spots || ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, spots: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">奖金 (分)</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.rewardAmount}
                    onChange={(e) => setEditForm((f) => ({ ...f, rewardAmount: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-500 mb-1">奖励类型</label>
                  <select
                    value={editForm.rewardType}
                    onChange={(e) => setEditForm((f) => ({ ...f, rewardType: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
                  >
                    <option value="CERTIFICATE">证书</option>
                    <option value="CASH">现金</option>
                    <option value="PRIZE">实物奖品</option>
                    <option value="INTERNSHIP">实习机会</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">奖励说明</label>
                  <input
                    type="text"
                    value={editForm.reward}
                    onChange={(e) => setEditForm((f) => ({ ...f, reward: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
                  />
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-2">能力要求（0-100）</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'requiredCraft', label: '工艺' },
                    { key: 'requiredLearn', label: '学习' },
                    { key: 'requiredDrive', label: '驱动力' },
                    { key: 'requiredTeam', label: '协作' },
                    { key: 'requiredGrit', label: '毅力' },
                    { key: 'requiredExpress', label: '表达' },
                  ].map((item) => (
                    <div key={item.key}>
                      <label className="block text-xs text-slate-400 mb-1">{item.label}</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={(editForm as any)[item.key]}
                        onChange={(e) => setEditForm((f) => ({ ...f, [item.key]: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={processingId === editingChallenge.id}
                  className="px-4 py-2 text-sm bg-[#3D5A37] text-white rounded-lg hover:bg-[#6B4E3D] disabled:opacity-50 transition"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
