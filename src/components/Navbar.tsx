'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!session?.user) return;

    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/notifications?unreadOnly=true&limit=1');
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        console.error('Fetch unread count error:', err);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [session]);

  const handleSignOut = () => {
    signOut();
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { href: '/talents', label: '发现' },
    { href: '/dashboard', label: '仪表盘' },
    { href: '/projects', label: '项目' },
    { href: '/weekly-review', label: '周复盘' },
    { href: '/challenges', label: '挑战' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-[#4A3728] tracking-wide">
          履程
        </Link>

        <div className="hidden md:flex items-center gap-4">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-slate-600 hover:text-slate-900 transition">
              {link.label}
            </Link>
          ))}
          {session && (
            <>
              {((session.user as any)?.role === 'ENTERPRISE' || (session.user as any)?.role === 'ADMIN') && (
                <Link href="/enterprise" className="text-slate-600 hover:text-slate-900 transition">
                  企业后台
                </Link>
              )}
              <Link href="/notifications" className="relative text-slate-600 hover:text-slate-900 transition">
                <span className="text-lg">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link href="/profile" className="text-slate-600 hover:text-slate-900 transition">
                个人资料
              </Link>
              <Link
                href={`/profile/${(session.user as any)?.id}`}
                className="text-slate-600 hover:text-slate-900 transition"
              >
                名片
              </Link>
              <span className="text-gray-500 text-sm">{session.user?.name}</span>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-red-500"
              >
                退出
              </button>
            </>
          )}
          {!session && (
            <>
              <Link href="/auth/login" className="text-slate-600 hover:text-slate-900 transition">
                登录
              </Link>
              <Link
                href="/auth/register"
                className="bg-[#4A3728] text-white px-5 py-2 rounded-lg hover:bg-[#6B4E3D] transition text-sm font-medium"
              >
                注册
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 text-slate-600 hover:text-slate-900"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="菜单"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-2 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {session && (
              <>
                {((session.user as any)?.role === 'ENTERPRISE' || (session.user as any)?.role === 'ADMIN') && (
                  <Link
                    href="/enterprise"
                    className="block px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    企业后台
                  </Link>
                )}
                <Link
                  href="/notifications"
                  className="block px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition relative"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  通知
                  {unreadCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/profile"
                  className="block px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  个人资料
                </Link>
                <Link
                  href={`/profile/${(session.user as any)?.id}`}
                  className="block px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  名片
                </Link>
                <div className="px-4 py-2 text-sm text-gray-500 border-t border-gray-100 mt-2">
                  {session.user?.name}
                </div>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  退出登录
                </button>
              </>
            )}
            {!session && (
              <>
                <Link
                  href="/auth/login"
                  className="block px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  登录
                </Link>
                <Link
                  href="/auth/register"
                  className="block px-4 py-3 bg-[#4A3728] text-white text-center rounded-lg hover:bg-[#6B4E3D] transition font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
