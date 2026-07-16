import { useState, useEffect, useCallback, useRef } from 'react';

interface UnreadCountResponse {
  unreadCount: number;
  totalCount: number;
}

export function useNotifications(pollingInterval = 30000) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch('/api/user/notifications/unread');
      if (!res.ok) return;
      const data: UnreadCountResponse = await res.json();
      setUnreadCount(data.unreadCount);
      setTotalCount(data.totalCount);
    } catch {
      // 静默失败，不干扰用户
    }
  }, []);

  useEffect(() => {
    fetchUnread();

    intervalRef.current = setInterval(fetchUnread, pollingInterval);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUnread();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchUnread, pollingInterval]);

  return { unreadCount, totalCount, refresh: fetchUnread };
}
