import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-guards';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { sanitizeInput } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

// GET /api/admin/challenges - 获取所有挑战列表
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.isAdmin) return guard.response;

  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { company: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    const [challenges, total] = await Promise.all([
      prisma.challenge.findMany({
        where,
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
          _count: {
            select: {
              applications: true,
              submissions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.challenge.count({ where }),
    ]);

    const sanitizedChallenges = challenges.map((c) => ({
      id: c.id,
      title: sanitizeInput(c.title),
      company: sanitizeInput(c.company),
      category: c.category,
      status: c.status,
      rewardAmount: c.rewardAmount,
      rewardType: c.rewardType,
      deadline: c.deadline,
      createdAt: c.createdAt,
      applicantCount: c._count.applications,
      submissionCount: c._count.submissions,
    }));

    return NextResponse.json({
      challenges: sanitizedChallenges,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    logger.error('Failed to fetch admin challenges', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '获取挑战列表失败' }, { status: 500 });
  }
}

const statusUpdateSchema = z.object({
  status: z.enum(['OPEN', 'CLOSED', 'COMPLETED']),
});

// PATCH /api/admin/challenges/[id] - 更新挑战状态
export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.isAdmin) return guard.response;

  try {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: '缺少挑战ID' }, { status: 400 });
    }

    const body = await req.json();
    const { status } = statusUpdateSchema.parse(body);

    const challenge = await prisma.challenge.update({
      where: { id },
      data: { status },
      select: { id: true, title: true, status: true },
    });

    logger.info('Admin updated challenge status', {
      adminId: guard.userId,
      challengeId: id,
      newStatus: status,
    });

    return NextResponse.json(challenge);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || '参数错误' },
        { status: 400 }
      );
    }
    logger.error('Failed to update challenge status', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '更新挑战状态失败' }, { status: 500 });
  }
}
