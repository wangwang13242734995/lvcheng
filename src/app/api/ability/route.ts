import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getLatestAbilityScore, getAbilityHistory } from '@/services/ability-engine';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user ? (session.user as any).id : null;

  const searchParams = req.nextUrl.searchParams;
  const targetUserId = searchParams.get('userId');

  if (!targetUserId && !currentUserId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const userId = targetUserId || currentUserId;
  const isOwnProfile = currentUserId === userId;

  const [latestScore, history, user, projects, growthRecords] = await Promise.all([
    getLatestAbilityScore(userId),
    getAbilityHistory(userId),
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.project.findMany({
      where: { userId, status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    prisma.growthRecord.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: isOwnProfile ? 20 : 5,
    }),
  ]);

  if (!user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  const safeUser = {
    id: user.id,
    name: user.name,
    email: isOwnProfile ? user.email : undefined,
    avatar: user.avatar,
    major: user.major,
    graduationYear: user.graduationYear,
    bio: user.bio,
    skills: user.skills,
    role: user.role,
    createdAt: user.createdAt,
  };

  return NextResponse.json({
    score: latestScore,
    history,
    user: safeUser,
    projects,
    growthRecords,
    isOwnProfile,
  });
}
