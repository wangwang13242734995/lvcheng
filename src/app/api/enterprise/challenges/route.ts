import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { sanitizeInput } from '@/lib/sanitize';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  status: z.enum(['ALL', 'OPEN', 'CLOSED', 'COMPLETED']).default('ALL'),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export async function GET(req: NextRequest) {
  const rateLimitResult = checkRateLimit(req, 'my-challenges', {
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

    const role = (session.user as any).role;
    const userName = (session.user as any).name;
    if (role !== 'ENTERPRISE' && role !== 'ADMIN') {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 });
    }

    if (role === 'ENTERPRISE' && !userName) {
      return NextResponse.json({ error: '请先完善企业信息' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    const where: any = {};

    if (role === 'ENTERPRISE') {
      where.company = userName;
    }

    if (query.status !== 'ALL') {
      where.status = query.status;
    }

    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' as const } },
        { description: { contains: query.q, mode: 'insensitive' as const } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const allWhere: any = { ...where };
    delete allWhere.status;

    const [challenges, total, allChallenges] = await Promise.all([
      prisma.challenge.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
        include: {
          _count: {
            select: {
              applications: true,
              submissions: true,
            },
          },
        },
      }),
      prisma.challenge.count({ where }),
      prisma.challenge.findMany({
        where: allWhere,
        select: {
          status: true,
          _count: {
            select: {
              applications: true,
              submissions: true,
            },
          },
        },
      }),
    ]);

    const stats = allChallenges.reduce(
      (acc, c) => {
        acc.totalApplicants += c._count.applications;
        acc.totalSubmissions += c._count.submissions;
        if (c.status === 'OPEN') acc.openCount += 1;
        return acc;
      },
      { totalApplicants: 0, totalSubmissions: 0, openCount: 0 }
    );

    const challengeList = challenges.map((c) => ({
      id: c.id,
      title: sanitizeInput(c.title),
      company: sanitizeInput(c.company),
      category: c.category,
      status: c.status,
      rewardAmount: c.rewardAmount,
      rewardType: c.rewardType,
      deadline: c.deadline,
      spots: c.spots,
      createdAt: c.createdAt,
      applicantCount: c._count.applications,
      submissionCount: c._count.submissions,
    }));

    return NextResponse.json({
      challenges: challengeList,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
      stats: {
        totalChallenges: allChallenges.length,
        openCount: stats.openCount,
        totalApplicants: stats.totalApplicants,
        totalSubmissions: stats.totalSubmissions,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || '参数错误' }, { status: 400 });
    }
    logger.error('Failed to fetch my challenges', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
