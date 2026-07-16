import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { sanitizeInput } from '@/lib/sanitize';
import { z } from 'zod';
import { createChallengeClosedNotification } from '@/services/notification-service';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  title: z.string().min(1, '请输入挑战标题').max(200, '标题不能超过200字'),
  description: z.string().min(10, '描述至少10个字').max(10000, '描述不能超过10000字'),
  category: z.enum(['TECH', 'PRODUCT', 'GROWTH', 'MARKETING']).default('TECH'),
  requiredCraft: z.coerce.number().int().min(0).max(100).default(0),
  requiredLearn: z.coerce.number().int().min(0).max(100).default(0),
  requiredDrive: z.coerce.number().int().min(0).max(100).default(0),
  requiredTeam: z.coerce.number().int().min(0).max(100).default(0),
  requiredGrit: z.coerce.number().int().min(0).max(100).default(0),
  requiredExpress: z.coerce.number().int().min(0).max(100).default(0),
  reward: z.string().optional(),
  rewardAmount: z.coerce.number().int().min(0).default(0),
  rewardType: z.enum(['CERTIFICATE', 'CASH', 'PRIZE', 'INTERNSHIP']).default('CERTIFICATE'),
  deadline: z.string().optional(),
  spots: z.coerce.number().int().min(1).optional(),
});

const statusSchema = z.object({
  status: z.enum(['OPEN', 'CLOSED', 'COMPLETED']),
});

async function checkEnterpriseAccess(session: any, challengeId: string) {
  const role = (session.user as any).role;
  const userName = (session.user as any).name;

  if (role !== 'ENTERPRISE' && role !== 'ADMIN') {
    return { allowed: false, status: 403, message: '无权限访问' };
  }

  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: { id: true, company: true, title: true },
  });

  if (!challenge) {
    return { allowed: false, status: 404, message: '挑战不存在' };
  }

  if (role === 'ENTERPRISE' && challenge.company !== userName) {
    return { allowed: false, status: 403, message: '无权限管理此挑战' };
  }

  return { allowed: true, challenge };
}

// PUT /api/enterprise/challenges/[id] - 编辑挑战
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimitResult = checkRateLimit(req, 'enterprise-challenge-update', {
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

    const access = await checkEnterpriseAccess(session, params.id);
    if (!access.allowed) {
      return NextResponse.json({ error: access.message }, { status: access.status });
    }

    const body = await req.json();
    const data = updateSchema.parse(body);

    const cleanTitle = sanitizeInput(data.title);
    const cleanDescription = sanitizeInput(data.description);
    const cleanReward = data.reward ? sanitizeInput(data.reward) : null;

    const updated = await prisma.challenge.update({
      where: { id: params.id },
      data: {
        title: cleanTitle,
        description: cleanDescription,
        category: data.category,
        requiredCraft: data.requiredCraft,
        requiredLearn: data.requiredLearn,
        requiredDrive: data.requiredDrive,
        requiredTeam: data.requiredTeam,
        requiredGrit: data.requiredGrit,
        requiredExpress: data.requiredExpress,
        reward: cleanReward,
        rewardAmount: data.rewardAmount,
        rewardType: data.rewardType,
        deadline: data.deadline ? new Date(data.deadline) : null,
        spots: data.spots,
      },
    });

    logger.info('Challenge updated', {
      challengeId: params.id,
      operator: (session.user as any).id,
      title: cleanTitle,
    });

    return NextResponse.json({ success: true, challenge: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || '参数错误' }, { status: 400 });
    }
    logger.error('Failed to update challenge', {
      challengeId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

// PATCH /api/enterprise/challenges/[id]/status - 状态变更
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimitResult = checkRateLimit(req, 'enterprise-challenge-status', {
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

    const access = await checkEnterpriseAccess(session, params.id);
    if (!access.allowed) {
      return NextResponse.json({ error: access.message }, { status: access.status });
    }

    const body = await req.json();
    const data = statusSchema.parse(body);

    const updated = await prisma.challenge.update({
      where: { id: params.id },
      data: { status: data.status },
    });

    // 关闭/完成挑战时通知所有报名者
    if (data.status === 'CLOSED' || data.status === 'COMPLETED') {
      const challenge = access.challenge!;
      const applicants = await prisma.challengeApplication.findMany({
        where: { challengeId: params.id },
        select: { userId: true },
      });
      await Promise.all(
        applicants.map((app) =>
          createChallengeClosedNotification(app.userId, challenge.title, params.id)
        )
      );
    }

    logger.info('Challenge status updated', {
      challengeId: params.id,
      status: data.status,
      operator: (session.user as any).id,
    });

    return NextResponse.json({ success: true, challenge: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || '参数错误' }, { status: 400 });
    }
    logger.error('Failed to update challenge status', {
      challengeId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '状态更新失败' }, { status: 500 });
  }
}
