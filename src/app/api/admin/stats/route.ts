import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalUsers,
      totalChallenges,
      totalProjects,
      totalBadges,
      totalCertificates,
      totalSubmissions,
      totalApplications,
      newUsersToday,
      activeChallenges,
      roleStats,
      challengeStats,
      categoryStats,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.challenge.count(),
      prisma.project.count(),
      prisma.badge.count(),
      prisma.certificate.count(),
      prisma.challengeSubmission.count(),
      prisma.challengeApplication.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      prisma.challenge.count({
        where: { status: 'OPEN' },
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
        orderBy: { _count: { role: 'desc' } },
      }),
      prisma.challenge.groupBy({
        by: ['status'],
        _count: { status: true },
        orderBy: { _count: { status: 'desc' } },
      }),
      prisma.challenge.groupBy({
        by: ['category'],
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
      }),
    ]);

    const conversionFunnel = {
      applications: totalApplications,
      submissions: totalSubmissions,
      accepted: await prisma.challengeSubmission.count({
        where: { status: 'ACCEPTED' },
      }),
    };

    const getTrendData = async (model: 'user' | 'challenge', days: number) => {
      const results: { date: string; count: number }[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        let count = 0;
        if (model === 'user') {
          count = await prisma.user.count({
            where: { createdAt: { gte: date, lt: nextDate } },
          });
        } else {
          count = await prisma.challenge.count({
            where: { createdAt: { gte: date, lt: nextDate } },
          });
        }

        results.push({
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          count,
        });
      }
      return results;
    };

    const [userTrend, challengeTrend] = await Promise.all([
      getTrendData('user', 14),
      getTrendData('challenge', 14),
    ]);

    logger.info('Admin stats fetched', { totalUsers, totalChallenges, totalProjects });

    return NextResponse.json({
      totalUsers,
      totalChallenges,
      totalProjects,
      totalBadges,
      totalCertificates,
      totalSubmissions,
      totalApplications,
      newUsersToday,
      activeChallenges,
      roleStats,
      challengeStats,
      categoryStats,
      conversionFunnel,
      userTrend,
      challengeTrend,
    });
  } catch (error) {
    logger.error('Failed to fetch admin stats', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '获取统计数据失败' }, { status: 500 });
  }
}