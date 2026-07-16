import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { sanitizeInput } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rateLimitResult = checkRateLimit(req, 'user-my-challenges', {
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

    const userId = (session.user as any).id;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';

    const applications = await prisma.challengeApplication.findMany({
      where: { userId },
      orderBy: { appliedAt: 'desc' },
      include: {
        challenge: {
          select: {
            id: true,
            title: true,
            company: true,
            category: true,
            status: true,
            rewardAmount: true,
            rewardType: true,
            deadline: true,
            createdAt: true,
          },
        },
        submission: {
          select: {
            id: true,
            status: true,
            title: true,
            reviewedAt: true,
            reviewComment: true,
            createdAt: true,
          },
        },
      },
    });

    let filtered = applications;
    if (status === 'in_progress') {
      filtered = applications.filter(
        (a) => a.challenge.status === 'OPEN' && !a.submission
      );
    } else if (status === 'submitted') {
      filtered = applications.filter(
        (a) => a.submission && a.submission.status === 'PENDING'
      );
    } else if (status === 'approved') {
      filtered = applications.filter(
        (a) => a.submission && a.submission.status === 'ACCEPTED'
      );
    } else if (status === 'rejected') {
      filtered = applications.filter(
        (a) => a.submission && a.submission.status === 'REJECTED'
      );
    }

    const list = filtered.map((a) => ({
      applicationId: a.id,
      applicationStatus: a.status,
      appliedAt: a.appliedAt,
      challenge: {
        id: a.challenge.id,
        title: sanitizeInput(a.challenge.title),
        company: sanitizeInput(a.challenge.company),
        category: a.challenge.category,
        status: a.challenge.status,
        rewardAmount: a.challenge.rewardAmount,
        rewardType: a.challenge.rewardType,
        deadline: a.challenge.deadline,
        createdAt: a.challenge.createdAt,
      },
      submission: a.submission
        ? {
            id: a.submission.id,
            status: a.submission.status,
            title: sanitizeInput(a.submission.title),
            reviewComment: a.submission.reviewComment
              ? sanitizeInput(a.submission.reviewComment)
              : null,
            reviewedAt: a.submission.reviewedAt,
            createdAt: a.submission.createdAt,
          }
        : null,
    }));

    const stats = {
      total: applications.length,
      inProgress: applications.filter(
        (a) => a.challenge.status === 'OPEN' && !a.submission
      ).length,
      submitted: applications.filter(
        (a) => a.submission && a.submission.status === 'PENDING'
      ).length,
      approved: applications.filter(
        (a) => a.submission && a.submission.status === 'ACCEPTED'
      ).length,
      rejected: applications.filter(
        (a) => a.submission && a.submission.status === 'REJECTED'
      ).length,
    };

    return NextResponse.json({
      challenges: list,
      stats,
    });
  } catch (error) {
    logger.error('Failed to fetch user challenges', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '获取我的挑战失败' }, { status: 500 });
  }
}
