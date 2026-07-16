import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: '无权限操作' }, { status: 403 });
    }

    const body = await req.json();
    const { challengeIds, action } = body;

    if (!challengeIds || !Array.isArray(challengeIds) || challengeIds.length === 0) {
      return NextResponse.json({ error: '请选择挑战' }, { status: 400 });
    }

    let result;
    switch (action) {
      case 'APPROVE':
        result = await prisma.challenge.updateMany({
          where: { id: { in: challengeIds }, status: 'PENDING' },
          data: { status: 'OPEN' },
        });
        logger.info('批量审核通过挑战', { count: result.count, challengeIds });
        break;
      case 'REJECT':
        result = await prisma.challenge.updateMany({
          where: { id: { in: challengeIds }, status: 'PENDING' },
          data: { status: 'REJECTED' },
        });
        logger.info('批量拒绝挑战', { count: result.count, challengeIds });
        break;
      case 'CLOSE':
        result = await prisma.challenge.updateMany({
          where: { id: { in: challengeIds }, status: 'OPEN' },
          data: { status: 'CLOSED' },
        });
        logger.info('批量关闭挑战', { count: result.count, challengeIds });
        break;
      case 'DELETE':
        result = await prisma.challenge.deleteMany({
          where: { id: { in: challengeIds } },
        });
        logger.info('批量删除挑战', { count: result.count, challengeIds });
        break;
      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `${result.count} 条记录已更新`,
      updatedCount: result.count,
    });
  } catch (error) {
    logger.error('批量操作挑战失败', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}