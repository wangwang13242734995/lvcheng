'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  targetId: string | null;
  targetType: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationResponse {
  notifications: Notification[];
  total: number;
  page: number;
  pageSize: number;
  unreadCount: number;
}

const typeIcons: Record<string, string> = {
  NEW_APPLICATION: '📝',
  NEW_SUBMISSION: '📤',
  CHALLENGE_CLOSED: '🔒',
  SYSTEM: '📢',
};

const typeColors: Record<string, string> = {
  NEW_APPLICATION: 'bg-blue-50 border-blue-200',
  NEW_SUBMISSION: 'bg-violet-50 border-violet-200',
  CHALLENGE_CLOSED: 'bg-gray-50 border-gray-200',
  SYSTEM: 'bg-slate-50 border-slate-200',
};

const filterTabs = [
  { value: '', label: '全部' },
  { value: 'NEW_APPLICATION', label: '新报名' },
  { value: 'NEW_SUBMISSION', label: '新提交' },
  { value: 'SYSTEM', label: '系统' },
];

export default function EnterpriseNotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterType, setFilterType] = useState('');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      if (filterType) params.set('type', filterType);
      const res = await fetch(`/api/user/notifications?${params}`);
      if (!res.ok) throw new Error('获取通知失败');
      const data: NotificationResponse = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setTotal(data.total);
    } catch {
      setError('获取通知失败');
    } finally {
      setLoading(false);
    }
  }, [page, filterType]);

  useEffect(() => {
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role !== 'ENTERPRISE' && role !== 'ADMIN') {
        router.push('/');
        return;
      }
      fetchNotifications();
    }
  }, [status, session, fetchNotifications, router]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      if (!res.ok) throw new Error('标记失败');
      const data = await res.json();
      setUnreadCount(data.unreadCount);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      setError('标记失败');
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      if (!res.ok) throw new Error('标记失败');
      const data = await res.json();
      setUnreadCount(data.unreadCount);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setMessage('全部已标记为已读');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setError('标记失败');
    }
  };

  const deleteAll = async () => {
    if (!confirm('确定删除所有通知？')) return;
    try {
      const res = await fetch('/api/user/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteAll: true }),
      });
      if (!res.ok) throw new Error('删除失败');
      setNotifications([]);
      setTotal(0);
      setUnreadCount(0);
      setMessage('已清空所有通知');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setError('删除失败');
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

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }

  if ((session?.user as any)?.role !== 'ENTERPRISE' && (session?.user as any)?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">企业通知</h1>
              <p className="text-slate-500 text-sm mt-1">
                {unreadCount > 0 ? `你有 ${unreadCount} 条未读通知` : '暂无未读通知'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/enterprise" className="text-sm text-slate-600 hover:text-slate-900 transition">
                ← 返回后台
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-[#F7FAF6] text-[#4A6B43] p-3 rounded-xl mb-4 text-sm">
            {message}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setFilterType(tab.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  filterType === tab.value
                    ? 'bg-[#4A3728] text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              >
                全部已读
              </button>
            )}
            {total > 0 && (
              <button
                onClick={deleteAll}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition"
              >
                清空全部
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
                <div className="h-5 bg-slate-100 rounded w-1/3 mb-2" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 text-center py-16">
            <span className="text-5xl mb-4 block">🔔</span>
            <p className="text-slate-500">暂无通知</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const targetLink = notification.targetType === 'CHALLENGE' && notification.targetId
                ? `/enterprise/challenges/${notification.targetId}`
                : null;
              return (
                <div
                  key={notification.id}
                  className={`flex gap-3 p-4 rounded-xl border transition cursor-pointer ${
                    notification.isRead
                      ? 'bg-white border-slate-100 hover:bg-slate-50'
                      : `${typeColors[notification.type] || 'bg-white border-slate-200'} border-l-4`
                  }`}
                  onClick={() => {
                    if (!notification.isRead) markAsRead(notification.id);
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-sm flex-shrink-0">
                    {typeIcons[notification.type] || '📢'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`font-semibold text-sm ${
                        notification.isRead ? 'text-slate-700' : 'text-slate-900'
                      }`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${
                      notification.isRead ? 'text-slate-500' : 'text-slate-700'
                    }`}>
                      {notification.content}
                    </p>
                    {targetLink && (
                      <Link
                        href={targetLink}
                        className="inline-block mt-2 text-sm text-[#7A9A75] hover:text-[#4A3728] hover:underline"
                      >
                        查看详情 →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {total > 20 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              上一页
            </button>
            <span className="text-sm text-slate-500">
              第 {page} 页 / 共 {Math.ceil(total / 20)} 页
            </span>
            <button
              onClick={() => setPage(Math.min(Math.ceil(total / 20), page + 1))}
              disabled={page >= Math.ceil(total / 20)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
