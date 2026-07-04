'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-slate-800 tracking-wide">
          履程
        </Link>
        <div className="flex items-center gap-4">
          {session ? (
            <>
              <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 transition">
                仪表盘
              </Link>
              <Link href="/projects" className="text-slate-600 hover:text-slate-900 transition">
                项目
              </Link>
              <Link
                href={`/profile/${(session.user as any)?.id}`}
                className="text-slate-600 hover:text-slate-900 transition"
              >
                名片
              </Link>
              <span className="text-gray-500 text-sm">{session.user?.name}</span>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-500 hover:text-red-500"
              >
                退出
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-slate-600 hover:text-slate-900 transition">
                登录
              </Link>
              <Link
                href="/auth/register"
                className="bg-slate-800 text-white px-5 py-2 rounded-lg hover:bg-slate-700 transition text-sm font-medium"
              >
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
