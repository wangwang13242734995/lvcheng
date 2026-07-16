'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Challenge {
  applicationId: string;
  applicationStatus: string;
  appliedAt: string;
  challenge: {
    id: string;
    title: string;
    company: string;
    category: string;
    status: string;
    rewardAmount: number;
    rewardType: string;
    deadline: string | null;
    createdAt: string;
  };
  submission: {
    id: string;
    status: string;
    title: string;
    reviewComment: string | null;
    reviewedAt: string | null;
    createdAt: string;
  } | null;
}

interface Stats {
  total: number;
  inProgress: number;
  submitted: number;
  approved: number;
  rejected: number;
}

type StatusFilter = 'all' | 'in_progress' | 'submitted' | 'approved' | 'rejected';

const categoryLabels: Record<string, string> = {
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

const statusLabels: Record<string, string> = {
  OPEN: '进行中',
  CLOSED: '已关闭',
  COMPLETED: '已完成',
};

const submissionStatusLabels: Record<string, string> = {
  PENDING: '待评审',
  ACCEPTED: '已通过',
  REJECTED: '未通过',
};

const submissionStatusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  ACCEPTED: 'bg-[#EDF3EB] text-[#7A9A75]',
  REJECTED: 'bg-red-100 text-red-700',
};

export default function MyChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (filter: StatusFilter) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/user/my-challenges?status=${filter}`);
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      setChallenges(data.challenges);
      setStats(data.stats);
    } catch (err) {
      setError('加载我的挑战失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeFilter);
  }, [activeFilter, fetchData]);

  const tabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: '全部', count: stats?.total || 0 },
    { key: 'in_progress', label: '进行中', count: stats?.inProgress || 0 },
    { key: 'submitted', label: '待评审', count: stats?.submitted || 0 },
    { key: 'approved', label: '已通过', count: stats?.approved || 0 },
    { key: 'rejected', label: '未通过', count: stats?.rejected || 0 },
  ];

  const getStateBadge = (challenge: Challenge) => {
    if (!challenge.submission) {
      return (
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
          📝 待提交
        </span>
      );
    }
    const s = challenge.submission.status;
    return (
      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${submissionStatusColors[s] || 'bg-slate-100 text-slate-600'}`}>
        {submissionStatusLabels[s] || s}
      </span>
    );
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">我的挑战</h1>
            <p className="text-slate-500 mt-1">追踪你报名的所有挑战</p>
          </div>
          <Link
            href="/profile"
            className="text-sm text-slate-500 hover:text-slate-700 transition"
          >
            ← 返回个人资料
          </Link>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-xs text-slate-500 mt-1">总报名</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              <p className="text-xs text-slate-500 mt-1">进行中</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <p className="text-2xl font-bold text-amber-600">{stats.submitted}</p>
              <p className="text-xs text-slate-500 mt-1">待评审</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <p className="text-2xl font-bold text-[#4A6B43]">{stats.approved}</p>
              <p className="text-xs text-slate-500 mt-1">已通过</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              <p className="text-xs text-slate-500 mt-1">未通过</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-200 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition ${
                  activeFilter === tab.key
                    ? 'text-[#6B4E3D] border-b-2 border-[#6B4E3D] bg-[#F7FAF6]/30'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
                <span className="ml-1.5 text-xs text-slate-400">({tab.count})</span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12 text-slate-400">加载中...</div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500 mb-3">{error}</p>
                <button
                  onClick={() => fetchData(activeFilter)}
                  className="text-sm text-[#7A9A75] hover:text-[#6B4E3D]"
                >
                  重试
                </button>
              </div>
            ) : challenges.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-6xl mb-3">🎯</p>
                <p className="text-slate-500 mb-4">
                  {activeFilter === 'all' ? '你还没有报名任何挑战' : '此分类下暂无挑战'}
                </p>
                <Link
                  href="/challenges"
                  className="inline-block px-4 py-2 bg-[#6B4E3D] text-white rounded-lg hover:bg-[#4A3728] transition text-sm"
                >
                  去挑战广场看看 →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {challenges.map((item) => (
                  <div
                    key={item.applicationId}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-5 hover:bg-slate-100 transition"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-base">{categoryIcons[item.challenge.category]}</span>
                          <span className="text-xs text-slate-500">{categoryLabels[item.challenge.category]}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs text-slate-500">{item.challenge.company}</span>
                          {getStateBadge(item)}
                        </div>
                        <Link
                          href={`/challenges/${item.challenge.id}`}
                          className="font-semibold text-slate-900 hover:text-[#6B4E3D] transition line-clamp-1"
                        >
                          {item.challenge.title}
                        </Link>
                      </div>
                      {item.challenge.rewardAmount > 0 && (
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold text-amber-600">
                            ¥{item.challenge.rewardAmount.toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-400">奖金</p>
                        </div>
                      )}
                    </div>

                    {item.submission && (
                      <div className="bg-white rounded-lg p-3 mb-3 border border-slate-200">
                        <p className="text-xs text-slate-500 mb-1">提交作品</p>
                        <p className="font-medium text-slate-900 text-sm">{item.submission.title}</p>
                        {item.submission.reviewComment && (
                          <div className="mt-2 p-2 bg-[#F7FAF6] rounded text-xs text-[#7A9A75]">
                            💬 {item.submission.reviewComment}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                        <span>报名于 {new Date(item.appliedAt).toLocaleDateString('zh-CN')}</span>
                        {item.challenge.deadline && (
                          <span>截止 {new Date(item.challenge.deadline).toLocaleDateString('zh-CN')}</span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded ${
                          item.challenge.status === 'OPEN' ? 'bg-[#EDF3EB] text-[#7A9A75]' :
                          item.challenge.status === 'CLOSED' ? 'bg-slate-100 text-slate-600' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {statusLabels[item.challenge.status] || item.challenge.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/challenges/${item.challenge.id}`}
                          className="text-xs text-slate-600 hover:text-slate-900 transition"
                        >
                          查看挑战
                        </Link>
                        {item.submission?.status === 'ACCEPTED' && (
                          <Link
                            href="/profile/achievements"
                            className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                          >
                            🏅 查看奖励
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
