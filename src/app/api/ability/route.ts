import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getLatestAbilityScore, getAbilityHistory } from '@/services/ability-engine';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const searchParams = req.nextUrl.searchParams;
  const targetUserId = searchParams.get('userId') || userId;

  const [latestScore, history, user, projects, growthRecords] = await Promise.all([
    getLatestAbilityScore(targetUserId),
    getAbilityHistory(targetUserId),
    prisma.user.findUnique({ where: { id: targetUserId } }),
    prisma.project.findMany({
      where: { userId: targetUserId, status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    prisma.growthRecord.findMany({
      where: { userId: targetUserId },
      orderBy: { date: 'desc' },
      take: 20,
    }),
  ]);

  return NextResponse.json({
    score: latestScore,
    history,
    user: user ? { ...user, password: undefined } : null,
    projects,
    growthRecords,
  });
}
