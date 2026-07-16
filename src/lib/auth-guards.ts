import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function requireAdmin(req?: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { isAdmin: false, response: NextResponse.json({ error: '请先登录' }, { status: 401 }) };
  }

  const role = (session.user as any).role;
  if (role !== 'ADMIN') {
    logger.warn('Non-admin user attempted admin access', {
      userId: (session.user as any).id,
      role,
      path: req?.url,
    });
    return { isAdmin: false, response: NextResponse.json({ error: '无权限访问' }, { status: 403 }) };
  }

  return { isAdmin: true, session, userId: (session.user as any).id };
}

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { isAuthenticated: false, response: NextResponse.json({ error: '请先登录' }, { status: 401 }) };
  }
  return { isAuthenticated: true, session, userId: (session.user as any).id, role: (session.user as any).role };
}
