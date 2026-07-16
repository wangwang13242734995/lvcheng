'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const categoryLabels: Record<string, string> = {
  TECH: '技术',
  PRODUCT: '产品',
  GROWTH: '增长',
  MARKETING: '营销',
};

const rewardLabels: Record<string, string> = {
  CASH: '现金',
  CERTIFICATE: '证书',
  BADGE: '徽章',
  INTERNSHIP: '实习机会',
};

const statusLabels: Record<string, string> = {
  OPEN: '进行中',
  CLOSED: '已关闭',
  COMPLETED: '已完成',
  PENDING: '待审核',
};

const statusColors: Record<string, string> = {
  OPEN: 'bg-[#EDF3EB] text-[#7A9A75]',
  CLOSED: 'bg-slate-100 text-slate-600',
  COMPLETED: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-amber-100 text-amber-700',
};

interface Challenge {
  id: string;
  title: string;
  company: string;
  category: string;
  rewardAmount: number;
  rewardType: string;
  deadline: string | null;
  spots: number | null;
  status: string;
  applicantCount: number;
  createdAt: string;
}

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/favorites');
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/login');
          return;
        }
        throw new Error('获取收藏失败');
      }
      const data = await res.json();
      setFavorites(data.favorites || []);
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchFavorites();
    }
  }, [status, fetchFavorites]);

  const handleRemove = async (challengeId: string) => {
    setDeletingId(challengeId);
    try {
      const res = await fetch('/api/user/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId }),
      });
      if (res.ok) {
        await fetchFavorites();
      }
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    } finally {
      setDeletingId(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }

  if (!session) {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">我的收藏</h1>
              <p className="text-slate-500 text-sm mt-1">收藏你感兴趣的挑战，方便后续查看</p>
            </div>
            <Link href="/challenges" className="text-sm text-[#4A6B43] hover:text-[#7A9A75] transition">
              浏览挑战 →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {favorites.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <span className="text-5xl mb-4 block">⭐</span>
            <p className="text-slate-600 mb-2 font-medium">暂无收藏</p>
            <p className="text-slate-400 text-sm mb-6">浏览挑战并点击收藏按钮添加</p>
            <Link
              href="/challenges"
              className="inline-flex items-center gap-2 bg-[#4A3728] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#6B4E3D] transition"
            >
              探索挑战
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((challenge) => (
              <div
                key={challenge.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-[#D6E4D2] hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[#EDF3EB] text-[#7A9A75]">
                        {categoryLabels[challenge.category] || challenge.category}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[challenge.status] || 'bg-slate-100 text-slate-600'}`}>
                        {statusLabels[challenge.status] || challenge.status}
                      </span>
                      {challenge.rewardAmount > 0 && (
                        <span className="text-xs text-amber-600 font-medium">
                          ¥{(challenge.rewardAmount / 100).toFixed(0)}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/challenges/${challenge.id}`}
                      className="font-semibold text-slate-900 hover:text-[#7A9A75] transition text-lg"
                    >
                      {challenge.title}
                    </Link>
                    <p className="text-sm text-slate-500 mt-1">{challenge.company}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                      <span>👥 {challenge.applicantCount || 0}/{challenge.spots || '∞'} 人报名</span>
                      {challenge.deadline && (
                        <span>⏰ 截止 {new Date(challenge.deadline).toLocaleDateString('zh-CN')}</span>
                      )}
                      {challenge.rewardType && (
                        <span>🎁 {rewardLabels[challenge.rewardType] || challenge.rewardType}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(challenge.id)}
                    disabled={deletingId === challenge.id}
                    className="shrink-0 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="取消收藏"
                  >
                    <span className="text-xl">🗑</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
