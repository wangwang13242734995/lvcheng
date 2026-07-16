import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

function startOfDay(daysAgo: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const role = (session.user as any).role;
    const userName = (session.user as any).name;
    if (role !== 'ENTERPRISE' && role !== 'ADMIN') {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 });
    }

    // 企业用户按公司名筛选；管理员无 company 范围，返回全平台数据
    const companyFilter = role === 'ENTERPRISE' ? userName : undefined;
    if (role === 'ENTERPRISE' && !companyFilter) {
      return NextResponse.json({ error: '请先完善企业信息' }, { status: 400 });
    }

    // 1. 旗下挑战 ID 列表
    const challengeWhere: any = companyFilter ? { company: companyFilter } : {};
    const myChallenges = await prisma.challenge.findMany({
      where: challengeWhere,
      select: { id: true, status: true, category: true, createdAt: true },
    });
    const challengeIds = myChallenges.map((c) => c.id);

    if (challengeIds.length === 0) {
      return NextResponse.json({
        totalChallenges: 0,
        openCount: 0,
        closedCount: 0,
        completedCount: 0,
        totalApplicants: 0,
        totalSubmissions: 0,
        acceptedSubmissions: 0,
        pendingReview: 0,
        abilityAverages: { craft: 0, learn: 0, drive: 0, team: 0, grit: 0, express: 0 },
        challengePerformance: [],
        applicationTrend: [],
        submissionTrend: [],
        reviewPendingTrend: [],
        statusDistribution: [],
        categoryDistribution: [],
      });
    }

    const applicationWhere = { challengeId: { in: challengeIds } };
    const submissionWhere = { challengeId: { in: challengeIds } };

    // 2. 基础统计
    const [
      openCount,
      closedCount,
      completedCount,
      totalApplicants,
      totalSubmissions,
      acceptedSubmissions,
      pendingReview,
      abilityAgg,
    ] = await Promise.all([
      prisma.challenge.count({ where: { ...challengeWhere, status: 'OPEN' } }),
      prisma.challenge.count({ where: { ...challengeWhere, status: 'CLOSED' } }),
      prisma.challenge.count({ where: { ...challengeWhere, status: 'COMPLETED' } }),
      prisma.challengeApplication.count({ where: applicationWhere }),
      prisma.challengeSubmission.count({ where: submissionWhere }),
      prisma.challengeSubmission.count({ where: { ...submissionWhere, status: 'APPROVED' } }),
      prisma.challengeSubmission.count({ where: { ...submissionWhere, status: 'PENDING' } }),
      prisma.abilityScore.aggregate({
        where: { user: { challengeApplications: { some: { challengeId: { in: challengeIds } } } } },
        _avg: {
          craft: true,
          learn: true,
          drive: true,
          team: true,
          grit: true,
          express: true,
        },
      }),
    ]);

    // 3. 旗下各挑战的报名/提交/通过表现
    const challengesWithCounts = await prisma.challenge.findMany({
      where: challengeWhere,
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        _count: {
          select: {
            applications: true,
            submissions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const submissionStatusByChallenge = await prisma.challengeSubmission.groupBy({
      by: ['challengeId', 'status'],
      where: submissionWhere,
      _count: { status: true },
    });

    const submissionMap = new Map<string, { approved: number; pending: number; rejected: number }>();
    submissionStatusByChallenge.forEach((s) => {
      const cur = submissionMap.get(s.challengeId) || { approved: 0, pending: 0, rejected: 0 };
      if (s.status === 'APPROVED') cur.approved = s._count.status;
      else if (s.status === 'PENDING') cur.pending = s._count.status;
      else if (s.status === 'REJECTED') cur.rejected = s._count.status;
      submissionMap.set(s.challengeId, cur);
    });

    const challengePerformance = challengesWithCounts.map((c) => {
      const subs = submissionMap.get(c.id) || { approved: 0, pending: 0, rejected: 0 };
      return {
        id: c.id,
        title: c.title,
        category: c.category,
        status: c.status,
        applicants: c._count.applications,
        submissions: c._count.submissions,
        approved: subs.approved,
        pending: subs.pending,
        conversionRate: c._count.applications > 0
          ? Math.round((c._count.submissions / c._count.applications) * 100)
          : 0,
      };
    });

    // 4. 最近 14 天趋势
    const days = 14;
    const applicationTrend: { date: string; count: number }[] = [];
    const submissionTrend: { date: string; count: number }[] = [];
    const reviewPendingTrend: { date: string; count: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = startOfDay(i);
      const dayEnd = startOfDay(i - 1);
      const dateStr = dayStart.toISOString().slice(5, 10);
      const [appCount, subCount, pendCount] = await Promise.all([
        prisma.challengeApplication.count({
          where: { ...applicationWhere, appliedAt: { gte: dayStart, lt: dayEnd } },
        }),
        prisma.challengeSubmission.count({
          where: { ...submissionWhere, createdAt: { gte: dayStart, lt: dayEnd } },
        }),
        prisma.challengeSubmission.count({
          where: {
            ...submissionWhere,
            status: 'PENDING',
            createdAt: { gte: dayStart, lt: dayEnd },
          },
        }),
      ]);
      applicationTrend.push({ date: dateStr, count: appCount });
      submissionTrend.push({ date: dateStr, count: subCount });
      reviewPendingTrend.push({ date: dateStr, count: pendCount });
    }

    // 5. 状态/分类分布
    const statusDistribution = [
      { name: '进行中', value: openCount, fill: '#10b981' },
      { name: '已关闭', value: closedCount, fill: '#94a3b8' },
      { name: '已完成', value: completedCount, fill: '#3b82f6' },
    ];

    const categoryGroup = await prisma.challenge.groupBy({
      by: ['category'],
      where: challengeWhere,
      _count: { category: true },
    });
    const CATEGORY_COLORS = ['#1e40af', '#047857', '#b45309', '#9333ea'];
    const categoryDistribution = categoryGroup.map((c, idx) => ({
      name: c.category,
      value: c._count.category,
      fill: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    }));

    return NextResponse.json({
      totalChallenges: myChallenges.length,
      openCount,
      closedCount,
      completedCount,
      totalApplicants,
      totalSubmissions,
      acceptedSubmissions,
      pendingReview,
      abilityAverages: {
        craft: Math.round(abilityAgg._avg.craft || 0),
        learn: Math.round(abilityAgg._avg.learn || 0),
        drive: Math.round(abilityAgg._avg.drive || 0),
        team: Math.round(abilityAgg._avg.team || 0),
        grit: Math.round(abilityAgg._avg.grit || 0),
        express: Math.round(abilityAgg._avg.express || 0),
      },
      challengePerformance,
      applicationTrend,
      submissionTrend,
      reviewPendingTrend,
      statusDistribution,
      categoryDistribution,
    });
  } catch (error) {
    logger.error('Failed to fetch enterprise stats', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '获取统计数据失败' }, { status: 500 });
  }
}
