import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { sanitizeInput } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rateLimitResult = checkRateLimit(req, 'user-notifications', {
    windowMs: 60 * 1000,
    maxRequests: 60,
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: '请求过于频繁' }, { status: 429 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const type = searchParams.get('type');
    const onlyUnread = searchParams.get('onlyUnread') === 'true';

    const where: any = {
      userId: (session.user as any).id,
    };

    if (type) {
      where.type = type;
    }

    if (onlyUnread) {
      where.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notification.count({ where }),
    ]);

    const unreadCount = await prisma.notification.count({
      where: { userId: (session.user as any).id, isRead: false },
    });

    const sanitizedNotifications = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: sanitizeInput(n.title),
      content: sanitizeInput(n.content),
      targetId: n.targetId,
      targetType: n.targetType,
      isRead: n.isRead,
      createdAt: n.createdAt,
    }));

    return NextResponse.json({
      notifications: sanitizedNotifications,
      total,
      page,
      pageSize,
      unreadCount,
    });
  } catch (error) {
    logger.error('Failed to fetch user notifications', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '获取通知数据失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const rateLimitResult = checkRateLimit(req, 'user-notifications-update', {
    windowMs: 60 * 1000,
    maxRequests: 30,
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: '请求过于频繁' }, { status: 429 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const body = await req.json();
    const { ids, markAll } = body;

    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId: (session.user as any).id, isRead: false },
        data: { isRead: true },
      });
    } else if (ids && Array.isArray(ids)) {
      await prisma.notification.updateMany({
        where: {
          userId: (session.user as any).id,
          id: { in: ids },
        },
        data: { isRead: true },
      });
    }

    const unreadCount = await prisma.notification.count({
      where: { userId: (session.user as any).id, isRead: false },
    });

    return NextResponse.json({ success: true, unreadCount });
  } catch (error) {
    logger.error('Failed to update notification read status', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '更新通知状态失败' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const rateLimitResult = checkRateLimit(req, 'user-notifications-delete', {
    windowMs: 60 * 1000,
    maxRequests: 20,
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: '请求过于频繁' }, { status: 429 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const body = await req.json();
    const { ids, deleteAll } = body;

    if (deleteAll) {
      await prisma.notification.deleteMany({
        where: { userId: (session.user as any).id },
      });
    } else if (ids && Array.isArray(ids)) {
      await prisma.notification.deleteMany({
        where: {
          userId: (session.user as any).id,
          id: { in: ids },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete notifications', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '删除通知失败' }, { status: 500 });
  }
}
