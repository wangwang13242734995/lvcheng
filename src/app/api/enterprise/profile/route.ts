import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { sanitizeInput } from '@/lib/sanitize';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const profileSchema = z.object({
  name: z.string().min(1, '企业名称不能为空').max(100, '企业名称不能超过100字'),
  bio: z.string().max(2000, '企业简介不能超过2000字').optional(),
  skills: z.string().max(500, '业务领域不能超过500字').optional(),
});

export async function GET(req: NextRequest) {
  const rateLimitResult = checkRateLimit(req, 'enterprise-profile-get', {
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
    if (role !== 'ENTERPRISE' && role !== 'ADMIN') {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        skills: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const [stats, challenges] = await Promise.all([
      prisma.challenge.aggregate({
        where: { company: user.name },
        _count: { id: true },
        _sum: { rewardAmount: true },
      }),
      prisma.challenge.findMany({
        where: { company: user.name },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          rewardAmount: true,
          createdAt: true,
          _count: { select: { applications: true, submissions: true } },
        },
      }),
    ]);

    const totalApplications = challenges.reduce((acc, c) => acc + c._count.applications, 0);
    const totalSubmissions = challenges.reduce((acc, c) => acc + c._count.submissions, 0);

    return NextResponse.json({
      profile: {
        id: user.id,
        name: sanitizeInput(user.name),
        email: sanitizeInput(user.email),
        bio: user.bio ? sanitizeInput(user.bio) : null,
        skills: user.skills ? sanitizeInput(user.skills) : null,
      },
      stats: {
        totalChallenges: stats._count.id || 0,
        totalRewardAmount: stats._sum.rewardAmount || 0,
        totalApplications,
        totalSubmissions,
      },
      recentChallenges: challenges.map((c) => ({
        id: c.id,
        title: sanitizeInput(c.title),
        status: c.status,
        rewardAmount: c.rewardAmount,
        createdAt: c.createdAt,
        applicantCount: c._count.applications,
        submissionCount: c._count.submissions,
      })),
    });
  } catch (error) {
    logger.error('Failed to fetch enterprise profile', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '获取企业信息失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const rateLimitResult = checkRateLimit(req, 'enterprise-profile-put', {
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

    const role = (session.user as any).role;
    if (role !== 'ENTERPRISE' && role !== 'ADMIN') {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 });
    }

    const body = await req.json();
    const data = profileSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email! },
      data: {
        name: sanitizeInput(data.name),
        bio: data.bio ? sanitizeInput(data.bio) : null,
        skills: data.skills ? sanitizeInput(data.skills) : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        skills: true,
      },
    });

    logger.info('Enterprise profile updated', {
      userId: updatedUser.id,
      name: updatedUser.name,
    });

    return NextResponse.json({
      profile: {
        id: updatedUser.id,
        name: sanitizeInput(updatedUser.name),
        email: sanitizeInput(updatedUser.email),
        bio: updatedUser.bio ? sanitizeInput(updatedUser.bio) : null,
        skills: updatedUser.skills ? sanitizeInput(updatedUser.skills) : null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || '参数错误' }, { status: 400 });
    }
    logger.error('Failed to update enterprise profile', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '更新企业信息失败' }, { status: 500 });
  }
}
