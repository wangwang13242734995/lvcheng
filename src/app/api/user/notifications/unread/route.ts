import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const [unreadCount, totalCount] = await Promise.all([
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
      prisma.notification.count({
        where: { userId },
      }),
    ]);

    return NextResponse.json({ unreadCount, totalCount });
  } catch (error) {
    logger.error('Failed to fetch unread notification count', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '获取未读通知数失败' }, { status: 500 });
  }
}
