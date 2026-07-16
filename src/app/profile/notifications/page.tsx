'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

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
  APPLICATION_APPROVED: '✅',
  APPLICATION_REJECTED: '❌',
  SUBMISSION_REVIEWED: '🔍',
  CHALLENGE_CLOSED: '🔒',
  BADGE_EARNED: '🏅',
  CERTIFICATE_ISSUED: '📜',
  SYSTEM: '📢',
};

const typeColors: Record<string, string> = {
  APPLICATION_APPROVED: 'bg-[#F7FAF6] border-[#D6E4D2]',
  APPLICATION_REJECTED: 'bg-red-50 border-red-200',
  SUBMISSION_REVIEWED: 'bg-blue-50 border-blue-200',
  CHALLENGE_CLOSED: 'bg-gray-50 border-gray-200',
  BADGE_EARNED: 'bg-amber-50 border-amber-200',
  CERTIFICATE_ISSUED: 'bg-purple-50 border-purple-200',
  SYSTEM: 'bg-slate-50 border-slate-200',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string>('');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      if (filterType) {
        params.set('type', filterType);
      }
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
    fetchNotifications();

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
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      setMessage('全部已标记为已读');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setError('标记失败');
    }
  };

  const deleteNotifications = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch('/api/user/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!res.ok) throw new Error('删除失败');
      setNotifications((prev) =>
        prev.filter((n) => !selectedIds.includes(n.id))
      );
      setSelectedIds([]);
      setMessage('已删除选中通知');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setError('删除失败');
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
      setSelectedIds([]);
      setMessage('已清空所有通知');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setError('删除失败');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map((n) => n.id));
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

  const getTargetLink = (targetType: string | null, targetId: string | null) => {
    if (!targetType || !targetId) return null;
    switch (targetType) {
      case 'CHALLENGE':
        return `/challenges/${targetId}`;
      case 'SUBMISSION':
        return `/challenges/${targetId}`;
      case 'BADGE':
        return '/profile/achievements';
      case 'CERTIFICATE':
        return '/profile/achievements';
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-60px)] flex items-center justify-center">
        <div className="text-[#4A3728]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-60px)] bg-gradient-to-br from-[#4A3728] via-[#2C1F14] to-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#4A3728] to-[#2C1F14] p-6">
            <h1 className="text-2xl font-bold text-white">通知中心</h1>
            <p className="text-[#D6E4D2] text-sm mt-1">
              {unreadCount > 0 ? `你有 ${unreadCount} 条未读通知` : '暂无未读通知'}
            </p>
          </div>

          <div className="p-6">
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
                <button
                  onClick={() => setFilterType('')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    filterType === ''
                      ? 'bg-[#4A3728] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => setFilterType('APPLICATION_APPROVED')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    filterType === 'APPLICATION_APPROVED'
                      ? 'bg-[#4A3728] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  报名审核
                </button>
                <button
                  onClick={() => setFilterType('SUBMISSION_REVIEWED')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    filterType === 'SUBMISSION_REVIEWED'
                      ? 'bg-[#4A3728] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  提交评审
                </button>
                <button
                  onClick={() => setFilterType('BADGE_EARNED')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    filterType === 'BADGE_EARNED'
                      ? 'bg-[#4A3728] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  成就奖励
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={markAllAsRead}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                >
                  全部已读
                </button>
                {selectedIds.length > 0 && (
                  <button
                    onClick={deleteNotifications}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition"
                  >
                    删除选中
                  </button>
                )}
                <button
                  onClick={deleteAll}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition"
                >
                  清空全部
                </button>
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🔔</div>
                <p className="text-slate-500">暂无通知</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === notifications.length && notifications.length > 0}
                    onChange={selectAll}
                    className="w-5 h-5 rounded border-slate-300 text-[#4A3728] focus:ring-[#5D7A57]"
                  />
                  <span className="text-sm text-slate-500">全选</span>
                  {selectedIds.length > 0 && (
                    <span className="text-sm text-[#4A3728]">
                      已选择 {selectedIds.length} 条
                    </span>
                  )}
                </div>

                {notifications.map((notification) => {
                  const targetLink = getTargetLink(
                    notification.targetType,
                    notification.targetId
                  );
                  return (
                    <div
                      key={notification.id}
                      className={`flex gap-3 p-4 rounded-xl border transition cursor-pointer ${
                        notification.isRead
                          ? 'bg-white border-slate-100 hover:bg-slate-50'
                          : `${typeColors[notification.type]} border-l-4`
                      }`}
                      onClick={() => {
                        if (!notification.isRead) {
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(notification.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelect(notification.id);
                        }}
                        className="w-5 h-5 rounded border-slate-300 text-[#4A3728] focus:ring-[#5D7A57] mt-1"
                      />

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
      </div>
    </div>
  );
}
