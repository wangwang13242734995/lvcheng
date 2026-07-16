import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

// GET /api/challenges/[id] - 获取挑战详情
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id: params.id },
      include: {
        applications: {
          select: { id: true, userId: true, status: true },
        },
      },
    });

    if (!challenge) {
      return NextResponse.json({ error: '挑战不存在' }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    return NextResponse.json({
      ...challenge,
      applicantCount: challenge.applications.length,
      hasApplied: userId ? challenge.applications.some((a) => a.userId === userId) : false,
    });
  } catch (error) {
    logger.error('Failed to fetch challenge', { id: params.id, error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: '获取挑战详情失败' }, { status: 500 });
  }
}
