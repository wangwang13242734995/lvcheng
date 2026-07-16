'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  targetId: string | null;
  targetType: string | null;
  createdAt: string;
}

const typeConfig: Record<string, { icon: string; color: string; bgColor: string }> = {
  APPLICATION_APPROVED: { icon: '✅', color: 'text-[#4A6B43]', bgColor: 'bg-[#F7FAF6]' },
  APPLICATION_REJECTED: { icon: '❌', color: 'text-red-600', bgColor: 'bg-red-50' },
  SUBMISSION_REVIEWED: { icon: '📝', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  CHALLENGE_CLOSED: { icon: '🏁', color: 'text-slate-600', bgColor: 'bg-slate-50' },
  BADGE_EARNED: { icon: '🏅', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  CERTIFICATE_ISSUED: { icon: '📜', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  NEW_APPLICATION: { icon: '👤', color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  NEW_SUBMISSION: { icon: '📤', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  SYSTEM: { icon: '🔔', color: 'text-slate-600', bgColor: 'bg-slate-100' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filter === 'unread' ? { unreadOnly: 'true' } : {}),
      });
      const res = await fetch(`/api/notifications?${params}`);
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Load notifications error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (!res.ok) throw new Error('操作失败');
      loadNotifications();
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const getTargetLink = (n: Notification) => {
    if (!n.targetId) return null;
    switch (n.targetType) {
      case 'CHALLENGE':
        return `/challenges/${n.targetId}`;
      case 'BADGE':
        return `/dashboard#badges`;
      case 'CERTIFICATE':
        return `/dashboard#certificates`;
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">通知中心</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {unreadCount > 0 ? `${unreadCount} 条未读` : '暂无新通知'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => { setFilter('all'); setPage(1); }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                    filter === 'all'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => { setFilter('unread'); setPage(1); }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                    filter === 'unread'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  未读 {unreadCount > 0 && <span className="text-orange-600">({unreadCount})</span>}
                </button>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-sm text-[#7A9A75] hover:text-[#6B4E3D] font-medium"
                >
                  全部标记已读
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="px-6 py-12 text-center text-slate-400">
                加载中...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📭</span>
                </div>
                <p className="text-slate-500">暂无通知</p>
              </div>
            ) : (
              notifications.map((n) => {
                const config = typeConfig[n.type] || typeConfig.SYSTEM;
                const targetLink = getTargetLink(n);
                const rowClass = `flex gap-4 px-6 py-4 transition ${
                  targetLink ? 'hover:bg-slate-50 cursor-pointer' : ''
                } ${!n.isRead ? 'bg-[#F7FAF6]/30' : ''}`;

                const content = (
                  <>
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bgColor}`}
                    >
                      <span className="text-lg">{config.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`font-medium ${n.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                          {n.title}
                        </h3>
                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {formatDate(n.createdAt)}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${n.isRead ? 'text-slate-400' : 'text-slate-600'}`}>
                        {n.content}
                      </p>
                    </div>
                    {!n.isRead && (
                      <div className="w-2 h-2 bg-[#5D7A57] rounded-full flex-shrink-0 mt-2" />
                    )}
                  </>
                );

                return targetLink ? (
                  <Link key={n.id} href={targetLink} className={rowClass}>
                    {content}
                  </Link>
                ) : (
                  <div key={n.id} className={rowClass}>
                    {content}
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <span className="text-sm text-slate-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          <Link href="/dashboard" className="text-[#7A9A75] hover:underline">
            ← 返回仪表盘
          </Link>
        </p>
      </div>
    </div>
  );
}