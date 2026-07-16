import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const searchParams = req.nextUrl.searchParams;
    const challengeId = searchParams.get('challengeId');

    if (challengeId) {
      const isFavorited = await prisma.challengeFavorite.count({
        where: { userId, challengeId },
      }) > 0;
      return NextResponse.json({ isFavorited });
    }

    const favorites = await prisma.challengeFavorite.findMany({
      where: { userId },
      include: {
        challenge: {
          select: {
            id: true,
            title: true,
            company: true,
            category: true,
            rewardAmount: true,
            rewardType: true,
            deadline: true,
            spots: true,
            status: true,
            createdAt: true,
            _count: { select: { applications: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      favorites: favorites.map((f) => ({
        ...f.challenge,
        applicantCount: f.challenge._count.applications,
      })),
      total: favorites.length,
    });
  } catch (error) {
    logger.error('Failed to fetch favorites', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '获取收藏失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { challengeId } = await req.json();

    if (!challengeId) {
      return NextResponse.json({ error: '缺少挑战ID' }, { status: 400 });
    }

    const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) {
      return NextResponse.json({ error: '挑战不存在' }, { status: 404 });
    }

    const existing = await prisma.challengeFavorite.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    });

    if (existing) {
      return NextResponse.json({ error: '已收藏' }, { status: 409 });
    }

    await prisma.challengeFavorite.create({
      data: { userId, challengeId },
    });

    return NextResponse.json({ success: true, isFavorited: true });
  } catch (error) {
    logger.error('Failed to add favorite', {
      error: error instanceof Error ? error.message : String(error),
    });
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ error: '已收藏' }, { status: 409 });
    }
    return NextResponse.json({ error: '收藏失败' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { challengeId } = await req.json();

    if (!challengeId) {
      return NextResponse.json({ error: '缺少挑战ID' }, { status: 400 });
    }

    const deleted = await prisma.challengeFavorite.deleteMany({
      where: { userId, challengeId },
    });

    return NextResponse.json({ success: true, isFavorited: false, deletedCount: deleted.count });
  } catch (error) {
    logger.error('Failed to remove favorite', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '取消收藏失败' }, { status: 500 });
  }
}
